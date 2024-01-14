---
title: CodePipeline for OpenBSD, Go, and Latex
slug: codepipeline-for-openbsd-go-latex
date: 2024-01-14
draft: true
summary: |
    This post aims to describe how to set up a CodePipeline with on-premises CodeDeploy for a Go application deployed to a VPS running OpenBSD.
---

Due to the fact that I work as a B2B contractor, I have to issue invoices by the end of every month and send the generated file to both the client and to my tax advisor.
Generating invoices is a very repetitive task, in particular because the only thing prone to change is the column aptly named _Date of issue_.
