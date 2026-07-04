#!/usr/bin/env node
/**
 * Railway backend entrypoint: migrate DB then start Express.
 * Used by Dockerfile.backend CMD.
 */
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../backend");

const run = (cmd) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: backendDir, env: process.env });
};

console.log("═══════════════════════════════════════════════════════");
console.log(" BlockCert API — Railway startup");
console.log("═══════════════════════════════════════════════════════");
console.log(`NODE_ENV=${process.env.NODE_ENV ?? "undefined"}`);
console.log(`PORT=${process.env.PORT ?? "5000"}`);
console.log(`UPLOAD_DIR=${process.env.UPLOAD_DIR ?? "./uploads"}`);
console.log(`DATABASE_URL=${process.env.DATABASE_URL ? "[set]" : "[MISSING]"}`);

try {
  run("npx sequelize-cli db:migrate");
  run("node dist/index.js");
} catch (err) {
  console.error("Startup failed:", err.message);
  process.exit(1);
}
