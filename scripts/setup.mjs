#!/usr/bin/env node
/**
 * One-command project setup:
 * install → env files → MySQL → migrate → seed → compile → sample PDFs
 */
import { execSync } from "child_process";
import {
  rootDir,
  copyEnvIfMissing,
  upsertEnvVar,
  HARDHAT_ACCOUNT,
} from "./lib/env-utils.mjs";

const run = (cmd, opts = {}) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: rootDir(), ...opts });
};

console.log("═══════════════════════════════════════════════════════");
console.log(" BlockCert — Project Setup");
console.log("═══════════════════════════════════════════════════════");

// 1. Install dependencies
run("npm install --legacy-peer-deps");

// 2. Environment files
copyEnvIfMissing("backend/.env");
copyEnvIfMissing("frontend/.env");
copyEnvIfMissing("blockchain/.env");

// Local dev defaults (Hardhat account #0 — NEVER use in production)
upsertEnvVar("backend/.env", "JWT_SECRET", "blockcert_local_dev_jwt_secret_32chars_minimum_length_ok");
upsertEnvVar("backend/.env", "DATABASE_URL", "mysql://blockcert:blockcert123@localhost:3307/blockcert");
upsertEnvVar("backend/.env", "RPC_URL", "http://127.0.0.1:8545");
upsertEnvVar("backend/.env", "PRIVATE_KEY", HARDHAT_ACCOUNT.privateKey);
upsertEnvVar("backend/.env", "CHAIN_ID", "31337");
upsertEnvVar("backend/.env", "NODE_ENV", "development");

upsertEnvVar("blockchain/.env", "PRIVATE_KEY", HARDHAT_ACCOUNT.privateKey);
upsertEnvVar("blockchain/.env", "LOCALHOST_RPC_URL", "http://127.0.0.1:8545");

upsertEnvVar("frontend/.env", "VITE_API_BASE_URL", "http://localhost:5000/api/v1");
upsertEnvVar("frontend/.env", "VITE_CHAIN_ID", "31337");
upsertEnvVar("frontend/.env", "VITE_CHAIN_NAME", "Hardhat Local");
upsertEnvVar("frontend/.env", "VITE_EXPLORER_URL", "http://127.0.0.1:8545");

// 3. MySQL via Docker
try {
  run("docker compose up -d mysql");
  run("npx wait-on tcp:localhost:3307 -t 90000");
} catch (e) {
  console.warn("\n⚠ Docker MySQL unavailable. Ensure MySQL is running on localhost:3307.");
}

// 4. Database migrate + seed
run("npm run db:migrate --workspace=@blockcert/backend");
run("npm run db:seed --workspace=@blockcert/backend");

// 5. Compile smart contracts + export ABI
run("npm run compile --workspace=@blockcert/blockchain");
run("npm run export:abi --workspace=@blockcert/blockchain");

// 6. Generate sample PDF certificates
run("node demo/generate-sample-pdfs.mjs");

console.log("\n═══════════════════════════════════════════════════════");
console.log(" Setup complete!");
console.log(" Run:  npm start");
console.log(" Then: npm run seed:demo   (uploads sample certificates)");
console.log(" Login: admin@blockcert.edu / Admin@123456");
console.log("═══════════════════════════════════════════════════════");
