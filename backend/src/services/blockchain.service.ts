import { ethers, Contract, JsonRpcProvider, Wallet, TransactionReceipt } from "ethers";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { blockchainConfig } from "../config/blockchain.config";
import { hexToBytes32, uuidToBytes32 } from "../utils/hash.util";
import { logger } from "../utils/logger";
import { withRetry, withTimeout } from "../utils/retry.util";
import { BlockchainError } from "../errors/AppError";

const ABI_PATH = join(__dirname, "../abi/CertificateRegistry.json");

function loadAbi(): ethers.InterfaceAbi {
  if (existsSync(ABI_PATH)) {
    const raw = JSON.parse(readFileSync(ABI_PATH, "utf-8"));
    return raw.abi ?? raw;
  }
  return [
    "function issueCertificate(bytes32 certificateId, bytes32 hash) external",
    "function getCertificate(bytes32 certificateId) external view returns (bytes32 hash, uint256 issuedAt, address issuer, bool exists)",
    "function isHashRegistered(bytes32 hash) external view returns (bool registered)",
    "function owner() external view returns (address)",
    "function totalIssued() external view returns (uint256)",
  ];
}

export interface BlockchainIssueResult {
  txHash: string;
  blockNumber: number;
  contractAddress: string;
  walletAddress: string;
  gasUsed: string;
}

export interface DeploymentStatus {
  connected: boolean;
  chainId: number;
  expectedChainId: number;
  contractAddress: string;
  contractDeployed: boolean;
  walletAddress: string;
  walletBalance: string;
  isOwner: boolean;
  totalIssuedOnChain: number;
  rpcUrl: string;
}

/**
 * Sequential nonce tracker — prevents "nonce too low" when issuing multiple certs quickly.
 */
class NonceManager {
  private nextNonce: number | null = null;

  constructor(private wallet: Wallet) {}

  async acquire(): Promise<number> {
    const networkNonce = await this.wallet.getNonce("pending");
    if (this.nextNonce === null || networkNonce > this.nextNonce) {
      this.nextNonce = networkNonce;
    }
    const nonce = this.nextNonce;
    this.nextNonce = nonce + 1;
    return nonce;
  }

  reset(): void {
    this.nextNonce = null;
  }
}

export class BlockchainService {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private contract: Contract;
  private nonceManager: NonceManager;

  constructor() {
    const { rpcUrl, chainId, privateKey, contractAddress } = blockchainConfig;

    // Step 1: Connect to Polygon Amoy via JSON-RPC
    this.provider = new ethers.JsonRpcProvider(rpcUrl, chainId, {
      staticNetwork: true,
      batchMaxCount: 1,
    });

    // Step 2: Load signing wallet from PRIVATE_KEY
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Step 3: Bind CertificateRegistry contract
    this.contract = new ethers.Contract(contractAddress, loadAbi(), this.wallet);
    this.nonceManager = new NonceManager(this.wallet);

    logger.info("BlockchainService initialized", {
      rpcUrl,
      chainId,
      wallet: this.wallet.address,
      contract: contractAddress,
    });
  }

  /**
   * Step 0 (startup): Verify contract is deployed and wallet is owner.
   */
  async verifyDeployment(): Promise<DeploymentStatus> {
    const { contractAddress, chainId, rpcUrl } = blockchainConfig;

    const network = await this.provider.getNetwork();
    const chainIdNum = Number(network.chainId);

    if (chainIdNum !== chainId) {
      throw new BlockchainError(
        `Chain ID mismatch: connected to ${chainIdNum}, expected ${chainId} (Polygon Amoy)`
      );
    }

    const bytecode = await this.provider.getCode(contractAddress);
    const contractDeployed = bytecode !== "0x" && bytecode.length > 2;

    if (!contractDeployed) {
      throw new BlockchainError(
        `No contract bytecode at ${contractAddress}. Deploy CertificateRegistry first.`
      );
    }

    const [balance, owner, totalIssued] = await Promise.all([
      this.provider.getBalance(this.wallet.address),
      this.contract.owner() as Promise<string>,
      this.contract.totalIssued() as Promise<bigint>,
    ]);

    const isOwner = owner.toLowerCase() === this.wallet.address.toLowerCase();

    if (!isOwner) {
      logger.warn("Wallet is NOT contract owner — issueCertificate will revert", {
        wallet: this.wallet.address,
        owner,
      });
    }

    const status: DeploymentStatus = {
      connected: true,
      chainId: chainIdNum,
      expectedChainId: chainId,
      contractAddress,
      contractDeployed,
      walletAddress: this.wallet.address,
      walletBalance: ethers.formatEther(balance),
      isOwner,
      totalIssuedOnChain: Number(totalIssued),
      rpcUrl,
    };

    logger.info("Blockchain deployment verified", status);
    return status;
  }

  /**
   * Register SHA-256 hash on Polygon Amoy with gas estimation, retries, and timeout.
   */
  async issueOnChain(certificateId: string, sha256Hash: string): Promise<BlockchainIssueResult> {
    const certIdBytes = uuidToBytes32(certificateId);
    const hashBytes = hexToBytes32(sha256Hash);

    return withRetry(
      () => this.sendIssueTransaction(certIdBytes, hashBytes, certificateId),
      {
        maxRetries: blockchainConfig.maxRetries,
        baseDelayMs: blockchainConfig.retryDelayMs,
        label: "issueCertificate",
      }
    );
  }

  private async sendIssueTransaction(
    certIdBytes: string,
    hashBytes: string,
    certificateId: string
  ): Promise<BlockchainIssueResult> {
    this.nonceManager.reset();

    // Step A: Estimate gas
    let gasLimit: bigint;
    try {
      const estimate = await this.contract.issueCertificate.estimateGas(certIdBytes, hashBytes);
      const buffer = BigInt(blockchainConfig.gasLimitBufferPercent);
      gasLimit = (estimate * (100n + buffer)) / 100n;
      logger.debug("Gas estimated", { estimate: estimate.toString(), gasLimit: gasLimit.toString() });
    } catch (error) {
      throw new BlockchainError(
        `Gas estimation failed — wallet may not be owner or cert already exists: ${(error as Error).message}`
      );
    }

    // Step B: Fetch current fee data (EIP-1559 on Polygon)
    const feeData = await this.provider.getFeeData();

    // Step C: Acquire nonce (handles rapid sequential submissions)
    const nonce = await this.nonceManager.acquire();

    // Step D: Send transaction
    logger.info("Sending issueCertificate tx", { certificateId, nonce });

    const tx = await this.contract.issueCertificate(certIdBytes, hashBytes, {
      gasLimit,
      maxFeePerGas: feeData.maxFeePerGas ?? undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
      nonce,
    });

    logger.info("Transaction submitted", { txHash: tx.hash, certificateId });

    // Step E: Wait for confirmation with timeout
    const receipt = await withTimeout(
      tx.wait(1) as Promise<TransactionReceipt | null>,
      blockchainConfig.txTimeoutMs,
      `Transaction ${tx.hash}`
    );

    if (!receipt || receipt.status !== 1) {
      this.nonceManager.reset();
      throw new BlockchainError(`Transaction reverted or failed: ${tx.hash}`);
    }

    logger.info("Transaction confirmed on Polygon Amoy", {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      certificateId,
    });

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress: blockchainConfig.contractAddress,
      walletAddress: this.wallet.address,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Read on-chain certificate (free view call — no gas, with timeout).
   */
  async getOnChainCertificate(certificateId: string): Promise<{
    exists: boolean;
    hash: string;
    issuedAt: number;
    issuer: string;
  }> {
    const certIdBytes = uuidToBytes32(certificateId);

    const result = await withTimeout(
      this.contract.getCertificate(certIdBytes) as Promise<[string, bigint, string, boolean]>,
      30_000,
      "getCertificate"
    );

    const hashHex = result[0];
    return {
      exists: result[3],
      hash: hashHex.startsWith("0x") ? hashHex.slice(2) : hashHex,
      issuedAt: Number(result[1]),
      issuer: result[2],
    };
  }

  async isHashRegistered(sha256Hash: string): Promise<boolean> {
    const hashBytes = hexToBytes32(sha256Hash);
    return this.contract.isHashRegistered(hashBytes);
  }

  getWalletAddress(): string {
    return this.wallet.address;
  }
}

let instance: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!instance) {
    instance = new BlockchainService();
  }
  return instance;
}

export async function initBlockchain(): Promise<DeploymentStatus> {
  const service = getBlockchainService();
  return service.verifyDeployment();
}
