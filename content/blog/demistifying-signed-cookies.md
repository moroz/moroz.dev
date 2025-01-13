---
title: "Demistifying Signed Cookies"
date: 2025-01-13
slug: "demistifying-signed-cookies"
summary: How to sign your own cookies
lang: en
draft: yes
---

### Introduction

Cookies are an essential part of any Web application.
When you visit your favorite website, you type in your username and password, and submit the login form.
The server of that website will most likely send you a cookie, which is a string of characters and symbols that your Web browser saves on your computer.

After that, whenever you make a request to the same server, the browser will include that cookie with the request, and based on this information, the website will be able to identify you.
As a developer, you may wonder what exactly you should store in that cookie.

### Naïve Approach: Just Store the Email

Let's start with a very simple approach:
Let's say that your application has a table in the database called `users`, and every user is identified by their email address.
When a user signs in, you would just store the email address in the cookie.
Then, when you make a request with that cookie, the server can just look for a user with that email address, and if we find the user, it means that you are signed in.

Now, this would work just fine, but there are two problems with this approach.
Firstly, if you change your email address, you will be signed out from the application.
This, in itself, is not necessarily an issue.

However, another, more burning issue with this approach is that it is terribly insecure.
A cookie is just a string of characters, so if I know your email address, I can pretend to be you just by including your email address with the request.
I wouldn't even need to know your password!

### Session Storage 101

Back in the early days of PHP, we had a 
