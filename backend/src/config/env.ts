import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/** Railway MySQL plugin may expose MYSQL_URL or mysql2:// — normalize for Sequelize. */
function resolveDatabaseUrl(): string {
  const raw =
    process.env.DATABASE_URL ??
    process.env.MYSQL_URL ??
    process.env.MYSQL_PUBLIC_URL ??
    "";
  return raw.replace(/^mysql2:\/\//i, "mysql://");
}

const databaseUrl = resolveDatabaseUrl();
if (databaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

/**
 * Blockchain env vars — primary names per spec.
 * Legacy aliases (BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY) supported for migration.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default("0.0.0.0"),
  API_PREFIX: z.string().default("/api/v1"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  ALLOWED_MIME_TYPES: z.string().default("application/pdf"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  /** Comma-separated CORS origins — defaults to FRONTEND_URL if empty */
  ALLOWED_ORIGINS: z.string().default(""),

  // ─── Rate limiting ────────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(10),
  VERIFY_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  VERIFY_RATE_LIMIT_MAX: z.coerce.number().default(60),

  // ─── Polygon Amoy (primary) ───────────────────────────────────────────────────
  RPC_URL: z.string().url().optional(),
  PRIVATE_KEY: z.string().min(1).optional(),
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address").optional(),
  CHAIN_ID: z.coerce.number().default(80002),

  // Legacy aliases
  BLOCKCHAIN_RPC_URL: z.string().url().optional(),
  BLOCKCHAIN_PRIVATE_KEY: z.string().min(1).optional(),

  // Transaction tuning
  TX_TIMEOUT_MS: z.coerce.number().default(120_000),
  TX_MAX_RETRIES: z.coerce.number().default(3),
  TX_RETRY_DELAY_MS: z.coerce.number().default(2_000),
  GAS_LIMIT_BUFFER_PERCENT: z.coerce.number().default(20),

  STORAGE_PROVIDER: z.enum(["local", "ipfs"]).default("local"),
  IPFS_API_URL: z.string().optional(),
  IPFS_GATEWAY_URL: z.string().optional(),
  IPFS_PROJECT_ID: z.string().optional(),
  IPFS_PROJECT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

const RPC_URL = raw.RPC_URL ?? raw.BLOCKCHAIN_RPC_URL;
const PRIVATE_KEY = raw.PRIVATE_KEY ?? raw.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = raw.CONTRACT_ADDRESS;

if (!RPC_URL) {
  console.error("Missing RPC_URL (or legacy BLOCKCHAIN_RPC_URL)");
  process.exit(1);
}
if (!PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY (or legacy BLOCKCHAIN_PRIVATE_KEY)");
  process.exit(1);
}
if (!CONTRACT_ADDRESS) {
  console.error("Missing CONTRACT_ADDRESS");
  process.exit(1);
}

export const env = {
  ...raw,
  RPC_URL,
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  ALLOWED_ORIGINS: raw.ALLOWED_ORIGINS
    ? raw.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : [],
};
