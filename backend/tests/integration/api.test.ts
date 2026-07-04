import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

describe("API integration", () => {
  const app = createApp();

  it("GET /api/v1/health returns 200", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("BlockCert API");
  });

  it("POST /api/v1/login rejects empty body", async () => {
    const res = await request(app)
      .post("/api/v1/login")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/v1/login rejects invalid email format", async () => {
    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: "not-an-email", password: "x" });
    expect(res.status).toBe(400);
  });

  it("GET /api/v1/certificates requires authentication", async () => {
    const res = await request(app).get("/api/v1/certificates");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/verify/:id rejects invalid UUID", async () => {
    const res = await request(app).get("/api/v1/verify/not-a-uuid");
    expect(res.status).toBe(400);
  });

  it("GET /api/v1/unknown returns 404", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
  });
});
