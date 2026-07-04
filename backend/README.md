# BlockCert Backend API

Production-ready Node.js Express API with MVC architecture, JWT auth, RBAC, Sequelize ORM, blockchain integration, and Swagger documentation.

## Architecture

```
Request → Middlewares → Routes → Controllers → Services → Repositories → MySQL
                                              ↘ Blockchain Service → Polygon Amoy
```

## Quick Start

```bash
cd backend
npm install --legacy-peer-deps
cp .env.example .env
docker compose up -d mysql   # from project root
npm run db:migrate && npm run db:seed
npm run dev
```

- API: `http://localhost:5000/api/v1`
- Swagger: `http://localhost:5000/api/v1/docs`
- Health: `http://localhost:5000/api/v1/health`

**Default admin:** `admin@blockcert.edu` / `Admin@123456`

## API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/login` | Public | — | JWT login |
| GET | `/me` | JWT | Any | Current user profile |
| POST | `/upload` | JWT | ADMIN | Upload PDF, hash, chain, QR |
| GET | `/certificates` | JWT | ADMIN | List certificates |
| GET | `/certificate/:id` | JWT | ADMIN, EMPLOYER | Get certificate |
| DELETE | `/certificate/:id` | JWT | ADMIN | Delete certificate |
| GET | `/verify/:id` | Public | — | Verify authenticity |
| GET | `/dashboard` | JWT | ADMIN | Dashboard statistics |
| GET | `/docs` | Public | — | Swagger UI |
| GET | `/health` | Public | — | Health check |

## Folder Structure

```
src/
├── config/          # env, database, jwt, swagger
├── controllers/     # HTTP handlers (thin)
├── services/        # Business logic
├── repositories/    # Data access layer
├── models/          # Sequelize models
├── middlewares/     # auth, rbac, validate, upload, logger, errors
├── validators/      # Zod schemas
├── routes/          # Route definitions
├── utils/           # hash, qr, logger, asyncHandler, response
├── errors/          # AppError hierarchy
└── abi/             # Smart contract ABI
```

## Upload Pipeline

1. Multer saves PDF to `uploads/certificates/`
2. SHA-256 hash computed from file bytes
3. Metadata saved to MySQL (status: PENDING)
4. Smart contract `issueCertificate(id, hash)` called on Polygon Amoy
5. Transaction hash + wallet address saved (status: ON_CHAIN)
6. QR code PNG generated at `uploads/qrcodes/{certificateId}.png`

## Verification Flow

1. `GET /verify/:id` (public, no auth)
2. Fetch certificate from MySQL
3. Read on-chain hash via `getCertificate()` view call
4. Compare DB hash vs chain hash
5. Log result to `verification_logs`
6. Return `VERIFIED` or `TAMPERED`

## Environment Variables

See `.env.example` for full list.

## Logging

Winston logs to console + `logs/combined.log` + `logs/error.log`.
Every request gets an `X-Request-Id` for traceability.
