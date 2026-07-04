# BlockCert — Complete Project Explanation

**Blockchain Based Certificate Verification System**

*Document for Faculty Evaluation, Viva Voce, and Project Presentation*

---

## Document Information

| Field | Detail |
|-------|--------|
| **Project Title** | BlockCert — Blockchain Based Certificate Verification System |
| **Domain** | Web Application + Blockchain + Information Security |
| **Type** | Final Year Engineering Project (Monorepo) |
| **Target Users** | College administrators (issuers), employers (verifiers), students (indirect) |
| **Blockchain Network** | Polygon Amoy Testnet (production path) / Hardhat Local (development) |
| **Repository Structure** | npm workspaces — frontend, backend, blockchain |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Existing System vs Proposed System](#4-existing-system-vs-proposed-system)
5. [Scope of the Project](#5-scope-of-the-project)
6. [System Overview](#6-system-overview)
7. [Architecture](#7-architecture)
8. [Technology Stack and Justification](#8-technology-stack-and-justification)
9. [Smart Contract Design](#9-smart-contract-design)
10. [Database Design](#10-database-design)
11. [Certificate Issuance — Detailed Workflow](#11-certificate-issuance--detailed-workflow)
12. [Certificate Verification — Detailed Workflow](#12-certificate-verification--detailed-workflow)
13. [Frontend Application](#13-frontend-application)
14. [Backend API and Business Logic](#14-backend-api-and-business-logic)
15. [Security Measures](#15-security-measures)
16. [Testing and Validation](#16-testing-and-validation)
17. [Live Demonstration Script for Faculty](#17-live-demonstration-script-for-faculty)
18. [Results and Outcomes](#18-results-and-outcomes)
19. [Limitations](#19-limitations)
20. [Future Enhancements](#20-future-enhancements)
21. [Conclusion](#21-conclusion)
22. [References and Further Reading](#22-references-and-further-reading)

---

## 1. Executive Summary

**BlockCert** is a full-stack web platform that enables academic institutions to issue digital certificates (PDF format) whose authenticity can be verified independently by any third party — particularly employers — without contacting the college for manual confirmation.

The core innovation is a **dual-layer trust model**:

1. **Off-chain layer (MySQL + file storage):** Stores the PDF, student metadata, and a locally computed SHA-256 hash.
2. **On-chain layer (Polygon blockchain):** Stores only the cryptographic hash and certificate identifier in an immutable smart contract (`CertificateRegistry.sol`).

When an employer verifies a certificate, the system **recalculates** the hash from the stored PDF, **retrieves** the hash from the blockchain, and **compares** both against the database record. If all three match, the certificate is marked **VERIFIED (Authentic)**. Any modification to the PDF after issuance causes a mismatch and the result becomes **TAMPERED**.

The project demonstrates practical integration of:

- Modern web development (React, Node.js, REST APIs)
- Relational database design (MySQL, Sequelize ORM)
- Blockchain development (Solidity, Hardhat, ethers.js)
- Information security (JWT, bcrypt, rate limiting, input validation)

---

## 2. Problem Statement

Academic certificate fraud is a widespread problem. Common issues include:

| Problem | Impact |
|---------|--------|
| Forged certificates | Unqualified candidates gain employment |
| Manual verification | HR departments call colleges; slow and costly |
| Photocopied / edited PDFs | Visual inspection cannot detect subtle tampering |
| Centralized trust | Verifier must trust the college's internal database alone |
| No audit trail | Colleges cannot prove when or how often a certificate was verified |

Traditional solutions — email verification, printed holograms, or proprietary portals — are either **slow**, **expensive**, or **not independently verifiable**.

**Research question addressed by BlockCert:**

> *How can a college issue digital certificates such that any employer can cryptographically verify their authenticity using blockchain as an immutable trust anchor, without storing sensitive student data on-chain?*

---

## 3. Objectives

### 3.1 Primary Objectives

1. **Design and implement** a web-based certificate issuance system for college administrators.
2. **Compute SHA-256 hashes** of certificate PDFs server-side to create tamper-evident fingerprints.
3. **Register hashes on a blockchain** smart contract to provide immutable proof of issuance.
4. **Generate QR codes** linking to a public verification page.
5. **Enable employer verification** without login, returning a clear authentic/tampered result.
6. **Maintain audit logs** for verifications and administrative actions.

### 3.2 Secondary Objectives

1. Implement role-based access control (Admin vs Employer).
2. Provide interactive API documentation (Swagger).
3. Support local development (Hardhat) and testnet deployment (Polygon Amoy).
4. Apply production-grade security practices (Helmet, rate limiting, validation).
5. Deliver comprehensive documentation and automated tests.

### 3.3 Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Issuance works end-to-end | PDF upload → hash → blockchain tx → QR → status `ON_CHAIN` |
| Verification is accurate | Unmodified PDF returns `VERIFIED`; modified PDF returns `TAMPERED` |
| Public access | `/verify/:id` works without authentication |
| Security | JWT auth, bcrypt passwords, rate-limited login |
| Test coverage | 17 contract tests + 28 backend tests passing |

---

## 4. Existing System vs Proposed System

### 4.1 Existing (Traditional) Approach

```
Student receives paper/PDF certificate
        ↓
Employer contacts college registrar
        ↓
Manual lookup in college records (days/weeks)
        ↓
Verbal/written confirmation — no cryptographic proof
```

**Weaknesses:** Slow, labour-intensive, no tamper detection on PDFs, single point of trust.

### 4.2 Proposed (BlockCert) Approach

```
Admin uploads PDF → SHA-256 computed → hash on blockchain
        ↓
QR code printed on certificate
        ↓
Employer scans QR → instant verification
        ↓
System compares PDF hash vs DB vs blockchain
        ↓
Result: VERIFIED or TAMPERED (with hash audit details)
```

**Strengths:** Instant verification, cryptographic tamper detection, immutable blockchain anchor, full audit trail.

### 4.3 Comparison Table

| Aspect | Traditional | BlockCert |
|--------|-------------|-----------|
| Verification time | Hours to days | Seconds |
| Tamper detection | Manual / none | SHA-256 cryptographic |
| Trust model | Trust college only | Trust college + blockchain |
| Cost per verification | Staff time | Automated (gas fee on issuance only) |
| Audit trail | Often absent | `verification_logs` + `audit_logs` |
| Student PII on blockchain | N/A | **Not stored** (privacy by design) |

---

## 5. Scope of the Project

### 5.1 In Scope

- Admin dashboard for certificate upload and management
- PDF validation (MIME type + magic-byte `%PDF` check)
- SHA-256 hashing and duplicate detection
- Smart contract for hash registration and on-chain verification
- QR code generation with verification URL
- Public verification page with hash audit breakdown
- MySQL database with migrations and seeds
- REST API with Swagger documentation
- Local Hardhat development environment
- Polygon Amoy testnet deployment path
- Security middleware and audit logging

### 5.2 Out of Scope (Future Work)

- IPFS / decentralized PDF storage (currently local filesystem)
- Student self-service portal
- Multi-institution federation
- Mobile native apps (web-responsive UI only)
- Mainnet deployment and production DevOps
- Digital signatures on PDF (PKI / DocuSign integration)

---

## 6. System Overview

BlockCert consists of **three cooperating packages** in a monorepo:

```mermaid
flowchart LR
    subgraph Frontend
        UI[BlockCert Verifier UI]
    end

    subgraph Backend
        API[Express REST API]
    end

    subgraph Blockchain
        HH[Hardhat / Polygon Amoy]
        SC[CertificateRegistry.sol]
    end

    UI -->|JSON over HTTP| API
    API -->|Sequelize| DB[(MySQL)]
    API -->|ethers.js v6| SC
    SC --> HH
    API --> FS[PDF + QR Storage]
```

### 6.1 Actors

| Actor | Role | Access |
|-------|------|--------|
| **College Admin** | Uploads certificates, views dashboard, deletes records | JWT + ADMIN role |
| **Employer** | Verifies certificates via QR or web | Public (no login) |
| **Backend Service** | Hashes PDFs, signs blockchain transactions | Server-side wallet |
| **Smart Contract** | Stores hashes immutably | On-chain, owner-only write |

### 6.2 Key Design Principle: Privacy on Chain

The smart contract stores **only**:

- Certificate ID (bytes32)
- SHA-256 hash (bytes32)
- Issuance timestamp
- Issuer wallet address

It does **not** store student names, emails, courses, or PDF content. This reduces gas costs, protects privacy, and aligns with GDPR-style data minimization principles.

---

## 7. Architecture

### 7.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients
        ADMIN[College Admin Browser]
        EMP[Employer Browser]
        QR[QR Code Scanner]
    end

    subgraph Frontend["Frontend — TanStack Start + React 19"]
        ROUTES[File-based Routes]
        RQ[TanStack Query]
        AXIOS[Axios API Client]
    end

    subgraph Backend["Backend — Express + Node.js"]
        ROUTES2[REST Routes /api/v1]
        AUTH[JWT + RBAC Middleware]
        VALID[Zod Validation]
        SVC[Service Layer]
        REPO[Sequelize Repositories]
    end

    subgraph Storage
        MYSQL[(MySQL 8 — port 3307)]
        FILES[Local PDF / QR Storage]
    end

    subgraph Blockchain
        ETHERS[ethers.js v6]
        CONTRACT[CertificateRegistry.sol]
        CHAIN[Hardhat / Polygon Amoy]
    end

    ADMIN --> ROUTES
    EMP --> ROUTES
    QR --> ROUTES
    ROUTES --> RQ --> AXIOS
    AXIOS -->|HTTPS REST| ROUTES2
    ROUTES2 --> AUTH --> VALID --> SVC
    SVC --> REPO --> MYSQL
    SVC --> FILES
    SVC --> ETHERS --> CONTRACT --> CHAIN
```

### 7.2 Layered Architecture (Backend)

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| **Presentation** | HTTP routing, Swagger UI | `routes/index.ts`, controllers |
| **Application** | Business rules, orchestration | `certificate.service.ts`, `auth.service.ts` |
| **Domain** | Models, validators | Sequelize models, Zod schemas |
| **Infrastructure** | External systems | MySQL, filesystem, blockchain RPC |

This separation ensures that blockchain logic, database access, and HTTP handling remain independently testable.

### 7.3 Data Flow Summary

**Issuance:** Admin → Frontend → Backend → [Hash PDF] → MySQL → Blockchain → QR → Response

**Verification:** Employer → Frontend → Backend → [Read PDF, Hash, Query Chain] → Compare → Log → Response

---

## 8. Technology Stack and Justification

### 8.1 Frontend — `@blockcert/frontend`

| Technology | Purpose | Why chosen |
|------------|---------|------------|
| **TanStack Start** | Full-stack React framework | Modern routing, SSR-capable, file-based routes |
| **React 19** | UI library | Industry standard, component reusability |
| **TanStack Query** | Server state caching | Efficient API data fetching, cache invalidation |
| **Axios** | HTTP client | Interceptors for JWT, upload progress |
| **Tailwind CSS v4** | Styling | Rapid UI development, consistent design |
| **shadcn/ui** | Component library | Accessible, customizable UI primitives |
| **Zod + React Hook Form** | Form validation | Type-safe login and upload forms |

### 8.2 Backend — `@blockcert/backend`

| Technology | Purpose | Why chosen |
|------------|---------|------------|
| **Node.js + Express** | REST API server | Lightweight, well-documented, large ecosystem |
| **TypeScript** | Type safety | Catch errors at compile time |
| **Sequelize ORM** | Database access | Migrations, models, MySQL support |
| **MySQL 8** | Relational storage | ACID compliance, familiar to institutions |
| **JWT (HS256)** | Authentication | Stateless admin sessions |
| **bcrypt** | Password hashing | Industry-standard slow hash (12 rounds) |
| **Zod** | Request validation | Schema validation for all inputs |
| **Winston** | Logging | Structured logs to files |
| **Swagger** | API docs | Interactive documentation for evaluators |
| **Multer** | File uploads | Multipart PDF handling |

### 8.3 Blockchain — `@blockcert/blockchain`

| Technology | Purpose | Why chosen |
|------------|---------|------------|
| **Solidity 0.8.24** | Smart contract language | Ethereum-compatible, mature tooling |
| **Hardhat** | Development framework | Local node, testing, deployment scripts |
| **OpenZeppelin Ownable** | Access control | Audited, battle-tested ownership pattern |
| **ethers.js v6** | Backend blockchain client | Modern API, Polygon-compatible |
| **Polygon Amoy** | Testnet | Low-cost EVM chain, Ethereum-compatible |

### 8.4 DevOps and Tooling

| Tool | Purpose |
|------|---------|
| **Docker Compose** | MySQL container (host port 3307) |
| **npm workspaces** | Monorepo dependency management |
| **Vitest** | Backend unit and integration tests |
| **Hardhat Test** | Smart contract unit tests |

---

## 9. Smart Contract Design

### 9.1 Contract: `CertificateRegistry.sol`

**Location:** `blockchain/contracts/CertificateRegistry.sol`

**Inheritance:** OpenZeppelin `Ownable` — only the contract owner (backend wallet) can issue certificates.

### 9.2 On-Chain Data Structure

```solidity
struct Certificate {
    bytes32 hash;       // SHA-256 of PDF (as bytes32)
    uint256 issuedAt;   // Block timestamp
    address issuer;     // msg.sender at issuance
    bool exists;        // Existence flag
}
```

**Mappings:**
- `_certificates[certificateId]` → Certificate record
- `_hashRegistered[hash]` → prevents duplicate hash registration

### 9.3 Core Functions

| Function | Access | Description |
|----------|--------|-------------|
| `issueCertificate(bytes32 id, bytes32 hash)` | Owner only | Registers a new certificate hash |
| `verifyCertificate(bytes32 id)` | Public (view) | Returns stored hash and existence |
| `getCertificate(bytes32 id)` | Public (view) | Returns full on-chain record |
| `totalIssued()` | Public (view) | Count of issued certificates |

### 9.4 Events (for transparency)

- `CertificateIssued(certificateId, hash, issuer, issuedAt)`
- `CertificateVerified(certificateId, hash, verifier, verifiedAt)`

### 9.5 ID and Hash Encoding

The backend converts:

- **Certificate UUID** → `bytes32` via `keccak256(uuid string)`
- **SHA-256 hex string** → `bytes32` (left-padded to 32 bytes)

This allows the off-chain UUID (used in QR codes) to map deterministically to on-chain keys.

### 9.6 Gas and Cost Considerations

Only a **hash** is stored on-chain (~32 bytes + metadata), not the PDF. Issuance cost is a single transaction per certificate. Verification reads are **free** (view calls, no gas for the verifier).

---

## 10. Database Design

### 10.1 Entity Relationship Overview

```
users (1) ──── issues ──── (N) certificates (1) ──── (N) verification_logs
                                    │
                                    └── audit_logs (admin actions)
```

### 10.2 Table: `users`

| Column | Description |
|--------|-------------|
| `id` | UUID primary key |
| `name` | Display name |
| `email` | Unique login identifier |
| `password` | bcrypt hash (never plaintext) |
| `role` | `ADMIN` or `EMPLOYER` |

**Seeded accounts for demonstration:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@blockcert.edu | Admin@123456 |
| Employer | employer@blockcert.edu | Employer@123456 |

### 10.3 Table: `certificates`

Stores all certificate metadata and blockchain linkage.

| Column | Description |
|--------|-------------|
| `certificate_id` | Public UUID (used in QR and verify URL) |
| `student_name`, `course`, `department`, `issue_date` | Academic metadata |
| `sha256_hash` | Unique 64-char hex hash of PDF |
| `pdf_path` | Server path to stored PDF |
| `blockchain_tx` | Transaction hash from `issueCertificate` |
| `contract_address` | Deployed registry address |
| `verification_status` | `PENDING` → `ON_CHAIN` or `FAILED` |

### 10.4 Table: `verification_logs`

Every employer verification attempt is recorded:

| Column | Description |
|--------|-------------|
| `certificate_id` | FK to certificates |
| `result` | `VERIFIED` or `TAMPERED` |
| `verified_by_ip` | Client IP (optional) |
| `verified_time` | Timestamp |

### 10.5 Table: `audit_logs`

Administrative actions for compliance:

- Login success / failure
- Certificate upload
- Certificate deletion

---

## 11. Certificate Issuance — Detailed Workflow

### 11.1 Step-by-Step Process

```mermaid
flowchart TD
    A[Admin opens /admin/upload] --> B[Select PDF + enter student metadata]
    B --> C[POST /api/v1/upload with JWT]
    C --> D{PDF valid?}
    D -->|No| E[400 — invalid or empty PDF]
    D -->|Yes| F[Compute SHA-256 of PDF bytes]
    F --> G{Duplicate hash in DB or chain?}
    G -->|Yes| H[409 — certificate already exists]
    G -->|No| I[Save PDF to uploads/certificates/]
    I --> J[Insert MySQL row — status PENDING]
    J --> K[Estimate gas for issueCertificate]
    K --> L[Send blockchain transaction]
    L --> M{Transaction confirmed?}
    M -->|No| N[Update status FAILED]
    M -->|Yes| O[Store tx hash, contract address, wallet]
    O --> P[Update status ON_CHAIN]
    P --> Q[Generate QR code PNG]
    Q --> R[Return certificate + verification URL]
    R --> S[Admin views certificate in dashboard]
```

### 11.2 Metadata Captured at Upload

| Field | Required | Example |
|-------|----------|---------|
| PDF file | Yes | `btech-cse-alice.pdf` |
| Student name | Yes | Alice Johnson |
| Student email | No | alice@university.edu |
| Course | Yes | B.Tech Computer Science |
| Department | Yes | Computer Science & Engineering |
| Issue date | Yes | 2024-06-15 |

### 11.3 QR Code Content

The QR encodes a URL of the form:

```
http://localhost:5173/verify/{certificate_id}
```

In production, `FRONTEND_URL` in backend `.env` would point to the deployed domain.

---

## 12. Certificate Verification — Detailed Workflow

### 12.1 Verification Logic (Core Algorithm)

```
storedHash    = hash from MySQL record
recalcHash    = SHA-256(current PDF file on disk)
chainHash     = hash from CertificateRegistry.verifyCertificate()

IF recalcHash == storedHash AND recalcHash == chainHash AND PDF readable:
    result = VERIFIED  ("Authentic Certificate")
ELSE:
    result = TAMPERED  ("Certificate Tampered")
```

### 12.2 Sequence Diagram

```mermaid
sequenceDiagram
    actor Employer
    participant FE as Frontend
    participant API as Backend
    participant DB as MySQL
    participant FS as PDF Storage
    participant BC as Smart Contract

    Employer->>FE: Scan QR → /verify/:id
    FE->>API: GET /verify/:id (public)
    API->>DB: Load certificate by certificate_id
    DB-->>API: Row with sha256_hash, pdf_path
    API->>FS: Read PDF file
    API->>API: Recalculate SHA-256
    API->>BC: getCertificate(id) — view call
    BC-->>API: On-chain hash
    API->>API: Compare all three hashes
    API->>DB: Insert verification_log
    API-->>FE: Result + hashAudit + history
    FE-->>Employer: VERIFIED or TAMPERED UI
```

### 12.3 Hash Audit Response (Transparency for Faculty)

The API returns a detailed audit object so evaluators can see **why** a result was reached:

```json
{
  "status": "VERIFIED",
  "message": "Authentic Certificate",
  "onChain": true,
  "hashAudit": {
    "recalculatedHash": "abc123...",
    "storedHash": "abc123...",
    "blockchainHash": "abc123...",
    "hashMatchesChain": true,
    "hashMatchesStored": true,
    "pdfAvailable": true
  },
  "verificationHistory": [...]
}
```

### 12.4 Tamper Demonstration (for Viva)

To demonstrate tamper detection live:

1. Verify a certificate → shows **VERIFIED**
2. Manually edit the PDF file on disk (or re-upload a modified copy under a new ID and compare)
3. Verify again → shows **TAMPERED** because `recalculatedHash ≠ storedHash`

---

## 13. Frontend Application

### 13.1 Application Name

**BlockCert Verifier** — TanStack Start web application.

### 13.2 Page Structure

| Route | User | Function |
|-------|------|----------|
| `/` | Public | Landing page explaining the system |
| `/verify` | Public | Manual certificate ID entry |
| `/verify/:id` | Public | Full verification result with hash audit |
| `/login` | Public | Admin authentication |
| `/admin/dashboard` | Admin | Statistics, network info, recent certificates |
| `/admin/upload` | Admin | Issue new certificate (multipart upload) |
| `/admin/certificates` | Admin | Paginated list with status badges |
| `/admin/certificates/:id` | Admin | Detail view, PDF/QR download, delete |

### 13.3 Authentication Flow

1. Admin enters email and password on `/login`
2. Frontend calls `POST /api/v1/login`
3. JWT token stored in `localStorage` (`blockcert_token`)
4. Axios interceptor attaches `Authorization: Bearer <token>` to admin requests
5. Admin routes redirect to `/login` if unauthenticated or non-admin

### 13.4 UI Design Highlights

- Clean, professional interface suitable for institutional use
- Status badges: `ON_CHAIN`, `PENDING`, `FAILED`, `VERIFIED`, `TAMPERED`
- Copy-to-clipboard for certificate IDs and transaction hashes
- Responsive layout for mobile QR scanning scenarios

---

## 14. Backend API and Business Logic

### 14.1 API Base URL

```
http://localhost:5000/api/v1
```

### 14.2 Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Service health check |
| GET | `/health/blockchain` | Public | RPC connectivity, chain ID, contract |
| POST | `/login` | Public | Returns JWT + user profile |
| GET | `/me` | JWT | Current user |
| GET | `/dashboard` | Admin | Aggregated statistics |
| POST | `/upload` | Admin | Issue certificate (multipart) |
| GET | `/certificates` | Admin | Paginated list |
| GET | `/certificate/:id` | JWT | Single certificate |
| DELETE | `/certificate/:id` | Admin | Delete certificate + files |
| GET | `/verify/:id` | Public | Verify authenticity |
| GET | `/docs` | Public | Swagger UI |

### 14.3 Response Envelope

All successful API responses follow:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

### 14.4 Blockchain Service Features

- Automatic retry with exponential backoff on transient RPC errors
- Gas estimation with configurable buffer (default 20%)
- Transaction timeout and confirmation waiting
- Deployment verification on startup
- Nonce management for sequential transactions

---

## 15. Security Measures

### 15.1 Authentication and Authorization

| Measure | Implementation |
|---------|----------------|
| Password storage | bcrypt, 12 rounds |
| Session tokens | JWT, HS256 algorithm pinned |
| Role-based access | `ADMIN` vs `EMPLOYER` middleware |
| Login brute-force protection | Rate limit: 10 attempts / 15 min |

### 15.2 Input Validation and Sanitization

- **Zod schemas** for all request bodies and query parameters
- **PDF magic-byte validation** — rejects non-PDF files even if MIME is spoofed
- **XSS sanitization** on string inputs
- **UUID validation** on certificate ID parameters

### 15.3 Network Security

- **Helmet** — security headers (CSP in production)
- **CORS** — origin whitelist; localhost allowed in development
- **Origin guard** — CSRF-aware check on state-changing requests
- **Rate limiting** — global, login, and verify endpoints

### 15.4 Data Integrity

- **Duplicate hash detection** — application, database unique constraint, and on-chain mapping
- **Immutable blockchain anchor** — hash cannot be altered after issuance without detection
- **Audit logs** — persistent record of admin actions

### 15.5 What Is NOT Stored in Plaintext

- User passwords (bcrypt only)
- Private keys (environment variables only, never in code)
- Student PII on blockchain (by design)

Full security documentation: [backend/docs/SECURITY.md](../backend/docs/SECURITY.md)

---

## 16. Testing and Validation

### 16.1 Test Summary

| Suite | Framework | Count | Location |
|-------|-----------|-------|----------|
| Smart contract | Hardhat + Chai | **17 tests** | `blockchain/test/` |
| Backend unit | Vitest | Multiple files | `backend/tests/unit/` |
| Backend integration | Vitest + Supertest | API endpoints | `backend/tests/integration/` |
| **Total backend** | Vitest | **28 tests** | `backend/tests/` |

### 16.2 Contract Tests Cover

- Deployment and ownership
- Certificate issuance (happy path)
- Duplicate hash rejection
- Duplicate ID rejection
- Verification view function
- Non-owner cannot issue
- Event emission

### 16.3 Integration Tests Cover

- Health endpoints
- Login validation
- Protected route rejection without JWT
- Verify endpoint with invalid UUID
- 404 handling

### 16.4 Manual End-to-End Validation

The following flow was verified on the development environment:

1. ✅ MySQL connection (Docker, port 3307)
2. ✅ Hardhat local node + contract deployment
3. ✅ Admin login with CORS from frontend
4. ✅ Dashboard statistics load
5. ✅ Certificate list and detail
6. ✅ Public verification returns `VERIFIED`
7. ✅ PDF upload registers hash `ON_CHAIN`
8. ✅ Frontend production build succeeds

Run tests:

```bash
npm test
```

---

## 17. Live Demonstration Script for Faculty

Use this script during the presentation (estimated 10–15 minutes).

### Phase 1 — Introduction (2 min)

1. Explain the problem of certificate fraud and manual verification delays.
2. Show the architecture diagram (Section 7.1).
3. Emphasize: **only hashes go on blockchain, not PDFs or student names**.

### Phase 2 — Start the System (1 min)

```bash
npm start
```

Open the URL shown in terminal (typically `http://localhost:5173`).

Optionally seed demo data (if not already done):

```bash
npm run seed:demo
```

### Phase 3 — Admin Issuance (3 min)

1. Navigate to **Admin Login**.
2. Sign in: `admin@blockcert.edu` / `Admin@123456`.
3. Show **Dashboard** — total certificates, on-chain count, network info.
4. Go to **Upload** — upload a sample PDF from `demo/samples/`.
5. Fill student metadata and submit.
6. Show certificate detail — QR code, transaction hash, status `ON_CHAIN`.
7. Open Swagger at `http://localhost:5000/api/v1/docs` briefly.

### Phase 4 — Employer Verification (3 min)

1. Open **Verify** page (or scan QR / paste certificate ID).
2. Show **VERIFIED** result with green status.
3. Expand **Hash Audit** section — explain the three-way comparison.
4. Show verification history.

### Phase 5 — Tamper Detection (2 min)

Explain that if the PDF bytes change after issuance:

- Recalculated hash ≠ stored hash
- Result becomes **TAMPERED**

(Optional live demo: modify PDF on disk if time permits.)

### Phase 6 — Blockchain Proof (2 min)

1. Show `GET /health/blockchain` — chain ID, contract address.
2. Open block explorer (Amoy) if deployed to testnet, or explain Hardhat local.
3. Show smart contract source: `blockchain/contracts/CertificateRegistry.sol`.

### Phase 7 — Q&A Preparation (2 min)

Anticipated faculty questions — see Section 21 and Limitations.

---

## 18. Results and Outcomes

### 18.1 Functional Outcomes

| Requirement | Status |
|-------------|--------|
| Admin can upload PDF certificates | ✅ Implemented |
| SHA-256 hash computed server-side | ✅ Implemented |
| Hash registered on blockchain | ✅ Implemented |
| QR code with verify URL | ✅ Implemented |
| Public verification without login | ✅ Implemented |
| Tamper detection | ✅ Implemented |
| Verification audit trail | ✅ Implemented |
| Admin audit logs | ✅ Implemented |
| API documentation | ✅ Swagger |
| Automated tests | ✅ 45 total |

### 18.2 Non-Functional Outcomes

| Aspect | Achievement |
|--------|-------------|
| **Performance** | Verification completes in under 2 seconds locally |
| **Scalability** | Layered architecture supports horizontal scaling of API |
| **Security** | Industry-standard auth, validation, rate limiting |
| **Maintainability** | TypeScript, monorepo, migrations, documentation |
| **Usability** | Single-page verify flow, mobile-responsive UI |

### 18.3 Learning Outcomes for Students

Through this project, the team gained practical experience in:

- Full-stack web development with modern JavaScript/TypeScript
- REST API design and OpenAPI documentation
- Relational database modeling and ORM migrations
- Smart contract development and testing with Hardhat
- Blockchain integration using ethers.js
- Application security best practices
- DevOps basics (Docker, environment configuration, monorepo scripts)

---

## 19. Limitations

| Limitation | Explanation |
|------------|-------------|
| **Local PDF storage** | PDFs stored on server filesystem, not IPFS — single point of failure if server compromised |
| **Backend wallet trust** | Backend holds private key to issue on-chain — institutional key management needed for production |
| **Testnet only (demo)** | Polygon Amoy used for demonstration; mainnet requires real MATIC and audit |
| **No PDF digital signature** | System detects content tampering via hash, not cryptographic PDF signatures |
| **Single institution** | No multi-college registry or federation |
| **Gas dependency** | Issuance requires blockchain transaction; failed txs mark certificate `FAILED` |
| **Admin pre-seeded** | No self-registration; admins created via database seed |

---

## 20. Future Enhancements

1. **IPFS storage** — Store PDFs on decentralized storage; store IPFS CID on-chain.
2. **Multi-signature issuance** — Require registrar + dean approval before on-chain registration.
3. **Student portal** — Allow students to download their certificates and share verify links.
4. **Email notifications** — Notify student when certificate is issued.
5. **Bulk upload** — CSV + ZIP batch issuance for convocation.
6. **Mainnet deployment** — Production deployment on Polygon PoS with audited contract.
7. **Mobile app** — Native QR scanner for employers.
8. **Zero-knowledge proofs** — Verify authenticity without revealing student details.
9. **Integration APIs** — Webhooks for HR systems (SAP, Workday).
10. **Certificate revocation** — On-chain revocation list for withdrawn degrees.

---

## 21. Conclusion

BlockCert successfully demonstrates a **practical, secure, and verifiable** approach to academic certificate management using blockchain technology. By anchoring SHA-256 hashes on an immutable smart contract while keeping PDFs and personal data off-chain, the system balances **transparency**, **privacy**, and **cost efficiency**.

Employers gain **instant, independent verification** without contacting the college. Institutions gain an **audit trail** and **tamper-evident** issuance process. The modular monorepo architecture ensures the system is **maintainable**, **testable**, and **extensible** for future production deployment.

The project meets its stated objectives and provides a solid foundation for real-world adoption with the future enhancements outlined above.

---

## 22. References and Further Reading

### Project Documentation

| Document | Path |
|----------|------|
| Main README | [../README.md](../README.md) |
| Installation Guide | [INSTALLATION.md](./INSTALLATION.md) |
| API Reference | [API.md](./API.md) |
| Architecture Diagrams | [diagrams/ARCHITECTURE.md](./diagrams/ARCHITECTURE.md) |
| Flow Diagrams | [diagrams/FLOW_DIAGRAM.md](./diagrams/FLOW_DIAGRAM.md) |
| Sequence Diagrams | [diagrams/SEQUENCE_DIAGRAM.md](./diagrams/SEQUENCE_DIAGRAM.md) |
| Database Schema | [../backend/docs/DATABASE.md](../backend/docs/DATABASE.md) |
| Blockchain Integration | [../backend/docs/BLOCKCHAIN_INTEGRATION.md](../backend/docs/BLOCKCHAIN_INTEGRATION.md) |
| Security Guide | [../backend/docs/SECURITY.md](../backend/docs/SECURITY.md) |
| Smart Contract Spec | [../blockchain/docs/CONTRACT.md](../blockchain/docs/CONTRACT.md) |

### External References

1. NIST FIPS 180-4 — Secure Hash Standard (SHA-256)
2. Ethereum Yellow Paper — Account and transaction model
3. OpenZeppelin Contracts — Ownable access control
4. OWASP — Authentication and session management guidelines
5. Polygon Documentation — Amoy testnet and RPC endpoints
6. Hardhat Documentation — Local Ethereum development environment

---

## Appendix A — Glossary

| Term | Definition |
|------|------------|
| **SHA-256** | Cryptographic hash function producing a 256-bit fingerprint of data |
| **Smart Contract** | Self-executing code deployed on a blockchain |
| **Gas** | Fee paid to execute blockchain transactions |
| **JWT** | JSON Web Token — signed token for stateless authentication |
| **QR Code** | Quick Response code encoding a URL for mobile scanning |
| **Polygon Amoy** | Ethereum-compatible testnet for Polygon (Chain ID 80002) |
| **Hardhat** | Local Ethereum development node for testing |
| **Immutable** | Data that cannot be changed after being written to blockchain |
| **Tamper-evident** | System that detects unauthorized modification of data |

---

## Appendix B — Hardware and Software Requirements

### Minimum Development Machine

| Component | Requirement |
|-----------|-------------|
| CPU | 4 cores |
| RAM | 8 GB |
| Storage | 2 GB free |
| OS | Windows 10+, macOS 12+, or Linux |
| Node.js | 20 or higher |
| Docker Desktop | For MySQL container |

### Ports Used (Local Development)

| Port | Service |
|------|---------|
| 5173 | Frontend (Vite dev server) |
| 5000 | Backend API |
| 3307 | MySQL (Docker host mapping) |
| 8545 | Hardhat local blockchain node |

---

## Appendix C — Sample Viva Questions and Answers

**Q1: Why store only the hash on blockchain and not the full PDF?**

> Storing PDFs on-chain is prohibitively expensive and exposes student data publicly. A SHA-256 hash is 32 bytes, cheap to store, and any change to the PDF produces a different hash — enabling tamper detection without uploading the document itself.

**Q2: What happens if the backend server is hacked and PDFs are deleted?**

> Verification would fail because the PDF cannot be recalculated. The on-chain hash still proves the original issuance occurred, but full verification requires the original PDF. Future IPFS integration would mitigate this.

**Q3: Can someone issue fake certificates on the contract?**

> Only the contract owner (backend wallet) can call `issueCertificate`. The private key must be secured. The contract uses OpenZeppelin `Ownable` to enforce this.

**Q4: How is this different from simply storing hashes in a database?**

> A database administrator can alter records. Blockchain hashes are immutable once confirmed — any database tampering would cause a mismatch with the on-chain value, which the verifier can detect.

**Q5: What is the cost per certificate on Polygon?**

> On testnet, gas is free (faucet MATIC). On mainnet, storing a hash costs a small fraction of a cent on Polygon due to low gas fees compared to Ethereum mainnet.

---

*End of document — BlockCert Project Presentation Guide*
