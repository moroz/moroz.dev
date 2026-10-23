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
//	                    declarations in file x that share a name with it, or
//	                    is appended to x if there are none; imports are added
//	                    to those of x
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
// A merged declaration is matched by every name it declares, methods by
// receiver type and name. A grouped declaration, such as const ( ... ),
// replaces the whole group: the first declaration in x that shares a name with
// it gives way to it, and the others are removed. Merged imports are rewritten
// into a single import declaration, standard library first.
//
// Commands run one at a time in bash, under `set -euo pipefail`. The working
// directory and the environment carry over from one command to the next, so
// `cd` and `export` behave as in the reader's shell; shell functions, aliases
// and options do not. When the replay ends, failed or not, the working
// directory is copied to /out if it exists.
//
// With -fix, the command instead formats every Go fence in the post in place,
// excerpts included, and skips the ones go/format cannot parse. A lone
// function signature parses if it does not open the body: a declaration
// without a body is valid Go.
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
	"slices"
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
		out, err := format.Source([]byte(src))
		if err != nil {
			fmt.Fprintf(os.Stderr, "%s:%d: skipped: %v\n", path, f.line, err)
			continue
		}
		result := strings.TrimSuffix(string(out), "\n")
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

// merge merges the declarations of block into src. A declaration replaces the
// declarations of src that share a name with it, or is appended if there are
// none; imports are added to the imports of src. merge returns the merged
// source and a line per declaration of block saying what happened to it.
func merge(src, block []byte) ([]byte, []string, error) {
	const header = "package p\n"
	fset := token.NewFileSet()
	blockFile, err := parser.ParseFile(fset, "block", header+string(block), parser.ParseComments)
	if err != nil {
		return nil, nil, err
	}
	blockOffset := func(p token.Pos) int { return fset.Position(p).Offset - len(header) }

	var srcFile *ast.File
	owner := map[string]ast.Decl{}
	if len(bytes.TrimSpace(src)) > 0 {
		srcFile, err = parser.ParseFile(fset, "file", src, parser.ParseComments)
		if err != nil {
			return nil, nil, err
		}
		for _, d := range srcFile.Decls {
			names, err := declNames(d)
			if err != nil {
				continue
			}
			for _, name := range names {
				owner[name] = d
			}
		}
	}
	srcOffset := func(p token.Pos) int { return int(p - srcFile.FileStart) }

	var edits []edit
	var added [][]byte
	var imports []*ast.ImportSpec
	var report []string
	declared := map[string]bool{}
	replaced := map[ast.Decl]bool{}
	for _, d := range blockFile.Decls {
		if g, ok := d.(*ast.GenDecl); ok && g.Tok == token.IMPORT {
			for _, s := range g.Specs {
				imports = append(imports, s.(*ast.ImportSpec))
			}
			continue
		}
		names, err := declNames(d)
		if err != nil {
			return nil, nil, fmt.Errorf("block line %d: %w", fset.Position(d.Pos()).Line-1, err)
		}
		var olds []ast.Decl
		for _, name := range names {
			if declared[name] {
				return nil, nil, fmt.Errorf("block declares %s twice", name)
			}
			declared[name] = true
			old, ok := owner[name]
			if !ok || slices.Contains(olds, old) {
				continue
			}
			if replaced[old] {
				return nil, nil, fmt.Errorf("%s is declared together with a name the block declares separately; declare them together", name)
			}
			replaced[old] = true
			olds = append(olds, old)
		}
		start, end := declRange(d)
		// Capped, so that appending to text cannot overwrite the rest of block.
		text := block[blockOffset(start):blockOffset(end):blockOffset(end)]
		label := describe(d, names)
		if len(olds) == 0 {
			added = append(added, text)
			report = append(report, "added "+label)
			continue
		}
		// The first declaration in the file gives way to the block's; the
		// others are removed.
		slices.SortFunc(olds, func(a, b ast.Decl) int { return int(a.Pos() - b.Pos()) })
		for i, old := range olds {
			start, end := declRange(old)
			if i == 0 {
				edits = append(edits, edit{srcOffset(start), srcOffset(end), text})
			} else {
				edits = append(edits, deletion(src, srcOffset(start), srcOffset(end)))
			}
		}
		report = append(report, "replaced "+label)
	}

	if len(imports) > 0 {
		if srcFile == nil {
			return nil, nil, errors.New("cannot add imports to a file without a package clause")
		}
		importEdits, importReport := mergeImports(src, srcFile, imports)
		edits = append(edits, importEdits...)
		report = append(report, importReport...)
	}

	// Back to front, so that each edit leaves the offsets before it valid. An
	// insertion goes after a deletion that starts at the same offset.
	slices.SortFunc(edits, func(a, b edit) int {
		if a.start != b.start {
			return b.start - a.start
		}
		return b.end - a.end
	})
	out := append([]byte(nil), src...)
	for _, e := range edits {
		out = append(out[:e.start:e.start], append(e.text, out[e.end:]...)...)
	}
	for _, text := range added {
		// Separate the declaration from what is already there, as a reader would.
		if len(out) > 0 {
			out = append(bytes.TrimRight(out, "\n"), "\n\n"...)
		}
		out = append(out, text...)
	}
	// A declaration removed from the end leaves blank lines behind.
	out = append(bytes.TrimRight(out, " \t\n"), '\n')
	return out, report, nil
}

// edit replaces src[start:end] with text.
type edit struct {
	start, end int
	text       []byte
}

// deletion removes src[start:end] and the blank lines before it.
func deletion(src []byte, start, end int) edit {
	for start > 0 && strings.ContainsRune(" \t\n", rune(src[start-1])) {
		start--
	}
	return edit{start, end, nil}
}

// mergeImports adds the imports that src does not have yet, rewriting the
// imports of src as a single declaration laid out as goimports does: the
// standard library first, then the other packages. Comments on the existing
// imports are lost.
func mergeImports(src []byte, file *ast.File, specs []*ast.ImportSpec) ([]edit, []string) {
	key := func(s *ast.ImportSpec) string {
		if s.Name != nil {
			return s.Name.Name + " " + s.Path.Value
		}
		return s.Path.Value
	}
	var all []string
	for _, s := range file.Imports {
		if !slices.Contains(all, key(s)) {
			all = append(all, key(s))
		}
	}
	var report []string
	for _, s := range specs {
		if !slices.Contains(all, key(s)) {
			all = append(all, key(s))
			report = append(report, "imported "+key(s))
		}
	}
	if len(report) == 0 {
		return nil, nil
	}

	var std, other []string
	for _, k := range all {
		_, path, _ := strings.Cut(k, `"`)
		if first, _, _ := strings.Cut(path, "/"); strings.Contains(first, ".") {
			other = append(other, k)
		} else {
			std = append(std, k)
		}
	}
	byPath := func(a, b string) int {
		_, pa, _ := strings.Cut(a, `"`)
		_, pb, _ := strings.Cut(b, `"`)
		return strings.Compare(pa, pb)
	}
	slices.SortFunc(std, byPath)
	slices.SortFunc(other, byPath)
	var decl string
	if len(all) == 1 {
		decl = "import " + all[0]
	} else {
		var groups []string
		for _, group := range [][]string{std, other} {
			if len(group) > 0 {
				groups = append(groups, "\t"+strings.Join(group, "\n\t")+"\n")
			}
		}
		decl = "import (\n" + strings.Join(groups, "\n") + ")"
	}

	offset := func(p token.Pos) int { return int(p - file.FileStart) }
	var edits []edit
	first := true
	for _, d := range file.Decls {
		g, ok := d.(*ast.GenDecl)
		if !ok || g.Tok != token.IMPORT {
			continue
		}
		start, end := declRange(g)
		if first {
			edits = append(edits, edit{offset(start), offset(end), []byte(decl)})
			first = false
		} else {
			edits = append(edits, deletion(src, offset(start), offset(end)))
		}
	}
	if first {
		// No imports yet: they go right after the package clause.
		at := offset(file.Name.End())
		edits = append(edits, edit{at, at, []byte("\n\n" + decl)})
	}
	return edits, report
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

// declNames returns the names that d declares, as merge matches them: Name
// for functions, types, variables and constants, and Type.Name for methods.
// The blank identifier is left out.
func declNames(d ast.Decl) ([]string, error) {
	switch d := d.(type) {
	case *ast.FuncDecl:
		if d.Recv == nil || len(d.Recv.List) == 0 {
			return []string{d.Name.Name}, nil
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
			return []string{id.Name + "." + d.Name.Name}, nil
		}
		return nil, fmt.Errorf("cannot merge method %s: unexpected receiver type", d.Name.Name)
	case *ast.GenDecl:
		var names []string
		for _, s := range d.Specs {
			switch s := s.(type) {
			case *ast.TypeSpec:
				names = append(names, s.Name.Name)
			case *ast.ValueSpec:
				for _, n := range s.Names {
					if n.Name != "_" {
						names = append(names, n.Name)
					}
				}
			}
		}
		return names, nil
	}
	return nil, errors.New("cannot merge this declaration")
}

// describe names d for the report: its name, or its keyword and names if it
// declares several.
func describe(d ast.Decl, names []string) string {
	if len(names) == 1 {
		return names[0]
	}
	tok := "func"
	if g, ok := d.(*ast.GenDecl); ok {
		tok = g.Tok.String()
	}
	return tok + " (" + strings.Join(names, ", ") + ")"
}

// quote returns s as a single-quoted bash word.
func quote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}
