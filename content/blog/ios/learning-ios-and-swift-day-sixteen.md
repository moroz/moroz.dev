---
title: "Learning iOS and Swift. Day 16:"
date: 2022-06-02
slug: learning-ios-and-swift-day-sixteen
lang: en-US
draft: true

summary: |

---

```sql
create table practices (
  id integer primary key not null,
  name text not null unique,
  mala_size integer not null default 108
);
```

```sql
insert into practices (name) values
('Refuge'), ('Diamond Mind'),
('Mandala Offering'), ('Guru Yoga');
```

```sql
create table practice_history (
  id integer primary key not null,
  practice_id integer not null,
  amount integer not null,
  inserted_on text not null,
  foreign key (practice_id) references practices (id)
);
```

```sql
insert into practice_history (practice_id, amount, inserted_on)
values (2, 100, date())
on conflict (practice_id, inserted_on)
do update set amount = amount + excluded.amount;
```
