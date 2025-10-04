---
title: How to Set Up PostgreSQL, Migrations, and Tailwind in ASP.NET Web Forms
date: 2025-10-04
draft: true
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

### Creating a Web Forms Project

When I tried to set up my very own Web Forms project on a fresh install of Windows 11, I quickly found out that I couldn't even get Visual Studio to show me the ASP.NET application template, and I had to resort to creating a starter project on another machine. Therefore, I am not going to go over the [official instructions](https://learn.microsoft.com/en-us/aspnet/web-forms/overview/getting-started/getting-started-with-aspnet-45-web-forms/create-the-project) on how to create a Web Forms project. Instead, you may just clone my [starter project](https://github.com/moroz/WebFormsStarter).

In the remaining part of this tutorial, I'm going to assume that your project is called `MyApp`. If you wish to use a different name, replace `MyApp` with something else.

```powershell
$projectName = "MyApp"

# Clone the starter project to .\MyApp
git clone https://github.com/moroz/WebFormsStarter $projectName
cd .\$projectName

# Replace WebFormsStarter with MyApp project-wide
.\rename_project.ps1 -New $projectName

# Stage and commit all changes
git add -A
git commit -m "Rename project to $projectName"
```
