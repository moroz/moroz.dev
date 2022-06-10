---
title: "Learning iOS and Swift. Day 22: Generic input field, toolbar"
date: 2022-06-09
slug: learning-ios-and-swift-day-twenty-two
lang: en-US
draft: true

summary: |
  I spent the whole evening going through tutorials and working on my side project, Ngöndro Tracker, leaving little time to post updates to the blog.
  Among others, I implemented a text field component with label, a helper to initialize colors from CSS hex strings, and began work on the view to edit practice settings.

---

## Creating `Color`s from hex strings

Let's first start with colors. In the Swift ecosystem, if you wish to use a custom color, you cannot just throw a color string, as you would do on the web, saying `salmon`, `black`, or `#fa8072`. Instead, each custom color must be initialized using floating-point values representing the decimal part of each of the RGB values divided by 255.0. So, for instance:

```
// #fa8072

0xFA == 250
0x80 == 128
0x72 == 114

// to instantiate a color
Color(red: 250.0 / 255, green: 128.0 / 255, blue: 114.0 / 255)
```

Being a lazy Web developer, I can't be bothered to do that much work each time I need a color literal, therefore I wrote a helper to convert strings like `#fff` or `#003366` to `Color`s. Below is a sample implementation:

```swift
import Foundation
import SwiftUI

private let regex = try! NSRegularExpression(pattern: "[^A-Fa-f0-9]")

private func normalizeHex(_ hex: String) -> String? {
  // First, remove irrelevant characters from the string
  let range = NSRange(location: 0, length: hex.length)
  let replaced = regex.stringByReplacingMatches(in: hex, range: range, withTemplate: "")

  // duplicate digits, if needed
  if replaced.count == 3 {
    return replaced.map { char in String(repeating: char, count: 2) }.joined()
  }

  if replaced.count == 6 {
    return replaced
  }

  return nil
}

extension Color {
  init(fromHex hex: String) {
    // normalize the string and parse as hex integer
    guard let normalized = normalizeHex(hex), let int = Int(normalized, radix: 16) else {
      fatalError("Invalid hex string: \(hex)")
    }
    
    // mask the third byte from the left and move it two bytes to the right
    // then convert it to `Double` and divide by 255.0
    let red = Double((int & 0xFF0000) >> 16) / 255.0
    let green = Double((int & 0xFF00) >> 8) / 255.0
    let blue = Double(int & 0xFF) / 255.0
    
    self.init(red: red, green: green, blue: blue)
  }
}
```

As it turns out, I may not be using this helper a whole lot, because all colors in iOS applications need to take dark mode into account, so I might end up setting custom colors through Xcode's palette.

```swift
import SwiftUI

struct AppTextFieldStyle: TextFieldStyle {
  func _body(configuration: TextField<_Label>) -> some View {
    configuration
      .padding(10)
      .background(Color(UIColor.systemGray5))
      .cornerRadius(5.0)
  }
}

struct LabeledTextField<V>: View {
  var label: String
  @Binding var value: V
  var placeholder: String = ""

  var body: some View {
    VStack {
      VStack(alignment: .leading) {
        Text(label)
          .font(.headline)
          .padding(.bottom, -1)
        switch $value {
        case is Binding<Int>:
          TextField(placeholder, value: $value, formatter: NumberFormatter())
            .keyboardType(.numberPad)
            .textFieldStyle(AppTextFieldStyle())
        default:
          TextField(placeholder, text: $value as! Binding<String>)
            .textFieldStyle(AppTextFieldStyle())
        }
      }
      .padding(.horizontal, 15)
    }
    .padding(.bottom, 10)
  }
}
```

```swift
import SwiftUI

struct EditPractice: View {
  var practice: Practice
  @State var draft: Practice
  
  init(practice pr: Practice) {
    practice = pr
    draft = practice
  }
  
  var body: some View {
    ScrollView(.vertical) {
      VStack(alignment: .leading) {
        LabeledTextField(label: "Name", value: $draft.name)
        LabeledTextField(label: "Mala size", value: $draft.malaSize)
        LabeledTextField(label: "Current amount", value: $draft.currentAmount)
        LabeledTextField(label: "Target amount", value: $draft.targetAmount)
      }
    }
    .navigationTitle("Edit practice")
    .toolbar {
      Button("Save") {}
    }
  }
}
```
