---
title: How to Use Phoenix 1.7 with Vite.js
slug: phoenix-1-7-with-vite-js
date: 2024-11-20
summary: |
    How to set up a Phoenix 1.7 project with Vite.js in place of the default setup,
    or how to start a Phoenix project if you're not a Tailwind person.
draft: true
---

This article will guide you through the process of integrating a new [Phoenix 1.7](https://www.phoenixframework.org/) application with [Vite.js](https://vite.dev/). I will show you how to use it in development, and how to prepare your application for deployment using Docker.
It is a partly rewritten version of an earlier article called [Integrating Vite.js with Phoenix 1.6](/blog/integrating-vite-js-with-phoenix-1-6/).

On the front end side of things, I will be using the `vanilla-ts` template, with no front end framework and pre-configured TypeScript support.

### Steps

Make sure you have Elixir, Erlang, and Node.js configured on your development machine.
This article was written and tested on Debian 12 "Bookworm", using Elixir 1.17.3, Erlang 27.1.2, and Node 22.11.0 (the latest LTS version as of this writing):

```shell
$ node --version
v22.11.0

$ elixir --version
Erlang/OTP 27 [erts-15.1.2] [source] [64-bit] [smp:16:16] [ds:16:16:10] [async-threads:1] [jit:ns]

Elixir 1.17.3 (compiled with Erlang/OTP 27)

# https://stackoverflow.com/a/34326368
$ erl -eval '{ok, Version} = file:read_file(filename:join([code:root_dir(), "releases", erlang:system_info(otp_release), "OTP_VERSION"])), io:fwrite(Version), halt().' -noshell
27.1.2
```

Install the `mix phx.new` generator. This is only necessary when you first generate the project.

```shell
$ mix local.hex --force
$ mix archive.install hex phx_new
```

Create a new Phoenix project. For the sake of simplicity, we will be using [SQLite3](https://www.sqlite.org/index.html). This is because SQLite3 stores all of its data in regular files, unlike most other database management systems, such as PostgreSQL or MySQL/MariaDB, which run as servers. This way, I do not need to explain how to configure a database server on your machine.

For a real world project, I highly recommend you use [PostgreSQL](https://www.postgresql.org/) instead.

```shell
$ mix phx.new --database=sqlite3 --no-assets --no-live my_app
```

After this command has finished its execution, initialize a Git repository and commit the initial contents:

```shell
$ cd my_app
$ git init
$ git add -A
$ git commit -m "Initial commit"
```

Initialize a database and run any migrations (spoiler: there are none).

```shell
$ mix ecto.setup
Generated my_app app
The database for MyApp.Repo has been created

19:08:38.799 [info] Migrations already up
[info] Migrations already up
```
