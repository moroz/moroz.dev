---
title: "Learning iOS and Swift. Day 16: Side project update"
date: 2022-06-03
slug: learning-ios-and-swift-day-sixteen
lang: en-US
draft: true

summary: |
  Today I spent the whole evening working on my pet project, Ngöndro Counter.
  Therefore, the blog post will consist solely of the project update.

---

I am currently working on my first iOS application, with the codename Ngöndro Tracker.
Ngöndro is a set of four meditation practices performed by practicioners of Tibetan Buddhism.
Each of the practices contains a certain mantra or exercise that is repeated multiple times during each meditation session.
In order to complete the four practices, the practitioner must accumulate 111,111 repetitions of each practice.
The application I am building is intended to help keep track of the repetitons.
Of course, there already exist applications that provide the same functionality, but none of them seems to have integration with Apple Watch.

Today I built a barebones index view that lists all practices stored in the database, and embedded it in a `NavigationView`:

<figure class="bordered-figure">
<img src="/images/ios-16/index-view.webp" />
<figcaption>List of all Four Preliminary Practices.</figcaption>
</figure>

By clicking on a name, the user is redirected to the corresponding practice view:

<figure class="bordered-figure">
<img src="/images/ios-16/practice-view.webp" />
<figcaption>In this view, the users will be able to make record of their daily repetitions.</figcaption>
</figure>
