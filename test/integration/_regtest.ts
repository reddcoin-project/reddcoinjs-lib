import { RegtestUtils } from 'regtest-client';
import * as bitcoin from 'bitcoinjs-lib';
import { randomBytes, webcrypto } from 'crypto';
import { before } from 'mocha';

// Node 18 has no global WebCrypto in CommonJS, which ecpair's default rng needs
if (!globalThis.crypto) (globalThis as any).crypto = webcrypto;

const APIPASS = process.env.APIPASS || 'satoshi';
// reddcoin-project/regtest-server, e.g. via test/integration/docker-compose.yml
export const APIURL = process.env.APIURL || 'http://127.0.0.1:8080/1';

// regtest-client assumes Bitcoin regtest; use Reddcoin regtest addresses
class ReddcoinRegtestUtils extends RegtestUtils {
  constructor(opts: { APIPASS: string; APIURL: string }) {
    super(opts);
    this.network = bitcoin.networks.reddcoinRegtest;
  }

  randomAddress(): string {
    return bitcoin.payments.p2pkh({
      hash: randomBytes(20),
      network: bitcoin.networks.reddcoinRegtest,
    }).address!;
  }
}

export const regtestUtils = new ReddcoinRegtestUtils({ APIPASS, APIURL });

// Reddcoin transactions with version > 1 carry nTime, which Reddcoin Core
// (develop) rejects when zero, and it rejects version 1 in the PoS era; so
// integration tests build version 2+ transactions with nTime set.
export const nTime = (): number => Math.floor(Date.now() / 1000);

// Time of the chain tip. Proof of stake needs chain time to pass, so a chain
// mined quickly runs ahead of the wall clock: derive lock times from this.
export async function chainTime(): Promise<number> {
  const header = (await regtestUtils.dhttp({
    method: 'GET',
    url: APIURL + '/b/best/header',
  })) as string;
  return bitcoin.Block.fromHex(header).timestamp;
}

export function newPsbt(
  opts?: ConstructorParameters<typeof bitcoin.Psbt>[0],
): bitcoin.Psbt {
  return new bitcoin.Psbt(opts).setNTime(nTime());
}

export function newTransaction(): bitcoin.Transaction {
  const tx = new bitcoin.Transaction();
  tx.version = 2;
  tx.nTime = nTime();
  return tx;
}

// The server reports ready once its chain is bootstrapped with CSV, segwit
// and taproot active (reddcoind started with -vbparams)
before(async function () {
  this.timeout(120000);
  try {
    await regtestUtils.dhttp({ method: 'GET', url: APIURL + '/ready' });
  } catch (e) {
    throw new Error(
      `Reddcoin regtest server not ready at ${APIURL} (${(e as Error).message}). ` +
        'Start it with: npm run integration:up',
    );
  }
});
