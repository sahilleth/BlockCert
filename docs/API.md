# API Documentation

Base URL: `http://localhost:5000/api/v1`

Interactive Swagger UI: **http://localhost:5000/api/v1/docs**

---

## Authentication

Protected endpoints require JWT Bearer token:

```
Authorization: Bearer <token>
```

Obtain token via `POST /login`.

---

## Endpoints

### Health

#### `GET /health`

Public health check.

**Response 200:**

```json
{
  "success": true,
  "service": "BlockCert API",
  "version": "1.0.0",
  "timestamp": "2024-07-04T12:00:00.000Z"
}
```

#### `GET /health/blockchain`

Public blockchain connection status.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "connected": true,
    "chainId": 80002,
    "expectedChainId": 80002,
    "contractAddress": "0x...",
    "contractDeployed": true,
    "walletAddress": "0x...",
    "walletBalance": "1.5",
    "isOwner": true,
    "totalIssuedOnChain": 3
  }
}
```

---

### Authentication

#### `POST /login`

Rate limited: 10 attempts / 15 min.

**Body:**

```json
{
  "email": "admin@blockcert.edu",
  "password": "Admin@123456"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "BlockCert Admin",
      "email": "admin@blockcert.edu",
      "role": "ADMIN"
    },
    "token": "eyJhbG..."
  }
}
```

#### `GET /me`

Requires JWT.

**Response 200:** Current user profile.

---

### Certificates (Admin)

#### `POST /upload`

Requires JWT + `ADMIN` role.

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `certificate` | File (PDF) | Yes |
| `studentName` | string | Yes |
| `studentEmail` | string | No |
| `course` | string | Yes |
| `department` | string | Yes |
| `issueDate` | string (YYYY-MM-DD) | Yes |

**Response 201:**

```json
{
  "success": true,
  "data": {
    "certificateId": "550e8400-e29b-41d4-a716-446655440000",
    "studentName": "Alice Johnson",
    "sha256Hash": "abc123...",
    "blockchainTx": "0x...",
    "verificationStatus": "ON_CHAIN",
    "verificationUrl": "http://localhost:5173/verify/550e8400-...",
    "qrCodeUrl": "/uploads/qrcodes/550e8400-....png"
  }
}
```

#### `GET /certificates`

Requires JWT + `ADMIN`. Query: `page`, `limit` (max 100).

#### `GET /certificate/:id`

Requires JWT + `ADMIN` or `EMPLOYER`. `:id` = public certificate UUID.

#### `DELETE /certificate/:id`

Requires JWT + `ADMIN`. Removes DB record and local files.

---

### Verification (Public)

#### `GET /verify/:id`

Rate limited: 60 / 15 min.

Compares recalculated PDF hash vs database vs blockchain.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "certificateId": "550e8400-...",
    "studentName": "Alice Johnson",
    "course": "B.Tech Computer Science",
    "status": "VERIFIED",
    "message": "Authentic Certificate",
    "onChain": true,
    "hashAudit": {
      "recalculatedHash": "abc...",
      "storedHash": "abc...",
      "blockchainHash": "abc...",
      "hashMatchesChain": true,
      "hashMatchesStored": true,
      "pdfAvailable": true
    },
    "blockchainTx": "0x...",
    "verificationHistory": []
  }
}
```

Status values: `VERIFIED` | `TAMPERED`

#### `GET /verify/:id/history`

Public verification attempt history for a certificate.

---

### Dashboard

#### `GET /dashboard`

Requires JWT + `ADMIN`. Aggregate stats: total certificates, verifications, on-chain count.

---

## Error Responses

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": ["Valid email is required"] }
}
```

| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Missing/invalid JWT |
| 403 | Insufficient role / origin blocked |
| 404 | Resource not found |
| 409 | Duplicate certificate |
| 429 | Rate limit exceeded |
| 502 | Blockchain operation failed |

---

## Postman / cURL Examples

**Login:**

```bash
curl -X POST http://localhost:5000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blockcert.edu","password":"Admin@123456"}'
```

**Upload:**

```bash
curl -X POST http://localhost:5000/api/v1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "certificate=@demo/samples/btech-cse-alice.pdf" \
  -F "studentName=Alice Johnson" \
  -F "course=B.Tech CSE" \
  -F "department=Computer Science" \
  -F "issueDate=2024-06-15"
```

**Verify:**

```bash
curl http://localhost:5000/api/v1/verify/550e8400-e29b-41d4-a716-446655440000
```
