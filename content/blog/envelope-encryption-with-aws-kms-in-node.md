---
title: Envelope Encryption with AWS KMS in Node.js
date: 2026-06-14
---

In this article I'm going to show you how to encrypt files for use with untrusted storage using AWS Key Management Service (KMS) and authenticated encryption with associated data primitives (AEAD) in Node.js.
The solution presented in this article has not been audited and is meant as an academic side project. That said, feel free to incorporate it in your side projects, iterate on it, and provide feedback.
The source code for this project is available on my GitHub at [moroz/envelope-encryption-node](https://github.com/moroz/envelope-encryption-node) and MIT-licensed.

First, let me explain the objective:

We want to encrypt files uploaded by end users for storage on potentially untrusted media, such as AWS Simple Storage Service (S3). Even though AWS S3 does provide an option to encrypt files at rest, once you manage to access a file through the S3 API, it is served in plaintext. A good cryptographic primitive to encrypt a file would be an AEAD (**A**uthenticated **E**ncryption with **A**ssociated **D**ata) scheme, such as AES-GCM-256 or XChacha-Poly1305. These AEADs provide good data confidentiality, meaning that an encrypted message cannot be read by someone who does not know the encryption key. They also guarantee message authenticity through the use of authentication tags, so that an encrypted message cannot be tampered with.

A na&iuml;ve solution involves a single encryption key, used directly to encrypt all files in the system. In the encrypted file, we store a random initialization vector (the first 12 bytes of the file), the ciphertext, and the authentication tag (the last 16 bytes of the file).
The obvious problem with this solution is that a single key shared by all files becomes a single point of failure. The moment this encryption key is leaked (for instance, because someone gained access to a machine storing the key in plaintext), all messages ever encrypted with this key are compromised. The attacker may decrypt all confidential data encrypted with this key. They may also replace existing files with tampered versions.

A simple way to remediate this is by using the so-called "envelope encryption." In this setup, the data itself is still encrypted using a simple AEAD scheme, but instead of using the same encryption key for everything, we generate a single-use encryption key ("ephemeral key") for each file. In the encrypted file, we store an encrypted representation of the ephemeral key, the initialization vector, the ciphertext, and the authentication tag. In order to decrypt the file, we first need to decrypt the ephemeral key, after which we can decrypt the rest of the file.

In this article, I'm going to show you how to leverage AWS KMS to securely generate ephemeral data keys.

Ensure you have a recent version of [Node.js](https://nodejs.org/en) installed, as well as [pnpm](https://pnpm.io/). As of this writing, the latest version of Node.js is 26.3.0, and the latest version of pnpm is 11.6.0. On my development machine, I manage those using [mise-en-place](https://mise.jdx.dev/).

First, let's create an empty directory for the project:

```shell
$ mkdir envelope-encryption
$ cd envelope-encryption
```

Pin Node.js and pnpm versions for the project using Mise:

```shell
$ mise use node@26.3.0 pnpm@11.6.0
mise 2026.5.18 by @jdx
pnpm@11.6.0
node@26.3.0
mise ~/working/exp/envelope-encryption/mise.toml tools: node@26.3.0, pnpm@11.6.0
```

Initialize a JavaScript project:

```shell
$ pnpm init
```

Create a `.gitignore`:

```shell
cat >.gitignore <<-EOF
node_modules
mise.local.toml
EOF
```

Initialize a Git repository and commit the changes:

```shell
$ git init
$ git add .
$ git commit -m "Initial commit"
```

Install TypeScript:

```shell
$ pnpm add -D typescript @types/node
```

Create a `tsconfig.json` file:

```js
{
  "compilerOptions": {
    // File Layout
    "rootDir": "./src",
    "outDir": "./dist",

    "module": "nodenext",
    "target": "esnext",
    "lib": ["esnext"],
    "types": ["node"],

    // Stricter Typechecking Options
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    // Recommended Options
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  }
}
```
