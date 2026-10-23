// Command tutorial-runner replays a blog post the way a reader would: it runs
// the shell commands, writes the files, and checks the code after every file it
// writes.
//
// Code fences are interpreted by their info string:
//
//	```bash             lines starting with "$ " are run; other lines are output
//	```bash fails       the commands must fail (a deliberately red step)
//	```bash norun       not run
//	```go filename="x"  the block replaces file x
//	```go filename="x" append
//	                    the block is appended to file x
//	```go filename="x" merge
//	                    each top-level declaration in the block replaces the
//	                    declaration of the same name in file x, or is appended
//	                    to x if there is none; methods are matched by receiver
//	                    type and name
//	```go filename="x" imports
//	                    the block is appended to (or with merge, merged into)
//	                    file x, then goimports fixes the imports of x
//
// Fences without a filename are excerpts and are skipped. After a .go file is
// written, the file must be gofmt-formatted and `go vet ./...` must pass. Its
// imports must be complete, unless the fence is marked `imports` (which implies
// `append` unless it is marked `merge`): then goimports fixes them first, as the
// reader's editor would on save.
//
// Commands run one at a time in bash, under `set -euo pipefail`. The working
// directory and the environment carry over from one command to the next, so
// `cd` and `export` behave as in the reader's shell; shell functions, aliases
// and options do not. When the replay ends, failed or not, the working
// directory is copied to /out if it exists.
//
// With -fix, the command instead formats every Go fence in the post in place,
// excerpts included, and skips the ones go/format cannot parse. Mark a fence
// that opens a block without closing it, such as a lone function signature,
// with `unclosed`; it is formatted as if followed by a closing brace.
package main

import (
	"bytes"
	"errors"
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
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
	if err := replay(fences); err != nil {
		fmt.Fprintf(os.Stderr, "\nFAILED at %v\n", err)
		os.Exit(1)
	}
	fmt.Print("\nOK: every step passed\n")
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

// shell is the reader's shell session: the working directory and environment
// the next command starts in.
type shell struct {
	dir   string
	env   []string
	state string // directory the commands report their final state to
}

func replay(fences []fence) error {
	root, err := os.Getwd()
	if err != nil {
		return err
	}
	state, err := os.MkdirTemp("", "tutorial-state")
	if err != nil {
		return err
	}
	defer os.RemoveAll(state)
	// Hand the reader's working directory back to the host, failed or not.
	defer func() {
		if _, err := os.Stat("/out"); err == nil {
			exec.Command("cp", "-a", root+"/.", "/out/").Run()
		}
	}()
	sh := &shell{dir: root, env: os.Environ(), state: state}
	for _, f := range fences {
		if hasFlag(f.meta, "norun") {
			continue
		}
		var label string
		var err error
		switch {
		case isShell(f.lang):
			label, err = runShell(sh, f)
		case filenameRe.MatchString(f.meta):
			label, err = writeFile(sh, f)
		}
		if err != nil {
			return fmt.Errorf("%s: %w", label, err)
		}
	}
	return nil
}

func step(label string) {
	fmt.Printf("\n==> %s\n", label)
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

// runShell runs the commands of a shell fence until one fails. A fence marked
// `fails` passes if one of them fails.
func runShell(sh *shell, f fence) (string, error) {
	label := fmt.Sprintf("line %d: %s", f.line, f.lang)
	cmds := commands(f)
	if len(cmds) == 0 {
		return label, nil
	}
	fails := hasFlag(f.meta, "fails")
	if fails {
		label += " (expected to fail)"
	}
	step(label)
	for _, cmd := range cmds {
		fmt.Printf("$ %s\n", cmd)
		err := sh.run(cmd)
		var exit *exec.ExitError
		switch {
		case fails && errors.As(err, &exit):
			return label, nil
		case err != nil:
			return label, err
		}
	}
	if fails {
		return label, errors.New("expected these commands to fail, but they succeeded")
	}
	return label, nil
}

// run runs cmd in bash and keeps the working directory and environment it
// leaves behind for the next command.
func (sh *shell) run(cmd string) error {
	cwdFile := filepath.Join(sh.state, "cwd")
	envFile := filepath.Join(sh.state, "env")
	save := fmt.Sprintf("s=$?; pwd > %s; env -0 > %s; exit $s", quote(cwdFile), quote(envFile))
	script := fmt.Sprintf("trap %s EXIT\nset -euo pipefail\n%s\n", quote(save), cmd)
	c := exec.Command("bash", "-c", script)
	c.Dir, c.Env = sh.dir, sh.env
	c.Stdout, c.Stderr = os.Stdout, os.Stderr
	runErr := c.Run()

	cwd, err := os.ReadFile(cwdFile)
	if err != nil {
		return errors.Join(runErr, err)
	}
	env, err := os.ReadFile(envFile)
	if err != nil {
		return errors.Join(runErr, err)
	}
	sh.dir = strings.TrimSuffix(string(cwd), "\n")
	sh.env = sh.env[:0:0]
	for _, kv := range strings.Split(string(env), "\x00") {
		// Left to bash, which would otherwise count SHLVL up by one per command.
		if kv == "" || strings.HasPrefix(kv, "SHLVL=") || strings.HasPrefix(kv, "_=") {
			continue
		}
		sh.env = append(sh.env, kv)
	}
	return runErr
}

// writeFile writes, appends or merges a fence into its file, then checks the
// file if it is Go code.
func writeFile(sh *shell, f fence) (string, error) {
	name := filenameRe.FindStringSubmatch(f.meta)[1]
	imports := hasFlag(f.meta, "imports")
	mode := "write"
	switch {
	case hasFlag(f.meta, "merge"):
		mode = "merge into"
	case imports || hasFlag(f.meta, "append"):
		mode = "append to"
	}
	label := fmt.Sprintf("line %d: %s %s", f.line, mode, name)
	step(label)

	path := filepath.Join(sh.dir, name)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return label, err
	}
	block := strings.Join(f.lines, "\n") + "\n"
	old, err := os.ReadFile(path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return label, err
	}
	var data []byte
	switch mode {
	case "write":
		data = []byte(block)
	case "append to":
		data = old
		// Separate the block from what is already there, as a reader would.
		if len(data) > 0 {
			data = append(data, '\n')
		}
		data = append(data, block...)
	case "merge into":
		var report []string
		data, report, err = merge(old, []byte(block))
		if err != nil {
			return label, err
		}
		for _, line := range report {
			fmt.Println(line)
		}
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return label, err
	}
	if !strings.HasSuffix(name, ".go") {
		return label, nil
	}
	return label, checkGo(sh, name, imports)
}

// checkGo checks that the Go file name is gofmt-formatted and has complete
// imports (or fixes them, with fixImports), and that the module vets.
func checkGo(sh *shell, name string, fixImports bool) error {
	out, err := sh.output("gofmt", "-l", name)
	if err != nil {
		return err
	}
	if out != "" {
		// gofmt -d exits with 1 when it prints a diff.
		diff, _ := sh.output("gofmt", "-d", name)
		return fmt.Errorf("%s is not gofmt-formatted:\n%s", name, diff)
	}
	if fixImports {
		if _, err := sh.output("goimports", "-w", name); err != nil {
			return err
		}
	} else {
		out, err := sh.output("goimports", "-l", name)
		if err != nil {
			return err
		}
		if out != "" {
			diff, _ := sh.output("goimports", "-d", name)
			return fmt.Errorf("%s needs import changes; fix them or mark the fence 'imports':\n%s", name, diff)
		}
	}
	vet := exec.Command("go", "vet", "./...")
	vet.Dir, vet.Env = sh.dir, sh.env
	vet.Stdout, vet.Stderr = os.Stdout, os.Stderr
	return vet.Run()
}

// output runs a tool in the shell's working directory and returns its output,
// even if it fails; on failure, the error includes the tool's stderr.
func (sh *shell) output(name string, args ...string) (string, error) {
	c := exec.Command(name, args...)
	c.Dir, c.Env = sh.dir, sh.env
	var stderr bytes.Buffer
	c.Stderr = &stderr
	out, err := c.Output()
	if err != nil {
		return string(out), fmt.Errorf("%s: %w\n%s", name, err, stderr.String())
	}
	return string(out), nil
}

// merge replaces the declarations of src that block declares again, and
// appends the others to src. It returns the merged source and a line per
// declaration of block saying which of the two happened to it.
func merge(src, block []byte) ([]byte, []string, error) {
	const header = "package p\n"
	fset := token.NewFileSet()
	blockFile, err := parser.ParseFile(fset, "block", header+string(block), parser.ParseComments)
	if err != nil {
		return nil, nil, err
	}
	offset := func(p token.Pos) int { return fset.Position(p).Offset - len(header) }

	existing := map[string]ast.Decl{}
	var srcFile *ast.File
	if len(bytes.TrimSpace(src)) > 0 {
		srcFile, err = parser.ParseFile(fset, "file", src, parser.ParseComments)
		if err != nil {
			return nil, nil, err
		}
		for _, d := range srcFile.Decls {
			if key, err := declKey(d); err == nil {
				existing[key] = d
			}
		}
	}

	type edit struct {
		start, end int
		text       []byte
	}
	var edits []edit
	var added [][]byte
	var report []string
	seen := map[string]bool{}
	for _, d := range blockFile.Decls {
		key, err := declKey(d)
		if err != nil {
			return nil, nil, fmt.Errorf("block line %d: %w", fset.Position(d.Pos()).Line-1, err)
		}
		if seen[key] {
			return nil, nil, fmt.Errorf("block declares %s twice", key)
		}
		seen[key] = true
		start, end := declRange(d)
		// Capped, so that appending to text cannot overwrite the rest of block.
		text := block[offset(start):offset(end):offset(end)]
		if old, ok := existing[key]; ok {
			start, end := declRange(old)
			base := srcFile.FileStart
			edits = append(edits, edit{int(start - base), int(end - base), text})
			report = append(report, "replaced "+key)
		} else {
			added = append(added, text)
			report = append(report, "added "+key)
		}
	}

	// Back to front, so that each edit leaves the offsets before it valid.
	sort.Slice(edits, func(i, j int) bool { return edits[i].start > edits[j].start })
	out := append([]byte(nil), src...)
	for _, e := range edits {
		out = append(out[:e.start:e.start], append(e.text, out[e.end:]...)...)
	}
	for _, text := range added {
		// Separate the declaration from what is already there, as a reader would.
		if len(out) > 0 {
			if !bytes.HasSuffix(out, []byte("\n")) {
				out = append(out, '\n')
			}
			out = append(out, '\n')
		}
		out = append(out, text...)
		out = append(out, '\n')
	}
	return out, report, nil
}

// declRange returns the extent of d, including its doc comment.
func declRange(d ast.Decl) (token.Pos, token.Pos) {
	var doc *ast.CommentGroup
	switch d := d.(type) {
	case *ast.FuncDecl:
		doc = d.Doc
	case *ast.GenDecl:
		doc = d.Doc
	}
	if doc != nil {
		return doc.Pos(), d.End()
	}
	return d.Pos(), d.End()
}

// declKey names the declaration d for merging: Name for functions, types,
// variables and constants, and Type.Name for methods. Imports and grouped
// declarations cannot be merged.
func declKey(d ast.Decl) (string, error) {
	switch d := d.(type) {
	case *ast.FuncDecl:
		if d.Recv == nil || len(d.Recv.List) == 0 {
			return d.Name.Name, nil
		}
		t := d.Recv.List[0].Type
		if star, ok := t.(*ast.StarExpr); ok {
			t = star.X
		}
		switch g := t.(type) {
		case *ast.IndexExpr:
			t = g.X
		case *ast.IndexListExpr:
			t = g.X
		}
		if id, ok := t.(*ast.Ident); ok {
			return id.Name + "." + d.Name.Name, nil
		}
		return "", fmt.Errorf("cannot merge method %s: unexpected receiver type", d.Name.Name)
	case *ast.GenDecl:
		if d.Tok == token.IMPORT {
			return "", errors.New("cannot merge imports; mark the fence 'imports' instead")
		}
		if len(d.Specs) != 1 {
			return "", fmt.Errorf("cannot merge a grouped %s declaration", d.Tok)
		}
		switch s := d.Specs[0].(type) {
		case *ast.TypeSpec:
			return s.Name.Name, nil
		case *ast.ValueSpec:
			if len(s.Names) == 1 {
				return s.Names[0].Name, nil
			}
		}
		return "", fmt.Errorf("cannot merge a %s declaration of several names", d.Tok)
	}
	return "", errors.New("cannot merge this declaration")
}

// quote returns s as a single-quoted bash word.
func quote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}
