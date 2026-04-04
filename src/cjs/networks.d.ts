/**
 * This module defines the network configurations for Reddcoin and Bitcoin variants, including message prefixes,
 * Bech32 address format, BIP32 key derivation prefixes, and other address-related configurations.
 * It supports Reddcoin mainnet/testnet and Bitcoin mainnet/testnet/regtest networks.
 *
 * @packageDocumentation
 */
export interface Network {
    messagePrefix: string;
    bech32: string;
    bip32: Bip32;
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
}
interface Bip32 {
    public: number;
    private: number;
}
/**
 * Represents the Bitcoin network configuration.
 */
export declare const bitcoin: Network;
/**
 * Represents the regtest network configuration.
 */
export declare const regtest: Network;
/**
 * Represents the testnet network configuration.
 */
export declare const testnet: Network;
/**
 * Represents the Reddcoin mainnet network configuration.
 */
export declare const reddcoin: Network;
/**
 * Represents the Reddcoin testnet network configuration.
 */
export declare const reddcoinTestnet: Network;
export {};
