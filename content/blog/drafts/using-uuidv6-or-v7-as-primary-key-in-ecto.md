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
The article discussed the topic of UUIDs in detail.

The acronym UUID stands for *Universally Unique IDentitfier* and refers to a 128-bit identifier that can be used to identify resources in databases and other computer systems.
In simpler terms, UUIDs are essentially really long numbers that are so long and random that you are unlikely ever to come across the same number, even if you generate them on different computers.
For that reason, they are sometimes called *Globaly Unique IDentifiers*, or GUID.

PostgreSQL has a native UUID data type and can do all sorts of operations on data with UUID primary keys.
The broad definition of UUID does not specify what exactly goes into the 128 bits of a UUID, and there are several variants to choose from.
So far, I have primarily used UUIDv4, which is essentially completely random.
Completely random identifiers have the advantage of being impossible to guess, but they are not a perfect choice for database primary keys.

If your primary key is an incremented integer (`serial` or `integer generated as identity`), you can get the last record in a table simply by adding `order by id desc limit 1`
to your query. In fact, this pattern is so common that many ORMs will do exactly this if you call `.last`.
Since UUIDv4 identifiers are completely random, they do not sort properly and are difficult for many databases to index.
You can still get the last record inserted into a table if by ordering by creation timestamp (`order by inserted_at desc limit 1`), but if you do this often, you will also need to create an index on that column.

UUIDv6 and UUIDv7, however, are not completely random, and are designed to start with a timestamp, so they still sort correctly.
While PostgreSQL supports UUID identifiers out of the box, there is no way to automatically generate v6 or v7 UUIDs with the standard PostgreSQL distribution.
The [uuid-ossp](https://www.postgresql.org/docs/current/uuid-ossp.html) package in the standard PostgreSQL distribution can only generate UUID v1, v3, v4, and v5.
You can, however, generate those newer UUIDs on the application level.


