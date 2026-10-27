import * as assert from 'assert';
import { describe, it } from 'mocha';
import {
  networks,
  address as baddress,
  Block,
  Transaction,
  payments,
  script as bscript,
} from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import * as tools from 'uint8array-tools';
import blockFixtures from './fixtures/reddcoin_blocks.json';

describe('Reddcoin', () => {
  describe('Network definitions', () => {
    it('reddcoin mainnet has correct pubKeyHash', () => {
      assert.strictEqual(networks.reddcoin.pubKeyHash, 0x3d);
    });

    it('reddcoin mainnet has correct scriptHash', () => {
      assert.strictEqual(networks.reddcoin.scriptHash, 0x05);
    });

    it('reddcoin mainnet has correct wif', () => {
      assert.strictEqual(networks.reddcoin.wif, 0xbd);
    });

    it('reddcoin mainnet has correct bech32 prefix', () => {
      assert.strictEqual(networks.reddcoin.bech32, 'rdd');
    });

    it('reddcoin mainnet has correct bip32 prefixes', () => {
      assert.strictEqual(networks.reddcoin.bip32.public, 0x0488b21e);
      assert.strictEqual(networks.reddcoin.bip32.private, 0x0488ade4);
    });

    it('reddcoin mainnet has correct message prefix', () => {
      assert.strictEqual(
        networks.reddcoin.messagePrefix,
        '\x19Reddcoin Signed Message:\n',
      );
    });

    it('reddcoin testnet has correct pubKeyHash', () => {
      assert.strictEqual(networks.reddcoinTestnet.pubKeyHash, 0x6f);
    });

    it('reddcoin testnet has correct wif', () => {
      assert.strictEqual(networks.reddcoinTestnet.wif, 0xef);
    });
  });

  describe('Address generation', () => {
    // Known public key (compressed, 33 bytes)
    const pubkey = Buffer.from(
      '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
      'hex',
    );

    it('generates a P2PKH address starting with R for mainnet', () => {
      const { address } = payments.p2pkh({
        pubkey,
        network: networks.reddcoin,
      });
      assert.ok(address);
      assert.ok(
        address!.startsWith('R'),
        `Expected address starting with R, got ${address}`,
      );
    });

    it('generates a P2PKH address starting with m or n for testnet', () => {
      const { address } = payments.p2pkh({
        pubkey,
        network: networks.reddcoinTestnet,
      });
      assert.ok(address);
      assert.ok(
        address!.startsWith('m') || address!.startsWith('n'),
        `Expected address starting with m or n, got ${address}`,
      );
    });

    it('decodes a Reddcoin mainnet address correctly', () => {
      const { address } = payments.p2pkh({
        pubkey,
        network: networks.reddcoin,
      });
      const decoded = baddress.fromBase58Check(address!);
      assert.strictEqual(decoded.version, 0x3d);
    });
  });

  describe('Transaction nTime', () => {
    it('new transaction has nTime defaulting to 0', () => {
      const tx = new Transaction();
      assert.strictEqual(tx.nTime, 0);
    });

    it('nTime is preserved through clone', () => {
      const tx = new Transaction();
      tx.nTime = 1700000000;
      const cloned = tx.clone();
      assert.strictEqual(cloned.nTime, 1700000000);
    });

    it('nTime adds 4 bytes to byteLength for version > 1', () => {
      const tx1 = new Transaction();
      tx1.version = 1;
      const len1 = tx1.byteLength();

      const tx2 = new Transaction();
      tx2.version = 2;
      const len2 = tx2.byteLength();

      assert.strictEqual(len2, len1 + 4);
    });

    it('serializes and deserializes nTime correctly (version > 1)', () => {
      const tx = new Transaction();
      tx.version = 2;
      tx.nTime = 1700000000;

      const hex = tx.toHex();
      const tx2 = Transaction.fromHex(hex);

      assert.strictEqual(tx2.version, 2);
      assert.strictEqual(tx2.nTime, 1700000000);
    });

    it('round-trips serialize -> deserialize -> serialize', () => {
      const tx = new Transaction();
      tx.version = 2;
      tx.nTime = 1700000000;
      tx.locktime = 500000;

      // Add a dummy input
      tx.addInput(
        Buffer.from(
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          'hex',
        ),
        0,
      );
      // Add a dummy output
      tx.addOutput(
        Buffer.from(
          '76a914000000000000000000000000000000000000000088ac',
          'hex',
        ),
        50000n,
      );

      const hex1 = tx.toHex();
      const tx2 = Transaction.fromHex(hex1);
      const hex2 = tx2.toHex();

      assert.strictEqual(hex1, hex2);
    });

    it('nTime is not serialized for version 1 transactions', () => {
      const tx = new Transaction();
      tx.version = 1;
      tx.nTime = 0;

      tx.addInput(
        Buffer.from(
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          'hex',
        ),
        0,
      );
      tx.addOutput(
        Buffer.from(
          '76a914000000000000000000000000000000000000000088ac',
          'hex',
        ),
        50000n,
      );

      const hex = tx.toHex();
      const tx2 = Transaction.fromHex(hex);

      // Version 1 should not read nTime, so it stays 0
      assert.strictEqual(tx2.version, 1);
      assert.strictEqual(tx2.nTime, 0);
    });
  });

  describe('Block signature', () => {
    const [powFixture, posvFixture] = blockFixtures.valid;

    blockFixtures.valid.forEach(f => {
      it('parses and round-trips mainnet ' + f.description, () => {
        const block = Block.fromHex(f.hex);
        assert.strictEqual(block.getId(), f.id);
        assert.strictEqual(block.version, f.version);
        assert.strictEqual(block.transactions!.length, f.nTx);
        assert.strictEqual(block.byteLength(), f.size);
        assert.strictEqual(block.toHex(), f.hex);
        assert.strictEqual(block.checkTxRoots(), true);
      });
    });

    it('has no block signature for PoW blocks', () => {
      const block = Block.fromHex(powFixture.hex);
      assert.strictEqual(block.hasBlockSig(), false);
      assert.strictEqual(block.blockSig, undefined);
    });

    blockFixtures.valid.slice(1).forEach(f => {
      it('verifies the block signature of ' + f.description, () => {
        const block = Block.fromHex(f.hex);
        assert.strictEqual(block.hasBlockSig(), true);

        // Signed by the P2PK key of the coinstake's second output
        const coinstakeOut = block.transactions![1].outs[1];
        const pubkey = bscript.decompile(coinstakeOut.script)![0] as Uint8Array;
        // Block signatures are DER without a sighash byte; append one to decode
        const { signature } = bscript.signature.decode(
          tools.concat([block.blockSig!, Uint8Array.from([0x01])]),
        );
        assert.strictEqual(
          ecc.verify(block.getHash(), pubkey, signature),
          true,
        );
      });
    });

    it('throws on a PoSV block with the signature truncated', () => {
      const truncated = posvFixture.hex.slice(0, -2);
      assert.throws(() => Block.fromHex(truncated), /out of bounds/);
    });

    it('serializes an empty signature for an unsigned PoSV block', () => {
      const block = Block.fromHex(posvFixture.hex);
      block.blockSig = undefined;
      const hex = block.toHex();
      assert.strictEqual(hex.slice(-2), '00');
      assert.strictEqual(block.byteLength(), hex.length / 2);
      assert.deepStrictEqual(Block.fromHex(hex).blockSig, new Uint8Array(0));
    });

    it('excludes the block signature from the block hash', () => {
      const block = Block.fromHex(posvFixture.hex);
      block.blockSig = new Uint8Array(0);
      assert.strictEqual(block.getId(), posvFixture.id);
      assert.strictEqual(block.toHex(true).length, 160);
    });
  });
});
