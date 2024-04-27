---
title: "Learning iOS and Swift. Day 13: Persistent storage APIs, SQLite3"
date: 2022-05-31
slug: learning-ios-and-swift-day-thirteen
lang: en-US

summary: |
  I intended to write about `@AppStorage` and `@SceneStorage`, but I ended up playing around with SQLite3 in C and Swift.

---

Today I followed chapter 8 of the [SwiftUI Apprentice]() tutorial.
Although a bit difficult to follow, the chapter described several data persistence APIs on Apple platforms, and taught how to use `@AppStorage` and `@SceneStorage`.
These APIs persist data in a space called "user defaults," which is a wrapper for "property lists," which in turn are basically XML files saved to the application's sandboxed file storage (under `Library/Preferences`, IIRC).
Since the data needs to be serialized to XML, these types of storage only support primitive scalar values, such as strings, numbers, or booleans.

For more complex values, there is an API called Core Data, which is a wrapper over SQLite.
Since I have never really used SQLite before (except when I inadvertently initialized Rails projects without specifying the database engine), and since the Swift `SQLite3` library is literally just `sqlite.c` with Swift typings, I decided to try the library out in C first.
Ah, the joy of low-level compiled languages comes to full fruition in the Swift ecosystem, where some libraries are written in C, some in Objective-C, and some in Swift, and they all just call each other at random.

<figure>
<img src="/images/ios-13/sqlite3_prepare_v2.webp" />
<figcaption>Swift typings for SQLite3 C libraries. Wait, was the SQL query implicitly coerced from a <code>String</code> to <code>UnsafePointer&lt;CChar&gt;!</code>?</figcaption>
</figure>

Following the tutorial at [ZetCode](https://zetcode.com/db/sqlitec/), I started with the following C program that fetches the version of the SQLite engine and prints it to standard output:

```c
#include <sqlite3.h>
#include <stdio.h>

int main(void) {
	printf("%s\n", sqlite3_libversion());

	return 0;
}
```

Compiling with Clang (symlinked to GCC, as is customary on macOS):

```shell
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

I tried to do the same thing using Swift. My first, na&#xEF;ve approach was like this:

```swift
import Foundation
import SQLite3

let version = sqlite3_libversion()
print(version)
```

The code did compile, but did not yield the same result:

```
$ swift version-broken.swift
version-broken.swift:5:7: warning: expression implicitly coerced from 'UnsafePointer<CChar>?' (aka 'Optional<UnsafePointer<I
nt8>>') to 'Any'
print(version)
      ^~~~~~~
version-broken.swift:5:7: note: provide a default value to avoid this warning
print(version)
      ^~~~~~~
              ?? <#default value#>
version-broken.swift:5:7: note: force-unwrap the value to avoid this warning
print(version)
      ^~~~~~~
             !
version-broken.swift:5:7: note: explicitly cast to 'Any' with 'as Any' to silence this warning
print(version)
      ^~~~~~~
              as Any
Optional(0x00000001c77a68a0)
```

I unwrapped the optional using an optional binding:

```swift
if let version = sqlite3_libversion() {
  print(version)
}
```

Now the code compiled without warning, but printed the hex representation of a `char *` rather than a string:

```shell
$ swift version-broken.swift
0x00000001c77a68a0
```

I converted the `char *` to a Swift string like so:

```swift
if let version = sqlite3_libversion() {
  let str = String(cString: version)
  print(str)
}
```

```shell
$ swift version.swift
3.37.0
```

I then tried to compile and run the same program on Debian.
The C version compiled and run fine with Clang but failed with GCC, because I did not know how to link it correctly.
The Swift version did not compile, because apparently the `SQLite3` module is only available on the Xcode toolchain (or only on Apple platforms).

The second program in the tutorial fetched the same version number, but this time using a SQL query:

```c
#include <sqlite3.h>
#include <stdio.h>

int main(void) {
	sqlite3 *db;
	sqlite3_stmt *res;

	int rc = sqlite3_open(":memory:", &db);

	if (rc != SQLITE_OK) {
		fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
		sqlite3_close(db);

		return 1;
	}

	rc = sqlite3_prepare_v2(db, "SELECT SQLITE_VERSION()", -1, &res, 0);

	if (rc != SQLITE_OK) {
		fprintf(stderr, "Failed to fetch data: %s\n", sqlite3_errmsg(db));
		sqlite3_close(db);

		return 1;
	}

	rc = sqlite3_step(res);

	if (rc == SQLITE_ROW) {
		printf("%s\n", sqlite3_column_text(res, 0));
	}

	sqlite3_finalize(res);
	sqlite3_close(db);
	
	return 0;
}
```

```shell
$ clang -lsqlite3 -o version2 version2.c
$ ./version2
3.37.0
```

I rewrote the program in Swift in a fairly similar manner:

```swift
import Foundation
import SQLite3

func formatError(db: OpaquePointer?) -> String? {
  if let raw_errmsg = sqlite3_errmsg(db) {
    return String(cString: raw_errmsg)
  }
  return nil
}

var db: OpaquePointer?
var res: OpaquePointer?

var rc = sqlite3_open(":memory:", &db)

if rc != SQLITE_OK {
  if let msg = formatError(db: db) {
    fputs("Cannot open database: \(msg)", stderr)
  }
  exit(1)
}

rc = sqlite3_prepare_v2(db, "select sqlite_version()", -1, &res, nil)

if rc != SQLITE_OK {
  if let msg = formatError(db: db) {
    fputs("Failed to fetch data: \(msg)", stderr)
  }
  sqlite3_close(db)
  exit(1)
}

rc = sqlite3_step(res)

if rc == SQLITE_ROW, let str = sqlite3_column_text(res, 0) {
  print(String(cString: str))
}

sqlite3_finalize(res)
sqlite3_close(db)

exit(0)
```

```shell
$ swift version2.swift
3.37.0
```

Tomorrow I will explore more of that database goodness.
