#!/usr/bin/env node
/**
 * Pre-flight checklist before Railway deploy.
 * Run: node scripts/railway-preflight.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const fail = (msg) => console.log(`  ❌ ${msg}`);

console.log("\nBlockCert — Railway pre-flight\n");

const files = [
  "Dockerfile.backend",
  "Dockerfile.frontend",
  "railway.backend.toml",
  "railway.frontend.toml",
  "scripts/railway-start-backend.mjs",
  "railway/backend.env.example",
  "railway/frontend.env.example",
];

let allGood = true;
for (const f of files) {
  if (fs.existsSync(path.join(root, f))) ok(f);
  else {
    fail(`Missing ${f}`);
    allGood = false;
  }
}

const amoy = path.join(root, "blockchain/deployments/amoy.json");
if (fs.existsSync(amoy)) {
  const d = JSON.parse(fs.readFileSync(amoy, "utf8"));
  ok(`Amoy contract deployed: ${d.contractAddress}`);
} else {
  warn("No Amoy deployment yet — run: npm run deploy:amoy (needs blockchain/.env + test MATIC)");
}

console.log("\nDocker images (optional local test):");
console.log("  npm run railway:docker:backend");
console.log("  npm run railway:docker:frontend");

console.log("\nRailway dashboard steps:");
console.log("  1. https://railway.com/new → GitHub → sahilleth/BlockCert");
console.log("  2. Add MySQL database");
console.log("  3. Service: blockcert-api → Dockerfile.backend → volume /data/uploads");
console.log("  4. Copy vars from railway/backend.env.example");
console.log("  5. Service: blockcert-web → Dockerfile.frontend");
console.log("  6. Copy vars from railway/frontend.env.example");
console.log("  7. npx @railway/cli login && railway link && npm run railway:seed");
console.log("\nFull guide: docs/RAILWAY_DEPLOYMENT.md\n");

process.exit(allGood ? 0 : 1);
