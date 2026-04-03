'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.reddcoinTestnet =
  exports.reddcoin =
  exports.testnet =
  exports.regtest =
  exports.bitcoin =
    void 0;
/**
 * Represents the Bitcoin network configuration.
 */
exports.bitcoin = {
  /**
   * The message prefix used for signing Bitcoin messages.
   */
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  /**
   * The Bech32 prefix used for Bitcoin addresses.
   */
  bech32: 'bc',
  /**
   * The BIP32 key prefixes for Bitcoin.
   */
  bip32: {
    /**
     * The public key prefix for BIP32 extended public keys.
     */
    public: 0x0488b21e,
    /**
     * The private key prefix for BIP32 extended private keys.
     */
    private: 0x0488ade4,
  },
  /**
   * The prefix for Bitcoin public key hashes.
   */
  pubKeyHash: 0x00,
  /**
   * The prefix for Bitcoin script hashes.
   */
  scriptHash: 0x05,
  /**
   * The prefix for Bitcoin Wallet Import Format (WIF) private keys.
   */
  wif: 0x80,
};
/**
 * Represents the regtest network configuration.
 */
exports.regtest = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'bcrt',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};
/**
 * Represents the testnet network configuration.
 */
exports.testnet = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'tb',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};
/**
 * Represents the Reddcoin mainnet network configuration.
 */
exports.reddcoin = {
  messagePrefix: '\x19Reddcoin Signed Message:\n',
  bech32: 'rdd',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x3d,
  scriptHash: 0x05,
  wif: 0xbd,
};
/**
 * Represents the Reddcoin testnet network configuration.
 */
exports.reddcoinTestnet = {
  messagePrefix: '\x19Reddcoin Signed Message:\n',
  bech32: 'trdd',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};
