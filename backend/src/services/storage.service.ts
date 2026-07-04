import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";

export interface StorageResult {
  filePath: string;
  storageType: "LOCAL" | "IPFS";
  ipfsCid?: string;
}

export interface StorageProvider {
  store(localPath: string, fileName: string): Promise<StorageResult>;
  retrieve(identifier: string): Promise<Buffer>;
}

class LocalStorageProvider implements StorageProvider {
  async store(localPath: string, _fileName: string): Promise<StorageResult> {
    return {
      filePath: localPath,
      storageType: "LOCAL",
    };
  }

  async retrieve(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }
}

class IpfsStorageProvider implements StorageProvider {
  async store(localPath: string, fileName: string): Promise<StorageResult> {
    // Placeholder for future IPFS integration (Pinata, web3.storage, etc.)
    if (!env.IPFS_API_URL) {
      throw new Error("IPFS is not configured. Set IPFS_API_URL and credentials.");
    }

    const buffer = await fs.readFile(localPath);
    // TODO: Upload to IPFS and return CID
    console.warn("[IPFS] Not yet implemented — falling back to local path reference");
    return {
      filePath: localPath,
      storageType: "IPFS",
      ipfsCid: undefined,
    };
  }

  async retrieve(cid: string): Promise<Buffer> {
    const gateway = env.IPFS_GATEWAY_URL ?? "https://ipfs.io/ipfs/";
    const response = await fetch(`${gateway}${cid}`);
    if (!response.ok) throw new Error("Failed to retrieve from IPFS");
    return Buffer.from(await response.arrayBuffer());
  }
}

export function getStorageProvider(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case "ipfs":
      return new IpfsStorageProvider();
    case "local":
    default:
      return new LocalStorageProvider();
  }
}
