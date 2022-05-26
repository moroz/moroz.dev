---
title: "Learning iOS and Swift. Day 8: Starting off a SwiftUI app"
date: 2022-05-26
slug: learning-ios-and-swift-day-eight
lang: en-US
draft: true

summary: ""
---

&#x2325;&#x2318;P -- resume preview of a SwiftUI scene

There is a keyboard shortcut similar to &#x2318;P that opens up a fuzzy file finder.
By default, this dialog is assigned to &#x21e7;&#x2318;O, while &#x2318;P is assigned to _Print_.
I remapped the file finder to &#x2318;P and removed the _Print_ binding altogether (who needs a print dialog in an IDE, anyway???).

It turns out that you can omit parentheses when passing a closure to a function or method.
Moreover, if a closure consists of only a single expression, the value of this expression will be implicitly `return`ed, so the `return` keyword can be omitted.
If you do not name the parameters of this closure, they will be made accessible in the body of the closure as `$0`, `$1`, etc.
So a `map` can be written like this:

```swift
let collection = ["Hello", "World"]
let uppercasedCollection = collection.map { $0.uppercased() }
print(uppercasedCollection)
// ["HELLO", "WORLD"]
```

With named parameters, the head of the closure, matching on the parameters, is followed by the confusingly named keyword `in`:

```swift
let dict = [
    "name": "SwiftUI",
    "author": "Apple Inc.",
    "ide": "Xcode"
]

let mappedDict = dict.map { (key, val) in "\(key): \(val)" }
print(mappedDict)
// ["name: SwiftUI", "ide: Xcode", "author: Apple Inc."]
```

Apparently, closures like this are heavily used in SwiftUI.

`VStack` -- vertical stack, similar to a flexbox with `flex-direction: column;`
`HStack` -- horizontal stack, similar to a classical flexbox

## `TabView` -- _the_ tool to build endless tutorial screens

`TabView` is a component used to build a simple tab navigation.
Each child view becomes a separate tab, and you can set a label on each subview using the `tabItem(_ label:)` method.

```swift
TabView {
    Text("Welcome").tabItem { Text("Welcome") }
    Text("Exercise 1").tabItem { Text("Exercise 1") }
    Text("Exercise 2").tabItem { Text("Exercise 2") }
}
```

This markup, when compiled, displays the following view with barely legible tabs at the bottom:

<figure class="bordered-figure">
<img src="/images/ios-8/tabview-with-labels.webp" />
<figcaption>TabView with default styling (text labels)</figcaption>
</figure>



<figure class="bordered-figure">
<img src="/images/ios-8/tabview-with-dots.webp" />
<figcaption>TabView with <code>PageTabViewStyle</code> and <code>backgroundDisplayMode: .always</code></figcaption>
</figure>
