# BlockCert Security Guide

Production-level security measures implemented in the backend and how each one works.

---

## 1. Helmet — HTTP Security Headers

**File:** `src/app.ts`

Helmet sets response headers that harden the API against common browser attacks:

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Restricts script/style/load sources (production only) |
| `Strict-Transport-Security` | Forces HTTPS for 1 year (production only) |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options: DENY` | Blocks clickjacking via iframes |
| `Referrer-Policy` | Limits referrer leakage |

Static PDF routes also set `nosniff` so browsers won't execute disguised content.

---

## 2. Rate Limiting

**Files:** `src/middlewares/rate-limit.middleware.ts`, `src/routes/index.ts`

Three tiers prevent abuse:

| Limiter | Route | Default | Purpose |
|---------|-------|---------|---------|
| Global | All routes | 200 / 15 min | General DoS protection |
| Login | `POST /login` | 10 / 15 min | Brute-force credential attacks |
| Verify | `GET /verify/:id` | 60 / 15 min | Certificate enumeration / scraping |

Failed logins count toward the limit; successful logins are skipped (`skipSuccessfulRequests`).

Configure via `RATE_LIMIT_*`, `LOGIN_RATE_LIMIT_*`, `VERIFY_RATE_LIMIT_*` env vars.

---

## 3. CORS — Cross-Origin Resource Sharing

**File:** `src/app.ts`

Only whitelisted browser origins may call the API with credentials:

```env
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://app.blockcert.edu
```

Non-browser clients (curl, mobile apps) don't send `Origin` and are allowed. Unknown origins receive a CORS error.

---

## 4. JWT — JSON Web Tokens

**Files:** `src/config/jwt.ts`, `src/middlewares/auth.middleware.ts`

- Tokens signed with `JWT_SECRET` (min 32 chars; 64+ recommended in production)
- Algorithm **pinned to HS256** — prevents algorithm-confusion attacks
- Payload: `userId`, `email`, `role`
- Expiry: `JWT_EXPIRES_IN` (default 7 days)
- Sent via `Authorization: Bearer <token>` header

Protected routes use `authenticate` middleware; admin routes add `adminOnly`.

---

## 5. bcrypt — Password Hashing

**File:** `src/models/User.ts`

- **12 rounds** (OWASP-recommended minimum)
- Hashing in Sequelize `beforeCreate` / `beforeUpdate` hooks
- Plaintext never stored; `validatePassword()` uses `bcrypt.compare()`
- Login returns generic "Invalid email or password" — no user enumeration via message

---

## 6. Input Validation — Zod Schemas

**Files:** `src/validators/*`, `src/middlewares/validate.middleware.ts`

Every user input is validated before reaching services:

| Input | Schema |
|-------|--------|
| Login body | Email format, password length 1–128 |
| Upload metadata | Name/course/department length + date format |
| URL params | UUID format for certificate IDs |
| Query params | Pagination bounds (limit max 100) |

Invalid input returns `400` with structured field errors — never processed.

---

## 7. SQL Injection Prevention

**Files:** `src/repositories/*`, Sequelize models

All database access uses **Sequelize ORM** with parameterized queries:

```typescript
Certificate.findOne({ where: { certificateId } });
```

User input is passed as bound parameters, never concatenated into SQL. No raw `sequelize.query()` in runtime API code.

---

## 8. XSS Prevention — Cross-Site Scripting

**Files:** `src/utils/sanitize.util.ts`, `src/validators/certificate.validator.ts`

Defense in depth:

1. **Input sanitization** — strips HTML tags, `javascript:` URLs, event handlers (`onclick=`)
2. **JSON API** — responses are `application/json`, not HTML
3. **Helmet CSP** — limits inline scripts in production
4. **Frontend responsibility** — React escapes by default; never use `dangerouslySetInnerHTML` with user data

Certificate fields (`studentName`, `course`, etc.) are sanitized on upload.

---

## 9. CSRF Awareness

**File:** `src/middlewares/security.middleware.ts` → `originGuard`

Classic CSRF targets **cookie-based sessions**. BlockCert uses **Bearer JWT in headers**, so browsers cannot auto-attach auth to cross-site requests.

`originGuard` adds defense-in-depth: on `POST`/`PUT`/`PATCH`/`DELETE`, if the browser sends an `Origin` or `Referer` header, it must match `ALLOWED_ORIGINS`. Blocks cross-site form submissions that might accompany future cookie auth.

---

## 10. File Upload Validation

**Files:** `src/middlewares/upload.middleware.ts`, `src/middlewares/security.middleware.ts`, `src/utils/file-validation.util.ts`

Multi-layer upload pipeline:

```
Multer → MIME check → extension check → magic-byte PDF check → Zod body validation
```

| Check | What it blocks |
|-------|----------------|
| File count | Multiple files in one request |
| Extension | Only `.pdf` |
| MIME type | Only `application/pdf` (configurable) |
| Magic bytes | Files renamed to `.pdf` that aren't real PDFs (`%PDF` header) |
| Empty file | Zero-byte uploads |
| Filename | Path traversal (`../`) |

Invalid files are **deleted from disk immediately**.

---

## 11. Maximum Upload Size

**Files:** `src/config/env.ts`, `src/middlewares/upload.middleware.ts`

```env
MAX_FILE_SIZE_MB=10
```

Multer enforces `fileSize` limit. Exceeding it returns `400: File exceeds 10MB limit`.

Separate from JSON body limit (`1mb` in `app.ts`).

---

## 12. Allowed MIME Types

**File:** `src/config/env.ts`

```env
ALLOWED_MIME_TYPES=application/pdf
```

Comma-separated list checked in multer `fileFilter`. Client-declared MIME is not trusted alone — combined with magic-byte validation.

---

## 13. Duplicate Certificate Detection

**Files:** `src/services/certificate.service.ts`, DB migration

Three layers prevent re-issuing the same certificate:

1. **Application** — `findBySha256Hash()` before insert; temp file deleted on conflict
2. **Database** — unique index on `sha256_hash` column (race-condition backstop)
3. **Blockchain** — `isHashRegistered()` pre-check + contract revert on duplicate

Conflict returns `409: This certificate PDF has already been issued`.

---

## 14. Secure Environment Variables

**Files:** `src/config/env.ts`, `src/config/security.config.ts`, `.env.example`, `.gitignore`

| Measure | Detail |
|---------|--------|
| Zod validation | All env vars validated at startup; process exits on failure |
| `.gitignore` | `.env` never committed |
| `.env.example` | Documents vars without real secrets |
| Weak secret block | Production rejects known default `JWT_SECRET` values |
| JWT length | Minimum 32 characters enforced |
| Private key | Stored in env; use secrets manager (AWS/GCP/Vault) in production |

Never log `PRIVATE_KEY`, `JWT_SECRET`, or passwords.

---

## 15. Audit Logs

**Files:** `src/models/AuditLog.ts`, `src/services/audit.service.ts`, migration `20250704120004`

Persistent audit trail in `audit_logs` table:

| Action | Trigger |
|--------|---------|
| `LOGIN_SUCCESS` | Successful authentication |
| `LOGIN_FAILED` | Wrong email or password |
| `CERTIFICATE_UPLOAD` | Admin issues certificate |
| `CERTIFICATE_DELETE` | Admin deletes certificate |

Each record stores: `user_id`, `action`, `resource_type`, `resource_id`, `ip_address`, `user_agent`, `metadata` (JSON), `created_at`.

Audit writes are **fire-and-forget** — failures are logged but don't block API responses.

**Verification logs** (`verification_logs` table) separately track every employer verification attempt with IP and result (`VERIFIED` / `TAMPERED`).

**Winston** file logs (`logs/combined.log`, `logs/error.log`) capture HTTP requests and operational events.

---

## Security Checklist for Production

```bash
# 1. Set strong secrets
JWT_SECRET=$(openssl rand -hex 64)

# 2. Restrict CORS
ALLOWED_ORIGINS=https://your-frontend.com

# 3. Run migrations (includes audit_logs)
npm run db:migrate

# 4. Enable HTTPS (reverse proxy — nginx, ALB)
# Helmet HSTS activates automatically when NODE_ENV=production

# 5. Never expose Swagger publicly without auth
# Consider disabling /docs in production or adding IP allowlist
```

---

## File Map

| File | Security role |
|------|---------------|
| `app.ts` | Helmet, CORS, rate limit, body limits |
| `config/security.config.ts` | Centralized security settings |
| `config/env.ts` | Env validation |
| `config/jwt.ts` | JWT sign/verify with algorithm pinning |
| `middlewares/rate-limit.middleware.ts` | Tiered rate limits |
| `middlewares/security.middleware.ts` | Origin guard, PDF validation |
| `middlewares/upload.middleware.ts` | Multer size/MIME/extension |
| `middlewares/auth.middleware.ts` | JWT authentication |
| `middlewares/rbac.middleware.ts` | Role-based access |
| `validators/*` | Zod input validation + sanitization |
| `utils/sanitize.util.ts` | XSS string cleaning |
| `utils/file-validation.util.ts` | PDF magic bytes |
| `services/audit.service.ts` | Persistent audit logging |
| `models/AuditLog.ts` | Audit log schema |
