---
title: How to Set Up an ASP.NET Core MVC Application with PostgreSQL
date: 2025-07-15
lang: en
summary: |
    In this article you will learn how to set up an ASP.NET Core MVC project with a PostgreSQL database using Entity Framework Core and Npgsql.
---

This walkthrough assumes you are using the [JetBrains Rider](https://www.jetbrains.com/rider/) IDE on a Unix-like operating system (Linux, macOS, or Windows with [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)). To a certain extent, it _may_ work on Windows with PowerShell, but I have not tested it.

In this workthrough, I will be using the .NET toolchain installed using [mise](https://mise.jdx.dev/). Ensure that `mise` is correctly installed and up to date:

```shell
$ mise doctor --json | jq -r .activated,.version
true
2025.7.10 linux-x64 (2025-07-14)
```

Install the latest .NET toolchain:

```shell
$ mise use -g dotnet
mise ~/.config/mise/config.toml tools: dotnet@9.0.301
```

Create a directory to store your projects at `~/projects`:

```shell
$ mkdir -p ~/projects
```

In this directory, create a C# solution called `MyApp`:

```shell
$ cd ~/projects
$ dotnet new sln -n MyApp -o MyApp
```

In the solution directory, initialize a Git repository, and create an initial commit:

```shell
$ cd ~/projects/MyApp
$ git init --initial-branch=main
$ git add .
$ git commit -m "Initial commit"
```

Inside this solution, Create an ASP.NET MVC project called `MyApp.Web` using the [ASP.NET Core Web App (Model-View-Controller)](https://github.com/dotnet/aspnetcore/tree/main/src/ProjectTemplates/Web.ProjectTemplates/content/StarterWeb-CSharp) template. This project will contain the code related to the Web-facing functionality of the application.

```shell
$ dotnet new mvc -o MyApp.Web
```

Add the newly created project to the `MyApp` solution:

```shell
$ dotnet sln add MyApp.Web
```

In the project's root directory, create a `.gitignore` file to avoid accidentally commiting dependencies and compiled binaries:

```shell
cat > .gitignore <<-EOF
bin/
obj/
/packages/
riderModule.iml
/_ReSharper.Caches/
EOF
```

Add the `MyApp.Web` project to Git and commit:

```shell
$ git add .
$ git commit -m "Generate MyApp.Web project"
```

Generate a minimal project called `MyApp.Data`. This is the

```shell
$ dotnet new classlib -n MyApp.Data -o MyApp.Data
$ dotnet sln add MyApp.Data
```

Add the `MyApp.Data` project to Git and commit:

```shell
$ git add .
$ git commit -m "Generate MyApp.Data project"
```

Within the `MyApp.Data` project, install a few [NuGet](https://www.nuget.org/) packages related to [EF Core](https://learn.microsoft.com/en-us/ef/core/) (short for Entity Framework Core) and [Npgsql](https://www.npgsql.org/) (the library connecting EF Core to PostgreSQL):

```shell
$ cd ~/projects/MyApp/MyApp.Data
$ dotnet add package Microsoft.EntityFrameworkCore
$ dotnet add package Microsoft.EntityFrameworkCore.Design
$ dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

Within the `MyApp.Web` project, we **are** going to need `Microsoft.EntityFrameworkCore` and `Npgsql.EntityFrameworkCore.PostgreSQL` to configure a database context. However, at this point we **do not need** `Microsoft.EntityFrameworkCore.Design`, which is needed to generate and run database schema migrations.

```shell
$ cd ~/projects/MyApp/MyApp.Web
$ dotnet add package Microsoft.EntityFrameworkCore
$ dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

Commit the changes to project dependencies:

```shell
$ git add -A
$ git commit -m "Install EF Core and Npgsql dependencies"
```

Install `dotnet-ef`, a command-line tool used to generate and perform database schema migrations.

```shell
$ dotnet tool install --global dotnet-ef
```
