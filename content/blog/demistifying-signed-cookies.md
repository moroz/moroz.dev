---
title: "Secure cookie library in Go from scratch"
date: 2025-01-14
slug: "secure-cookie-library-in-go-from-scratch"
summary: In this post, I show you how to write a "secure cookie" library in Go using AEAD cryptographic primitives.
lang: en
draft: yes
---

### What are cookies and why should I care?

Cookies are short[^1] strings of letters, digits, and symbols[^2] that a Web server may store in your browser.
They are used to identify a user of a given Website between requests.
Whenever you add a product to a virtual shopping cart or sign in to an online mailbox, that Website is going to give you a _cookie_ that the server can later use to identify you.

The name _cookie_ comes from the term _magic cookie_[^3], which predates the World Wide Web and refers to a value passed between programs unchanged.
This is similar to a [fortune cookie &#x1F960;](https://en.wikipedia.org/wiki/Fortune_cookie), which also contains a hidden message that can be passed around.

Cookies are an essential part of any Web application, and if you live in Europe, chances are you are going to be reminded about this fact every single day. There is a browser extension to fix that[^4].

But have you ever wondered _what exactly_ is stored in that cookie?

### Naïve Approach: Just Store the Value

Let us go back to the example of a virtual shopping cart. On the server, there is likely a database table called `carts`. When you put an item in the cart, the server will create a new row in that table (a "new cart"). Let's say that your cart has the ID of `42`.

The simplest approach is to just store the cart ID in the cookie:

```http
HTTP/1.1 200 OK
Set-Cookie: cart_id=42
...
```

Then, when you visit your cart again, you send the cookie back to the server:

```http
GET /cart HTTP/1.1
Cookie: cart_id=42
...
```

In a perfect world, this would work just fine! However, in a non-perfect world, like the one I live in, this approach is going to be terribly insecure.

For starters, the cart ID is generated in a sequence (1, 2, 3, ...), making it trivial to guess the next and previous identifier.
Even worse, this ID is all that is needed to forge a cookie and fetch someone else's cart.

With such poor security, a malicious actor (or just a curious bystander) could _hack your Website_ and fetch _all data_ in _all carts_, using just a `for` loop:

```c
for (int i = 1; i <= 42; i++) {
    hack_the_website(i);
}
```

Not great! What can we do to remedy this?

### Approach 1: Signed Cookies

Back in the early days of PHP, we had a 

[^1]: As a [rule of thumb](http://browsercookielimits.iain.guru/), the maximum size of all cookies stored for a domain should not exceed around 4 kB (4096 bytes).

[^2]: According to [RFC 6265](https://httpwg.org/specs/rfc6265.html#sane-set-cookie), all the characters permitted within a cookie are: `A`&ndash;`Z`, `a`&ndash;`z`, `0`&ndash;`9`, and the following: <code>!#$%&'()&#x2a;+-./:&lt;=&gt;?@[]^&#x5F;&#x60;{|}~</code>. Note that spaces, double quotes&nbsp;(`"`), and semicolons&nbsp;(`;`) are not permitted.

[^3]: ["Where cookie comes from :: DominoPower"](http://dominopower.com/article/where-cookie-comes-from/). _dominopower.com_ (retrieved 2025-01-14).

[^4]: If you are tired of obnoxious cookie banners, you can hide them using the browser extension _I still don't care about cookies_ (available for [Chrome/Edge](https://chromewebstore.google.com/detail/i-still-dont-care-about-c/edibdbjcniadpccecjdfdjjppcpchdlm) and [Firefox](https://addons.mozilla.org/en-US/firefox/addon/istilldontcareaboutcookies/)).
