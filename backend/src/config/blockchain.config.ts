import { env } from "./env";

/** Polygon Amoy blockchain connection settings */
export const blockchainConfig = {
  /** JSON-RPC endpoint — e.g. https://rpc-amoy.polygon.technology */
  rpcUrl: env.RPC_URL,

  /** Backend hot-wallet private key (must be contract owner) */
  privateKey: env.PRIVATE_KEY.startsWith("0x") ? env.PRIVATE_KEY : `0x${env.PRIVATE_KEY}`,

  /** Deployed CertificateRegistry address on Amoy */
  contractAddress: env.CONTRACT_ADDRESS,

  /** Expected chain ID — Polygon Amoy = 80002 */
  chainId: env.CHAIN_ID,

  /** Max wait time for tx confirmation (ms) */
  txTimeoutMs: env.TX_TIMEOUT_MS,

  /** Retry attempts for transient failures */
  maxRetries: env.TX_MAX_RETRIES,

  /** Base delay between retries (ms) — doubled each attempt */
  retryDelayMs: env.TX_RETRY_DELAY_MS,

  /** Extra gas headroom above estimate (percent) */
  gasLimitBufferPercent: env.GAS_LIMIT_BUFFER_PERCENT,

  /** Polygon Amoy explorer base URL */
  explorerUrl: "https://amoy.polygonscan.com",
} as const;
