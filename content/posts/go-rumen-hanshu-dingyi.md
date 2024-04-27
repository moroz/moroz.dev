---
title: Go 入門：函數定義
date: 2023-11-27
slug: go-rumen-hanshu-dingyi
lang: zh-Hant-TW

summary: 函數與做蛋糕有什麼關係？如何定義一些簡單的函數？寫布林函數的時候要注意什麼？
---

開發軟體像做蛋糕一樣。一開始，只有一個粗略的，很抽象的描寫，如：「做蛋糕」。然而，如果只提供這麼簡約的描寫，恐怕沒有特別多人做得出蛋糕，更不可能每一次都是同一個口味，也無法保證每一次都做得一樣好。

因此，目標要設得更明確，如：「我要做一個蘋果派」。這樣，我們可以將做蘋果派的流程分得更細：

* 買原料、
* 做蘋果泥、
* 做麵團、
* 將蘋果泥塗在麵團上、
* 烘焙、
* 冷卻。

這時候，一個人看到以上步驟，說不定已經可以做得出還不錯的蘋果派。那是因為人的大腦會在處理過程中加上大腦內部現有的輸入資料，也就是說每一個人的教育與經驗。然而，電腦不會自己學習，你要它做什麼，它就做什麼，不會突暫停來思考你所輸入的程式是否合理。

所以上面的每一步都要繼續拆解，將每一個小任務都分為更小的動作。比如說，做麵團，就是要拿一個金屬碗，將三杯麵粉加進去，加上150克奶油、一杯糖、一茶匙蘇打粉、五克鹽，攪拌均勻。每一個動作都要分解為不能再拆解的小步驟，才可以保證之後的實作都會一樣可靠。

開發軟體的概念很接近。每一個功能都要拆成很細節的小步驟，而且還要了解動作之間的相依關係。

最簡單的一種函數就是高中數學學過的純函數。如果一個函數得到一樣的輸入值總是返回一樣的結果，就可以稱為「純函數」。以下有兩個範例：

```go
package main

import "fmt"

// AddTwo: f(x) = x + 2
func AddTwo(x int) int {
    return x + 2
}

// SubtractThree: f(x) = x - 3
func SubtractThree(x int) int {
    return x - 3
}

func main() {
    fmt.Printf("AddTwo(2) = %d\n", AddTwo(2))
    fmt.Printf("SubtractThree(2) = %d\n", SubtractThree(2))
}
```

從上方範例可以猜出 Go 語言定義函數的語法：

* 關鍵字 `func`：表示後續為函數定義。
* 函數名稱：`AddTwo`、`SubtractThree`。如果函數名稱的第一個符號為大寫拉丁字母，該函數成為公開函數，可以在該軟體包（package）以外使用。
* 左圓括號：`(`
* 零或更多的參數名稱與類型：`x int` 代表該函數接受一個參數，名稱為 `x`，類型為預設大小整數`int`（32位處理器用32位，64位處理器用64位，同 Rust 的 isize）。
* 右圓括號：`)`
* 零或更多的返回值，只寫類型：`int`。Go 的函數可以返回多個返回值，如果返回值數為兩個以上，必須用圓括號包圍，如：`(int, int)`。
* 最後為左花括號：`{`，開始一個 block。

執行上方程式的結果相當好猜：

```shell
$ go run .
AddTwo(2) = 4
SubtractThree(2) = -1
```

## 變數範圍

每一個函數定義都有一個獨立的變數範圍（scope），一個函數的區域變數僅存在於該函數裡面。所以以下一段程式碼不會編譯：

```go
package main

import "fmt"

// 不論呼叫這個函數的時候我們給它什麼，這裡面都會叫 x
func DivideByFour(x float64) float64 {
    return x / 4
}

func main() {
    // y 為 main 的區域變數
    y := 33.0
    // 將 y 的值克隆給 DivideByFour 使用
    // 函數裡面這個值就會存在於 x 參數（區域變數）裡面
    fmt.Println(DivideByFour(y))
    // 但 DivideByFour 以外 x 不存在
    // 所以編譯器會抱怨我們用了不存在的變數
    fmt.Println(x)
}
```

`DivideByFour` 這個函數有一個名為 `x` 的參數。參數在函數內成為區域變數，但函數一旦結束，該函數以外的程式碼將讀不到這個變數：

```shell
$ go run .
# github.com/moroz/functions-demo/cmd/exp/scope
./main.go:12:14: undefined: x
```

對於初學者而言，這個概念可能有點陌生，但其實有固定的變數範圍讓程式的邏輯與資訊流程比較好理解，每一個區域裡面可以用比較短的變數名稱，也不用思考某一段程式裡面會不會有其他地方覆蓋了我的變數。

## 布林條件

布林（`bool`）為「是」或「否」的資料類型。如：

```go
是否住在台灣 := true
是否喜歡寫_Python := false
```

布林值最常見的用途就是 `if-else` 條件表達式（conditional expressions）：

```go
// 如果這個布林條件是真的，就進行這個 block
if 是否住在台灣 {
    fmt.Println("本文筆者目前住在台灣")
} else { // else 為「否則」的意思
    fmt.Println("本文筆者住在國外！")
}
```

```shell
$ go run .
本文筆者目前住在台灣
```

這邊主要需要注意的是，不要寫 `if 是否住在台灣 == true`，因為`是否住在台灣`這個變數已經是布林值。如果想要否定一個布林值，用 `!` 運算子，寫在布林值前面。`!` 的意思可以理解成「不」，甚至**某些**程式語言裡面會直接用 `not` 這個寫法來表示同樣的意思。

```go
// 如果不喜歡，才會印出來
if !是否喜歡寫_Python {
    fmt.Println("本文筆者不喜歡 Python 唷~")
}
```

```shell
$ go run .
本文筆者目前住在台灣
本文筆者不喜歡 Python 唷~
```

## 布林函數

那麼，如果我們要寫一個函數來幫我們反復判斷一個條件，布林函數是理所當然的選擇。當我們第一次嘗試寫一個布林函數的時候，可能會寫出像下方這種單純寫法：

```go
package main

import "fmt"

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 256

// ValidatePasswordLength 確認一個密碼長度是否在
// MIN_PASSWORD_LENGTH 與 MAX_PASSWORD_LENGTH 之間
// 要牢記，原則上密碼越長，越難被黑客猜
// 所以請讀者趕快開始用一個密碼管理器，如 1Password 或 BitWarden
func ValidatePasswordLength(password string) bool {
    length := len(password)
    if length >= MIN_PASSWORD_LENGTH && length <= MAX_PASSWORD_LENGTH {
        return true
    } else {
        return false
    }
}

func main() {
    // 這個密碼真的太短
    shortPass := "short"
    // 很多簡單的英文字的密碼其實蠻安全的
    okPass := "correct-horse-battery-staple"
    fmt.Printf(
        "ValidatePasswordLength(\"%s\") = %t\n",
        shortPass,
        ValidatePasswordLength(shortPass),
    )
    fmt.Printf(
        "ValidatePasswordLength(\"%s\") = %t\n",
        okPass,
        ValidatePasswordLength(okPass),
    )
}
```

以上程式碼效果正確：

```shell
$ go run .
ValidatePasswordLength("short") = false
ValidatePasswordLength("correct-horse-battery-staple") = true
```

但其實這 `ValidatePasswordLength` 的寫法多此一舉。為什麼呢？那就是因為裡面有一個 `if-else` 條件表達式，而 Go 的 `if` 一律只接受布林條件，所以 `if` 的條件已經是我們要返回的值！所以其實這個函數可以用以下技巧省略好幾行程式碼：

```go
func ValidatePasswordLength(password string) bool {
    length := len(password)
    return length >= MIN_PASSWORD_LENGTH && length <= MAX_PASSWORD_LENGTH
}
```

功能還是正確：

```shell
$ go run .
ValidatePasswordLength("short") = false
ValidatePasswordLength("correct-horse-battery-staple") = true
```

所以請各位讀者牢記，布林函數裡面通常不需要條件性的 `return`，如果你寫的程式碼裡面有這種情況，請往後退一步並想看看該函數是否可以簡化。
