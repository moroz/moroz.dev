---
title: CodeShare
slug: codeshare
tagline: A private iOS application for storing and sharing Albert Heijn deposit vouchers within a household. The Go backend stores voucher contents only as end-to-end encrypted blobs.
started: "2026-10"
role: iOS application, backend, cryptographic protocol, deployment
status: Private; sideloaded
icon: ./icon.png
cover: ./screens.png
coverAlt: Five CodeShare screens in light and dark appearance, in English, Dutch and Traditional Chinese. Shown are the current-store card, the Bonuskaart, vouchers grouped by store and a voucher detail view with its barcode. All values are fictitious.
stack:
  - SwiftUI
  - GRDB / SQLite
  - CryptoKit
  - Secure Enclave
  - Go
  - Echo v5
  - PostgreSQL 18
  - sqlc
  - OpenAPI
  - Ansible
  - Caddy
  - FreeBSD
highlights:
  - End-to-end encryption
  - Local-first storage
  - Secure Enclave device keys
links:
  - label: Technical write-up (PDF, dark)
    href: https://github.com/moroz/codeshare-writeup/releases/download/v2026.10.04/codeshare.pdf
  - label: Technical write-up (PDF, light)
    href: https://github.com/moroz/codeshare-writeup/releases/download/v2026.10.04/codeshare-light.pdf
  - label: Typst source
    href: https://github.com/moroz/codeshare-writeup
order: 1
---

## What?

CodeShare is a private iOS application in which the members of a household store and share Albert Heijn deposit vouchers (_emballagebonnen_) and a Bonuskaart. Each phone holds a complete local copy of the household's vouchers; a Go backend relays them between phones as end-to-end encrypted records that it cannot read.

1. A voucher is scanned with the camera in a single pass, reading the barcode and the printed text. The parser extracts the branch number, address, amount and issue time; every field can be corrected before saving.
2. Vouchers are stored locally, so that the application functions without network access in the store.
3. A voucher is displayed as a regenerated EAN-13 barcode at maximum screen brightness.
4. Vouchers are grouped by store, with totals, and stores are ordered by distance. When the user is at a store, the vouchers redeemable there are listed first.
5. Vouchers are replicated between the phones of all household members.

The interface is localised in English, Dutch and Traditional Chinese.

## Why?

The Netherlands charges a deposit (_statiegeld_) on cans and plastic bottles. At Albert Heijn supermarkets, the reverse vending machine refunds the deposit as a paper voucher, which is redeemable only at the issuing branch and carries no expiry date. In a household with several members, vouchers accumulate, and the member holding a voucher is frequently not the member present at the issuing store.

Albert Heijn tills accept a barcode presented on a phone screen. The requirements therefore follow directly: capture each voucher once, replicate it to every phone in the household, group vouchers by store, and present the barcode at the till. Because the vouchers have monetary value, the server was not to be trusted with their contents.

## How?

### Architecture

The application is local-first. Each phone holds a complete SQLite database, accessed through GRDB. The server acts as a relay and backup: it stores, orders and returns encrypted records but cannot decrypt them.

The backend is a single static Go binary (Echo v5, pgx, sqlc) implementing an OpenAPI 3 contract through a generated strict server, on PostgreSQL 18. It runs behind Caddy on a shared FreeBSD host provisioned with Ansible. Synchronisation uses PostgreSQL transaction identifiers as the cursor rather than timestamps, which makes the cursor independent of clock skew between hosts.

The application is distributed by sideloading under a free Apple developer account. This excludes push notifications, Sign in with Apple and TestFlight. Authentication is therefore implemented with passkeys on a server-hosted page, and synchronisation is triggered by the client.

### Cryptography

Voucher contents (barcode payload, amount, label) are sealed with ChaCha20-Poly1305 under a household key that the server never receives. Metadata required for ordering and deduplication is stored in plaintext; a sealed copy is kept as well, and clients trust only the sealed copy.

- Each phone generates a device key pair in the Secure Enclave on NIST P-256. The private key is not exportable.
- The household key is distributed to a device as a wrap derived by ECDH and HKDF to that device's public key, authenticated with HMAC.
- Duplicate vouchers are detected with an HMAC-SHA256 blind index over the payload.
- The protocol supports key rotation: a new household key is wrapped to the current key holders, and every record is resealed under it.

### Observations

- Domain facts were taken from a real voucher before design began. The line order, time zone, Dutch month abbreviations and the absence of the amount from the barcode were all determined this way.
- Several defects were observable only on a physical device. The iOS Simulator has no brightness control, so a defect restoring brightness to zero could not appear there.
- A server change is constrained by the oldest client still in use, even when sideloaded builds expire after seven days.

The threat model, key hierarchy, synchronisation protocol, deployment and review findings are described in full in the technical write-up.
