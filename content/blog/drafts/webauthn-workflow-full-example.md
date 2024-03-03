---
title: "Building a Multi-Factor Authentication workflow with TOTP in Go"
slug: webauthn-workflow-full-example
date: 2024-02-03
draft: true
summary: Everything you always wanted to know about implementing an MFA workflow.
---

## What is MFA and why should I implement it?

Most common Web application implement authentication with some sort of user ID (like an email address) and a password or PIN.
A lot of users, especially the less tech-savvy ones, tend to use very weak passwords, often reusing the same password for multiple websites.
If a user's password is compromised, a malicious party can then gain access to all of those websites.

Multi-Factor Authentication (MFA) is a way to prevent unauthorized access to a system by combining the factor of _Something You Know_ (a password or PIN) with _Something You Have_ (some sort of an authenticating device).
Common MFA techniques include one-time codes delivered by SMS or email, or generated using an authenticator app.
Another way is to use push notifications delivered to a mobile app, prompting the user to confirm an action performed another device.
All of these can effectively prevent unauthorized access when a user's account is compromised, but they are not immune to phishing attacks, because a phishing website may still trick the user into authorizing a malicious website.

In this article, I would like to provide a general description of what you need to do in order to implement a TOTP-based MFA workflow in a Web application.
While the code samples shown in the article will be in Go, the overall workflow is generic enough to implement with any technological stack.

{/* Migration / changes to database structure
* Column-level encryption
* Generate backup codes / hash as password
* Generating QR code
* Registration: one code and current password
* Authentication: check TOTP code or any of backup codes */}

According to the [OWASP Multi-Factor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html), the three most common ways of authenticating a user on a Web application are:

* Something You Are: biometrics,
* Something You Know: passwords or PINs,
* Something You Have: basically any sort of hardware devices that can provide 
