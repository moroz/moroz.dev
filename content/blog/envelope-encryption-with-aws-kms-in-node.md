---
title: Envelope Encryption with AWS KMS in Node.js
date: 2026-06-14
---

THIS IS A DRAFT

In this article I'm going to show you how to encrypt files for use with untrusted storage using AWS Key Management Service (KMS) and authenticated encryption with associated data primitives (AEAD) in Node.js.
The solution presented in this article has not been audited and is meant as an academic side project. That said, feel free to incorporate it in your side projects, iterate on it, and provide feedback.
The source code for this project is available on my GitHub at [moroz/envelope-encryption-node](https://github.com/moroz/envelope-encryption-node) and MIT-licensed.

### Mission statement

First, let me explain the objective:

We want to encrypt files uploaded by end users for storage on potentially untrusted media, such as AWS Simple Storage Service (S3). Even though AWS S3 does provide an option to encrypt files at rest, once you manage to access a file through the S3 API, it is served in plaintext. A good cryptographic primitive to encrypt a file would be an AEAD (**A**uthenticated **E**ncryption with **A**ssociated **D**ata) scheme, such as AES-GCM-256 or XChacha-Poly1305. These AEADs provide good data confidentiality, meaning that an encrypted message cannot be read by someone who does not know the encryption key. They also guarantee message authenticity through the use of authentication tags, so that an encrypted message cannot be tampered with.

A na&iuml;ve solution involves a single encryption key, used directly to encrypt all files in the system. In the encrypted file, we store a random initialization vector (the first 12 bytes of the file), the ciphertext, and the authentication tag (the last 16 bytes of the file).
The obvious problem with this solution is that a single key shared by all files becomes a single point of failure. The moment this encryption key is leaked (for instance, because someone gained access to a machine storing the key in plaintext), all messages ever encrypted with this key are compromised. The attacker may decrypt all confidential data encrypted with this key. They may also replace existing files with tampered versions.

A simple way to remediate this is by using the so-called "envelope encryption." In this setup, the data itself is still encrypted using a simple AEAD scheme, but instead of using the same encryption key for everything, we generate a single-use encryption key ("ephemeral key") for each file. In the encrypted file, we store an encrypted representation of the ephemeral key, the initialization vector, the ciphertext, and the authentication tag. In order to decrypt the file, we first need to decrypt the ephemeral key, after which we can decrypt the rest of the file.

In this article, I'm going to show you how to leverage AWS KMS to securely generate ephemeral data keys. In order to follow along with the AWS part of this tutorial, you're going to need an active AWS account.

Ensure you have a recent version of [Node.js](https://nodejs.org/en) installed, as well as [pnpm](https://pnpm.io/). As of this writing, the latest version of Node.js is 26.3.0, and the latest version of pnpm is 11.6.0. On my development machine, I manage those using [mise-en-place](https://mise.jdx.dev/).

## Project setup

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

### Generate an encryption key

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

### Setting up a KMS key

In this part of the article we are going to create a KMS symmetric encryption key. I will also demonstrate the API calls used to generate key material and the response format.

Make sure you have installed and configured the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html). On macOS and Linux, you can install the AWS CLI using either Homebrew or Mise. In this article, I'm going to use Mise.

```shell
$ mise use aws
aws@2.35.2
mise ~/working/exp/envelope-encryption/mise.toml tools: aws@2.35.2
```

You need to configure the AWS CLI to use the correct credentials, for instance using [`aws-vault`](https://github.com/ByteNess/aws-vault). Best practices for secure AWS CLI configuration are beyond the scope of this article. Once you have configured the AWS CLI correctly, you can verify your credentials using `aws sts get-caller-identity` (the credentials and resource IDs in this section have been anonymized):

```shell
$ aws sts get-caller-identity
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "677884085811",
    "Arn": "arn:aws:iam::677884085811:user/example-user"
}
```

You can create a symmetric key using `aws kms create-key`.
Please be advised that KMS keys are paid resources. As of this writing, one KMS key [costs US$1/month](https://aws.amazon.com/kms/pricing/).

```shell
$ aws kms create-key
{
    "KeyMetadata": {
        "AWSAccountId": "677884085811",
        "KeyId": "ac39f2f4-bf80-415d-a460-de56fc6fd668",
        "Arn": "arn:aws:kms:eu-central-1:677884085811:key/ac39f2f4-bf80-415d-a460-de56fc6fd668",
        "CreationDate": "2026-06-14T22:55:56.928000+02:00",
        "Enabled": true,
        "Description": "",
        "KeyUsage": "ENCRYPT_DECRYPT",
        "KeyState": "Enabled",
        "Origin": "AWS_KMS",
        "KeyManager": "CUSTOMER",
        "CustomerMasterKeySpec": "SYMMETRIC_DEFAULT",
        "KeySpec": "SYMMETRIC_DEFAULT",
        "EncryptionAlgorithms": [
            "SYMMETRIC_DEFAULT"
        ],
        "MultiRegion": false,
        "CurrentKeyMaterialId": "321c6aa24d88273bf1f355d9fe80ecb3b6725c5e1e66f981b843a473ddfaeac9"
    }
}
```

Note: Once you're done with this tutorial, remember to schedule your key for deletion using `aws kms schedule-key-deletion`:

```shell
$ aws kms schedule-key-deletion --key-id "ac39f2f4-bf80-415d-a460-de56fc6fd668" --pending-window-in-days 7
{
    "KeyId": "arn:aws:kms:eu-central-1:677884085811:key/ac39f2f4-bf80-415d-a460-de56fc6fd668",
    "DeletionDate": "2026-06-21T22:57:27.065000+02:00",
    "KeyState": "PendingDeletion",
    "PendingWindowInDays": 7
}
```

Once you have an active key, you can generate an ephemeral AES-256 key using `aws kms generate-data-key`:

```shell
$ aws kms generate-data-key --key-id="ac39f2f4-bf80-415d-a460-de56fc6fd668" --number-of-bytes 32
{
    "CiphertextBlob": "AQIBAHg2lS0EjL9HUNzk+f0duqFuRva3xcI7b1dYz258CzR1+AH48NV21vsO7RVRH3osiAmpAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMSxqqRHjFCjs6GGqUAgEQgDtzQpAtuIvGvp+tLJSaC6T2DC4ohBEgOsK/hLf0+g89t3KOjJ7cM/4jnINcsOycbDWuoRa31rvf8vs1MQ==",
    "Plaintext": "fOO8LDQB0w0nHSXiwdDVN+lEnL0lxBQQb0AGfzF91Fc=",
    "KeyId": "arn:aws:kms:eu-central-1:677884085811:key/ac39f2f4-bf80-415d-a460-de56fc6fd668",
    "KeyMaterialId": "321c6aa24d88273bf1f355d9fe80ecb3b6725c5e1e66f981b843a473ddfaeac9"
}
```

The response contains two values that are important to us: `Plaintext` contains the ephemeral symmetric key you can use to encrypt your data; `CiphertextBlob` contains an opaque, encrypted value that we will later store together with the encrypted file.

You can decrypt the `CiphertextBlob` using `aws kms decrypt`:

```shell
# Generate a data key and store it in the $RESULT variable
$ RESULT="$(aws kms generate-data-key --key-id="ac39f2f4-bf80-415d-a460-de56fc6fd668" --number-of-bytes 32)"

# Extract the original plaintext ephemeral key from the GenerateDataKey response
$ ORIGINAL_PLAINTEXT="$(echo $RESULT | jq -r .Plaintext)"
$ echo $ORIGINAL_PLAINTEXT
lneXCfzUy/tZkYOj7P7zZ51Om+PRdo56tEAE/gzyZUk=

# Extract the encrypted data key from the GenerateDataKey response
$ CIPHERTEXT_BLOB="$(echo $RESULT | jq -r .CiphertextBlob)"
$ DECRYPTION_RESULT="$(aws kms decrypt --key-id="ac39f2f4-bf80-415d-a460-de56fc6fd668" --ciphertext-blob "$CIPHERTEXT_BLOB")"
$ echo $DECRYPTION_RESULT
{
    "KeyId": "arn:aws:kms:eu-central-1:677884085811:key/ac39f2f4-bf80-415d-a460-de56fc6fd668",
    "Plaintext": "lneXCfzUy/tZkYOj7P7zZ51Om+PRdo56tEAE/gzyZUk=",
    "EncryptionAlgorithm": "SYMMETRIC_DEFAULT",
    "KeyMaterialId": "321c6aa24d88273bf1f355d9fe80ecb3b6725c5e1e66f981b843a473ddfaeac9"
}

# Extract the decrypted plaintext ephemeral key from the Decrypt response
# and compare it with the original key
$ ACTUAL_PLAINTEXT="$(echo $DECRYPTION_RESULT | jq -r .Plaintext)"
$ [[ "$ACTUAL_PLAINTEXT" = "$ORIGINAL_PLAINTEXT" ]] && echo "OK"
OK
```