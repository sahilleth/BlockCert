import { env } from "./env";

export const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "BlockCert API",
    version: "1.0.0",
    description:
      "Blockchain-based certificate verification system. Colleges issue PDF certificates whose SHA-256 hashes are stored on Polygon Amoy. Employers verify via QR code.",
    contact: { name: "BlockCert Team" },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: "Development",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@blockcert.edu" },
          password: { type: "string", example: "Admin@123456" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
              token: { type: "string" },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["ADMIN", "EMPLOYER"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UploadCertificateRequest: {
        type: "object",
        required: ["studentName", "course", "department", "issueDate", "certificate"],
        properties: {
          studentName: { type: "string", example: "Alice Johnson" },
          studentEmail: { type: "string", format: "email" },
          course: { type: "string", example: "B.Sc Computer Science" },
          department: { type: "string", example: "Engineering" },
          issueDate: { type: "string", format: "date", example: "2025-06-15" },
          certificate: { type: "string", format: "binary", description: "PDF file" },
        },
      },
      Certificate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          certificateId: { type: "string", format: "uuid" },
          studentName: { type: "string" },
          studentEmail: { type: "string", nullable: true },
          course: { type: "string" },
          department: { type: "string" },
          issueDate: { type: "string", format: "date" },
          sha256Hash: { type: "string" },
          blockchainTx: { type: "string", nullable: true },
          contractAddress: { type: "string", nullable: true },
          walletAddress: { type: "string", nullable: true },
          verificationStatus: { type: "string", enum: ["PENDING", "ON_CHAIN", "FAILED"] },
          verificationUrl: { type: "string" },
          qrCodeUrl: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      VerificationResult: {
        type: "object",
        properties: {
          certificateId: { type: "string" },
          studentName: { type: "string" },
          course: { type: "string" },
          department: { type: "string" },
          issueDate: { type: "string" },
          status: { type: "string", enum: ["VERIFIED", "TAMPERED"] },
          onChain: { type: "boolean" },
          blockchainTx: { type: "string", nullable: true },
          verifiedAt: { type: "string", format: "date-time" },
        },
      },
      DashboardStats: {
        type: "object",
        properties: {
          totalCertificates: { type: "integer" },
          onChain: { type: "integer" },
          pending: { type: "integer" },
          failed: { type: "integer" },
          totalVerifications: { type: "integer" },
          verifiedCount: { type: "integer" },
          tamperedCount: { type: "integer" },
          recentCertificates: {
            type: "array",
            items: { $ref: "#/components/schemas/Certificate" },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "object" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentication" },
    { name: "Certificates", description: "Certificate management" },
    { name: "Verification", description: "Public verification" },
    { name: "Dashboard", description: "Admin statistics" },
  ],
};

export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};
