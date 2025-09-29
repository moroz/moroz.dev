---
title: Testing ASP.NET Core Applications Against a Real Database
date: 2025-09-27
summary: |
    In this post, I briefly explain how to set up integration tests in an ASP.NET Core application, using Entity Framework Core, PostgreSQL, Npgsql, and gRPC.
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

Create a `GlobalTestFixture` class, wrapping a `WebApplicationFactory<Program>`:

```cs
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Courses.Tests;

public class GlobalTestFixture : IAsyncLifetime
{
    private WebApplicationFactory<Program>? _factory;

    public WebApplicationFactory<Program> Factory =>
        _factory ?? throw new InvalidOperationException("Factory is not initialized");

    public AsyncServiceScope AsyncScope => Factory.Services.CreateAsyncScope();

    public async Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.UseEnvironment("Test"));
        await MigrateDb();
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    private async Task MigrateDb()
    {
        await using var scope = AsyncScope;
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }
}
```

Let's analyze this code.

```cs
public class GlobalTestFixture : IAsyncLifetime
{
    private WebApplicationFactory<Program>? _factory;

    public WebApplicationFactory<Program> Factory =>
        _factory ?? throw new InvalidOperationException("Factory is not initialized");
```

This class wraps an instance of `WebApplicationFactory<Program>`. In this case, `Program` is the application's main entry point, and is a class defined implicitly in `Courses/Program.cs`. This class implements [`IAsyncLifetime`](https://api.xunit.net/v3/3.1.0/Xunit.IAsyncLifetime.html), so that it can be asynchronously initialized and disposed of. We also expose a computed property called `Factory`, which returns the private `WebApplicationFactory<Program>` instance, or throws an exception if, for some reason, the field `_factory` has not been correctly set.


```cs
public AsyncServiceScope AsyncScope => Factory.Services.CreateAsyncScope();
```

We define a computed property `AsyncScope`, which creates a new service scope using the [`IServiceProvider`](https://learn.microsoft.com/en-us/dotnet/api/system.iserviceprovider?view=net-9.0) associated with `_factory`.
The concept of a _service scope_ will turn out to be very important in ASP.NET core. Service scopes are [`IDisposable`](https://learn.microsoft.com/en-us/dotnet/api/system.idisposable?view=net-9.0), and must be used within a `using` statement, or be manually disposed after use.

```cs
public async Task InitializeAsync()
{
    _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.UseEnvironment("Test"));
    await MigrateDb();
}
```

`InitializeAsync` is a callback method required by the `IAsyncLifetime` interface. We can read this as a workaround to call asynchronous methods during initialization.
We instantiate `_factory` with an instance of `WebApplicationFactory<Program>`, and instruct the factory to use configuration from the `Test` environment.
Afterwards, we call `MigrateDb` to migrate the database.

```cs
public Task DisposeAsync()
{
    return Task.CompletedTask;
}
```

The `DisposeAsync` method is a no-op (this is a fancy IT term to say: it does nothing).

```cs
private async Task MigrateDb()
{
    await using var scope = AsyncScope;
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}
```

Finally, in `MigrateDb`, we obtain an `AppDbContext` instance from the service scope, and migrate the database.

### Define a Test Collection

In `Courses.Tests/IntegrationCollection.cs`, create a placeholder class called `IntegrationCollection`. This class is used by xUnit to group our tests into a _collection_. If I understand the implications correctly, this means that the `GlobalTestFixture` will only be instantiated once per test run.

```cs
namespace Courses.Tests;

[CollectionDefinition("integration")]
public class IntegrationCollection : ICollectionFixture<GlobalTestFixture>
{
}
```

In `Courses.Tests/DbTestFixture.cs`, create a base abstract class that all our test classes will later inherit from:

```cs
namespace Courses.Tests;

public abstract class DbTestBase(GlobalTestFixture fixture) : IAsyncLifetime
{
    protected readonly GlobalTestFixture Fixture = fixture;

    public Task InitializeAsync()
    {
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }
}
```

This class is mostly there just to implement `IAsyncLifetime` and to expose the test fixture to our tests.

Finally, in the existing `Courses.Tests/UnitTest1.cs` file, modify the test class to use the `Collection` decorator, and to inherit from `DbTestBase`:

```cs
using System.Net;
using Courses.Grpc;
using Courses.Repository;
using Grpc.Net.Client;
using Microsoft.Extensions.DependencyInjection;

namespace Courses.Tests;

[Collection("integration")]
public class UnitTest1(GlobalTestFixture fixture) : DbTestBase(fixture)
{
    // Tests go here
}
```

Now, inside of this class, we can write tests using the database and other services injected in `Program.cs`. For instance, below is a test using `EventRepository`:

```cs
[Fact]
public async Task Test_EventRepository()
{
    await using var scope = Fixture.AsyncScope;
    var repo = scope.ServiceProvider.GetRequiredService<IEventRepository>();
    var actual = await repo.ListEvents();
    Assert.Empty(actual);
}
```

We can also write test examples making HTTP requests to the application:

```cs
[Fact]
public async Task Test_HttpClient()
{
    var client = Fixture.Factory.CreateDefaultClient();
    var response = await client.GetAsync("/");
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
}
```

You can even make gRPC requests to the application's gRPC services:

```cs
[Fact]
public async Task Test_GrpcClient()
{
    var client = Fixture.Factory.CreateDefaultClient();
    var channel = GrpcChannel.ForAddress(client.BaseAddress!, new GrpcChannelOptions { HttpClient = client, });
    var grpcClient = new CoursesApi.CoursesApiClient(channel);
    var actual = await grpcClient.ListEventsAsync(new ListEventsRequest());
    Assert.Empty(actual.Events);
}
```

Thank you for reading!

[^1]: Microsoft. (2025, March 25). *Integration tests in ASP.NET Core*. Microsoft Learn. https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-9.0&pivots=xunit ([Web Archive](https://web.archive.org/web/20250927142022/https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-9.0&pivots=xunit))
