---
title: 儲存密碼最佳方法：如何使用 Go 儲存密碼
date: 2023-11-25
slug: chucun-mima-zuijia-fangfa
lang: zh-Hant-TW

summary: |
    各位讀者如果想要學習網頁開發，遲早會遇到儲存密碼的問題。究竟如何儲存密碼才最好？如何才不會讓「密碼在網路上裸奔」？
---

各位讀者如果想要學習網頁開發，遲早會遇到儲存密碼的問題。
究竟如何儲存密碼才最好？
如果你來此只是為了得到答案，可以直接跳去看[答案：使用專用密碼加密演算法](#answer)。

## 安全考量

觀察一般使用者的密碼習慣，或許會發現，其實很多人使用的密碼都不怎麼好，而且根據 [Bitwarden 2021 的密碼習慣調查結果](https://docs.google.com/presentation/d/16lVP0KxbUZqup9c2NAKivKj7Im7TsBUpRoBq_CzDInw/edit#slide=id.gd394e02ceb_0_3227)，85% 的接受調查者會在多個網站與多個地方重複使用同樣的密碼。不僅這樣，很多人所使用的密碼[非常簡單，很容易被黑客猜對](https://www.cnbc.com/2023/11/16/most-common-passwords-70percent-can-be-cracked-in-less-than-a-second.html)。如果你的組織經營一個較大的網站，你的正式資料庫裡很高機率儲存著非常多很好猜的密碼。而萬一資料庫泄漏了，黑客就會拿到使用者清單加上密碼，可以直接一一去嘗試其他常用的網站。

所以開發網頁的時候一定要保證，**即使資料庫泄漏了，黑客也無法猜到密碼**。本文旨在解釋為何常見的儲存密碼的方法可能不是最佳選擇。

## 單純方法一：直接存純文本（plain text）

最單純的方法，就是直接在資料庫裡面儲存密碼。黑客一旦拿到了資料庫，也直接拿到了密碼。這是安全性最低的方法，請不要使用。

## 單純方法二：密碼雜湊函數（hash function）

第二個單純的方法是使用一種密碼雜湊函數（英：*hash function*）。密碼雜湊函數保證，接受同樣的輸入資料，都會返回一樣的輸出資料。這種加密法是單向的，也就是說，密碼一旦寫入資料庫，我們無法解密原本的密碼，只能判斷使用者所輸入的密碼是否正確。

常見的密碼雜湊函數主要為 [MD5](https://zh.wikipedia.org/zh-tw/MD5) 與 [SHA 家族](https://zh.wikipedia.org/wiki/SHA%E5%AE%B6%E6%97%8F)的函數（[SHA-1](https://zh.wikipedia.org/wiki/SHA-1)、[SHA-256](https://zh.wikipedia.org/wiki/SHA-2)等）。我在台灣一個上線的專案裡看到有人直接使用 MD5，用一臺筆電在幾分鐘內解密了系統裡七成的密碼。

如果直接使用密碼雜湊函數，所有使用同一個不好的密碼的使用者在資料庫裡也都看得到同樣的密碼雜湊函數結果。另外，這種函數可以計算得很快，大多數的常用密碼也可以直接對[彩虹表](https://zh.wikipedia.org/zh-tw/%E5%BD%A9%E8%99%B9%E8%A1%A8)（英：*rainbow table*）。這樣的方法僅比直接儲存純文本好一點點，請不要使用。

## 不那麼單純的方法：密碼雜湊函數加鹽（hash+salt）

黑客們都討厭這個簡單的技巧：加鹽其實是一個非常簡單的概念。「鹽」是一個隨機值，這個值可以直接儲存在資料庫裡面。每次套用密碼雜湊函數的時候都是將「鹽」跟密碼一起輸入。這樣，即使密碼重複了，只要對應的「鹽」不同，加密後的結果會不一樣。

以上的方法我也在台灣一個上線的專案裡看過。這個方法安全性沒有跟前兩個方法一樣糕，但還是請你不要使用，有更簡單的作法：使用專用加密密碼的函數。

<h2 id="answer">TL;DR 請用 Argon2id</h2>

當我開始寫本文的時候，我以為儲存密碼最好的選擇是 bcrypt 演算法。然而，經過約五分鐘的研究，我得知如今比較好的選擇是 [Argon2id](https://en.wikipedia.org/wiki/Argon2)（名字中的 id 代表演算法的不同版本，不是 identifier 的意思）。這個推薦來自於 [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)。

現代電腦越來越快，而且密碼雜湊函數可以用 GPU 計算，所以現代的加密密碼的函數主要需求是要消耗大量的計算資源。Argon2id 不僅可以設定密碼雜湊函數的迭代數，而且還可以設定最少要求多少記憶體。

我在 [github.com/moroz/password-demo](https://github.com/moroz/password-demo) 上傳了一個小專案，裡面用一個簡單的 CLI 方式展示了儲存密碼的方式。

### 資料結構

首先，用 [golang-migrate](https://github.com/golang-migrate/migrate) 建立了一個 migration，用以下 SQL 腳本建立了 `users` 資料表：

```sql
-- db/migrations/20231124175433_create_users.up.sql

-- 安裝 citext 擴充功能，提供不分大小寫的字串類型 citext
create extension if not exists "citext" with schema "public";

-- 以下為 users 資料表的定義
create table users (
  id uuid primary key, -- 主鍵為 UUID 類型，在應用程式層產生 UUIDv7
  email citext not null unique, -- 信箱不可重複且不分大小寫
  password_hash text, -- 加密後的密碼
  inserted_at timestamp(0) not null default (now() at time zone 'utc'), -- 紀錄新增時間
  updated_at timestamp(0) not null default (now() at time zone 'utc') -- 最後一次更新時間
);
```

以下為使用者的 model。本專案沒有用 ORM，只有用 [jmoiron/sqlx](https://github.com/jmoiron/sqlx) 將資料庫中的資料讀取為 struct：

```go
type User struct {
    ID           uuidv7.UUID `db:"id"`
    Email        string      `db:"email"`
    PasswordHash string      `db:"password_hash"`
    InsertedAt   time.Time   `db:"inserted_at"`
    UpdatedAt    time.Time   `db:"updated_at"`
}
```

### 新增使用者

以上結構裡的 `uuidv7.UUID` 為筆者自己開發的軟體包 [moroz/uuidv7-go](https://github.com/moroz/uuidv7-go) 所提供的 UUID 類型。UUIDv7 為新一代的 ID 標準，本網頁曾用英文描寫過：[Using UUIDv6 or v7 as primary key in Ecto](/blog/using-uuidv6-or-v7-as-primary-key-in-ecto)。我之所以開發了自己的軟體包，是因為網路上找不到針對 Go 語言的 UUIDv7 的實作。一開始找到的 [GoWebProd/uuid7](https://github.com/GoWebProd/uuid7) 邏輯有誤，該使用 big-endian 的地方用了 little-endian，因此所產生的值不是正確的 UUIDv7 值。

Argon2id 的軟體包為 [alexedwards/argon2id](https://github.com/alexedwards/argon2id)。雖然 [golang.org/x/crypto/argon2](https://pkg.go.dev/golang.org/x/crypto/argon2) 本身提供了 Argon2id 所需函數，但是使用方法不簡單，`alexedwards/argon2id` 稍微好用一些。

新增使用者的時候做一些簡單的資料驗證，如果資料都符合需求（信箱與密碼不能為空、密碼確認必須與密碼相符），就可以將密碼轉換為 argon2id digest：

```go
// Argon2 的設定：46 MiB 記憶體，一個迭代
var ARGON2_PARAMS = argon2id.Params{
    Memory:      46 * 1024, // 46 MiB
    Iterations:  1,
    Parallelism: 1,
    SaltLength:  16,
    KeyLength:   16,
}

const USER_COLUMNS = "id, email, password_hash, inserted_at, updated_at"

func CreateUser(db *sqlx.DB, email, password, passwordConfirmation string) (*User, error) {
    // 信箱不能為空
    if email == "" {
        return nil, errors.New("Email cannot be blank!")
    }

    // 密碼不能為空
    if password == "" {
        return nil, errors.New("Password cannot be blank!")
    }

    // 密碼確認必須與密碼相符
    if password != passwordConfirmation {
        return nil, errors.New("Passwords do not match!")
    }

    // 套用 argon2id 密碼雜湊函數
    digest, err := argon2id.CreateHash(password, &ARGON2_PARAMS)
    if err != nil {
        return nil, err
    }

    result := User{}

    // 產生 UUIDv7
    id := uuidv7.Generate()

    // SQL INSERT 插入資料，用 RETURNING 即可與插入同時取得新的一筆資料
    err = db.Get(
        &result,
        `insert into users (id, email, password_hash)
        values ($1, $2, $3) returning `+USER_COLUMNS,
        // SQL 語法中三個佔位符 $1, $2, $3 需提供三個參數
        id.String(), email, digest,
    )
    return &result, err
}
```

使用以上一段程式碼寫了一個簡單的應用程式，可以新增使用者：

```go
package main

import (
    "fmt"
    "log"
    "strings"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
    "github.com/moroz/password-demo/config"
    "github.com/moroz/password-demo/models"
)

func main() {
    db := sqlx.MustConnect("postgres", config.DATABASE_URL)

    var email, password, confirmation string
    fmt.Print("Email: ")
    fmt.Scanln(&email)
    fmt.Print("Password: ")
    fmt.Scanln(&password)
    fmt.Print("Confirm password: ")
    fmt.Scanln(&confirmation)

    // 刪除前後的空白字符
    email = strings.TrimSpace(email)

    user, err := models.CreateUser(db, email, password, confirmation)
    if err != nil {
        log.Println(err)
    } else {
        log.Printf("Created user with ID: %s\n", user.ID.String())
    }
}
```

新增使用者結果：

```shell
$ go run .
Email: user@example.com
Password: foobar
Confirm password: foobar
2023/11/26 22:56:45 Created user with ID: 018c0c22-04e0-7900-92f2-25c57662e998
```

讓我們瞧瞧密碼被轉換為 argon2id 會長什麼樣：

```shell
$ psql password_demo_dev
psql (16.0, server 15.2)
Type "help" for help.

password_demo_dev=# \x
Expanded display is on.
password_demo_dev=# select id, email, password_hash hash from users;
-[ RECORD 1 ]-----------------------------------------------------------------------
id    | 018c0c22-04e0-7900-92f2-25c57662e998
email | user@example.com
hash  | $argon2id$v=19$m=47104,t=1,p=1$e3rOL2Zvj2mqzwe7o2pycQ$7H5h7CbMq/uDzBpXzbvtMw
```

`$argon2id$...` 這一段鎖定了本密碼所使用的設定：46 MiB 記憶體（46 * 1024 KiB），`t=1` （iterations，一個迭代），`p=1`（parallelism，不並行處理）。這個字串的格式詳見 [PHC string format spec](https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md)。

### 使用者登入

以下函數可以使用電子信箱與密碼找出使用者並判斷所輸入的密碼正確與否：

```go
func AuthenticateUserByEmailPassword(db *sqlx.DB, email, password string) (*User, error) {
    result := User{}
    err := db.Get(
        &result,
        // 搜尋已設定密碼且符合輸入電子信箱之使用者
        "select "+USER_COLUMNS+" from users where password_hash is not null and email=$1",
        // 為 SQL 語法中的佔位符 $1 提供值：信箱
        email,
    )
    // 若查詢時發生錯誤，如：使用者不存在，連接失敗等，則放棄登入
    if err != nil {
        return nil, err
    }

    // 檢查密碼是否與當初所輸入的相符
    match, err := argon2id.ComparePasswordAndHash(password, result.PasswordHash)
    // 若檢查時發生錯誤，如：資料庫裡面儲存的密碼字串格式不正確等，則放棄登入
    if err != nil {
        return nil, err
    }

    // 成功檢查密碼，結果為不相符：拒絕登入
    if !match {
        return nil, errors.New("Invalid password")
    }

    // 成功登入：返回使用者資料
    return &result, nil
}
```

以下為簡單的應用程式，使用電子信箱與密碼驗證使用者：

```go
package main

import (
    "fmt"
    "log"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
    "github.com/moroz/password-demo/config"
    "github.com/moroz/password-demo/models"
)

func main() {
    db := sqlx.MustConnect("postgres", config.DATABASE_URL)

    var email, password string
    fmt.Print("Email: ")
    fmt.Scanln(&email)
    fmt.Print("Password: ")
    fmt.Scanln(&password)

    user, err := models.AuthenticateUserByEmailPassword(db, email, password)
    if err != nil {
        log.Println(err)
    } else {
        log.Printf("Signed in user with ID: %s\n", user.ID.String())
    }
}
```

稍早新增的使用者現在可以登入了：

```shell
$ go run .
Email: user@example.com
Password: foobar
2023/11/26 23:16:37 Signed in user with ID: 018c0c22-04e0-7900-92f2-25c57662e998
```

若使用不正確信箱或密碼：

```shell
$ go run .
Email: user@example.com
Password: invalid
2023/11/26 23:29:20 Invalid password
```

```shell
$ go run .
Email: invalid@example.com
Password: foobar
2023/11/26 23:29:31 sql: no rows in result set
```

### 重複密碼的處理

假設今天來了一個新的使用者，跟 `user@example.com` 那一位用了同樣的密碼：

```shell
$ go run .
Email: other@example.com
Password: foobar
Confirm password: foobar
2023/11/26 23:31:56 Created user with ID: 018c0c42-3b63-77b2-91cc-37d91d13a273
```

可見資料庫裡儲存的密碼字串跟第一個使用者不一樣：

```shell
$ psql password_demo_dev
psql (16.0, server 15.2)
Type "help" for help.

password_demo_dev=# \x
Expanded display is on.
password_demo_dev=# select id, email, password_hash hash from users;
-[ RECORD 1 ]-----------------------------------------------------------------------
id    | 018c0c22-04e0-7900-92f2-25c57662e998
email | user@example.com
hash  | $argon2id$v=19$m=47104,t=1,p=1$e3rOL2Zvj2mqzwe7o2pycQ$7H5h7CbMq/uDzBpXzbvtMw
-[ RECORD 2 ]-----------------------------------------------------------------------
id    | 018c0c42-3b63-77b2-91cc-37d91d13a273
email | other@example.com
hash  | $argon2id$v=19$m=47104,t=1,p=1$Jlieaj0Ne2Bk/WR02a3RuA$rR1lFhvTw9HnQ/jX73wg2g
```

## 吐槽：不合理的密碼限制

生活在台灣的我，在日常生活中經常遇到對於密碼內容與長短要求不理想的網站。以下為幾個常見的範例：

<figure class="bordered-figure">
<img src="/images/passwords/cathay.webp" alt="" />
<figcaption>國泰世華銀行：只能用拉丁字母與數字，長度限16位</figcaption>
</figure>

<figure class="bordered-figure">
<img src="/images/passwords/shopee.webp" alt="" />
<figcaption>蝦皮：只能用拉丁字母、數字與「常用的標點符號」，長度限16位</figcaption>
</figure>

<figure class="bordered-figure">
<img src="/images/passwords/pchome.webp" alt="" />
<figcaption>PCHome 24h：只能用拉丁字母、數字與底線，長度限16位</figcaption>
</figure>

總之，非常多常用的網站不讓使用者使用特殊符號，而且還限制密碼長度不能超過16個字符。希望看到這邊的讀者可以牢記，設定這種限制沒有理由。密碼雜湊函數可以接受任何長度的輸入資料，而且可以輸入任何二進制資料。限制密碼內容與長度恐會顯著降低安全性，請不要這麼做。

另一方面，密碼長度不能完全沒有限制，如果允許無限長度的密碼，那麼黑客可以送出非常長的密碼，導致伺服器忙著執行密碼雜湊函數，記憶體滿了，就會當機。合理的長度限制大概為8&ndash;256字符。
