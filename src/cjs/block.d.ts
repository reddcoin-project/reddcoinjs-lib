import { Transaction } from './transaction.js';
export declare class Block {
    static fromBuffer(buffer: Uint8Array): Block;
    static fromHex(hex: string): Block;
    static calculateTarget(bits: number): Uint8Array;
    static calculateMerkleRoot(transactions: Transaction[], forWitness?: boolean, mutated?: {
        value: boolean;
    }): Uint8Array;
    version: number;
    prevHash?: Uint8Array;
    merkleRoot?: Uint8Array;
    timestamp: number;
    witnessCommit?: Uint8Array;
    bits: number;
    nonce: number;
    transactions?: Transaction[];
    blockSig?: Uint8Array;
    /** True if this block's serialization includes a block signature (PoSV). */
    hasBlockSig(): boolean;
    getWitnessCommit(): Uint8Array | null;
    hasWitnessCommit(): boolean;
    hasWitness(): boolean;
    weight(): number;
    byteLength(headersOnly?: boolean, allowWitness?: boolean): number;
    getHash(): Uint8Array;
    getId(): string;
    getUTCDate(): Date;
    toBuffer(headersOnly?: boolean): Uint8Array;
    toHex(headersOnly?: boolean): string;
    checkTxRoots(): boolean;
    /**
     * Returns the scrypt proof-of-work hash of the header. Unlike getHash()
     * (sha256d, the block id), this is what PoW blocks are mined against.
     */
    getPoWHash(): Uint8Array;
    /**
     * Checks the scrypt hash of a PoW block against a positive, nonzero target
     * that fits in 256 bits. PoSV blocks have no proof of work, so this throws
     * for them. Callers must also enforce the network's target limit and
     * expected difficulty.
     */
    checkProofOfWork(): boolean;
    private __checkMerkleRoot;
    private __checkWitnessCommit;
}
