+++
title = 'Go 入門：軟體包、宣告變數'
date = "2023-11-04"
slug = "go-rumen-bao-bianshu-hanshu"
lang = "zh-Hant-TW"

summary = "此篇為編程的初學者介紹了 Go 程式語言的基本概念，初始化專案的方法，以及宣告變數的兩種語法。"
+++

## 先備知識

為了參與這堂課，請各位同學預先安裝最新的 Go。寫本文的時候最新的版本為 1.21.3。
使用 MS&nbsp;Windows 作業系統的同學可以至 [Go 官方網站](https://go.dev/dl/)下載安裝器。
Linux 或 macOS 作業系統的使用者可以用 [rtx](https://github.com/jdx/rtx) 或 [Homebrew](https://brew.sh/) 安裝。

使用 Windows 作業系統的同學請另外安裝 [Git 版本控制系統](https://git-scm.com/download/win)。
如果你還沒有[註冊 GitHub](https://github.com/signup)，請先註冊並[設定 SSH 金鑰](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)。

你會需要一個程式碼編輯器。我本身偏好 [Neovim](https://neovim.io/)，但對於初學者而言，[Visual Studio Code](https://code.visualstudio.com/) （以下簡稱 VS&nbsp;Code）是還不錯的選擇。

如使用 VS&nbsp;Code，請安裝 [Rich Go language support for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=golang.Go) 的擴充包。

## 建立專案資料夾

接下來請打開終端機。在 Windows 環境，可用 Git Bash（安裝 Windows 版 Git 就會自動安裝 Git Bash）。
在 macOS 環境，可用 [iTerm2](https://iterm2.com/) 或 macOS 內建的 Terminal.app。

終端機預設打開的資料夾為你的「家目錄」，又名「主目錄」（英：_home directory_），如果在終端機看到波浪符號（`~`）或 `$HOME` 的寫法，那就是家目錄的意思。

在家目錄，請用 `mkdir` 指令建立 `projects` 資料夾（`mkdir` 為 _make directory_ 的縮寫）：

```shell
mkdir ~/projects
```

切換終端機工作目錄使用 `cd` 指令，`cd` 為 _change directory_ 的縮寫：

```shell
cd ~/projects
```

若想回到家目錄，可以直接打 `cd`，如果沒有給更多的參數，`cd` 就會預設切換到家目錄。

```shell
cd
```

這堂課要建立的專案名為 `hello-world`，因此建立 `~/projects/hello-world` 資料夾：

```shell
mkdir ~/projects/hello-world
```

## 初始化 Go 專案

切換至 `~/projects/hello-world` 資料夾：

```shell
cd ~/projects/hello-world
```

用 `go mod init` 初始化 Go 軟體包（英：_package_）。此處的名稱為 `github.com/<你的GitHub用戶名>/hello-world`。我的用戶名為 [moroz](https://github.com/moroz)，所以我會打：

```shell
$ go mod init github.com/moroz/hello-world
go: creating new go.mod: module github.com/moroz/hello-world
```

在裡面，我們可以初始化一個 Git 版本庫（英：_Git repository_）：

```shell
$ git init
提示：如果要設定所有新版本庫要使用的初始分支名稱，
提示：請呼叫（會隱藏這個警告）：
提示：
提示：  git config --global init.defaultBranch <name>
提示：
提示：除了 “master” 外，常用的分支名稱有 “main”, “trunk” 以及
提示：“development”。剛建立的分支可以用這個命令重新命名：
提示：
提示：  git branch -m <name>
已初始化空的 Git 版本庫於 /Users/karol/projects/hello-world/.git/
$ git add .
$ git commit -m "Initial commit"
[master (根提交) 76fbede] Initial commit
 1 file changed, 3 insertions(+)
 create mode 100644 go.mod
```

## 第一段 Go 程式

接下來，請用程式碼編輯器打開這個專案。如使用 VS&nbsp;Code，可以用以下指令開啟：

```shell
code .
```

若在 macOS 環境中第一次使用此指令，可能遇到 _command not found_ 的錯誤訊息。
這種情況下，請先使用 Finder 或 Spotlight 開啟 VS&nbsp;Code，然後按 Cmd-Shift-P，並輸入 `code`。
輸入框中應該出現 _Install 'code' command in PATH_ 的選項（如圖），請用箭頭選擇此指令並按 Enter。

<figure>
<img src="/images/go-1/install-code-in-path.webp" />
<figcaption><em>Install 'code' command in PATH</em> 的截圖</figcaption>
</figure>

打開專案後請建立新的檔案 `main.go` 並輸入以下內容：

```go
package main // 宣稱 main 軟體包

import "fmt" // 導入 fmt 包

func main() { // 宣稱 main 函數，無返回值
    // 列印「你好，世界！」、換行
    fmt.Println("你好，世界！")
}
```

接下來，我們可以在終端機中用 `go run` 指令執行這段程式：

```shell
$ go run .
你好，世界！
```

## 宣告變數

接下來，我們來研究宣告變數的兩種方法。第一種方法是用 `var` 關鍵字，語法為：

```go
var [變數名稱] [資料類型] = [初始值]
```

例如：

```go
func main() {
    var name string = "王小明"
    var x int = 42
    fmt.Println("我叫", name)
    fmt.Println("x =", x)
}
```

讓我們分析一下以上程式碼宣告變數的意思。

```go
var name string = "王小明"
```

宣告一個名為 `name` 的變數，它的類型為 `string`（字串，也就是說文字資料）。與宣告同時，我們為 `name` 賦值 `"王小明"` 這一段文字資料。

```go
var x int = 42
```

宣告一個名為 `x` 的變數，它的類型為 `int`（整數）。與宣告同時，我們為 `x` 賦值 `42` 的整數。

執行以上程式碼會看到以下結果：

```shell
$ go run .
我叫 王小明
x = 42
```

Go 的變數定義也有一種簡化的寫法：

```go
[變數名稱] := [初始值]
```

注意看，這邊的賦值運算子變成 `:=` （冒號、等於）而非 `=`（等於）。

```go
func main() {
    name := "王小明"
    x := 42
    fmt.Println("我叫", name)
    fmt.Println("x =", x)
}
```

若使用簡化的變數定義語法，Go 編譯器將在編譯過程中檢測類型，不必宣告。
以上程式碼結果與上一段完全一致：

```shell
$ go run .
我叫 王小明
x = 42
```

注意，簡化宣告運算子 `:=` 一定要用來宣告新的變數，如要為現存變數賦值，就一定要用 `=`。以下程式將無法編譯：

```go
func main() {
    name := "王小明"
    name := "張西西"
    fmt.Println(name)
}
```

```shell
$ go run .                                                                                                         1
# github.com/moroz/hello-world
./main.go:7:7: no new variables on left side of :=
```

若看到 `no new variables on left side of :=` 這樣的錯誤訊息，通常就代表在應該用 `=` 的地方錯用 `:=`。

```go
func main() {
    name := "王小明"
    name = "張西西" // `:=` 改為 `=`
    fmt.Println(name)
}
```

```shell
$ go run .                                                                                                         1
張西西
```
