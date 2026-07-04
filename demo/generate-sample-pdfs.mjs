#!/usr/bin/env node
/**
 * Generates minimal valid PDF certificates for demo and testing.
 * Each PDF has unique content so SHA-256 hashes differ.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "samples");

const CERTIFICATES = [
  {
    file: "btech-cse-alice.pdf",
    title: "Bachelor of Technology — Computer Science",
    student: "Alice Johnson",
    roll: "CS2021-0142",
    grade: "First Class with Distinction",
  },
  {
    file: "btech-ece-bob.pdf",
    title: "Bachelor of Technology — Electronics",
    student: "Bob Martinez",
    roll: "EC2021-0087",
    grade: "First Class",
  },
  {
    file: "mba-carol.pdf",
    title: "Master of Business Administration",
    student: "Carol Williams",
    roll: "MBA2022-0033",
    grade: "Distinction",
  },
  {
    file: "bsc-math-david.pdf",
    title: "Bachelor of Science — Mathematics",
    student: "David Chen",
    roll: "MA2020-0199",
    grade: "First Class",
  },
  {
    file: "mtech-ai-eve.pdf",
    title: "Master of Technology — Artificial Intelligence",
    student: "Eve Nakamura",
    roll: "AI2023-0005",
    grade: "Distinction",
  },
];

function buildPdf({ title, student, roll, grade }) {
  const lines = [
    "BlockCert University",
    "Certificate of Completion",
    "",
    `Awarded to: ${student}`,
    `Program: ${title}`,
    `Roll No: ${roll}`,
    `Classification: ${grade}`,
    `Issue Date: 2024-06-15`,
    "",
    "This document is a demo sample for BlockCert verification.",
    `Unique ID: ${roll}-${Date.now()}`,
  ];

  const stream = lines
    .map((line, i) => {
      const y = 720 - i * 28;
      return `BT /F1 14 Tf 72 ${y} Td (${escapePdf(line)}) Tj ET`;
    })
    .join("\n");

  const streamLen = Buffer.byteLength(stream, "utf8");

  const body = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length ${streamLen} >>stream
${stream}
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000${(400 + streamLen).toString().padStart(3, "0")} 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
${450 + streamLen}
%%EOF`;

  return Buffer.from(body, "utf8");
}

function escapePdf(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const cert of CERTIFICATES) {
    const pdf = buildPdf(cert);
    const outPath = path.join(OUT_DIR, cert.file);
    fs.writeFileSync(outPath, pdf);
    console.log(`Created: ${outPath} (${pdf.length} bytes)`);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(CERTIFICATES, null, 2)
  );
  console.log(`\n${CERTIFICATES.length} sample PDFs ready in demo/samples/`);
}

main();
