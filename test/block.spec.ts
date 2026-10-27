import * as assert from 'assert';
import { beforeEach, describe, it } from 'mocha';
import { Block } from 'bitcoinjs-lib';
import * as tools from 'uint8array-tools';

import fixtures from './fixtures/block.json';

// Bitcoin full blocks with version > 2 lack the Reddcoin block signature;
// append an empty one (1 byte, non-witness) so they parse as Reddcoin blocks
const rddValid = fixtures.valid.map((f: any) =>
  f.version > 2 && f.hex.length > 160
    ? {
        ...f,
        hex: f.hex + '00',
        size: f.size + 1,
        strippedSize: f.strippedSize + 1,
        weight: f.weight + 4,
      }
    : f,
);

describe('Block', () => {
  describe('version', () => {
    it('should be interpreted as an int32le', () => {
      const blockHex =
        'ffffffff000000000000000000000000000000000000000000000000000000000000' +
        '00004141414141414141414141414141414141414141414141414141414141414141' +
        '01000000020000000300000000';
      const block = Block.fromHex(blockHex);
      assert.strictEqual(-1, block.version);
      assert.strictEqual(1, block.timestamp);
    });
  });

  describe('calculateTarget', () => {
    fixtures.targets.forEach(f => {
      it('returns ' + f.expected + ' for 0x' + f.bits, () => {
        const bits = parseInt(f.bits, 16);

        assert.strictEqual(
          tools.toHex(Block.calculateTarget(bits)),
          f.expected,
        );
      });
    });
  });

  describe('fromBuffer/fromHex', () => {
    rddValid.forEach(f => {
      it('imports ' + f.description, () => {
        const block = Block.fromHex(f.hex);

        assert.strictEqual(block.version, f.version);
        assert.strictEqual(tools.toHex(block.prevHash!), f.prevHash);
        assert.strictEqual(tools.toHex(block.merkleRoot!), f.merkleRoot);
        if (block.witnessCommit) {
          assert.strictEqual(tools.toHex(block.witnessCommit), f.witnessCommit);
        }
        assert.strictEqual(block.timestamp, f.timestamp);
        assert.strictEqual(block.bits, f.bits);
        assert.strictEqual(block.nonce, f.nonce);
        assert.strictEqual(!block.transactions, f.hex.length === 160);
        if (f.size && f.strippedSize && f.weight) {
          assert.strictEqual(block.byteLength(false, true), f.size);
          assert.strictEqual(block.byteLength(false, false), f.strippedSize);
          assert.strictEqual(block.weight(), f.weight);
        }
      });
    });

    fixtures.invalid.forEach(f => {
      it('throws on ' + f.exception, () => {
        assert.throws(() => {
          Block.fromHex(f.hex);
        }, new RegExp(f.exception));
      });
    });
  });

  describe('toBuffer/toHex', () => {
    rddValid.forEach(f => {
      let block: Block;

      beforeEach(() => {
        block = Block.fromHex(f.hex);
      });

      it('exports ' + f.description, () => {
        assert.strictEqual(block.toHex(true), f.hex.slice(0, 160));
        assert.strictEqual(block.toHex(), f.hex);
      });
    });
  });

  describe('getHash/getId', () => {
    rddValid.forEach(f => {
      let block: Block;

      beforeEach(() => {
        block = Block.fromHex(f.hex);
      });

      it('returns ' + f.id + ' for ' + f.description, () => {
        assert.strictEqual(tools.toHex(block.getHash()), f.hash);
        assert.strictEqual(block.getId(), f.id);
      });
    });
  });

  describe('getUTCDate', () => {
    rddValid.forEach(f => {
      let block: Block;

      beforeEach(() => {
        block = Block.fromHex(f.hex);
      });

      it('returns UTC date of ' + f.id, () => {
        const utcDate = block.getUTCDate().getTime();

        assert.strictEqual(utcDate, f.timestamp * 1e3);
      });
    });
  });

  describe('calculateMerkleRoot', () => {
    it('should throw on zero-length transaction array', () => {
      assert.throws(() => {
        Block.calculateMerkleRoot([]);
      }, /Cannot compute merkle root for zero transactions/);
    });

    rddValid.forEach(f => {
      if (f.hex.length === 160) return;

      let block: Block;

      beforeEach(() => {
        block = Block.fromHex(f.hex);
      });

      it('returns ' + f.merkleRoot + ' for ' + f.id, () => {
        assert.strictEqual(
          tools.toHex(Block.calculateMerkleRoot(block.transactions!)),
          f.merkleRoot,
        );
      });

      if (f.witnessCommit) {
        it('returns witness commit ' + f.witnessCommit + ' for ' + f.id, () => {
          assert.strictEqual(
            tools.toHex(Block.calculateMerkleRoot(block.transactions!, true)),
            f.witnessCommit,
          );
        });
      }
    });
  });

  describe('checkTxRoots', () => {
    rddValid.forEach(f => {
      if (f.hex.length === 160) return;

      let block: Block;

      beforeEach(() => {
        block = Block.fromHex(f.hex);
      });

      it('returns ' + f.valid + ' for ' + f.id, () => {
        assert.strictEqual(block.checkTxRoots(), true);
      });
    });
  });

  // Bitcoin fixtures are mined against sha256d; Reddcoin uses scrypt (and
  // PoSV blocks have no proof of work). Covered in reddcoin.spec.ts instead.
  describe.skip('checkProofOfWork', () => {
    rddValid.forEach(f => {
      let block: Block;

      beforeEach(() => {
        block = Block.fromHex(f.hex);
      });

      it('returns ' + f.valid + ' for ' + f.id, () => {
        assert.strictEqual(block.checkProofOfWork(), f.valid);
      });
    });
  });
});
