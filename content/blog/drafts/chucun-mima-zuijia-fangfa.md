---
title: 儲存密碼最佳方法：如果使用 Go 儲存密碼
date: 2023-11-25
slug: chucun-mima-zuijia-fangfa
lang: zh-Hant-TW

summary: |
    各位讀者如果想要學習網頁開發，遲早會遇到儲存密碼的問題。
    究竟如何儲存密碼才最好？
    如何才不會讓「密碼在網路上裸奔」？
---

各位讀者如果想要學習網頁開發，遲早會遇到儲存密碼的問題。
究竟如何儲存密碼才最好？
如果你來此只是為了得到答案，可以直接跳去看[答案：使用專用密碼加密演算法](#answer)。

## 安全考量

觀察一般使用者的密碼習慣，或許會發現，其實很多人使用的密碼都不怎麼好，而且根據 <a href="https://docs.google.com/presentation/d/16lVP0KxbUZqup9c2NAKivKj7Im7TsBUpRoBq_CzDInw/edit#slide=id.gd394e02ceb_0_3227" target="_blank" rel="noopener noreferrer">Bitwarden 2021 的密碼習慣調查結果</a>，85% 的接受調查者會在多個網站與多個地方重複使用同樣的密碼。不僅這樣，很多人所使用的密碼<a href="https://www.cnbc.com/2023/11/16/most-common-passwords-70percent-can-be-cracked-in-less-than-a-second.html" target="_blank" rel="noopener noreferrer">非常簡單，很容易被黑客猜對</a>。如果你的組織經營一個較大的網站，你的正式資料庫裡很高機率儲存著非常多很好猜的密碼。而萬一資料庫泄漏了，黑客就會拿到使用者清單加上密碼，可以直接一一去嘗試其他常用的網站。

所以開發網頁的時候一定要保證，**即使資料庫泄漏了，黑客也無法猜到密碼**。本文旨在解釋為何常見的儲存密碼的方法可能不是最佳選擇。

## 單純方法一：直接存純文本（plain text）

最單純的方法，就是直接在資料庫裡面儲存密碼。黑客一旦拿到了資料庫，也直接拿到了密碼。這是安全性最低的方法，請不要使用。

## 單純方法二：密碼雜湊函數（hash function）

第二個單純的方法是使用一種密碼雜湊函數（英：*hash function*）。密碼雜湊函數保證，接受同樣的輸入資料，都會返回一樣的輸出資料。這種加密法是單向的，也就是說，密碼一旦寫入資料庫，我們無法解密原本的密碼，只能判斷使用者所輸入的密碼是否正確。

常見的密碼雜湊函數主要為 <a href="https://zh.wikipedia.org/zh-tw/MD5" target="_blank" rel="noopener noreferrer">MD5</a> 與 <a href="https://zh.wikipedia.org/wiki/SHA%E5%AE%B6%E6%97%8F" target="_blank" rel="noopener noreferrer">SHA 家庭</a>的函數（<a href="https://zh.wikipedia.org/wiki/SHA-1" target="_blank" rel="noopener noreferrer">SHA-1</a>、<a href="https://zh.wikipedia.org/wiki/SHA-2" target="_blank" rel="noopener noreferrer">SHA-256</a>等）。我在台灣一個上線的專案裡看到有人直接使用 MD5，用一臺筆電在幾分鐘內解密了系統裡七成的密碼。

如果直接使用密碼雜湊函數，所有使用同一個不好的密碼的使用者在資料庫裡也都看得到同樣的密碼雜湊函數結果。另外，這種函數可以計算得很快，大多數的常用密碼也可以直接對<a href="https://zh.wikipedia.org/zh-tw/%E5%BD%A9%E8%99%B9%E8%A1%A8" target="_blank" rel="noopener noreferrer">彩虹表</a>（英：*rainbow table*）。這樣的方法僅比直接儲存純文本好一點點，請不要使用。

## 不那麼單純的方法：密碼雜湊函數加鹽（hash+salt）

黑客們都討厭這個簡單的技巧：加鹽其實是一個非常簡單的概念。「鹽」是一個隨機值，這個值可以直接儲存在資料庫裡面。每次套用密碼雜湊函數的時候都是將「鹽」跟密碼一起輸入。這樣，即使密碼重複了，只要對應的「鹽」不同，加密後的結果會不一樣。

以上的方法我也在台灣一個上線的專案裡看過。這個方法安全性沒有跟前兩個方法一樣糕，但還是請你不要使用，有更簡單的作法：使用專用加密密碼的函數。

<h2 id="answer">TL;DR 請用 bcrypt</h2>

Bcrypt 原則上也是一種密碼雜湊函數，但它與 MD5 或 SHA 家族的密碼雜湊函數的不同點就是，bcrypt 是專門拿來儲存密碼的。

我在 <a href="https://github.com/moroz/bcrypt-demo" target="_blank" rel="noopener noreferrer">github.com/moroz/bcrypt-demo</a> 上傳了一個小專案，裡面雖然沒有用到網頁的部分，但仍提供了一個簡單的使用 bcrypt 加密密碼的範例。

## 吐槽：不合理的密碼限制
