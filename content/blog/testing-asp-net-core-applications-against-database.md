---
title: Testing ASP.NET Core Applications Against a Real Database
date: 2025-09-27
summary: |
    In this post, I briefly explain how to set up integration tests in an ASP.NET Core application, using Entity Framework Core, PostgreSQL, Npgsql, and gRPC.
draft: true
---

I am writing this post to record the steps necessary to set up integration testing in my side project, which I am building for my YouTube channel, [Make Programming Fun Again](https://www.youtube.com/@KarolMoroz).
The [project in question](https://github.com/moroz/FullStackAsp.Net-Courses) is a full stack application, built as an ASP.NET Core application, using [PostgreSQL](https://www.postgresql.org/) and [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/) for data persistence, with a [gRPC](https://grpc.io/)-based API, and a Web interface built with [SvelteKit](https://svelte.dev/docs/kit/introduction).

This walkthrough starts at the revision at tag [2025-09-24](https://github.com/moroz/FullStackAsp.Net-Courses/tree/2025-09-24).

The code snippets in this post are largely inspired by Microsoft (2025)[^1], the recommendations of some friends, and a bunch of conversations with various LLMs.

This walkthrough is meant for use with a specific project. You may find it useful in other project, but it is not meant as a generic reference or tutorial.

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

[^1]: Microsoft. (2025, March 25). *Integration tests in ASP.NET Core*. Microsoft Learn. https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-9.0&pivots=xunit ([Web Archive](https://web.archive.org/web/20250927142022/https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-9.0&pivots=xunit))
