import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../../src/config/jwt";

describe("jwt", () => {
  it("signs and verifies a token with HS256", () => {
    const payload = { userId: "550e8400-e29b-41d4-a716-446655440000", email: "a@b.c", role: "ADMIN" };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe("ADMIN");
  });

  it("rejects tampered tokens", () => {
    const token = signToken({ userId: "1", email: "a@b.c", role: "ADMIN" });
    const parts = token.split(".");
    parts[1] = Buffer.from('{"userId":"hacked"}').toString("base64url");
    expect(() => verifyToken(parts.join("."))).toThrow();
  });
});
