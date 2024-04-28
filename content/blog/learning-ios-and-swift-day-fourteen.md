---
title: "Learning iOS and Swift. Day 14: More SQLite3 C APIs, dark mode detection"
date: 2022-06-01
slug: learning-ios-and-swift-day-fourteen
lang: en-US

summary: |
  I spent another evening treading through SQLite's low-level C APIs.
  I integrated a very na&#xEF;vely written data store built with these APIs into a simple iOS GUI app.
  Finally, I found out how to detect dark mode on macOS using Swift APIs.

---

Today's post will be rich in code and mostly devoid of comments.

## Automatic dark mode in Vim

I like to use darker interface themes when the sun is down and lighter when it's shining.
I know most developer just use very dark themes and dark interface theme all day long, but I'm not one of them.
Before, I used a C++ program I did not really understand to calculate sunset and sunrise times, but recently it does not seem to return correct results and there is too much math involved for me to debug it.
However, there is a much easier way to test for darkness -- using the system's interface theme setting.
Even better, macOS since Catalina has an "automatic" setting for dark/light modes.
You can use this short Swift script to make the operating system tell you which interface theme is currently enabled:

```swift
import AppKit

let x = NSAppearance.currentDrawing()
if x.name.rawValue == "NSAppearanceNameDarkAqua" {
  print("NIGHT")
} else {
  print("DAYTIME")
}
```

I compiled this for better performance and put it under `~/.dotfiles/darkmode.Darwin`.
In my `init.vim`, I have this snippet (abridged for clarity):

```vim
" If running on a Unix platform
if has("unix")
  let s:uname = system("uname")

  " And it's macOS
  if s:uname == "Darwin\n"
    let s:linux = 0
    " Run this program
    let s:daytime = system("$HOME/.dotfiles/darkmode.Darwin")
  else
    let s:linux = 1
    let s:daytime = system("$HOME/.dotfiles/daytime")
  endif

  " Compare the string printed to STDOUT by the program
  let g:daytime = s:daytime == "DAYTIME\n"
endif

if g:daytime 
  colorscheme atom
else
  colorscheme distinguished
endif
```

## Exploring SQLite3 in Swift, day two

I built a very simple interface to try out and debug SQLite3 bindings.
Its source code is available on [Github](https://github.com/moroz/ios-practice/tree/master/SQLiteTest).
At its finest, it is a pinnacle of UI design:

<figure class="bordered-figure">
<img src="/images/ios-14/db-facing-app.webp" />
<figcaption>Hello world, full path of the database file, a button.</figcaption>
</figure>

In order to get this program to run, I implemented a `DataStore` class:

```swift
class DataStore: ObservableObject {
  var dbPath: String? {
    tutorialDirectoryUrl?.appendingPathComponent("store.db").relativePath
  }

  private var db: OpaquePointer?
  private(set) var dbOpen = false

  init() {
    if let _ = openDatabase() {
      if !tableExists(tableName: "Contact") {
        createTable()
      }
    }
  }

  // ...
}
```

This class opens a database file in the application's sandboxed `Documents` directory, and creates a table named `Contact` if it does not yet exist.
This is loosely based on a part of a tutorial named [SQLite With Swift Tutorial: Getting Started](https://www.raywenderlich.com/6620276-sqlite-with-swift-tutorial-getting-started).

The method to check for table existence:

```swift
func tableExists(tableName: String) -> Bool {
  guard let db = db, dbOpen else {
    return false
  }
  var statement: OpaquePointer?

  let queryString = "select name from sqlite_master where type = 'table' and name = ?;"
  if sqlite3_prepare_v2(db, queryString, -1, &statement, nil) == SQLITE_OK {
    sqlite3_bind_text(statement, 1, tableName, -1, nil)
    let result = sqlite3_step(statement)
    sqlite3_finalize(statement)
    return result == SQLITE_ROW
  }
  return false
}
```

The function runs a query against one of the schema tables that returns one row if a table has been found and zero rows if there is no such table.
If there is a table, the query returns `SQLITE_ROW`.

This is the function that creates a table to store contact information:

```swift
private let createTableString = """
  create table Contact(
    id integer primary key,
    name varchar(255) not null,
    email varchar(255) not null unique,
    phone varchar(255)
  );
  """

func createTable() {
  var createTableStatement: OpaquePointer?
  if sqlite3_prepare_v2(db, createTableString, -1, &createTableStatement, nil) == SQLITE_OK {
    if sqlite3_step(createTableStatement) == SQLITE_DONE {
      print("\nContact table created.")
    } else {
      print("\nContact table could not be created.")
    }
  } else {
    print("\nCould not prepare CREATE TABLE statement.")
  }
  sqlite3_finalize(createTableStatement)
}
```

For some peculiar reason, in SQLite3 the primary key `id` column needs to be marked as `INTEGER PRIMARY KEY`, not `INT PRIMARY KEY`. Even though `INT` is short for `INTEGER`, their behavior is not the same.

This is the function that inserts a contact to the table:

```swift
func insertContact(_ row: Contact) -> Bool {
  let queryString = """
    insert into Contact (name, email, phone) values (?, ?, ?);
    """

  var statement: OpaquePointer?
  let result = sqlite3_prepare_v2(db, queryString, -1, &statement, nil)
  if result == SQLITE_OK {
    sqlite3_bind_text(statement, 1, row.name, -1, nil)
    sqlite3_bind_text(statement, 2, row.email, -1, nil)
    if let phone = row.phone {
      sqlite3_bind_text(statement, 3, phone, -1, nil)
    } else {
      sqlite3_bind_null(statement, 3)
    }
    let result = sqlite3_step(statement)
    if result == SQLITE_DONE {
      sqlite3_finalize(statement)
      return true
    } else {
      if let err = formatError(db: db) {
        print(err)
      }
      sqlite3_finalize(statement)
      return false
    }
  } else {
    print("Could not prepare statement")
    return false
  }
}
```

The `DataStore` is then mounted to the application as an `@EnvironmentObject` (that's why it's a class implementing `ObservableObject`).
The view:

```swift
import SwiftUI

struct DatabaseView: View {
  @EnvironmentObject var store: DataStore

  func insertUser() {
    let result = store.insertContact(
      Contact(name: "Test User", email: "test@example.com", phone: nil))
    if result {
      print("Contact inserted")
    } else {
      print("could not insert")
    }
  }

  var body: some View {
    VStack {
      Text("Hello, World!")
      Text(store.dbPath ?? "")
      Button("Insert a user") { insertUser() }
    }
  }
}
```

The full path of the database file is printed to the console in Xcode, for each build it's a different path.
If you have [TablePlus](https://tableplus.com/) installed, you can open SQLite database files in this program, otherwise you can use the `sqlite3` CLI.
This is the database created by this application: :

<figure>
<img src="/images/ios-14/db-schema-in-tableplus.webp" />
<figcaption>An older version of the table, when `id` was still an `int` rather than `integer` and primary keys were not filled.</figcaption>
</figure>

