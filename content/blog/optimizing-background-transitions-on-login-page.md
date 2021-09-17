---
title: Optimizing background transitions on login page
author: "Karol Moroz <k.j.moroz@gmail.com>"
date: 2021-09-17
slug: optimizing-background-transitions-on-login-page
draft: true
---

# Project statement

A recent project I have worked on features a full-screen background on the login page
that fades into another picture every 10 seconds. The initial design of that page contained
a collection of 12 elements with background images, styled to cover the whole page, and
the transition was implemented as a CSS animation. Each image was fading in the same way,
but with a different `animation-delay`, so that only one image was showing at a given time.
The order of images was randomized on the back end on each request, and after all images
had been displayed, it would go back to the first image in an infinite loop.

This first iteration was looking as intended but the page proved very slow to load once deployed to staging.
The image files themselves totaled about 27 MB, all of which had to be fetched on the first page load.
Needless to say, Google Lighthouse wasn't happy, giving the page a very low score.

# Proposed solution

What you can do about that issue basically boils down to two things:

1. Convert and compress your image files to make their byte size smaller.
2. Only fetch the first image on initial page load and fetch all subsequent images dynamically using JavaScript.

In this article I would like to elaborate on these two steps.
We will implement the whole view from scratch, writing all the necessary CSS and JavaScript from scratch.
For the development server, I will use a minimal setup of [Vite.js](https://vitejs.dev/) with SASS and Pug.

```bash
yarn create vite --template vanilla-ts dynamic-bg
cd dynamic-bg
yarn
git init
git add -A
git commit -m "Initial commit"
```

First, we need some background images. For the purposes of this exercise, I hand-picked twelve exquisite images of a certain tropical island, located somewhere between China and the Philippines. They came from
[here](https://unsplash.com/photos/phjpsNFw6pM), [here](https://unsplash.com/photos/5K_C8tRn678),
[here](https://unsplash.com/photos/BNZyrmMV51c), [here](https://unsplash.com/photos/JgFTqBHIHFE),
[here](https://unsplash.com/photos/Q7ssPp8bPtw), [here](https://unsplash.com/photos/cVHqIdkxE7U),
[here](https://unsplash.com/photos/oc2hzcGLCFU), [here](https://unsplash.com/photos/UGoUK9Ev7jU),
[here](https://unsplash.com/photos/NWkztkVe1HU), [here](https://unsplash.com/photos/DGLYo2q2gj8),
[here](https://unsplash.com/photos/TWxB8pT5eHs), and [here](https://unsplash.com/photos/TWxB8pT5eHs).
I assigned numbers (1&ndash;12) to them and placed them in the project's `public` directory, which is the place to put static content in Vite.

Now, let's install SASS and Pug to simplify writing CSS and HTML:

```bash
yarn add sass pug vite-plugin-pug
```

Then we need to configure this plugin in `vite.config.ts` (create this file if it does not exist):

```typescript
import { defineConfig } from "vite";
import pugPlugin from "vite-plugin-pug";

export default defineConfig({
  plugins: [pugPlugin()]
});
```

# Coding the page

Now let's start coding our login page. First, create a directory at `src/css` and inside it, an empty file called `main.sass`. Then, in `src/main.ts`, replace all existing code with a single line that imports the file we just created:

```typescript
import "./css/main.sass";
```

This will load and process the SASS files the project and apply styling on our views.

In `index.html`, replace all existing content with a slot for a Pug template:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <pug src="login.pug" />
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create a file called `login.pug` in the same directory and add the following markup:

```pug
.dynamic-bgs#dynamic-bgs
  - for (let i = 1; i <= 12; i++)
    picture
      img(src=`/${i}.jpg` alt="")
```

This will create 12 `<picture>` tags with nested `<img>`s. At this point, the outer `<picture>` tag is not necessary, but we will need it later on to provide fallback images for browsers that don't support WEBP, such as Safari up to version 13.

If we launch `yarn dev` right now, we will see the images properly loaded, displayed all at once on a single page. Let's add some styles to position them:

```sass
*
  box-sizing: border-box

html
  font-size: 100%

body
  font-family: system-ui
  padding: 0
  margin: 0
  height: 100vh
  overflow: hidden

.dynamic-bgs
  img
    position: fixed
    top: 50%
    right: 0
    left: 0
    transform: translateY(-50%)
```
