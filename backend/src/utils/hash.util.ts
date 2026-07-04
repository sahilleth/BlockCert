import crypto from "crypto";
import fs from "fs";
import { ethers } from "ethers";

export function computeSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function computeSha256Buffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/** Convert a 64-char SHA-256 hex digest to bytes32 for the smart contract. */
export function hexToBytes32(hexHash: string): string {
  const clean = hexHash.startsWith("0x") ? hexHash.slice(2) : hexHash;
  return "0x" + clean.padStart(64, "0");
}

/** Convert a UUID string to bytes32 (keccak256) — matches Hardhat test convention. */
export function uuidToBytes32(uuid: string): string {
  return ethers.id(uuid);
}
