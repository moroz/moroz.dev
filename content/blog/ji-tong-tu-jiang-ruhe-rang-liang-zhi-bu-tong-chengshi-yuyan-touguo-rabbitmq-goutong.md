---
title: 雞同兔講：如何讓兩隻不同程式語言透過 RabbitMQ 溝通
date: 2021-02-20
slug: ji-tong-tu-jiang-ruhe-rang-liang-zhi-bu-tong-chengshi-yuyan-touguo-rabbitmq-goutong
---

## 序

近期工作上有一個專案需要為一個現有的系統新增功能。原始的專案以 Node.js 為後端伺服器，以 React.js 為前端單頁應用（SPA）界面。該專案為公司內用系統，規模不大，然而結構卻錯綜複雜。專案沒有測試項目，原本打算為現有的 Node 架構漸漸加測試項目，但經八小時的實驗後我發現 TypeORM 在測試方面表現不佳，無法以資料庫交易（transaction）隔斷每一項測試的資料庫連接，使資料庫互動的測試極為艱難。幸好小編最擅長的一門程式語言在單元測試的方面表現非常好：每一個用 `mix phx.server` 建立的專案都具備使用獨立交易測試資料庫的功能；測項文法很簡潔，執行速度非常快。

