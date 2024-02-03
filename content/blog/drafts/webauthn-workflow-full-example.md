---
title: "Building a Multi-Factor Authentication workflow with WebAuthn"
slug: webauthn-workflow-full-example
date: 2024-02-03
summary: Everything you always wanted to know about implementing an MFA workflow.
---

## What is MFA and why should I implement it?

Most common Web application implement authentication with some sort of user ID (like an email address) and a password or PIN.
A lot of users, especially the less tech-savvy ones, tend to use very weak passwords, often reusing the same password for multiple websites.
If a user's password is compromised, a malicious party can then gain access to all of those websites.

Multi-Factor Authentication (MFA) is a way to prevent unauthorized access to a system by combining the factor of _Something You Know_ (a password or PIN) with _Something You Have_ (some sort of an authenticating device).
Common MFA techniques include one-time codes delivered by SMS or email, or generated using an authenticator app.
Many services also provide mult
Other systems, such as iCloud, Google, and Github, use push notifications sent 
While these 

According to the [OWASP Multi-Factor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html), the three most common ways of authenticating a user on a Web application are:

* Something You Are: biometrics,
* Something You Know: passwords or PINs,
* Something You Have: basically any sort of hardware devices that can provide 
