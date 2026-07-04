import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../src/utils/sanitize.util";

describe("sanitizeString", () => {
  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("removes HTML tags", () => {
    expect(sanitizeString('<script>alert("xss")</script>Alice')).toBe("alert(\"xss\")Alice");
  });

  it("removes javascript: protocol", () => {
    expect(sanitizeString("javascript:alert(1)")).toBe("alert(1)");
  });

  it("removes event handlers", () => {
    expect(sanitizeString('onmouseover="evil()"')).toBe("\"evil()\"");
  });

  it("preserves normal certificate names", () => {
    expect(sanitizeString("Alice Johnson")).toBe("Alice Johnson");
  });
});
