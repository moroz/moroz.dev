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

This is a good moment to commit the changes to Git and refactor the code a bit.

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

func addressFromMaster(master *hdkeychain.ExtendedKey) (btcutil.Address, error) {
	pubKey, err := master.ECPubKey()
	if err != nil {
		return nil, err
	}

	witnessProgram := btcutil.Hash160(pubKey.SerializeCompressed())
	return btcutil.NewAddressWitnessPubKeyHash(witnessProgram, netParams)
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

This way, we split the logic for deriving key pairs and converting them into P2WPKH addresses into two functions.
Later on in the project, we are going to need Alice's private key to send a transaction to Bob.

### Derive keys and addresses for Bob

The steps to generate a key for Bob are exactly the same be exactly the same as for Alice, just with a different salt:

```go
func main() {
    // ...

	bobKey, err := deriveMaster(config.SECRET_KEY_BASE, "Bob's key")
	if err != nil {
		log.Fatal(err)
	}

	bobAddr, err := addressFromMaster(bobKey)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Bob's address: %s\n", bobAddr)
}
```

The program should now print these addresses:

```
$ go run .
Alice's address: bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235
Bob's address: bcrt1qsltjpv4zgzsed00tg32rvpvakuev0fnf8ev3rg
```

### Setting up a local Bitcoin node

Now, it's time to set up a Bitcoin node. We can do so using [Docker](https://www.docker.com/).
If you need to get this to work on a platform that doesn't support Docker, such as FreeBSD, you will need to compile Bitcoin Core from source.

Ensure you have Docker installed. In the root directory of the project, create a file called `docker-compose.yml`:

```yaml
services:
  bitcoin:
    image: bitcoin/bitcoin:29.0
    ports:
      - "18443:18443"
    command: |
      -printtoconsole
      -regtest=1
      -server=1
      -rpcbind=0.0.0.0
      -rpcallowip=0.0.0.0/0
      -rpcuser="username"
      -rpcpassword="password"
    volumes:
      - "bitcoin:/home/bitcoin/.bitcoin"

volumes:
  bitcoin: {}
```

This configuration will set up a container running a local Bitcoin node in Regtest mode. The `command` property of this file contains various options for the Bitcoin server, specifying which IP address blocks may connect to the node, as well as the username and password we will use when connecting to the node over its [JSON API](https://developer.bitcoin.org/reference/rpc/index.html).

### Mining the first block

Next, we can use the `bitcoin-cli` command to interact with our Bitcoin node.
The easiest way to install it on macOS and Linux is using [Homebrew](https://brew.sh/):

```shell
brew install bitcoin
```

Mind you, what this means in practice is that we're going to end up with two copies of the Bitcoin Core software suite: One running inside the Docker container, and one installed with Homebrew.

Create a configuration file at `~/.bitcoin/bitcoin.conf`, so that we can connect to the node without specifying username and password each time:

```shell
mkdir -p ~/.bitcoin
cat > ~/.bitcoin/bitcoin.conf <<-EOF
regtest=1
rpcuser=username
rpcpassword=password
EOF
```

Let's run a simple command to ensure we can connect to the server:

```shell
$ bitcoin-cli getblockchaininfo
{
  "chain": "regtest",
  "blocks": 0,
  "headers": 0,
  "bestblockhash": "0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206",
  "bits": "207fffff",
  "target": "7fffff0000000000000000000000000000000000000000000000000000000000",
  "difficulty": 4.656542373906925e-10,
  "time": 1296688602,
  "mediantime": 1296688602,
  "verificationprogress": 1,
  "initialblockdownload": true,
  "chainwork": "0000000000000000000000000000000000000000000000000000000000000002",
  "size_on_disk": 293,
  "pruned": false,
  "warnings": [
  ]
}
```

This means that the node is up and running, but there aren't any blocks or coins in circulation.
Let us generate some money for Alice:

```shell
# Mine 1 block and send the reward to Alice's address, as calculated by our program
$ bitcoin-cli generatetoaddress 1 bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235
[
  "38d8dc6226ae9226bea5c7cc97a982b03fa6f00259640c9591a163a53b526f5e"
]
```

### Create a wallet

Generating a block will create 50 BTC and deposit it at Alice's address.
However, we currently have no way to verify that it arrived:

```shell
$ bitcoin-cli listtransactions                                                
error code: -18
error message:
No wallet is loaded. Load a wallet using loadwallet or create a new one with createwallet. (Note: A default wallet is no longer automatically created)
```

Let's create a wallet:

```shell
$ bitcoin-cli createwallet "watchonly" true true "" false true true
{
  "name": "watchonly",
  "warnings": [
    "Empty string given as passphrase, wallet will not be encrypted."
  ]
}
```

Wow, that's a lot of positional arguments! Let me break it down for you:

1. `wallet_name="watchonly"`. The name of the wallet.
2. `disable_private_keys=true`. We will not be storing the private keys for any of the addresses in this wallet.
3. `blank=true`. Do not generate a default address.
4. `passphrase=""`. We do not really need to encrypt the wallet as it is not storing any private keys.
5. `avoid_reuse=false`. Irrelevant for our use case.
6. `descriptors=true`. We need this to work with SegWit addresses.
7. `load_on_startup=true`. This effectively sets this wallet as the default wallet for the node.

### Import an address into the wallet

Now that we have a wallet, we can finally import an address, right? Right?...

```
$ bitcoin-cli importaddress bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235                                  
error code: -4
error message:
Only legacy wallets are supported by this command
```

Oops, this is an old command that only supports legacy addresses. Surely, we can try to import a descriptor, then?

```shell
$ address="bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235"
$ payload="[{\"desc\":\"addr($address)\",\"label\":\"$address\",\"timestamp\":\"now\"}]"
$ bitcoin-cli importdescriptors $payload
[
  {
    "success": false,
    "error": {
      "code": -5,
      "message": "Missing checksum"
    }
  }
]
```

Oh, no! Now we need to calculate a checksum for this descriptor!
Luckily, we don't need to write the code ourselves, Bitcoin Core has our backs:

```shell
$ address="bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235"
$ bitcoin-cli getdescriptorinfo "addr($address)"
{
  "descriptor": "addr(bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235)#cycpm2nf",
  "checksum": "cycpm2nf",
  "isrange": false,
  "issolvable": false,
  "hasprivatekeys": false
}
```

With this descriptor, we can finally import the address into our wallet.

<strong>Note: you may need to install `jq` using Apt or Homebrew.</strong>

```shell
$ address="bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235"
$ descriptor="$(bitcoin-cli getdescriptorinfo "addr($address)" | jq -r .descriptor)"
$ payload="[{\"desc\":\"$descriptor\",\"label\":\"$address\",\"timestamp\":\"now\"}]"
$ bitcoin-cli importdescriptors $payload                                            
[
  {
    "success": true
  }
]
```

### Fetching balance

The `listunspent` command returns the unspent transaction outputs in your wallet.
At this point, however, even though we have received a 50 BTC reward, the `listunspent` command does not return any transactions:

```
$ bitcoin-cli listunspent
[
]
```

A look at the transaction history gives us a hint as to the reason:

```json
$ bitcoin-cli listtransactions
[
  {
    "address": "bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235",
    "parent_descs": [
      "addr(bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235)#cycpm2nf"
    ],
    "category": "immature",
    "amount": 50.00000000,
    "label": "bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235",
    "vout": 0,
    "abandoned": false,
    "confirmations": 1,
    "generated": true,
    "blockhash": "38d8dc6226ae9226bea5c7cc97a982b03fa6f00259640c9591a163a53b526f5e",
    "blockheight": 1,
    "blockindex": 0,
    "blocktime": 1748766660,
    "txid": "7fe00dc35e2e9d0f03d7ba3cbc19962ce37bb7c124dc744321eb706487faca4a",
    "wtxid": "5fc67692510bef557ea0ab0504cafdcb9b2e0a9de9e991265688e63c83462dcf",
    "walletconflicts": [
    ],
    "mempoolconflicts": [
    ],
    "time": 1748766660,
    "timereceived": 1748768359,
    "bip125-replaceable": "no"
  }
]
```

The `"category": "immature"` line indicates that the transaction cannot currently be spent because it is _immature_. That is an issue that's only going to happen with _coinbase_ transactions, i. e. coins that were mined.
Unlike coins that you may have received elsewhere, _coinbase_ transactions can only be spent once they have at least a 100 confirmations. In other words, at least 100 blocks must be mined on top of this block until we can finally spend these coins!

Luckily, in regression testing mode, this can be achieved very easily with this command:

```
$ bitcoin-cli generatetoaddress 100 "bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235"
[
  // ... 100 block hashes ...
]
```

Now, we should be able to spend the 50 BTC that were generated in the first block:

```json
$ bitcoin-cli listunspent
[
  {
    "txid": "7fe00dc35e2e9d0f03d7ba3cbc19962ce37bb7c124dc744321eb706487faca4a",
    "vout": 0,
    "address": "bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235",
    "label": "bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235",
    "scriptPubKey": "00149154b23b4f6ebbade97c9b5ba4651e962618489b",
    "amount": 50.00000000,
    "confirmations": 101,
    "spendable": true,
    "solvable": false,
    "parent_descs": [
      "addr(bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235)#cycpm2nf"
    ],
    "safe": true
  }
]
```

### Building a raw transaction in Go

Now that we have 50 BTC to spend at Alice's address, we can start building a _raw transaction_ in Go.

Raw transactions are far from the easiest way to transfer Bitcoin, but they give us the most flexibility.
Using raw transactions, we never need to expose the private key for Alice's address to the server &mdash; instead, we sign the transaction in our Go application, and rely on our node to broadcast the raw transaction to the network.

In the Go code, we're going to need a way to fetch the exact information about unspent transaction outputs.
We can do this using the [`rpcclient` package](https://pkg.go.dev/github.com/btcsuite/btcd/rpcclient), a part of `btcsuite`.

First, install `rpcclient`:

```
go get -u github.com/btcsuite/btcd/rpcclient
```

Then, we can configure the client and use it to query the API for any unspent transaction outputs associated with Alice's address:

```go
func main() {
    // ... generate keys and addresses
    
	client, err := rpcclient.New(&rpcclient.ConnConfig{
		Host:         "127.0.0.1:18443",
		User:         "username",
		Pass:         "password",
		DisableTLS:   true,
		HTTPPostMode: true,
	}, nil)
	if err != nil {
		log.Fatal(err)
	}

	unspent, err := client.ListUnspentMinMaxAddresses(1, 1e7-1, []btcutil.Address{aliceAddr})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("%#v\n", unspent)
}
```

```
$ go run .
// ... Alice and Bob's addresses omitted for brevity
[]btcjson.ListUnspentResult{btcjson.ListUnspentResult{TxID:"7fe00dc35e2e9d0f03d7ba3cbc19962ce37bb7c124dc744321eb706487faca4a", Vout:0x0, Address:"bcrt1qj92tyw60d6a6m6tundd6geg7jcnpsjym58y235", Account:"", ScriptPubKey:"00149154b23b4f6ebbade97c9b5ba4651e962618489b", RedeemScript:"", Amount:50, Confirmations:101, Spendable:true}}

```

[^1]: This command should come pre-installed on macOS, *BSD, and most linux distributions.
