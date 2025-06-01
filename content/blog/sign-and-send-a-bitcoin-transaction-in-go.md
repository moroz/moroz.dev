---
title: How to Sign and Send a Bitcoin Transaction in Go
slug: sign-and-send-a-bitcoin-transaction-in-go
date: 2025-06-01
---

In this post I'm going to show you how to send Bitcoin from one address to another in Go.

### Project Setup

Start by creating a new Go project:

```shell
cd ~/projects
mkdir bitcoin-transaction-go
cd bitcoin-transaction-go
go mod init github.com/moroz/bitcoin-transaction-go
```

We will be using two Go libraries: [`btcutil`](https://pkg.go.dev/github.com/btcsuite/btcd/btcutil), which is a part of a larger set of libraries for working with the Bitcoin protocol, and [`argon2`](https://pkg.go.dev/golang.org/x/crypto/argon2) for cryptographic key derivation.

Install these libraries:

```shell
go get -u github.com/btcsuite/btcd/btcutil golang.org/x/crypto/argon2
```

### Generating the Secret Key Base

Before we can send any money between addresses, we need to know what these two addresses are going to be. To this end, we need to generate two key pairs, from which we can then generate [Pay To Witness Public Key Hash](https://learnmeabitcoin.com/technical/script/p2wpkh/) (P2WPKH) addresses.
We will generate both key pairs from a shared secret using a key derivation function.

Start by generating a secret key base using [`openssl`](https://www.openssl.org/)[^1]:

```shell
$ openssl rand -base64 64 | tr -d '\n'
TlpqMzhzmJJ0/qUBJ1/EveyjNVdOeaKHFaE3oJf8oTlLd33qe05uQg7chnFWmRwju7ws/y+dU+ASIqsp2I+55A==
```

### Configuring the Secret in Go

Create a directory called `config`, and inside it, a file called `config.go`:

```go
package config

import "encoding/base64"

var SECRET_KEY_BASE, _ = base64.StdEncoding.DecodeString(
	"TlpqMzhzmJJ0/qUBJ1/EveyjNVdOeaKHFaE3oJf8oTlLd33qe05uQg7chnFWmRwju7ws/y+dU+ASIqsp2I+55A==")
```

### Deriving a Key Using Argon2

Create a file called `main.go` in the project's root directory. In this file, we can derive a key pair using [argon2.IDKey](https://pkg.go.dev/golang.org/x/crypto/argon2#IDKey):

```go
package main

import (
	"fmt"

	"github.com/moroz/bitcoin-transaction-go/config"
	"golang.org/x/crypto/argon2"
)

func main() {
	aliceKey := argon2.IDKey(config.SECRET_KEY_BASE, []byte("Alice's key"), 2, 46*1024, 1, 32)
	fmt.Printf("Alice's key: %X\n", aliceKey)
}
```

The `argon2.IDKey` function takes a base key (or password), a [salt](https://en.wikipedia.org/wiki/Salt_(cryptography)), followed by three parameters specific to this key derivation algorithm: `time`, `memory`, and `threads`. The final parameter specifies the desired length of the resulting key.

With these parameters, the program should derive the following 32-byte binary:

```
$ go run .                                                                                           
Alice's key: 42BB24B4A83D5A7CDE0FA8B8943AD79B2DE5B4403AFE4ED94C8331E71E82AE93
```

### Generating a Bitcoin Key Pair

Then, we can convert this binary to a key pair.
In this program, we will be generating keys and addresses for use in the [regression testing](https://developer.bitcoin.org/examples/testing.html) (Regtest) mode. This way, we can test our code against a real Bitcoin node without having to spend real coins.
If you want to work with Mainnet or Testnet instead, simply replace the global `netParams` variable with another value from the [`chaincfg`](https://pkg.go.dev/github.com/btcsuite/btcd/chaincfg) package.

```go
package main

import (
	"fmt"
	"log"

	"github.com/btcsuite/btcd/btcutil/hdkeychain"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/moroz/bitcoin-transaction-go/config"
	"golang.org/x/crypto/argon2"
)

var netParams = &chaincfg.RegressionNetParams

func main() {
	aliceKey := argon2.IDKey(config.SECRET_KEY_BASE, []byte("Alice's key"), 2, 46*1024, 1, 32)

	masterKey, err := hdkeychain.NewMaster(aliceKey, netParams)
	if err != nil {
		log.Fatal(err)
	}

	pubKey, err := masterKey.ECPubKey()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Alice's key: %X\n", pubKey.SerializeCompressed())
}
```

Now, instead of printing out Alice's seeds, the program will print out her public key, serialized to a "compressed" format.

```
$ go run .
Alice's key: 026F3C81631C73139B87F7A5C91DD0581138DB9859F46D241ACB5CA823670DCAE8
```

### Converting Public Keys to Bitcoin Addresses

With this public key, we can generate a "witness public key hash script", which we can then convert to a usable Bitcoin address:

```go
func main() {
    // ...

    // calculate RIPEMD160(SHA256(pubKey))
	witnessProgram := btcutil.Hash160(pubKey.SerializeCompressed())
	addr, err := btcutil.NewAddressWitnessPubKeyHash(witnessProgram, netParams)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Alice's address: %s\n", addr.EncodeAddress())
}
```

This this program should generate and print Alice's address, starting with `bcrt1q`, which is the expected prefix for SegWit addresses:

```
$ go run .
Alice's address: bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235
```

### Refactoring and Code Organization

The steps to generate a key for Bob would be exactly the same, but with different inputs.
Therefore, this is a good moment to commit the changes up to this point to version control and refactor the code a bit.

```go
package main

import (
	"fmt"
	"log"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/btcutil/hdkeychain"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/moroz/bitcoin-transaction-go/config"
	"golang.org/x/crypto/argon2"
)

var netParams = &chaincfg.RegressionNetParams

func deriveMaster(base []byte, salt string) (*hdkeychain.ExtendedKey, error) {
	seed := argon2.IDKey(base, []byte(salt), 2, 46*1024, 1, 32)
	return hdkeychain.NewMaster(seed, netParams)
}

func addressFromMaster(master *hdkeychain.ExtendedKey) (string, error) {
	pubKey, err := master.ECPubKey()
	if err != nil {
		return "", err
	}

	witnessProgram := btcutil.Hash160(pubKey.SerializeCompressed())
	addr, err := btcutil.NewAddressWitnessPubKeyHash(witnessProgram, netParams)
	if err != nil {
		return "", err
	}

	return addr.EncodeAddress(), nil
}

func main() {
	aliceKey, err := deriveMaster(config.SECRET_KEY_BASE, "Alice's key")
	if err != nil {
		log.Fatal(err)
	}

	aliceAddr, err := addressFromMaster(aliceKey)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Alice's address: %s\n", aliceAddr)
}
```

In this program, we split the logic for deriving key pairs and converting them into P2WPKH addresses into two functions.
Later on in the project, we are going to need Alice's private key to send a transaction to Bob.

[^1]: This command should come pre-installed on macOS, *BSD, and most linux distributions.
