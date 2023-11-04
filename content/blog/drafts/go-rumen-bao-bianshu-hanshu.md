---
title: Go 入門：包、變數、函數
date: 2023-11-04
slug: go-rumen-bao-bianshu-hanshu
lang: zh-Hant
---

## 先備知識

為了參與這堂課，請各位同學預先安裝最新的 Go。寫本文的時候最新的版本為 1.21.3。
使用 MS&nbsp;Windows 作業系統的同學可以至 [Go 官方網站](https://go.dev/dl/)下載安裝器。
Linux 或 macOS作業系統的使用者可以用 [rtx](https://github.com/jdx/rtx) 或 [Homebrew](https://brew.sh/) 安裝。

使用Windows作業系統的同學請另外安裝 [Git 版本控制系統](https://git-scm.com/download/win)。
如果你還沒有[註冊 GitHub](https://github.com/signup)，請先註冊並[設定 SSH 金鑰](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)。

你會需要一個程式碼編輯器。我本身偏好 [Neovim](https://neovim.io/)，但對於初學者而言，[Visual Studio Code](https://code.visualstudio.com/) 是還不錯的選擇。

如使用 Visual Studio Code，請安裝 [Rich Go language support for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=golang.Go) 的擴充包。

## 建立專案資料夾

接下來請打開終端機。在 Windows 環境，可用 Git Bash（安裝 Windows 版 Git 就會自動安裝 Git Bash）。
在 macOS 環境，可用 [iTerm2](https://iterm2.com/) 或 macOS 內建的 Terminal.app。

終於機預設打開的資料夾為你的「家目錄」，又名「主目錄」（英：_home directory_），如果在終端機看到波浪符號（`~`）或 `$HOME` 的寫法，那就是家目錄的意思。

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

用 `go mod init` 初始化 Go 軟體包。此處的名稱為 `github.com/<你的GitHub用戶名>/hello-world`。我的用戶名為 [moroz](https://github.com/moroz)，所以我會打：

```shell
$ go mod init github.com/moroz/hello-world
go: creating new go.mod: module github.com/moroz/hello-world
```

在裏面，我們可以初始化一個 Git 版本庫（英：_Git repository_）：

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

接下來，請用程式碼編輯器打開這個專案。如使用 Visual Studio Code，可以用以下指令開啟：

```shell
code .
```
