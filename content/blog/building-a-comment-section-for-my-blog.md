---
title: Building a Comment Section for My Blog, Part 1
date: 2021-11-19
slug: building-a-comment-section-for-my-blog
draft: true
tags:
  - Elixir
  - React
  - Next.js
summary: |
  How I built the new comment section for this website using Elixir, Phoenix, Absinthe GraphQL, and Next.js.
---

Static websites are getting increasingly popular these days. There are dozens of very good static site generators
out there, the most popular being [Next.js](https://nextjs.org/), [Hugo](https://gohugo.io/), and [Gatsby](https://www.gatsbyjs.com/).
Static websites have numerous advantages over dynamically generated websites. Most importantly, they are very fast
and cheap to deploy: once your generator spits out a bunch of HTML, CSS, and JS files.

I have recently seen the article [Various ways to include comments on your static site](https://darekkay.com/blog/static-site-comments/)
by Darek Kay on the main page of Hacker News.
The article describes several solutions to the problem of implementing comments on static websites.
Considering how I got around 15 comments over roughly 13 years of blogging, I decided to invest some 
