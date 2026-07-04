import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { isValidPdfFile, isAllowedUploadFilename } from "../../src/utils/file-validation.util";

const FIXTURES = path.join(__dirname, "../fixtures");

describe("file-validation.util", () => {
  const validPdf = path.join(FIXTURES, "valid.pdf");
  const fakePdf = path.join(FIXTURES, "fake.pdf");

  beforeAll(() => {
    fs.mkdirSync(FIXTURES, { recursive: true });
    fs.writeFileSync(validPdf, "%PDF-1.4\n% demo content");
    fs.writeFileSync(fakePdf, "NOT A PDF");
  });

  afterAll(() => {
    for (const f of [validPdf, fakePdf]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("isValidPdfFile accepts real PDF magic bytes", () => {
    expect(isValidPdfFile(validPdf)).toBe(true);
  });

  it("isValidPdfFile rejects non-PDF files", () => {
    expect(isValidPdfFile(fakePdf)).toBe(false);
  });

  it("isAllowedUploadFilename accepts .pdf", () => {
    expect(isAllowedUploadFilename("certificate.pdf")).toBe(true);
  });

  it("isAllowedUploadFilename rejects path traversal", () => {
    expect(isAllowedUploadFilename("../etc/passwd.pdf")).toBe(false);
  });

  it("isAllowedUploadFilename rejects non-pdf extension", () => {
    expect(isAllowedUploadFilename("malware.exe")).toBe(false);
  });
});
