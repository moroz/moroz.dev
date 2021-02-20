---
title: 雞同兔講：如何讓兩隻不同程式語言透過 RabbitMQ 溝通
date: 2021-02-20
slug: ji-tong-tu-jiang-ruhe-rang-liang-zhi-bu-tong-chengshi-yuyan-touguo-rabbitmq-goutong
lang: zh-Hant
---

## 序

近期有一個專案需要為一個現有的系統新增功能。
原始的專案以 Node.js 為後端伺服器。該專案為公司內用系統，規模不大，然而結構卻錯綜複雜。
小編認為 Node.js 的生態環境最嚴重的問題一向就是沒有可行的 ORM，現有的那幾款皆有一些缺點，但目前為止最好的便是 TypeORM。

TypeORM 雖然在簡單查詢方面尚可，但測試方面表現不佳，無法以資料庫交易（transaction）隔斷每一項測試的資料庫連接，使資料庫互動的測試極為艱難。
這一點唯一方案便是 [typeorm-test-transactions](https://www.npmjs.com/package/typeorm-test-transactions) 這個包。
可見該包的制造者很努力，但大概是因為 TypeORM 連接池的設計，它只支援很基本的查詢（使用 `Repository` 或 `BaseEntity` 的方法），
一旦出現比較復雜的查詢（使用 `getConnection().createQueryBuilder()`），就會使用另外一個資料庫連接，使交易無效。
因此，也無法解決所有測試上的問題，主要是因為沒有一個簡單的強迫測試中的所有程式碼都使用同一個資料庫連接。

我們手上的專案原本沒有測試項目，原本打算為現有的 Node 架構漸漸加測試項目，但經八小時的實驗後我發現專案所使用的 TypeORM 在測試方面表現不佳，無法以資料庫交易（transaction）隔斷每一項測試的資料庫連接，使資料庫互動的測試極為艱難。
幸好小編最擅長的一門程式語言在單元測試的方面表現非常好：每一個用 `mix phx.server` 建立的專案都具備使用獨立交易測試資料庫的功能；測項文法很簡潔，執行速度非常快。
之後我們採用的開發策略是在原始的資料庫結構上另外增加一款用 Phoenix 框架開發的 Elixir 應用程式，與原有的系統共用資料庫。
