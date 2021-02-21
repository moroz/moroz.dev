---
title: 雞同兔講：如何讓兩隻不同程式語言透過 RabbitMQ 溝通
date: 2021-02-20
slug: ji-tong-tu-jiang-ruhe-rang-liang-zhi-bu-tong-chengshi-yuyan-touguo-rabbitmq-goutong
lang: zh-Hant
---

## 摘要

本文描寫了如何透過 RabbitMQ 使 Node.js 與 Elixir 即時溝通。
這個作法可以套用在近幾年很時尚的微型服務上。

## 序

近期有一個專案需要為一個現有的系統新增功能。
原始的專案以 Node.js 為後端伺服器。該專案為公司內用系統，規模不大，然而結構卻錯綜複雜。
小編認為 Node.js 生態環境最嚴重的問題一向就是沒有可行的 ORM。
只要不需要碰到資料庫，Node 就可以寫得很愉快，可惜大部分應用程式都需要資料庫。
現有的 ORM 各有優缺點，尤其是文檔沒有完全覆蓋全部的功能與設定，但目前為止最好的應該就是 TypeORM。

TypeORM 雖然在簡單查詢方面尚可，但測試方面表現不佳，無法以資料庫交易（transaction）隔斷每一項測試的資料庫連接，使資料庫互動的測試極為艱難。
這個難點唯一解決方案是 [typeorm-test-transactions](https://www.npmjs.com/package/typeorm-test-transactions) 這個包。
可見該包的作者很努力，但大概是因為 TypeORM 連接池的設計，它只支援很基本的查詢（使用 `Repository` 或 `BaseEntity` 的方法），
而一旦出現比較復雜的查詢（使用 `getConnection()`），就會取得另外一個資料庫連接，使交易無效。

同時，小編最擅長的一門程式語言 Elixir 在單元測試方面的表現非常好：
每一個用 `mix phx.new` 建立的 Phoenix 專案都預備 ExUnit 測試框架及支援獨立測試的資料庫連接框架 Ecto。
Elixir 的測項文法簡潔，執行速度非常快。
因此，最終的開發策略便是在原始的資料庫結構上額外加上一款用 Phoenix 框架開發的應用程式，與原有的系統共用資料庫。
大部分的時候，共用的資料庫已經足以讓兩款應用程式協力合作，唯有少數的時候需要互相通知。

小編遇到的情況如下：原始的系統與新的系統都可以下訂單，然而收款服務只能指定一個 webhook 接口。
特此收款邏輯保留在原始系統內。收款時將判斷收款的訂單為哪款應用程式所建立，若為原始 Node 系統所建立，則按原始的方法處理，而若為新的 Elixir 系統所建立，則即時通知 Elixir。

## 範例專案介紹


