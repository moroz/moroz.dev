---
title: "Learning iOS and Swift. Day 13: AppStorage, SceneStorage"
date: 2022-05-31
slug: learning-ios-and-swift-day-thirteen
lang: en-US
draft: true

summary: |

---

Today I followed chapter 8 of the [SwiftUI Apprentice]() tutorial.
Although a bit difficult to follow, the chapter described several data persistence APIs on Apple platforms, and taught how to use `@AppStorage` and `@SceneStorage`.
These APIs persist data in a space called "user defaults," which is a wrapper for "property lists," which in turn are basically XML files saved to the application's sandboxed file storage (under `Library/Preferences`, IIRC).
Since the data needs to be serialized to XML, these types of storage only support primitive scalar values, such as strings, numbers, or booleans.

For more complex values, there is an API called Core Data, which is a wrapper over SQLite.
Since I have never really used SQLite (except when I inadvertently initialized Rails projects without specifying the database engine), and since all Swift bindings call C libraries under the hood, I decided to try the library out with its original C bindings.
Following the tutorial at [ZetCode](https://zetcode.com/db/sqlitec/), I started with the following C program that fetches the version of the SQLite engine and prints it to the screen:

```c
#include <sqlite3.h>
#include <stdio.h>

int main(void) {
	printf("%s\n", sqlite3_libversion());

	return 0;
}
```

Compiler version:

```
$ gcc --version
Apple clang version 13.1.6 (clang-1316.0.21.2.5)
Target: arm64-apple-darwin21.5.0
Thread model: posix
InstalledDir: /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin
```

The SQLite headers were already installed on macOS, but in order for the compiler to find the correct symbols, I had to compile with `-lsqlite`:

```shell
$ gcc -o version-c -lsqlite3 version.c
$ ./version-c
3.37.0
```

I tried to run the same program on Linux with GCC, but since the dependency resolution and linking algorithm is different (and it's not my field of expertise, anyway), it only compiled when built with Clang.
