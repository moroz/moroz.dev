---
title: Testing ASP.NET Core Applications Against a Real Database
date: 2025-09-27
summary: |
    In this post, I briefly explain how to set up integration tests in an ASP.NET Core application, using Entity Framework Core, PostgreSQL, Npgsql, and gRPC.
draft: true
---

I am writing this post to record the steps necessary to set up integration testing in my side project, which I am building for my YouTube channel, [Make Programming Fun Again](https://www.youtube.com/@KarolMoroz).
The [project in question](https://github.com/moroz/FullStackAsp.Net-Courses) is a full stack application, built as an [ASP.NET Core](https://dotnet.microsoft.com/en-us/apps/aspnet) application.
It uses [PostgreSQL](https://www.postgresql.org/) and [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/) for data persistence, and exposes a [gRPC](https://grpc.io/)-based API.
On top of this API, a Web interface will be built using [SvelteKit](https://svelte.dev/docs/kit/introduction).

The code snippets in this post are largely inspired by Microsoft (2025)[^1], the recommendations of some friends, and a bunch of conversations with various LLMs.

If you want to follow along this walkthrough, clone the GitHub repository [moroz/FullStackAsp.Net-Courses](https://github.com/moroz/FullStackAsp.Net-Courses) and check out the branch `testing-tutorial` (starting at tag [2025-09-24](https://github.com/moroz/FullStackAsp.Net-Courses/tree/2025-09-24)):

```shell
git clone git@github.com:moroz/FullStackAsp.Net-Courses.git -b testing-tutorial
```

Disclaimer: This walkthrough is meant for use with a specific project. You may find it useful in other project, but it is not meant as a generic reference or tutorial.

### Create a `Courses.Tests` project

In the root directory of the project, create an [xUnit](https://xunit.net/?tabs=cs) project called `Courses.Tests`. You may want to name it differently in your own project.

```shell
dotnet new xunit -o Courses.Tests
```

Add the newly created project to the solution:

```shell
$ dotnet sln add ./Courses.Tests/Courses.Tests.csproj 
Project `Courses.Tests/Courses.Tests.csproj` added to the solution.
```

In the `Courses.Tests` project, add a reference to the `Courses` project, so that we can access the latter project's code in tests:

```shell
$ dotnet add reference Courses/Courses.csproj --project Courses.Tests
Reference `..\Courses\Courses.csproj` added to the project.
```

In `Courses/Program.cs`, expose the implicitly defined `Program` class to outside projects. At the very end of the file, add this empty class:

```cs
public partial class Program
{
}
```

In `Courses/Courses.csproj`, configure the protocol buffer code generator to create both server and client code for the gRPC services defined in `courses.proto`:

```xml
<ItemGroup>
    <Protobuf Include="Protos\greet.proto" GrpcServices="Server"/>
    <!-- Add ;Client in this line: -->
    <Protobuf Include="Protos\courses.proto" GrpcServices="Server;Client"/>
</ItemGroup>
```

### Create a Test Example

In `Courses.Tests/UnitTest1.cs`, create a test example without external dependencies. We're going to use it to test that the project can compile and run tests correctly:

```cs
namespace Courses.Tests;

public class UnitTest1
{
    [Fact]
    public void Test_TheTruth()
    {
        var actual = 2 + 2;
        Assert.Equal(4, actual);
    }
}
```

At this point, when running `dotnet test` inside the `Courses.Tests` directory, I was getting build-time warnings caused by inconsistent dependency resolution within the `Courses` project.
These issues were fixed by explicitly setting a version for `Microsoft.EntityFrameworkCore.Relational`:

```shell
$ cd ../Courses
$ dotnet package add "Microsoft.EntityFrameworkCore.Relational" --version 9.0.9 --project .
```

Now, the tests should be passing:

```shell
$ cd ../Courses.Tests
$ dotnet test
Restore complete (0.2s)
  Courses succeeded (0.4s) → /Users/karol/RiderProjects/FullStackAsp.Net-Courses/Courses/bin/Debug/net9.0/Courses.dll
  Courses.Tests succeeded (0.1s) → bin/Debug/net9.0/Courses.Tests.dll
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v2.8.2+699d445a1a (64-bit .NET 9.0.9)
[xUnit.net 00:00:00.02]   Discovering: Courses.Tests
[xUnit.net 00:00:00.04]   Discovered:  Courses.Tests
[xUnit.net 00:00:00.04]   Starting:    Courses.Tests
[xUnit.net 00:00:00.05]   Finished:    Courses.Tests
  Courses.Tests test succeeded (0.4s)

Test summary: total: 1, failed: 0, succeeded: 1, skipped: 0, duration: 0.4s
Build succeeded in 1.3s
```

This may be a good moment to commit your changes, if you haven't done so already:

```shell
$ git add -A
$ git commit -m "Set up Courses.Tests project"
```

### Set Up a `CustomWebApplicationFactory`

Install the `Microsoft.AspNetCore.Mvc.Testing` package in the `Courses.Tests` project:

```shell
$ cd ../Courses.Tests
$ dotnet package add Microsoft.AspNetCore.Mvc.Testing --project .
```

Duplicate the `Courses/appsettings.Development.json` file as `Courses/appsettings.Test.json`.

```shell
$ cp Courses/appsettings.Development.json Courses/appsettings.Test.json
```

Within the newly created `Courses/appsettings.Test.json` file, update the `ConnectionStrings.AppDbContext` key to use a separate PostgreSQL database. This is necessary so that, in testing, we can destroy and/or re-create the database to our heart's content:

```json
{
  // ... omitted for brevity
  "ConnectionStrings": {
    "AppDbContext": "Host=localhost; Password=postgres; Username=postgres; Database=courses_test" // Modify the `Database` key
  }
}
```

Create a `CustomWebApplicationFactory` class. In further examples, we are going to use this code to test the specific HTTP and gRPC calls:

```cs
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Courses.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        builder.ConfigureServices(services =>
        {
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.Migrate();
        });
    }
}
```

Inside `ConfigureWebHost`, we explicitly instruct the application to use the `Test` environment:

```cs
builder.UseEnvironment("Test");
```

Then, within a call to `builder.ConfigureServices`, we obtain an instance of `AppDbContext` and apply all database migrations:

```cs
builder.ConfigureServices(services =>
{
    var sp = services.BuildServiceProvider();
    using var scope = sp.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
});
```

All of these will happen every time we instantiate `CustomWebApplicationFactory`. Due to the fact that performing database migrations is slow, we should only perform this step once, when we set up the entire test suite.

[^1]: Microsoft. (2025, March 25). *Integration tests in ASP.NET Core*. Microsoft Learn. https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-9.0&pivots=xunit ([Web Archive](https://web.archive.org/web/20250927142022/https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-9.0&pivots=xunit))
