---
title: How to deploy a Phoenix API on Windows Server 2019
date: 2021-05-14
slug: deploy-phoenix-on-windows-server-2019
tags:
  - Elixir
  - Phoenix
  - Deployment
---

This post aims to describe the steps necessary to deploy a Phoenix application to a Windows Server 2019 machine
in a cloud-based setting, like a VM on [Azure](https://azure.microsoft.com/en-us/). It is meant as a last resort reference for people compelled
to only use Windows-based solution, like the internal policies of their own organization or that of a client.
It is _not_ meant as a tutorial for beginners who just want to deploy their fresh Phoenix applications but have no
experience with UNIX-like operating systems. If that sounds like you, I strongly encourage you to instead use any operating
system from the GNU/Linux or BSD family, such as [Ubuntu Server](https://ubuntu.com/download/server),
[Debian](https://www.debian.org/), or [FreeBSD](https://www.freebsd.org/), all available free of charge
on all major cloud computing platforms.
