#!/usr/bin/env node
/**
 * Railway backend entrypoint: migrate DB then start Express.
 */
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../backend");

const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "RPC_URL",
  "PRIVATE_KEY",
  "CONTRACT_ADDRESS",
];

const missing = required.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error("\n❌ Backend cannot start — missing Railway variables:\n");
  for (const k of missing) console.error(`   • ${k}`);
  console.error("\nSet them in Railway → @blockcert/backend → Variables");
  console.error("Template: railway/backend.env.example\n");
  process.exit(1);
}

const run = (cmd) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: backendDir, env: process.env });
};

console.log("═══════════════════════════════════════════════════════");
console.log(" BlockCert API — Railway startup");
console.log("═══════════════════════════════════════════════════════");
console.log(`NODE_ENV=${process.env.NODE_ENV ?? "undefined"}`);
console.log(`PORT=${process.env.PORT ?? "5000"}`);
console.log(`HOST=${process.env.HOST ?? "0.0.0.0"}`);
console.log(`UPLOAD_DIR=${process.env.UPLOAD_DIR ?? "./uploads"}`);
console.log(`DATABASE_URL=[set]`);
console.log(`CONTRACT_ADDRESS=${process.env.CONTRACT_ADDRESS}`);

try {
  run("npx sequelize-cli db:migrate");
  run("node dist/index.js");
} catch (err) {
  console.error("\n❌ Startup failed:", err.message);
  console.error("Check Railway deploy logs above (migrations or blockchain init).\n");
  process.exit(1);
}
