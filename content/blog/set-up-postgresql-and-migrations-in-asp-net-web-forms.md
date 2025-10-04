---
title: How to Set Up PostgreSQL, Migrations, and Tailwind in ASP.NET Web Forms
date: 2025-10-04
summary: |
    If, for archeological reasons, you need to work with ASP.NET Web Forms in 2025, this post is for you.
    You will find out how to set up Entity Framework 6 with PostgreSQL, how to create migrations, and how to set up Tailwind CSS.
    None of this has been tested in production.
---

### Introduction

ASP.NET Web Forms is an old technology. As of this writing, the [latest release](https://developer.mescius.com/componentone/docs/webforms/online-releasehistory/releasehistory.html) is some 5 years old, and even Microsoft, who has brought this calamity upon us in the first place, has deprecated the technology by not including it by default in Visual Studio 2022.

In general, there is no good reason to start a new project with Web Forms in 2025, nor is there a good reason to teach Web Forms to beginners.
Unfortunately, in Taiwan, ASP.NET Web Forms is still in widespread use at [governmental](https://english.gov.taipei/News_Photo.aspx?n=4FF938C7E036410F&sms=A03DD346DED13796) and [educational](https://my.ntu.edu.tw/Default.aspx?lang=eng) institutions. Historically, there has been little to no incentive to replace it with a more modern stack.
<!-- However, to my surprise, I have been unable to find a single bank or financial institution still using Web Forms in production. -->

According to anecdotal evidence, one of the reasons commercial software stacks are so prevalent in Taiwan may be because some institutions need to pay for the software they use, and most open source stacks are completely free of charge.

If you are a decisive person at a large institution in Taiwan and need to pay for a server operating system, please consider purchasing enterprise support for [Rocky Linux](https://rockylinux.org/support/support-providers), [Alma Linux](https://almalinux.org/support/), or [Ubuntu Server](https://ubuntu.com/download/server). All of the above options can run [.NET Core](https://dotnet.microsoft.com/en-us/download) and [MS SQL Server](https://learn.microsoft.com/en-us/sql/linux/sql-server-linux-setup?view=sql-server-ver17) natively.

### What this tutorial covers

In this tutorial, I'm going to show you how to set up code-first database schema migrations in an ASP.NET Web Forms application. We will be using PostgreSQL 17 for persistence and [Tailwind CSS](https://tailwindcss.com/) for styling.

### Pre-requisites

In order to follow along with this tutorial, you should:

* know the difference between [Visual Studio](https://visualstudio.microsoft.com/) (purple icon) and [Visual Studio Code](https://code.visualstudio.com/) (blue icon),
* know the difference between [.NET Framework](https://dotnet.microsoft.com/en-us/download/dotnet-framework) (supports Windows only) and [.NET Core](https://dotnet.microsoft.com/en-us/download) (supports Windows, macOS, and GNU/Linux),
* know the difference between [PostgreSQL](https://www.postgresql.org/download/) (the most advanced free and open source database system in the world) and [MS SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (can't handle UTF-8).

You need to install the following software:

* [PostgreSQL 17](https://www.postgresql.org/download/). You can install PostgreSQL natively on Windows 11 using the following command:

    ```powershell
    winget install --id=PostgreSQL.PostgreSQL.17 -e
    ```

    The installation may take several minutes due to the way Windows Defender scans all new files upon creation. You may also install PostgreSQL inside [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install).

* [Visual Studio 2022](https://visualstudio.microsoft.com/) is necessary to generate and run database migrations. Other that that, it's a pretty bad IDE, so I usually edit code in...
* [JetBrains Rider](https://www.jetbrains.com/rider/). You may stick to Visual Studio if you insist, but Rider is easier to use.
* [Git](https://git-scm.com/). You may install Git on Windows using the following command:
    ```powershell
    winget install Git.Git
    ```
* [PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.5) 7 or later. Note that the version of PowerShell that comes bundled with Windows 11 is 5.x, and behaves differently from PowerShell 7.

<figure>
<img src="/images/asp.net/powershell.png" alt="" />
<figcaption>List of terminal presets within the Windows Terminal application.</figcaption>
</figure>

### Creating a Web Forms Project

In the remaining part of this tutorial, I'm going to assume that your project is called `MyApp`. If you wish to use a different name, replace `MyApp` in all code snippets with something else.

When I tried to set up my very own Web Forms project on a fresh installation of Windows 11, I quickly found out that I couldn't even get Visual Studio to show me the ASP.NET application template, and I had to resort to creating a starter project on another machine. Therefore, I am not going to go over the [official instructions](https://learn.microsoft.com/en-us/aspnet/web-forms/overview/getting-started/getting-started-with-aspnet-45-web-forms/create-the-project) on how to create a Web Forms project. Instead, you may just clone my [starter project](https://github.com/moroz/WebFormsStarter).

The following PowerShell snippet clones the starter project to `.\MyApp`, launches a PowerShell script that renames all classes and files to `MyApp`, and commits the changes to Git:

```powershell
> $projectName = "MyApp"

# Clone the starter project to .\MyApp
> git clone https://github.com/moroz/WebFormsStarter $projectName
> cd .\$projectName

# Replace WebFormsStarter with MyApp project-wide
> .\rename_project.ps1 -New $projectName

# Stage and commit all changes
> git add -A
> git commit -m "Rename project to $projectName"
```

### Install NuGet packages

Open the project in JetBrains Rider:

```powershell
rider .
```

Open the NuGet Tool Window using the keyboard shortcut `Alt + Shift + 7`.

Within the `MyApp` project, install the following dependencies:

* `Npgsql` version `4.1.14`,
* `EntityFramework6.Npgsql` version `3.2.1.1`.
* `Medo.Uuid7`, latest compatible version (`3.1.0.0` as of this writing).

### Create a database context class

Create a directory at `MyApp/Models`. Within this directory, create a C# file called `AppDbContext.cs` with the following content:

```cs
using System.Data.Entity;
using Npgsql;

namespace MyApp.Models
{
    [DbConfigurationType(typeof(NpgSqlConfiguration))]
    public class AppDbContext : DbContext
    {
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("public");
        }
    }

    public class NpgSqlConfiguration : DbConfiguration
    {
        public NpgSqlConfiguration()
        {
            var name = "Npgsql";

            SetProviderFactory(providerInvariantName: name, providerFactory: NpgsqlFactory.Instance);
            SetProviderServices(providerInvariantName: name, provider: NpgsqlServices.Instance);
            SetDefaultConnectionFactory(connectionFactory: new NpgsqlConnectionFactory());
        }
    }
}
```

### Expose `AppDbContext` to Pages

In the root directory of the project, create a class called `BasePage`. This will be the base class from which all pages in the application will later inherit from.

```cs
using System;
using MyApp.Models;

namespace MyApp
{
    public class BasePage : System.Web.UI.Page
    {
        protected readonly AppDbContext _db = new AppDbContext();

        protected override void OnUnload(EventArgs e)
        {
            base.OnUnload(e);
            _db.Dispose();
        }
    }
}
```

### Create a Migration Configuration Class

```cs
using GangOfFour.Models;

namespace GangOfFour.Migrations
{
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;

    internal sealed class Configuration : DbMigrationsConfiguration<AppDbContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = false;
        }

        protected override void Seed(AppDbContext context)
        {
            context.Events.AddOrUpdate(
                new Event
                {
                    TitleEn = "Example Event 1",
                    DescriptionEn = "Example description",
                    StartsAt = new DateTime(2025, 10, 1, 9, 0, 0),
                    EndsAt = new DateTime(2025, 10, 1, 11, 0, 0),
                    EventId = new Guid("0199aac4-698b-772d-b79a-085a45267a66"),
                });
        }
    }
}
```