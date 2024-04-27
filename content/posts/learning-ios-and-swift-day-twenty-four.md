---
title: "Learning iOS and Swift. Day 24: Building a carousel using UIKit interop"
date: 2022-06-11
slug: learning-ios-and-swift-day-twenty-four
lang: en-US

summary: |
  Following Apple's SwiftUI tutorial, I explore the interoperability techniques used to embed SwiftUI components inside UIKit Controllers, and vice versa.
  The tutorial teaches how to build a carousel view, which I find pretty cool.
  I also learned how to overlay text and a gradient over an image.

---

Following one of the later chapters of Apple's SwiftUI tutorial, [Interfacing with UIKit](https://developer.apple.com/tutorials/swiftui/interfacing-with-uikit), I built a carousel view that displays a set of featured landmark cards and lets the user swipe left and right to see the next or previous featured landmark.

The carousel itself is a built-in UIKit component called [UIPageViewController](https://developer.apple.com/documentation/uikit/uipageviewcontroller).
In order to display a UIKit controller inside SwiftUI, the controller needs to be wrapped in another controller, which must implement the `UIViewControllerRepresentable` protocol.
The protocol requires two callbacks, `makeUIViewController(context:)` and `updateUIViewController(_:context:)`, which handle initialization and prop updates, respectively.

The controller may also define a coordinator class, which must inherit from `NSObject` and which may be used as a **data source** -- which apparently is a common pattern in pre-SwiftUI Apple frameworks. Note: I still haven't figured out the relationship between Cocoa, UIKit, and AppKit.
In the case of the `UIPageViewController`, the data source must implement the `UIPageViewControllerDataSource` protocol, and define logic for which slide comes after which one.
The fact that this logic is defined using required callbacks means that the carousel component is infinitely more flexible in terms of presentation logic than its equivalent Web components, which usually just slide a few `<div>`s one way or the other using a ton of hideous jQuery code.

## Image text overlays

The tutorial teaches how to implement the following layout, and it does so in a rather matter-of-factly way.

<figure>
<img src="/images/ios-24/feature-card.webp" alt="Turtle Rock. Joshua Tree National Park. Text overlaid over an image." />
<figcaption>Text and gradient overlaid over an image.</figcaption>
</figure>

So basically to do an overlay like this, you define what your overlay should look like, for instance using a separate component:

```swift
struct TextOverlay: View {
  var landmark: Landmark

  var gradient: LinearGradient {
    .linearGradient(
      Gradient(colors: [.black.opacity(0.6), .black.opacity(0)]),
      startPoint: .bottom, endPoint: .center)
  }

  var body: some View {
    ZStack(alignment: .bottomLeading) {
      gradient
      VStack(alignment: .leading) {
        Text(landmark.name)
          .font(.title)
          .bold()
        Text(landmark.park)
      }
      .padding()
    }
    .foregroundColor(.white)
  }
}
```

This component essentially renders a linear gradient (the equivalent of `linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 50%)` in CSS) and two lines of text inside a `ZStack` (so it renders in layers within the same space).
The text layout is pretty straightforward, but I found it interesting to see the `.opacity(_:)` method called on a value of the struct `Color` to modify the alpha channel.

This component can then be placed in the `.overlay` modifier of another view, like so:

```swift
struct FeatureCard: View {
  var landmark: Landmark

  var body: some View {
    landmark.featureImage?
      .resizable()
      .aspectRatio(3 / 2, contentMode: .fit)
      .overlay {
        TextOverlay(landmark: landmark)
      }
  }
}
```
