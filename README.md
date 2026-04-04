# reddcoinjs-lib

[![Github CI](https://github.com/reddcoin-project/reddcoinjs-lib/actions/workflows/main_ci.yml/badge.svg)](https://github.com/reddcoin-project/reddcoinjs-lib/actions/workflows/main_ci.yml) [![NPM](https://img.shields.io/npm/v/reddcoinjs-lib.svg)](https://www.npmjs.org/package/reddcoinjs-lib) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A client-side Reddcoin JavaScript library for Node.js and browsers. Forked from [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) v7, adapted for the Reddcoin blockchain with Proof-of-Stake velocity (PoSV) support.

Written in TypeScript, with compiled JS committed for verification.

Released under the terms of the [MIT LICENSE](LICENSE).

## Should I use this in production?
If you are thinking of using the *master* branch of this library in production, **stop**.
Master is not stable; it is our development branch, and [only tagged releases may be classified as stable](https://github.com/reddcoin-project/reddcoinjs-lib/tags).

## Can I trust this code?
> Don't trust. Verify.

We recommend every user of this library and the [reddcoinjs](https://github.com/reddcoin-project/reddcoinjs) ecosystem audit and verify any underlying code for its validity and suitability,  including reviewing any and all of your project's dependencies.

Mistakes and bugs happen, but with your help in resolving and reporting [issues](https://github.com/reddcoin-project/reddcoinjs-lib/issues), together we can produce open source software that is:

- Easy to audit and verify,
- Tested, with test coverage >95%,
- Advanced and feature rich,
- Standardized, using [prettier](https://github.com/prettier/prettier) and Node `Buffer`'s throughout, and
- Friendly, with a strong and helpful community, ready to answer questions.

## Documentation
Visit our [documentation](https://reddcoin-project.github.io/reddcoinjs-lib/) to explore the available resources. We're continually enhancing our documentation with additional features for an enriched experience. If you need further guidance beyond what our [examples](#examples) offer, don't hesitate to  [ask for help](https://github.com/reddcoin-project/reddcoinjs-lib/issues/new). We're here to assist you.

You can find a [Web UI](https://reddcoin.com/apps/reddcoinjs-ui/index.html) that covers most of the `psbt.ts`, `transaction.ts` and `p2*.ts` APIs [here](https://bitcoincore.tech/apps/bitcoinjs-ui/index.html).
If you need guidance beyond what the [quick start](#quick-start) examples offer, don't hesitate to [open an issue](https://github.com/reddcoin-project/reddcoinjs-lib/issues/new).

## Reddcoin-specific features

- **nTime field** in transactions (version > 1) for PoSV consensus
- **Reddcoin network definitions** with correct address prefixes (`R` for mainnet P2PKH)
- **PSBT support** with nTime handling
- **Signing hash** correctly excludes nTime per Reddcoin Core consensus rules

### Transaction format (version > 1)

Reddcoin PoSV transactions include a 4-byte `nTime` timestamp after `nLockTime`:

```
[nVersion: 4] [vin] [vout] [nLockTime: 4] [nTime: 4]
```

The `nTime` field is included in the transaction hash (txid) but excluded from the signing hash, matching Reddcoin Core behaviour.

## Installation

```bash
npm install reddcoinjs-lib
# optionally, install a key derivation library as well
npm install ecpair bip32
```

## Quick start

```typescript
import { networks, payments } from 'reddcoinjs-lib';

// Generate a Reddcoin P2PKH address from a public key
const { address } = payments.p2pkh({
  pubkey: publicKeyBuffer,
  network: networks.reddcoin,
});
// address starts with 'R'
```

### Building a transaction with PSBT

```typescript
import { Psbt, networks } from 'reddcoinjs-lib';

const psbt = new Psbt({ network: networks.reddcoin });
psbt.addInput({
  hash: '<previous tx hash>',
  index: 0,
  nonWitnessUtxo: Buffer.from('<raw tx hex>', 'hex'),
});
psbt.addOutput({
  address: 'R...',
  value: 50000n,
});
psbt.nTime = Math.floor(Date.now() / 1000);
psbt.signInput(0, keyPair);
psbt.finalizeAllInputs();

const tx = psbt.extractTransaction();
console.log(tx.toHex());
```

## Networks

| Network | pubKeyHash | scriptHash | WIF | Bech32 |
|---------|-----------|-----------|-----|--------|
| Reddcoin mainnet | `0x3d` (R) | `0x05` | `0xbd` | `rdd` |
| Reddcoin testnet | `0x6f` (m/n) | `0xc4` | `0xef` | `trdd` |

## Usage

### Browser

The recommended method of using `reddcoinjs-lib` in your browser is through a bundler like [browserify](http://browserify.org/) or a modern build tool:

```sh
npm install reddcoinjs-lib browserify
npx browserify --standalone reddcoin -o reddcoinjs-lib.js <<< "module.exports = require('reddcoinjs-lib');"
```

### TypeScript

Type declarations are included. Normal installation should include all needed type information.

### ECC library

This library uses a pluggable ECC interface. You must call `initEccLib()` with a secp256k1 implementation before using Taproot or signing features:

```typescript
import { initEccLib } from 'reddcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

initEccLib(ecc);
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

### Running the test suite

```bash
npm test
npm run coverage
```

## Upstream

This library is based on [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) v7.0.1. The upstream complementary libraries (BIP32, BIP39, BIP38, ecpair, etc.) are compatible.

## LICENSE [MIT](LICENSE)
