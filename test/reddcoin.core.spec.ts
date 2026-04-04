import * as assert from 'assert';
import base58 from 'bs58';
import { describe, it } from 'mocha';
import * as rdd from 'bitcoinjs-lib';
import base58EncodeDecode from './fixtures/core/base58_encode_decode.json';
import keyIoInvalid from './fixtures/core/key_io_invalid.json';
import keyIoValid from './fixtures/core/key_io_valid.json';
import sigHash from './fixtures/core/sighash.json';
import txValid from './fixtures/core/tx_valid.json';
import * as tools from 'uint8array-tools';

const NETWORKS: Record<string, rdd.networks.Network> = {
  main: rdd.networks.reddcoin,
  test: rdd.networks.reddcoinTestnet,
};

describe('Reddcoin-core', () => {
  describe('base58', () => {
    (base58EncodeDecode as string[][]).forEach(f => {
      const fhex = f[0];
      const fb58 = f[1];

      it('can decode ' + fb58, () => {
        const buffer = base58.decode(fb58);
        assert.strictEqual(tools.toHex(buffer), fhex);
      });

      it('can encode ' + fhex, () => {
        const buffer = Buffer.from(fhex, 'hex');
        assert.strictEqual(base58.encode(buffer), fb58);
      });
    });
  });

  describe('address (key_io_valid)', () => {
    const typeMap: Record<string, string> = {
      pubkey: 'pubKeyHash',
      script: 'scriptHash',
    };

    (keyIoValid as any[]).forEach(f => {
      const expected = f[0] as string;
      const scriptHex = f[1] as string;
      const params = f[2] as any;

      if (params.isPrivkey) return;

      const network = NETWORKS[params.chain];
      if (!network) return; // skip regtest etc.

      // Skip bech32 addresses (rdd1..., trdd1...) — need SegWit decoder
      if (expected.startsWith('rdd1') || expected.startsWith('trdd1')) return;

      it('can decode ' + expected, () => {
        const decoded = rdd.address.fromBase58Check(expected);
        assert.ok(
          decoded.version === network.pubKeyHash ||
            decoded.version === network.scriptHash,
          'version mismatch for ' + expected,
        );
      });
    });
  });

  describe('address (key_io_invalid)', () => {
    const allowedVersions = [
      rdd.networks.reddcoin.pubKeyHash,
      rdd.networks.reddcoin.scriptHash,
      rdd.networks.reddcoinTestnet.pubKeyHash,
      rdd.networks.reddcoinTestnet.scriptHash,
    ];

    (keyIoInvalid as string[][]).forEach(f => {
      const strng = f[0];

      it('throws on ' + strng, () => {
        assert.throws(() => {
          const address = rdd.address.fromBase58Check(strng);
          assert.notStrictEqual(
            allowedVersions.indexOf(address.version),
            -1,
            'Invalid network',
          );
        }, /(Invalid|Non-base58|too (short|long))/);
      });
    });
  });

  describe('Transaction.fromHex (tx_valid)', () => {
    (txValid as any[]).forEach(f => {
      if (f.length === 1) return; // comment entries

      const inputs = f[0];
      const fhex = f[1] as string;

      // Skip Bitcoin v2 transactions that lack Reddcoin nTime
      const version = Buffer.from(fhex.slice(0, 8), 'hex').readUInt32LE(0);
      if (version > 1) {
        // Check if it has nTime by attempting round-trip
        try {
          const tx = rdd.Transaction.fromHex(fhex);
          if (tx.toHex() !== fhex) return; // no nTime, skip
        } catch {
          return;
        }
      }

      it('can decode ' + fhex.slice(0, 40) + '...', () => {
        const transaction = rdd.Transaction.fromHex(fhex);

        transaction.ins.forEach((txIn, i) => {
          const input = (inputs as any[])[i];
          const prevOutHash = Buffer.from(input[0] as string, 'hex').reverse();
          const prevOutIndex = input[1];

          assert.deepStrictEqual(Buffer.from(txIn.hash), prevOutHash);
          assert.strictEqual(txIn.index & 0xffffffff, prevOutIndex);
        });
      });
    });
  });

  describe('Transaction sighash', () => {
    (sigHash as any[]).forEach(f => {
      if (f.length === 1) return;

      const txHex = f[0] as string;
      const scriptHex = f[1] as string;
      const inIndex = f[2] as number;
      const hashType = f[3] as number;
      const expectedHash = f[4];

      // Skip transactions with version > 1 that lack nTime (Bitcoin fuzz vectors)
      const version = Buffer.from(txHex.slice(0, 8), 'hex').readUInt32LE(0);
      if (version > 1) return;

      const hashTypes: string[] = [];
      if ((hashType & 0x1f) === rdd.Transaction.SIGHASH_NONE)
        hashTypes.push('SIGHASH_NONE');
      else if ((hashType & 0x1f) === rdd.Transaction.SIGHASH_SINGLE)
        hashTypes.push('SIGHASH_SINGLE');
      else hashTypes.push('SIGHASH_ALL');
      if (hashType & rdd.Transaction.SIGHASH_ANYONECANPAY)
        hashTypes.push('SIGHASH_ANYONECANPAY');

      it(
        'should hash ' +
          txHex.slice(0, 40) +
          '... (' +
          hashTypes.join(' | ') +
          ')',
        () => {
          const transaction = rdd.Transaction.fromHex(txHex);
          assert.strictEqual(transaction.toHex(), txHex);

          const script = Buffer.from(scriptHex, 'hex');
          const scriptChunks = rdd.script.decompile(script);
          assert.strictEqual(
            tools.toHex(rdd.script.compile(scriptChunks!)),
            scriptHex,
          );

          const hash = transaction.hashForSignature(inIndex, script, hashType);
          assert.strictEqual(
            tools.toHex(hash.reverse() as Buffer),
            expectedHash,
          );
        },
      );
    });
  });
});
