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
這個難點唯一解決方案是 [typeorm-test-transactions](https://www.npmjs.com/package/typeorm-test-transactions) 這個包。
可見該包的作者很努力，但大概是因為 TypeORM 連接池的設計，它只支援很基本的查詢（使用 `Repository` 或 `BaseEntity` 的方法），
而一旦出現比較復雜的查詢（使用 `getConnection()`），就會取得另外一個資料庫連接，使交易無效。

同時，小編最擅長的一門程式語言在單元測試的方面表現非常好：每一個用 `mix phx.new` 建立的專案都具備使用獨立交易測試資料庫的功能；測項文法很簡潔，而且執行速度非常快。
因此，最終的開發策略便是在原始的資料庫結構上額外加上一款用 Phoenix 框架開發的 Elixir 應用程式，與原有的系統共用資料庫。
大部分的時候，共用的資料庫已經足以讓兩款應用程式協力合作，唯有少數的時候真正需要溝通。

小編遇到的情況如下：原始的系統與新的系統都可以下訂單，然而收款服務只能指定一個 webhook 接口。
特此在收款邏輯保留在原始系統，若收款的訂單為原始系統建立，則按原始的方法處理，
而若收款的訂單為 Phoenix 應用程式建立，則需要即時通知 Phoenix 一端。
近幾年微型服務很時尚，本文所描寫的技術也可以套用在微型服務上。
