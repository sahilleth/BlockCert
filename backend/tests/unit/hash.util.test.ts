import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { computeSha256, hexToBytes32, uuidToBytes32 } from "../../src/utils/hash.util";

const TEST_DIR = path.join(__dirname, "../fixtures");

describe("hash.util", () => {
  const testFile = path.join(TEST_DIR, "hash-test.txt");

  beforeAll(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(testFile, "BlockCert hash test content");
  });

  afterAll(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  it("computeSha256 returns 64-char hex digest", () => {
    const hash = computeSha256(testFile);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("computeSha256 is deterministic", () => {
    expect(computeSha256(testFile)).toBe(computeSha256(testFile));
  });

  it("hexToBytes32 pads to 32 bytes", () => {
    const hash = "a".repeat(64);
    expect(hexToBytes32(hash)).toBe("0x" + hash);
  });

  it("uuidToBytes32 returns valid bytes32", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const bytes = uuidToBytes32(id);
    expect(bytes).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
