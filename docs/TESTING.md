# Testing Guide

## Run All Tests

```bash
npm test
```

Runs smart contract tests (Hardhat) and backend tests (Vitest).

---

## Smart Contract Tests

```bash
npm run test:contracts
# or
cd blockchain && npm test
```

**Location:** `blockchain/test/CertificateRegistry.test.ts`

**Coverage (17 tests):**

| Category | Tests |
|----------|-------|
| Deployment | Owner assignment, zero initial count |
| issueCertificate | Hash storage, events, duplicate rejection |
| Access control | Non-owner revert |
| View functions | getCertificate, isHashRegistered, totalIssued |
| verifyCertificate | Event emission |

Uses Hardhat local network — no external dependencies.

---

## Backend Unit Tests

```bash
npm run test:unit --workspace=@blockcert/backend
```

**Location:** `backend/tests/unit/`

| File | Tests |
|------|-------|
| `sanitize.util.test.ts` | XSS string cleaning |
| `hash.util.test.ts` | SHA-256, bytes32 conversion |
| `file-validation.util.test.ts` | PDF magic bytes, filename rules |
| `validators.test.ts` | Zod schema validation |
| `jwt.test.ts` | HS256 sign/verify, tamper rejection |

No database required.

---

## Backend Integration Tests

```bash
npm run test:integration --workspace=@blockcert/backend
```

**Location:** `backend/tests/integration/api.test.ts`

Uses **supertest** against `createApp()`:

- Health endpoint
- Login validation errors
- Auth-required routes
- Invalid UUID rejection
- 404 handling

Some tests query MySQL (login failure). Ensure MySQL is running or expect graceful 401/500.

---

## Manual E2E Test Checklist

1. `npm run setup && npm start`
2. `npm run seed:demo`
3. Login at http://localhost:5173/login
4. View certificates in admin dashboard
5. Open verify URL from seed output
6. Confirm **Authentic Certificate** status
7. Check tx on explorer (Amoy) or Hardhat logs (local)
8. Modify PDF on disk → verify shows **Tampered**

---

## Test Configuration

| File | Purpose |
|------|---------|
| `backend/vitest.config.ts` | Vitest settings |
| `backend/tests/setup.ts` | Test env vars |
| `blockchain/hardhat.config.ts` | Hardhat test network |

---

## CI Suggestion

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: blockcert
          MYSQL_USER: blockcert
          MYSQL_PASSWORD: blockcert123
    steps:
      - uses: actions/checkout@v4
      - run: npm install --legacy-peer-deps
      - run: npm run db:migrate --workspace=@blockcert/backend
      - run: npm test
```
