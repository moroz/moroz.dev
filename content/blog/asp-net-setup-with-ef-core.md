---
title: How to Set Up an ASP.NET Core MVC Application with PostgreSQL
date: 2025-07-15
lang: en
summary: |
    In this article you will learn how to set up an ASP.NET Core MVC project with a PostgreSQL database using Entity Framework Core and Npgsql.
draft: true
---

This walkthrough assumes you are using the [JetBrains Rider](https://www.jetbrains.com/rider/) IDE on a Unix-like operating system (Linux, macOS, or Windows with [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)). To a certain extent, it _may_ work on Windows with PowerShell, but I have not tested it.

In this workthrough, I will be using the .NET toolchain installed using [mise](https://mise.jdx.dev/). Ensure that `mise` is correctly installed and up to date:

```shell
$ mise doctor --json | jq -r .activated,.version
true
2025.7.10 macos-arm64 (2025-07-14) 
```

Install the latest .NET toolchain:

```shell
$ mise use -g dotnet
mise ~/.config/mise/config.toml tools: dotnet@9.0.301
```

Next, let's create an ASP.NET MVC application using the [ASP.NET Core Web App (Model-View-Controller)](https://github.com/dotnet/aspnetcore/tree/main/src/ProjectTemplates/Web.ProjectTemplates/content/StarterWeb-CSharp) template. You _could_ do this in your IDE using _File > New Solution_, but it's actually a little bit easier to do from the command line:

```shell
# Create a directory for your projects
$ mkdir -p ~/projects
$ cd ~/projects

# Create a project called MvcPostgres1
$ dotnet new mvc -o MvcPostgres1
```

In the newly created project, initialize a Git repository:

```shell
$ cd ~/projects/MvcPostgres1
$ git init --initial-branch=main
```

Create a `.gitignore` file to avoid accidentally commiting dependencies and compiled binaries:

```shell
cat > .gitignore <<-EOF
bin/
obj/
/packages/
riderModule.iml
/_ReSharper.Caches/
EOF
```

Finally, stage all newly created files for commit and create an initial commit:

```shell
$ git add .
$ git commit -m "Initial commit"
```

We are going to 

Install Entity Framework Core and [Npgsql](https://www.npgsql.org/) (a .NET library used to communicate with PostgreSQL databases):

```shell
dotnet add package Npgsql
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.Design
```

Install `dotnet-ef`, a command-line tool used to generate and perform database schema migrations.
