# Flow Diagrams

## Certificate Issuance Flow

```mermaid
flowchart TD
    A[Admin uploads PDF + metadata] --> B{Valid PDF?}
    B -->|No| X1[400 Reject]
    B -->|Yes| C[Compute SHA-256 hash]
    C --> D{Duplicate hash?}
    D -->|Yes| X2[409 Conflict]
    D -->|No| E[Save PDF to storage]
    E --> F[Insert MySQL record PENDING]
    F --> G[Estimate gas + issueCertificate on-chain]
    G --> H{Tx confirmed?}
    H -->|No| I[Mark FAILED in DB]
    H -->|Yes| J[Store tx hash + ON_CHAIN status]
    J --> K[Generate QR code]
    K --> L[Return certificate + verify URL]
```

---

## Employer Verification Flow

```mermaid
flowchart TD
    V1[Employer scans QR or opens verify URL] --> V2[GET /verify/:certificateId]
    V2 --> V3[Load certificate from MySQL]
    V3 --> V4[Recalculate SHA-256 from stored PDF]
    V4 --> V5[Fetch hash from blockchain]
    V5 --> V6{recalc == stored == chain?}
    V6 -->|All match| V7[VERIFIED — Authentic Certificate]
    V6 -->|Any mismatch| V8[TAMPERED — Certificate Tampered]
    V7 --> V9[Log to verification_logs]
    V8 --> V9
    V9 --> V10[Return result + hash audit + history]
```

---

## Authentication Flow

```mermaid
flowchart LR
    L1[POST /login] --> L2[Rate limit check]
    L2 --> L3[Validate email/password format]
    L3 --> L4[Lookup user in MySQL]
    L4 --> L5{bcrypt compare}
    L5 -->|Fail| L6[401 + audit LOGIN_FAILED]
    L5 -->|OK| L7[Sign JWT HS256]
    L7 --> L8[audit LOGIN_SUCCESS]
    L8 --> L9[Return token + user]
```

---

## Local Development Flow

```mermaid
flowchart TD
    S1[npm run setup] --> S2[Install + MySQL + Migrate + Seed]
    S2 --> S3[Compile contracts + Generate PDFs]
    S3 --> S4[npm start]
    S4 --> S5[Hardhat node :8545]
    S5 --> S6[Deploy CertificateRegistry]
    S6 --> S7[Backend :5000]
    S7 --> S8[Frontend :5173]
    S8 --> S9[npm run seed:demo]
    S9 --> S10[3 certificates on-chain]
```

---

## Data Flow — What Goes Where

| Data | MySQL | Blockchain | File System |
|------|-------|--------------|-------------|
| Student name | ✓ | ✗ | ✗ |
| Course / department | ✓ | ✗ | ✗ |
| PDF bytes | ✗ | ✗ | ✓ |
| SHA-256 hash | ✓ | ✓ | ✗ |
| Transaction hash | ✓ | ✓ (receipt) | ✗ |
| QR code image | ✗ | ✗ | ✓ |
| Verification attempts | ✓ | ✗ | ✗ |
