# Entity-Relationship Diagram

## Mermaid ER Diagram

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : "performs"
    CERTIFICATES ||--o{ VERIFICATION_LOGS : "has"
    
    USERS {
        uuid id PK
        varchar name
        varchar email UK
        varchar password
        enum role "ADMIN | EMPLOYER"
        datetime created_at
    }

    CERTIFICATES {
        uuid id PK
        uuid certificate_id UK "public QR ID"
        varchar student_name
        varchar student_email
        varchar course
        varchar department
        date issue_date
        varchar pdf_path
        char sha256_hash UK
        varchar blockchain_tx
        varchar contract_address
        varchar wallet_address
        enum verification_status "PENDING | ON_CHAIN | FAILED"
        datetime created_at
    }

    VERIFICATION_LOGS {
        uuid id PK
        uuid certificate_id FK
        varchar verified_by_ip
        datetime verified_time
        enum result "VERIFIED | TAMPERED | NOT_FOUND"
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK "nullable"
        enum action "LOGIN_SUCCESS | LOGIN_FAILED | CERTIFICATE_UPLOAD | CERTIFICATE_DELETE"
        varchar resource_type
        varchar resource_id
        varchar ip_address
        varchar user_agent
        json metadata
        datetime created_at
    }
```

---

## Relationships

| From | To | Cardinality | Description |
|------|-----|-------------|-------------|
| `users` | `audit_logs` | 1:N | Admin actions tracked with optional user FK |
| `certificates` | `verification_logs` | 1:N | Each verify attempt logged |
| `users` | `certificates` | — | No direct FK; issuer tracked via blockchain `wallet_address` |

---

## Key Design Decisions

1. **`certificate_id` vs `id`** — Internal `id` is the DB primary key. Public `certificate_id` (UUID) appears in QR codes and URLs — never expose internal `id`.

2. **`sha256_hash` unique** — Prevents duplicate PDF issuance at database level.

3. **No PII on blockchain** — Only the 32-byte hash is stored in `CertificateRegistry.sol`.

4. **Verification logs append-only** — Employers cannot delete verification history.

5. **Audit logs separate from verification logs** — Admin actions (login, upload, delete) vs public verification scans.

---

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `users` | `email` UNIQUE | Fast login lookup |
| `certificates` | `certificate_id` UNIQUE | QR lookup |
| `certificates` | `sha256_hash` UNIQUE | Duplicate detection |
| `certificates` | `blockchain_tx` | Explorer link lookup |
| `verification_logs` | `certificate_id` | History queries |
| `audit_logs` | `user_id`, `action`, `created_at` | Compliance queries |

See `backend/docs/DATABASE.md` for full column documentation.
