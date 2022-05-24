---
title: "Learning iOS and Swift. Day 6: More enums, struct, and classes"
date: 2022-05-24
slug: learning-ios-and-swift-day-six
lang: en-US

summary: ""
---

There are three types of "algebraic" data types in Swift: enumerations, structs, and classes.
That's one more than Rust, which does not have classes.

In Swift, structs and classes are very similar in functionality and behavior.
The key differences I have noticed by now is that classes can be subclassed (i. e. they support inheritance), and the way they are passed around in memory: structs are passed by value (like `Copy` values in Rust), while class instances are passed by reference (so, passing pointers around).

This can be easily illustrated by implementing a simple counter. With a struct, it looks like this:

```swift
struct StructCounter {
    private(set) var value: Int = 0

    mutating func inc() {
        self.value += 1
    }

    mutating func dec() {
        self.value -= 1
    }
}
```

Notice that within a struct, methods that modify the value of the struct's properties must be annotated with `mutating`.

```swift
var s1 = StructCounter()
s1.inc() // s1.value is now 1

var s2 = s1 // s1 gets copied
s2.inc()

print(s1.value) // 1
print(s2.value) // 2
```

By annotating the `value` property with `private(set)`, we prevent the struct from being modified from the outside of the struct. If we tried to reassign the value nevertheless, we would get a compiler error:

```swift
myCounter.value = 100
```

```shell
struct_with_methods.swift:21:11: error: cannot assign to property: 'value' setter is inaccessible
myCounter.value = 100
~~~~~~~~~~^~~~~
```

The same counter functionality, but written as a class:

```swift
class ClassCounter {
    private(set) var value: Int = 0

    func inc() {
        self.value += 1
    }

    func dec() {
        self.value -= 1
    }
}
```

In class definitions, mutating methods must not be annotated with `mutating`.

```swift
var c1 = ClassCounter()
c1.inc() // c1.value is now 1

var c2 = c1 // c2 and c1 now point to the same instance
c2.inc() // so when you call a method on c2, c1 gets mutated as well

print(c1.value) // 2
print(c2.value) // 2
```
