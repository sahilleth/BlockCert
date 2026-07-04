#!/usr/bin/env node
/**
 * One-command start: Hardhat node → deploy → backend → frontend
 */
import { spawn, execSync } from "child_process";
import fs from "fs";
import {
  rootDir,
  upsertEnvVar,
  readDeployment,
  waitForPort,
  waitForHttp,
  HARDHAT_ACCOUNT,
} from "./lib/env-utils.mjs";

const children = [];

function spawnProc(name, cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd: cwd ?? rootDir(),
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) console.error(`[${name}] exited with code ${code}`);
  });
  children.push({ name, child });
  return child;
}

function cleanup() {
  console.log("\nShutting down...");
  for (const { name, child } of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      console.warn(`Could not stop ${name}`);
    }
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

async function deployLocal() {
  console.log("\n▶ Deploying CertificateRegistry to local Hardhat node...");
  execSync("npm run deploy:local --workspace=@blockcert/blockchain", {
    stdio: "inherit",
    cwd: rootDir(),
  });

  const deployment = readDeployment("localhost");
  if (!deployment?.contractAddress) {
    throw new Error("Local deployment failed — no contract address");
  }

  upsertEnvVar("backend/.env", "CONTRACT_ADDRESS", deployment.contractAddress);
  upsertEnvVar("backend/.env", "RPC_URL", "http://127.0.0.1:8545");
  upsertEnvVar("backend/.env", "PRIVATE_KEY", HARDHAT_ACCOUNT.privateKey);
  upsertEnvVar("backend/.env", "CHAIN_ID", "31337");
  upsertEnvVar("blockchain/.env", "CONTRACT_ADDRESS", deployment.contractAddress);

  console.log(`✓ Contract deployed: ${deployment.contractAddress}`);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log(" BlockCert — Starting All Services");
  console.log("═══════════════════════════════════════════════════════");

  if (!fs.existsSync(rootDir("backend/.env"))) {
    console.error("Run `npm run setup` first.");
    process.exit(1);
  }

  // 1. Hardhat local blockchain
  spawnProc("blockchain", "npx", ["hardhat", "node"], rootDir("blockchain"));
  await waitForPort(8545);

  // 2. Deploy contract (always fresh on local node restart)
  await deployLocal();

  // 3. Backend API
  spawnProc("backend", "npm", ["run", "dev"], rootDir("backend"));
  await waitForHttp("http://localhost:5000/api/v1/health");

  // 4. Frontend
  spawnProc("frontend", "npm", ["run", "dev"], rootDir("frontend"));

  console.log("\n═══════════════════════════════════════════════════════");
  console.log(" BlockCert is running!");
  console.log(" Frontend : http://localhost:5173");
  console.log(" API      : http://localhost:5000/api/v1");
  console.log(" Swagger  : http://localhost:5000/api/v1/docs");
  console.log(" Admin    : admin@blockcert.edu / Admin@123456");
  console.log("");
  console.log(" Upload demo certs: npm run seed:demo");
  console.log(" Press Ctrl+C to stop all services");
  console.log("═══════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error(err.message);
  cleanup();
});
