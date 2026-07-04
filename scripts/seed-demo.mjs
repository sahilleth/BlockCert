#!/usr/bin/env node
/**
 * Uploads sample PDF certificates via the API (requires running backend + blockchain).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const API = process.env.API_BASE_URL ?? "http://localhost:5000/api/v1";
const SAMPLES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../demo/samples");

const UPLOADS = [
  {
    file: "btech-cse-alice.pdf",
    studentName: "Alice Johnson",
    studentEmail: "alice.johnson@university.edu",
    course: "B.Tech Computer Science",
    department: "Computer Science & Engineering",
    issueDate: "2024-06-15",
  },
  {
    file: "btech-ece-bob.pdf",
    studentName: "Bob Martinez",
    studentEmail: "bob.martinez@university.edu",
    course: "B.Tech Electronics & Communication",
    department: "Electronics Engineering",
    issueDate: "2024-06-15",
  },
  {
    file: "mba-carol.pdf",
    studentName: "Carol Williams",
    studentEmail: "carol.williams@university.edu",
    course: "Master of Business Administration",
    department: "Management Studies",
    issueDate: "2024-05-20",
  },
];

async function login() {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@blockcert.edu",
      password: "Admin@123456",
    }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data.token;
}

async function upload(token, meta) {
  const filePath = path.join(SAMPLES_DIR, meta.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Sample PDF not found: ${filePath}. Run npm run setup first.`);
  }

  const form = new FormData();
  const blob = new Blob([fs.readFileSync(filePath)], { type: "application/pdf" });
  form.append("certificate", blob, meta.file);
  form.append("studentName", meta.studentName);
  form.append("studentEmail", meta.studentEmail);
  form.append("course", meta.course);
  form.append("department", meta.department);
  form.append("issueDate", meta.issueDate);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const body = await res.json();
  if (!res.ok) throw new Error(`Upload ${meta.file} failed: ${JSON.stringify(body)}`);
  return body.data;
}

async function main() {
  console.log("Seeding demo certificates...\n");

  const health = await fetch(`${API}/health`).catch(() => null);
  if (!health?.ok) {
    console.error("Backend not running. Start with: npm start");
    process.exit(1);
  }

  const token = await login();
  console.log("✓ Logged in as admin\n");

  for (const meta of UPLOADS) {
    try {
      const cert = await upload(token, meta);
      console.log(`✓ Issued: ${meta.studentName}`);
      console.log(`  ID: ${cert.certificateId}`);
      console.log(`  Verify: http://localhost:5173/verify/${cert.certificateId}`);
      console.log(`  Tx: ${cert.blockchainTx ?? "pending"}\n`);
    } catch (err) {
      console.error(`✗ ${meta.file}: ${err.message}\n`);
    }
  }

  console.log("Demo seed complete.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
