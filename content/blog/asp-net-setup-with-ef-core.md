---
title: How to Set Up an ASP.NET Core MVC Application with PostgreSQL
date: 2025-07-15
lang: en
summary: |
    In this article you will learn how to set up an ASP.NET Core MVC project with a PostgreSQL database using Entity Framework Core and Npgsql.
---

## Prerequisites and Environment Setup

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

## Install and Configure PostgreSQL

Ensure that you have a recent version of [PostgreSQL](http://postgresql.org/) installed on your machine.

On Debian GNU/Linux and derivatives (Ubuntu, Linux Mint, etc.), you can install the latest version of PostgreSQL using [these instructions](https://www.postgresql.org/download/linux/debian/).

On macOS, you can install PostgreSQL using [Homebrew](https://brew.sh/).

On Windows, you can either install PostgreSQL using [an installer](https://www.postgresql.org/download/windows/), or install it within WSL2 using a package for Debian GNU/Linux.

On Linux, if you have just installed PostgreSQL for the first time, you will not be able to connect to the database as a regular user:

```plain
$ psql
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  role "karol" does not exist
```

You can fix this by creating a role and a database for your user:

```plain
$ sudo su postgres -c "createuser -s $(whoami)"
$ createdb
$ psql
psql (17.5 (Debian 17.5-1.pgdg120+1))
Type "help" for help.

karol=#
```

Set the password for database user `postgres` to `postgres`:

```plain
$ psql -c "alter user postgres password 'postgres'"
ALTER ROLE
```

You should now be able to connect to PostgreSQL as user `postgres`, password `postgres`:

```plain
$ psql postgres://postgres:postgres@localhost
psql (17.5 (Debian 17.5-1.pgdg120+1))
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off, ALPN: postgresql)
Type "help" for help.

postgres=#
```

The remaining part of this walkthrough assumes that the superuser's username is `postgres` and its password is `postgres`.

## Create Solution and Projects

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

## Install Dependencies

Within the `MyApp.Data` project, install a few [NuGet](https://www.nuget.org/) packages related to [EF Core](https://learn.microsoft.com/en-us/ef/core/) (short for Entity Framework Core) and [Npgsql](https://www.npgsql.org/) (the library connecting EF Core to PostgreSQL):

```shell
$ cd ~/projects/MyApp/MyApp.Data
$ dotnet add package Microsoft.EntityFrameworkCore
$ dotnet add package Microsoft.EntityFrameworkCore.Design
$ dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

Within the `MyApp.Web` project, install the same packages, as well as `EFCore.NamingConventions`. This library lets us configure EF Core to generate queries and migrations using `snake_case` for table and column names, rather than the customary `PascalCase`.

```shell
$ cd ~/projects/MyApp/MyApp.Web
$ dotnet add package Microsoft.EntityFrameworkCore
$ dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
$ dotnet add package Microsoft.EntityFrameworkCore.Design
$ dotnet add package EFCore.NamingConventions
```

Commit the changes to project dependencies:

```shell
$ git add -A
$ git commit -m "Install EF Core and Npgsql dependencies"
```

## Install EF Core CLI

Install `dotnet-ef`, a command-line tool used to generate and perform database schema migrations.

```shell
$ dotnet tool install --global dotnet-ef
```

This command may print a message like the following:

```plain
Tools directory '/Users/karol/.dotnet/tools' is not currently on the PATH environment variable.
If you are using zsh, you can add it to your profile by running the following command:

cat << \EOF >> ~/.zprofile
# Add .NET Core SDK tools
export PATH="$PATH:/Users/karol/.dotnet/tools"
EOF

And run `zsh -l` to make it available for current session.

You can only add it to the current session by running the following command:

export PATH="$PATH:/Users/karol/.dotnet/tools"

You can invoke the tool using the following command: dotnet-ef
Tool 'dotnet-ef' (version '9.0.7') was successfully installed.
```

If this happens, follow the instructions printed in this message to add the newly installed command to `PATH`. Once this is done, `dotnet-ef` should be available as `dotnet ef`:

```shell
$ which dotnet-ef
/Users/karol/.dotnet/tools/dotnet-ef
$ dotnet ef

                     _/\__
               ---==/    \\
         ___  ___   |.    \|\
        | __|| __|  |  )   \\\
        | _| | _|   \_/ |  //|\\
        |___||_|       /   \\\/\\

Entity Framework Core .NET Command-line Tools 9.0.7

# ... omitted for brevity ...
```

## Add Project Reference for `MyApp.Data`

In `MyApp.Web/MyApp.Web.csproj`, add a reference to the other project, `MyApp.Data`. This way, we can use code from that project inside `MyApp.Web`.

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
    <!-- ... omitted for brevity ... -->

    <!-- add this section -->
    <ItemGroup>
        <ProjectReference Include="../MyApp.Data/MyApp.Data.csproj"/>
    </ItemGroup>

</Project>
```

## Create Directories for `AppDbContext` and Models

At this point, in the `MyApp.Data` project, there are only two source files:

```shell
$ tree --gitignore MyApp.Data
MyApp.Data
├── Class1.cs
└── MyApp.Data.csproj

1 directory, 2 files
```

We are not going to use `Class1.cs`, so delete the file:

```shell
$ cd ~/projects/MyApp/MyApp.Data
$ rm Class1.cs
```

Instead, create files and directories for entity classes and for `AppDbContext`:

```shell
$ mkdir Entities
$ touch AppDbContext.cs Entities/Member.cs
```

The file structure should now look like this:

```shell
$ tree --gitignore MyApp.Data
MyApp.Data
├── AppDbContext.cs
├── Entities
│   └── Member.cs
└── MyApp.Data.csproj

2 directories, 3 files
```

Finally, open the project in your IDE of choice.

## Create `AppDbContext`

In `MyApp.Data/AppDbContext.cs`, add a class called `AppDbContext`. This class is going to be our main entry point for EF Core interactions.

```cs
using Microsoft.EntityFrameworkCore;

namespace MyApp.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
}
```

In `MyApp.Web/Program.cs`, connect your web application to `AppDbContext` using `.AddDbContext()`:

```cs
using Microsoft.EntityFrameworkCore;
using MyApp.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options
        .UseNpgsql(builder.Configuration.GetConnectionString("AppDbContext"))
        .UseSnakeCaseNamingConvention());

// ... omitted for brevity ...
```
