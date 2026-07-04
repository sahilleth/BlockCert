import { describe, it, expect } from "vitest";
import { loginSchema, certificateIdParamSchema, paginationSchema } from "../../src/validators/auth.validator";
import { uploadCertificateSchema } from "../../src/validators/certificate.validator";

describe("auth.validator", () => {
  it("loginSchema accepts valid credentials", () => {
    const result = loginSchema.parse({
      email: "Admin@BlockCert.edu",
      password: "secret",
    });
    expect(result.email).toBe("admin@blockcert.edu");
  });

  it("loginSchema rejects invalid email", () => {
    expect(() => loginSchema.parse({ email: "not-email", password: "x" })).toThrow();
  });

  it("certificateIdParamSchema requires UUID", () => {
    expect(() =>
      certificateIdParamSchema.parse({ id: "not-a-uuid" })
    ).toThrow();
    expect(
      certificateIdParamSchema.parse({ id: "550e8400-e29b-41d4-a716-446655440000" }).id
    ).toBeDefined();
  });

  it("paginationSchema caps limit at 100", () => {
    expect(() => paginationSchema.parse({ page: 1, limit: 200 })).toThrow();
  });
});

describe("certificate.validator", () => {
  it("uploadCertificateSchema sanitizes student name", () => {
    const result = uploadCertificateSchema.parse({
      studentName: "  Alice <b>Johnson</b>  ",
      course: "B.Tech CSE",
      department: "Computer Science",
      issueDate: "2024-06-15",
    });
    expect(result.studentName).toBe("Alice Johnson");
  });

  it("uploadCertificateSchema rejects invalid date format", () => {
    expect(() =>
      uploadCertificateSchema.parse({
        studentName: "Alice",
        course: "B.Tech",
        department: "CS",
        issueDate: "15-06-2024",
      })
    ).toThrow();
  });
});
