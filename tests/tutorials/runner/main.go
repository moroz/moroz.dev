// Command tutorial-runner turns a blog post into a bash script that replays it
// the way a reader would: it runs the shell commands, writes the files, and
// checks the code after every file it writes.
//
// Code fences are interpreted by their info string:
//
//	```bash             lines starting with "$ " are run; other lines are output
//	```bash fails       the commands must fail (a deliberately red step)
//	```bash norun       not run
//	```go filename="x"  the block replaces file x
//	```go filename="x" append
//	                    the block is appended to file x
//	```go filename="x" imports
//	                    the block is appended to file x, then goimports fixes
//	                    the imports of x
//
// Fences without a filename are excerpts and are skipped. After a .go file is
// written, the file must be gofmt-formatted and `go vet ./...` must pass. Its
// imports must be complete, unless the fence is marked `imports` (which implies
// `append`): then goimports fixes them first, as the reader's editor would on
// save.
//
// With -fix, the command instead formats every Go fence in the post in place,
// excerpts included, and skips the ones go/format cannot parse. Mark a fence
// that opens a block without closing it, such as a lone function signature,
// with `unclosed`; it is formatted as if followed by a closing brace.
package main

import (
	"bufio"
	"fmt"
	"go/format"
	"os"
	"regexp"
	"strings"
)

type fence struct {
	line  int // line of the opening fence, 1-based
	end   int // line of the closing fence, 1-based
	lang  string
	meta  string
	lines []string
}

var filenameRe = regexp.MustCompile(`(?:title|filename)="([^"]+)"`)

func main() {
	args := os.Args[1:]
	fix := len(args) == 2 && args[0] == "-fix"
	if fix {
		args = args[1:]
	}
	if len(args) != 1 {
		fmt.Fprintln(os.Stderr, "usage: tutorial-runner [-fix] POST.mdx")
		os.Exit(2)
	}
	fences, err := parse(args[0])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if fix {
		if err := fixFences(args[0], fences); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}
	w := bufio.NewWriter(os.Stdout)
	defer w.Flush()
	emit(w, fences)
}

func parse(path string) ([]fence, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var fences []fence
	var cur *fence
	for i, line := range strings.Split(string(data), "\n") {
		trimmed := strings.TrimSpace(line)
		if cur == nil {
			if !strings.HasPrefix(trimmed, "```") {
				continue
			}
			info := strings.TrimSpace(strings.TrimPrefix(trimmed, "```"))
			lang, meta, _ := strings.Cut(info, " ")
			cur = &fence{line: i + 1, lang: lang, meta: meta}
			continue
		}
		if trimmed == "```" {
			cur.end = i + 1
			fences = append(fences, *cur)
			cur = nil
			continue
		}
		cur.lines = append(cur.lines, line)
	}
	if cur != nil {
		return nil, fmt.Errorf("%s:%d: unclosed code fence", path, cur.line)
	}
	return fences, nil
}

// fixFences formats the Go fences of the post at path in place.
func fixFences(path string, fences []fence) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	lines := strings.Split(string(data), "\n")
	changed := 0
	// Back to front, so that a fence that changes length does not shift the
	// line numbers of the fences before it.
	for i := len(fences) - 1; i >= 0; i-- {
		f := fences[i]
		if f.lang != "go" {
			continue
		}
		opening := lines[f.line-1]
		indent := opening[:len(opening)-len(strings.TrimLeft(opening, " \t"))]
		var body []string
		for _, line := range f.lines {
			body = append(body, strings.TrimPrefix(line, indent))
		}
		src := strings.Join(body, "\n") + "\n"
		unclosed := hasFlag(f.meta, "unclosed")
		input := src
		if unclosed {
			input += "}\n"
		}
		out, err := format.Source([]byte(input))
		if err != nil {
			fmt.Fprintf(os.Stderr, "%s:%d: skipped: %v\n", path, f.line, err)
			continue
		}
		result := strings.TrimSuffix(string(out), "\n")
		if unclosed {
			result = strings.TrimRight(strings.TrimSuffix(result, "}"), " \t\n")
		}
		if result+"\n" == src {
			continue
		}
		var formatted []string
		for _, line := range strings.Split(result, "\n") {
			if line != "" {
				line = indent + line
			}
			formatted = append(formatted, line)
		}
		lines = append(lines[:f.line], append(formatted, lines[f.end-1:]...)...)
		fmt.Fprintf(os.Stderr, "%s:%d: formatted\n", path, f.line)
		changed++
	}
	if changed == 0 {
		return nil
	}
	return os.WriteFile(path, []byte(strings.Join(lines, "\n")), 0o644)
}

func hasFlag(meta, flag string) bool {
	for _, word := range strings.Fields(filenameRe.ReplaceAllString(meta, "")) {
		if word == flag {
			return true
		}
	}
	return false
}

func emit(w *bufio.Writer, fences []fence) {
	w.WriteString(`#!/usr/bin/env bash
set -euo pipefail
current="start"
trap 'echo >&2; echo "FAILED at $current" >&2' ERR
# Hand the reader's working directory back to the host, failed or not.
trap 'if [ -d /out ]; then find /work -mindepth 1 -maxdepth 1 -exec cp -a {} /out/ \; ; fi' EXIT
step() { current="$*"; printf '\n==> %s\n' "$*"; }
`)
	for _, f := range fences {
		if hasFlag(f.meta, "norun") {
			continue
		}
		switch {
		case isShell(f.lang):
			emitShell(w, f)
		case filenameRe.MatchString(f.meta):
			emitFile(w, f)
		}
	}
	fmt.Fprint(w, "\nprintf '\\nOK: every step passed\\n'\n")
}

func isShell(lang string) bool {
	switch lang {
	case "bash", "sh", "shell", "console", "zsh":
		return true
	}
	return false
}

// commands returns the "$ " lines of a shell fence, joining lines continued
// with a trailing backslash.
func commands(f fence) []string {
	var cmds []string
	continued := false
	for _, line := range f.lines {
		switch {
		case continued:
			cmds[len(cmds)-1] += "\n" + line
		case strings.HasPrefix(line, "$ "):
			cmds = append(cmds, strings.TrimPrefix(line, "$ "))
		default:
			continue
		}
		continued = strings.HasSuffix(line, "\\")
	}
	return cmds
}

func emitShell(w *bufio.Writer, f fence) {
	cmds := commands(f)
	if len(cmds) == 0 {
		return
	}
	fails := hasFlag(f.meta, "fails")
	label := fmt.Sprintf("line %d: %s", f.line, f.lang)
	if fails {
		label += " (expected to fail)"
	}
	fmt.Fprintf(w, "\nstep %s\n", quote(label))
	if fails {
		fmt.Fprintln(w, "if (")
	}
	for _, cmd := range cmds {
		fmt.Fprintf(w, "printf '$ %%s\\n' %s\n%s\n", quote(cmd), cmd)
	}
	if fails {
		fmt.Fprintf(w, "); then\n  echo %s >&2\n  false\nfi\n",
			quote(fmt.Sprintf("line %d: expected these commands to fail, but they succeeded", f.line)))
	}
}

func emitFile(w *bufio.Writer, f fence) {
	name := filenameRe.FindStringSubmatch(f.meta)[1]
	op, verb := ">", "write"
	imports := hasFlag(f.meta, "imports")
	if imports || hasFlag(f.meta, "append") {
		op, verb = ">>", "append to"
	}
	delim := fmt.Sprintf("TUTORIAL_EOF_%d", f.line)
	fmt.Fprintf(w, "\nstep %s\n", quote(fmt.Sprintf("line %d: %s %s", f.line, verb, name)))
	fmt.Fprintf(w, "mkdir -p \"$(dirname %s)\"\n", quote(name))
	if op == ">>" {
		// Separate the block from what is already there, as a reader would.
		fmt.Fprintf(w, "if [ -s %[1]s ]; then echo >> %[1]s; fi\n", quote(name))
	}
	fmt.Fprintf(w, "cat %s %s <<'%s'\n%s\n%s\n", op, quote(name), delim, strings.Join(f.lines, "\n"), delim)
	if !strings.HasSuffix(name, ".go") {
		return
	}
	// A parse error fails the assignment and stops the script under set -e.
	fmt.Fprintf(w, `unformatted=$(gofmt -l %[1]s)
if [ -n "$unformatted" ]; then
  echo "%[2]s is not gofmt-formatted:" >&2
  gofmt -d %[1]s >&2
  false
fi
`, quote(name), strings.ReplaceAll(name, `"`, `\"`))
	if imports {
		fmt.Fprintf(w, "goimports -w %s\n", quote(name))
	} else {
		fmt.Fprintf(w, `missing=$(goimports -l %[1]s)
if [ -n "$missing" ]; then
  echo "%[2]s needs import changes; fix them or mark the fence 'imports':" >&2
  goimports -d %[1]s >&2
  false
fi
`, quote(name), strings.ReplaceAll(name, `"`, `\"`))
	}
	fmt.Fprintln(w, "go vet ./...")
}

// quote returns s as a single-quoted bash word.
func quote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}
