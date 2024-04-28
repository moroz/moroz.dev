---
title: "Learning iOS and Swift. Day 20: Apple's tutorial on Defense Against the Dark Arts"
date: 2022-06-07
slug: learning-ios-and-swift-day-twenty
lang: en-US

summary: |
  Following Apple's tutorial on graphics leaves me completely dumbfounded.
  Does it mean I will learn how to make stuff as pretty as Apple's native apps?

---

Today I followed the chapter [Drawing Paths and Shapes](https://developer.apple.com/tutorials/swiftui/drawing-paths-and-shapes) from Apple's SwiftUI tutorial.
At first, the tutorial taught me how to draw a rounded hexagon using hard-coded path segments of B&eacute;zier curves.
If I understood it correctly, a B&eacute;zier curve consists of three (or more?) points which define the start and end of a line, and its curvature.

This reminds me of what Lea Verou once said in her almanach of CSS magic called [CSS Secrets](https://www.oreilly.com/library/view/css-secrets/9781449372736/).
It was something along the lines of "SVG syntax for `path` is very complicated, because when it was being designed, no one expected that people would be writing SVG by hand."
Although Web technologies constitute my comfort zone when it comes to building pretty things on a computer's screen, I do anticipate that native bindings from UIKit and similar libraries may be many times more performant and powerful than hacks built on top of an [XML-based vector graphics format](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics) and a [programming language designed in 10 days](https://www.computer.org/csdl/magazine/co/2012/02/mco2012020007/13rRUy08MzA) for the absurdly complex ecosystem called "the Web browser."

Luckily, Apple's `CoreGraphics` can definitely be written by hand, even if at this point I couldn't come up with the same ingenious code that paints a gradient-filled, rounded hexagon on the screen:

<figure>
<a href="/images/ios-20/hexagon.webp" target="_blank">
<img src="/images/ios-20/hexagon.webp" alt="Screenshot of an Xcode window with the preview of a gradient-filled, rounded hexagon." />
</a>
<figcaption>A rounded hexagon displayed with SwiftUI (click to enlarge).</figcaption>
</figure>

Then, there is a snippet I understand much better, which renders a complex polygon using an array of `CGPoint`s:

```swift
import SwiftUI

struct BadgeSymbol: View {
  var body: some View {
    GeometryReader { geometry in
      Path { path in
        let width = min(geometry.size.width, geometry.size.height)
        let height = width * 0.75
        let spacing = width * 0.03
        let middle = width * 0.5
        let topWidth = width * 0.226
        let topHeight = height * 0.488

        path.addLines([
          CGPoint(x: middle, y: spacing),
          CGPoint(x: middle - topWidth, y: topHeight - spacing),
          CGPoint(x: middle, y: topHeight / 2 + spacing),
          CGPoint(x: middle + topWidth, y: topHeight - spacing),
          CGPoint(x: middle, y: spacing),
        ])
      }
    }
  }
}
```

The resulting shape:

<figure>
<img src="/images/ios-20/polygon.webp" alt="A polygon shape built using points." />
<figcaption>A polygon &ndash; not quite as impressive, but easier to grasp.</figcaption>
</figure>

The tutorial then proceeds with overlaying complex polygons and other shapes on top of the gradient-filled rounded hexagon.
This is a matter I shall explore tomorrow.
