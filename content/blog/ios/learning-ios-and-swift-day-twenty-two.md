---
title: "Learning iOS and Swift. Day 22: Generic input field, toolbar"
date: 2022-06-09
slug: learning-ios-and-swift-day-twenty-two
lang: en-US
draft: true

summary: |
  Today I implemented persisting practice history each time the user adds some repetitions of a practice.
  I also implemented a simple view for presenting those records.
  I found out how to implement custom keys for `Decodable` data structures.

---

```swift
import Foundation
import SwiftUI

private func normalizeHex(_ hex: String) -> String? {
  guard hex.count == 6 || hex.count == 7 else {
    return nil
  }

  if hex.starts(with: "#") {
    let start = hex.index(hex.startIndex, offsetBy: 1)
    return String(hex[start...])
  }

  return hex
}

extension Color {
  init(fromHex hex: String) {
    guard let normalized = normalizeHex(hex), let int = Int(normalized, radix: 16) else {
      fatalError("Invalid hex string: \(hex)")
    }
    
    let red = Double((int & 0xFF0000) >> 16) / 255.0
    let green = Double((int & 0xFF00) >> 8) / 255.0
    let blue = Double(int & 0xFF) / 255.0
    
    self.init(red: red, green: green, blue: blue)
  }
}
```

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
