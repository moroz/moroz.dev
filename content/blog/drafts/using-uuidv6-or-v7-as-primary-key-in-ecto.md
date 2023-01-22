---
title: Using UUIDv6 or v7 as primary key in Ecto
author: Karol Moroz
date: 2023-01-22
draft: true
slug: using-uuidv6-or-v7-as-primary-key-in-ecto

summary: |
  UUIDs are a great choice for primary keys in Postgres.
  However, not all UUIDs were created equal.
  This post discusses the pros and cons of different versions and explains
  how to use newer variants in Ecto for Elixir.
---

Yesterday I read a post on the Supabase blog called [Choosing a Postgres Primary Key](https://supabase.com/blog/choosing-a-postgres-primary-key).
The article discussed the topic of UUIDs at length.

The acronym UUID stands for *Universally Unique IDentitfier* and refers to a 128-bit identifier that can be used to identify resources in databases and other computer systems.
In simpler terms, UUIDs are in essence really long numbers that are so long and random that they are not likely to ever repeat, even if you generate them on different computers.
For that reason, they are sometimes called *Globaly Unique IDentifiers*, or GUID.

The broad definition of UUID does not specify how these identifiers should be generated, and there are multiple variants to choose.
Until now, I have primarily used UUIDv4, which is essentially fully random.
Completely random identifiers have the benefit of being impossible to guess, but they are not a perfect choice for database primary keys.

If your primary key is an incremented integer (`serial` or `integer generated as identity`), you can get the last record in a table by simply adding `order by id desc limit 1`
to your query. In fact, this pattern is so common that this is exactly what many ORMs will do if you call `.last`.
Since UUIDv4 identifiers are completely random, they do not sort properly and are difficult for many databases to index.
You can still get the last record inserted in a table if you order by creation timestamp (`order by inserted_at desc limit 1`), but if you do that often, you will need to also create an index on that column.

UUIDv6 and UUIDv7, however, are not completely random, and are designed to begin with a timestamp, so they still sort correctly.

While PostgreSQL supports UUID identifiers out of the box, the [uuid-ossp](https://www.postgresql.org/docs/current/uuid-ossp.html) package in the standard distribution can only generate UUID v1, v3, v4, and v5.

