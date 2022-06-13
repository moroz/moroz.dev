---
title: "Learning iOS and Swift. Day 25: Apollo Client, MVVM architecture, keychain storage"
date: 2022-06-13
slug: learning-ios-and-swift-day-twenty-six
lang: en-US

summary: |
  Exploring integration with Apollo Client for iOS. Discovering MVVM architecture and singleton classes.
  Storing authentication data inside the Keychain using the Security module, which is part of Foundation.

---

Yesterday I more or less finished Apple's SwiftUI tutorial, skipping the section on macOS development, as it is outside my area of focus at the moment.
I tried to build a watchOS app for my Ngöndro Tracker project, but I hit a wall due to persistence and synchronization requirements.
As it turned out, even though SQLite3 is readily available on iOS, iPadOS, and macOS, it is not available on watchOS, probably because it is too resource-consuming.
Having overlooked this fact, I could only watch each build of the watchOS target fail miserably, not finding this or that header file.
I am planning to approach this project again once I learn enough about Core Data to be able to use it for persistence both on the iPhone as well as on the Apple Watch.

## Storing credentials on the keychain


