---
title: Envelope Encryption with AWS KMS in Node.js
date: 2026-06-14
---

THIS IS A DRAFT

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

```
node_modules
mise.local.toml
```

Initialize a Git repository and commit the changes:

```shell
$ git init
$ git add .
$ git commit -m "Initial commit"
```

Install TypeScript:

```shell
$ pnpm add -D typescript @types/node tsx
$ pnpm approve-builds esbuild
```

Create a `tsconfig.json` file:

```json
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

In `package.json`, set `"type": "module"` to enable native ESM import syntax:

```json
// ...
  "type": "module",
// ...
```

Replace the `scripts` section of `package.json` with the following:

```json
// ...
  "scripts": {
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
// ...
```

Now, let's start writing some code. First, I'm going to show you how to encrypt data using AES-GCM-256, each time using a fully random encryption key and initialization vector.

First, generate an encryption key and an initialization vector (`iv`):

```typescript
import crypto from "node:crypto";

const encryptionKey = await crypto.subtle.generateKey(
  {
    name: "AES-GCM",
    length: 256, // AES-GCM can be used with 128-, 192-, and 256-bit keys
  },
  true,
  ["encrypt", "decrypt"],
);

// The initialization vector in AES-GCM is 96 bits (12 bytes) long,
// regardless of key length
const iv = crypto.getRandomValues(new Uint8Array(12));

console.log({ encryptionKey, iv });
```

Let's run this program to see what these values are under the hood:

```shell
$ pnpm dev
{
  encryptionKey: CryptoKey {
    type: 'secret',
    extractable: true,
    algorithm: { name: 'AES-GCM', length: 256 },
    usages: [ 'encrypt', 'decrypt' ]
  },
  iv: Uint8Array(12) [
     60, 198, 171,  52,
    161, 156, 254,  16,
    163, 220, 146, 165
  ]
}
```

The `encryptionKey` variable is an instance of [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey), and the `iv` is a 12-byte [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).

Next, define and encrypt a message:

```ts
// src/index.ts, add after iv generation

const message = "All work and no play makes Jack a dull boy.";

const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  encryptionKey,
  new TextEncoder().encode(message), // convert message (string) to Uint8Array
);

console.log({ encrypted });
```

The script should now print out the encrypted message, which is a `Uint8Array`:

```shell
$ pnpm dev
{
  encrypted: ArrayBuffer {
    [Uint8Contents]: <...>, # omitted for brevity
    [byteLength]: 59
  }
}
```

The resulting binary is 59 bytes long. Let's compare it to the length of the plaintext:

```ts
const messageBytes = new TextEncoder().encode(message);
console.log("Plaintext length:", messageBytes.byteLength);
console.log("Encrypted length:", encrypted.byteLength);
console.log("Overhead:", encrypted.byteLength - messageBytes.byteLength);
```

The program output shows that the resulting message is 16 bytes longer than the plaintext:

```shell
$ pnpm dev
Plaintext length: 43
Encrypted length: 59
Overhead: 16
```

The reason for this difference in length is that the encryption function appends an authentication tag at the end of the ciphertext, and that ciphertext is 16 bytes long.

Now, let's see if the encryption is reversible:

```ts
const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, encryptionKey, encrypted);
console.log({ decrypted });
```

Once again, the result is a `Uint8Array`, this time only 43 bytes long:

```shell
$ pnpm dev
{
  decrypted: ArrayBuffer {
    [Uint8Contents]: <41 6c 6c 20 77 6f 72 6b 20 61 6e 64 20 6e 6f 20 70 6c 61 79 20 6d 61 6b 65 73 20 4a 61 63 6b 20 61 20 64 75 6c 6c 20 62 6f 79 2e>,
    [byteLength]: 43
  }
}
```

Convert it to a string using `TextDecoder`:

```ts
const decryptedString = new TextDecoder().decode(decrypted);
console.log({ decryptedString });
```

If you've wired everything correctly, the resulting decrypted message should be the same as the initial plaintext:

```shell
$ pnpm dev
{ decryptedString: 'All work and no play makes Jack a dull boy.' }
```