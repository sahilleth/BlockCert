# BlockCert — MySQL Database Design (Sequelize)

This document describes the complete MySQL schema for BlockCert, implemented with **Sequelize ORM**, migrations, models, and validations.

---

## Entity Relationship Diagram

```
┌─────────────────────────┐
│         users           │
├─────────────────────────┤
│ PK  id          UUID    │
│     name        VARCHAR │
│ UQ  email       VARCHAR │
│     password    VARCHAR │  ← bcrypt hash
│     role        ENUM    │  ← ADMIN | EMPLOYER
│     created_at  DATETIME│
└─────────────────────────┘

┌─────────────────────────────────────────┐
│              certificates                │
├─────────────────────────────────────────┤
│ PK  id                  UUID            │  ← internal
│ UQ  certificate_id      UUID            │  ← public (QR)
│     student_name        VARCHAR         │
│     student_email       VARCHAR (null)  │
│     course              VARCHAR         │
│     department          VARCHAR         │
│     issue_date          DATE            │
│     pdf_path            VARCHAR         │
│ UQ  sha256_hash         CHAR(64)        │
│     blockchain_tx       VARCHAR (null)  │
│     contract_address    VARCHAR (null)  │
│     wallet_address      VARCHAR (null)  │
│     verification_status ENUM            │
│     created_at          DATETIME        │
└──────────────────┬──────────────────────┘
                   │ 1
                   │
                   │ N
┌──────────────────▼──────────────────────┐
│          verification_logs               │
├─────────────────────────────────────────┤
│ PK  id              UUID                │
│ FK  certificate_id  UUID → certificates │
│     verified_by_ip  VARCHAR (null)      │
│     verified_time   DATETIME            │
│     result          ENUM                │
└─────────────────────────────────────────┘
```

---

## Table 1: `users`

Stores college admins (issuers) and employers who may use authenticated features.

| Column | Type | Constraints | Why it exists |
|--------|------|-------------|---------------|
| **id** | `UUID` | PK, default UUIDv4 | Opaque, non-sequential identifier — safer than auto-increment for JWT subject references; avoids enumeration attacks. |
| **name** | `VARCHAR(120)` | NOT NULL | Display name on dashboard and audit contexts (e.g. "Dr. Jane Smith, Registrar"). |
| **email** | `VARCHAR(255)` | NOT NULL, UNIQUE | Login username; unique constraint prevents duplicate accounts. |
| **password** | `VARCHAR(255)` | NOT NULL | Stores **bcrypt hash** (12 rounds), never plaintext. Column named `password` per schema; hashed via Sequelize `beforeCreate` hook. |
| **role** | `ENUM('ADMIN','EMPLOYER')` | NOT NULL, default `EMPLOYER` | **ADMIN** — can issue certificates and access admin dashboard. **EMPLOYER** — can register/login for future employer-only features (saved verifications, bulk lookup). |
| **created_at** | `DATETIME` | NOT NULL | Account creation timestamp for audit and support. |

### Indexes
- `users_email_unique` — fast login lookup by email
- `users_role_idx` — filter users by role for admin panels

---

## Table 2: `certificates`

Core record for each issued academic certificate. Links PDF file, cryptographic hash, and blockchain proof.

| Column | Type | Constraints | Why it exists |
|--------|------|-------------|---------------|
| **id** | `UUID` | PK | Internal surrogate key. Used as FK in `verification_logs`. **Never** put in QR codes — avoids exposing internal row identity. |
| **certificate_id** | `UUID` | NOT NULL, UNIQUE | **Public identifier** embedded in QR URL (`/verify/{certificate_id}`). Separate from `id` so internal DB operations can remain isolated from public verification. |
| **student_name** | `VARCHAR(150)` | NOT NULL | Human-readable holder name shown on verification page. |
| **student_email** | `VARCHAR(255)` | NULL | Optional contact for the student; nullable because not all colleges collect email on certificates. |
| **course** | `VARCHAR(200)` | NOT NULL | Degree/course title (e.g. "B.Sc Computer Science") — displayed to employers and stored on-chain. |
| **department** | `VARCHAR(150)` | NOT NULL | Academic department (e.g. "Engineering") — helps employers contextualize the credential. |
| **issue_date** | `DATE` | NOT NULL | Official graduation/conferral date from the certificate. |
| **pdf_path** | `VARCHAR(500)` | NOT NULL | Filesystem path to uploaded PDF (local now; can become IPFS gateway URL later without schema change). |
| **sha256_hash** | `CHAR(64)` | NOT NULL, UNIQUE | **Cryptographic fingerprint** of PDF bytes. Compared against on-chain hash during verification. Unique constraint prevents re-issuing the same file. |
| **blockchain_tx** | `VARCHAR(66)` | NULL | Polygon transaction hash (`0x` + 64 hex) after successful `issueCertificate` call. NULL while `PENDING`. Enables Polygonscan audit link. |
| **contract_address** | `VARCHAR(42)` | NULL | Deployed `CertificateRegistry` address on Amoy. NULL until registered on-chain. |
| **wallet_address** | `VARCHAR(42)` | NULL | Ethereum address of the backend/admin wallet that signed the transaction. Proves which institution wallet issued the credential on-chain. |
| **verification_status** | `ENUM('PENDING','ON_CHAIN','FAILED')` | NOT NULL, default `PENDING` | **Issuance lifecycle** — not the employer verify outcome. `PENDING` = uploaded; `ON_CHAIN` = hash confirmed on blockchain; `FAILED` = chain write error. |
| **created_at** | `DATETIME` | NOT NULL | When the record was first created in the system. |

### Indexes
- `certificates_certificate_id_unique` — O(1) lookup for QR verification
- `certificates_sha256_hash_unique` — duplicate file detection
- `certificates_student_name_idx` — admin search by student
- `certificates_verification_status_idx` — filter pending/failed issuances
- `certificates_blockchain_tx_idx` — lookup by transaction hash

---

## Table 3: `verification_logs`

Append-only audit trail every time an employer (or anyone) verifies a certificate.

| Column | Type | Constraints | Why it exists |
|--------|------|-------------|---------------|
| **id** | `UUID` | PK | Unique log entry identifier. |
| **certificate_id** | `UUID` | FK → `certificates.id`, CASCADE | Links log to the **internal** certificate row. CASCADE delete removes orphan logs if a cert is deleted (dev/test cleanup). |
| **verified_by_ip** | `VARCHAR(45)` | NULL | IP address of verifier (supports IPv6 up to 45 chars). Audit/compliance — who scanned and when. Nullable for proxied or unknown IPs. |
| **verified_time** | `DATETIME` | NOT NULL, default NOW | Exact timestamp of verification attempt. |
| **result** | `ENUM('VERIFIED','TAMPERED','NOT_FOUND')` | NOT NULL | Outcome of hash comparison. **VERIFIED** = DB hash matches blockchain. **TAMPERED** = mismatch or missing on-chain record. **NOT_FOUND** reserved for future soft-fail logging. |

### Indexes
- `verification_logs_certificate_id_idx` — history per certificate
- `verification_logs_verified_time_idx` — time-range analytics
- `verification_logs_result_idx` — count verified vs tampered

---

## Relationships

```typescript
Certificate.hasMany(VerificationLog, { foreignKey: 'certificateId', as: 'verificationLogs' });
VerificationLog.belongsTo(Certificate, { foreignKey: 'certificateId', as: 'certificate' });
```

- One certificate → many verification attempts (re-scans, different employers).
- `verification_logs.certificate_id` references `certificates.id` (not `certificate_id`) to keep public UUID separate from internal FK.

---

## Validation Layers

| Layer | Location | Purpose |
|-------|----------|---------|
| **HTTP (Zod)** | `src/validators/` | Request body validation before DB touch |
| **Sequelize model** | `src/models/*.ts` | Column-level rules (email format, hash length, UUID format) |
| **MySQL constraints** | Migrations | UNIQUE, FK, ENUM, NOT NULL at database level |
| **bcrypt hook** | `User` model `beforeCreate` | Plaintext password → hash before INSERT |

---

## Migrations

| File | Creates |
|------|---------|
| `20250704120001-create-users.js` | `users` table + indexes |
| `20250704120002-create-certificates.js` | `certificates` table + indexes |
| `20250704120003-create-verification-logs.js` | `verification_logs` + FK to certificates |

Run:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

---

## Models

| Model | File | Key features |
|-------|------|--------------|
| `User` | `src/models/User.ts` | Role enum, password hashing hooks, `toSafeJSON()`, `validatePassword()` |
| `Certificate` | `src/models/Certificate.ts` | SHA-256 format validation, verification status enum |
| `VerificationLog` | `src/models/VerificationLog.ts` | IP validation, result enum, no timestamps (uses `verified_time`) |

---

## UUID Strategy

| Field | UUID? | Reason |
|-------|-------|--------|
| `users.id` | ✅ | JWT subject, non-guessable |
| `certificates.id` | ✅ | Internal PK, FK target |
| `certificates.certificate_id` | ✅ | Public QR identifier — separate from internal `id` |
| `verification_logs.id` | ✅ | Log entry identity |
| `sha256_hash` | ❌ | Fixed 64-char hex, not UUID |
| `blockchain_tx` | ❌ | 66-char hex transaction hash |

---

## Default Seed Data

After `npm run db:seed`:

| Email | Password | Role |
|-------|----------|------|
| `admin@blockcert.edu` | `Admin@123456` | ADMIN |
