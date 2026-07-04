#!/usr/bin/env node
/**
 * Seed Railway MySQL (NOT local Docker MySQL).
 * Must be run via: railway run npm run railway:seed
 */
import { execSync } from "child_process";

if (!process.env.RAILWAY_ENVIRONMENT && !process.env.RAILWAY_SERVICE_NAME) {
  console.error(`
❌ This seeds the Railway database, not your local machine.

Run:
  npx @railway/cli run npm run railway:seed

Make sure you linked @blockcert/backend first:
  npx @railway/cli link
`);
  process.exit(1);
}

console.log(`Seeding Railway DB (${process.env.RAILWAY_ENVIRONMENT ?? "railway"})…`);

// Internal mysql.railway.internal only works inside Railway containers.
// From your laptop, railway run needs the public TCP proxy URL.
const dbUrl = (
  process.env.MYSQL_PUBLIC_URL ??
  process.env.DATABASE_URL ??
  process.env.MYSQL_URL ??
  ""
).replace(/^mysql2:\/\//i, "mysql://");

console.log(`DATABASE_URL=${dbUrl ? "[set]" : "[MISSING — add MySQL to project]"}`);

if (!dbUrl) {
  console.error("\n❌ No database URL. Add MySQL and link DATABASE_URL on backend.\n");
  process.exit(1);
}

process.env.DATABASE_URL = dbUrl;

execSync("npm run db:seed --workspace=@blockcert/backend", {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

console.log("\n✅ Railway seed complete.");
console.log("   Admin: admin@blockcert.edu / Admin@123456\n");
