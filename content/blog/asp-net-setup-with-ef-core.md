---
title: How to Set Up an ASP.NET Core MVC Application with PostgreSQL
date: 2025-07-19
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

## Set a .NET Version for the Project

```shell
mise use dotnet
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

## Set a Connection String

In `MyApp.Web/appsettings.Development.json`, add a connection string under `ConnectionStrings.AppDbContext`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "AppDbContext": "Host=localhost; Username=postgres; Password=postgres; Database=my_app_dev"
  }
}
```

Unfortunately, Npgsql does not support standard [libpq connection strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).

## Generate the First Migration

Before we create any tables in the database, we're going to write a separate migration to create a [PL/pgSQL](https://www.postgresql.org/docs/current/plpgsql.html) function that generates [UUIDv7](https://www.rfc-editor.org/rfc/rfc9562.html#name-uuid-version-7) identifiers. We are going to use UUIDv7 for primary keys in this project.

Generate the first migration using `dotnet ef`:

```shell
$ cd ~/projects/MyApp
$ dotnet ef migrations add CreateUUIDv7Function --project MyApp.Data --startup-project MyApp.Web
```

This command should create a new directory called `Migrations` inside `MyApp.Data`, along with three files:

```shell
$ tree --gitignore MyApp.Data
MyApp.Data
├── AppDbContext.cs
├── Entities
│   └── Member.cs
├── Migrations
│   ├── 20250717155142_CreateUUIDv7Function.cs
│   ├── 20250717155142_CreateUUIDv7Function.Designer.cs
│   └── AppDbContextModelSnapshot.cs
└── MyApp.Data.csproj

3 directories, 6 files
```

The `<TIMESTAMP>_CreateUUIDv7Function.cs` is the main migration file. This is where we are going to add the code modifying the database schema. The `<TIMESTAMP>_CreateUUIDv7Function.Designer.cs` and `AppDbContextModelSnapshot.cs` files contain automatically generated metadata and we don't need to worry about these at this point.

Create a directory and a file to store the SQL source code for the migration:

```shell
$ cd ~/projects/MyApp/MyApp.Data
$ mkdir -p Scripts
$ touch Scripts/CreateUUIDv7Function.sql
```

Paste the following snippet of SQL to `Scripts/CreateUUIDv7Function.sql`.
The source code for the `uuid7()` function comes from the MIT-licensed repo [autopilot-team/interview](https://github.com/autopilot-team/interview/blob/79372fc68568f7d21b9e609017c7241d0fe2ec21/backends/api/migrations/identity/00000000000000_init.sql).
We store it in a separate file because it's quite a large chunk of SQL and it would look quite ugly if we were to embed it as a string inside the migration class.

```sql
-- MyApp.Data/Scripts/CreateUUIDv7Function.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION uuid7() RETURNS uuid AS $$
DECLARE
BEGIN
    RETURN uuid7(clock_timestamp());
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION uuid7(p_timestamp timestamp with time zone) RETURNS uuid AS $$
DECLARE
    v_time double precision := null;

    v_unix_t bigint := null;
    v_rand_a bigint := null;
    v_rand_b bigint := null;

    v_unix_t_hex varchar := null;
    v_rand_a_hex varchar := null;
    v_rand_b_hex varchar := null;

    c_milli double precision := 10^3;  -- 1 000
    c_micro double precision := 10^6;  -- 1 000 000
    c_scale double precision := 4.096; -- 4.0 * (1024 / 1000)

    c_version bigint := x'0000000000007000'::bigint; -- RFC-9562 version: b'0111...'
    c_variant bigint := x'8000000000000000'::bigint; -- RFC-9562 variant: b'10xx...'
BEGIN
    v_time := extract(epoch from p_timestamp);

    v_unix_t := trunc(v_time * c_milli);
    v_rand_a := trunc((v_time * c_micro - v_unix_t * c_milli) * c_scale);
    v_rand_b := trunc(random() * 2^30)::bigint << 32 | trunc(random() * 2^32)::bigint;

    v_unix_t_hex := lpad(to_hex(v_unix_t), 12, '0');
    v_rand_a_hex := lpad(to_hex((v_rand_a | c_version)::bigint), 4, '0');
    v_rand_b_hex := lpad(to_hex((v_rand_b | c_variant)::bigint), 16, '0');

    RETURN (v_unix_t_hex || v_rand_a_hex || v_rand_b_hex)::uuid;
END $$ LANGUAGE plpgsql;
```

Mark the `Scripts/CreateUUIDv7Function.sql` file as an **embedded resource**. You can do this in Rider by right-clicking on the file in the file explorer pane, clicking on _Properties&hellip;_, then setting _Build action_ to _Embedded Resource_.

Alternatively, you can add this XML snippet to `MyApp.Data/MyApp.Data.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <!-- ... omitted for brevity ... -->

  <!-- add this section -->
  <ItemGroup>
    <None Remove="Scripts\CreateUUIDv7Function.sql" />
    <EmbeddedResource Include="Scripts\CreateUUIDv7Function.sql" />
  </ItemGroup>

</Project>
```

Finally in the migration file (`<TIMESTAMP>_CreateUUIDv7Function.cs`), add the migration code:

```cs
using System.Reflection;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApp.Data.Migrations
{
    /// <inheritdoc />
    public partial class CreateUUIDv7Function : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var sql = ReadEmbeddedResource("MyApp.Data.Scripts.CreateUUIDv7Function.sql");
            migrationBuilder.Sql(sql);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                drop function if exists uuid7(timestamp with time zone);
                drop function if exists uuid7();
                drop extension if exists pgcrypto;
            ");
        }

        private static string ReadEmbeddedResource(string name)
        {
            var assembly = Assembly.GetExecutingAssembly();
            using var stream = assembly.GetManifestResourceStream(name);
            if (stream == null)
            {
                throw new Exception("Resource not found");
            }

            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }
}
```

The `ReadEmbeddedResource(string name)` static method reads an embedded resource into a string using a combination of 
[`Assembly.GetExecutingAssembly`](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.assembly.getexecutingassembly?view=net-9.0#system-reflection-assembly-getexecutingassembly), [`GetManifestResourceStream`](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.assembly.getmanifestresourcestream?view=net-9.0), and [`StreamReader`](https://learn.microsoft.com/en-us/dotnet/api/system.io.streamreader?view=net-9.0).

Within the method `Up`, we call this method to read the SQL file we have previously added to the project. Since it is placed in the `Scripts` directory of the `MyApp.Data` project, the file is embedded in the assembly as `MyApp.Data.Scripts.CreateUUIDv7Function.sql`. Finally, we execute the SQL code.

The `Down` method contains instructions to delete ("drop") the functions created by `Up` and to uninstall the database extension [`pgcrypto`](https://www.postgresql.org/docs/current/pgcrypto.html).

## Running the Migrations

Run the migrations using `dotnet ef database update`:

```shell
$ dotnet ef database update --startup-project MyApp.Web --project MyApp.Data
```

If everything works, you should be able to connect to the database using `psql`. You should also have access to two new custom SQL functions, `uuid7()` and `uuid7(timestamp with time zone)`.

```plain
$ psql my_app_dev
psql (17.4 (Homebrew))
Type "help" for help.

my_app_dev=# \x
Expanded display is on.
my_app_dev=# \df uuid7
List of functions
-[ RECORD 1 ]-------+-------------------------------------
Schema              | public
Name                | uuid7
Result data type    | uuid
Argument data types |
Type                | func
-[ RECORD 2 ]-------+-------------------------------------
Schema              | public
Name                | uuid7
Result data type    | uuid
Argument data types | p_timestamp timestamp with time zone
Type                | func

my_app_dev=# select uuid7();
-[ RECORD 1 ]-------------------------------
uuid7 | 0198216e-abfb-7d70-821a-c468784bed4d

my_app_dev=# select uuid7(now() + interval '1 day');
-[ RECORD 1 ]-------------------------------
uuid7 | 01982695-2350-7937-b58a-cb6de23998a3
```

This is a good point to commit the changes:

```shell
$ git add -A
$ git commit -m "Create UUIDv7 SQL function"
```

## Add Member Model

In `MyApp.Data/Entities/Model.cs`, define a class representing a member record:

```cs
namespace MyApp.Data.Entities;

public enum Gender
{
    Male,
    Female,
    ApacheHelicopter,
    NonBinary,
}

public class Member
{
    public Guid Id { get; set; }
    public string GivenName { get; set; }
    public string FamilyName { get; set; }
    public Gender Gender { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

In `MyApp.Data/AppDbContext.cs`:

```cs
using Microsoft.EntityFrameworkCore;
using MyApp.Data.Entities;

namespace MyApp.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Member> Members { get; set; }
}
```

In `MyApp.Web/Program.cs`, tell Npgsql about our newly defined enumeration type `Gender`:

```cs
using Microsoft.EntityFrameworkCore;
using MyApp.Data;
using MyApp.Data.Entities;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options
        .UseNpgsql(builder.Configuration.GetConnectionString("AppDbContext"),
            optionsBuilder => { optionsBuilder.MapEnum<Gender>("gender"); })
        .UseSnakeCaseNamingConvention());
```
