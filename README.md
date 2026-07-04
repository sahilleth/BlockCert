# BlockCert

**Blockchain-based academic certificate verification**

BlockCert lets colleges issue PDF certificates whose **SHA-256 fingerprints** are anchored on a blockchain (local Hardhat or **Polygon Amoy**). Employers verify authenticity by scanning a QR code — the system compares the PDF hash against the database and the on-chain record.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Polygon](https://img.shields.io/badge/Network-Polygon_Amoy-8247E5?logo=polygon&logoColor=white)](https://polygon.technology/)

---

## Table of contents

- [Why BlockCert](#why-blockcert)
- [Quick start](#quick-start)
- [Demo credentials](#demo-credentials)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Development](#development)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Testing](#testing)
- [Deploying to Polygon Amoy](#deploying-to-polygon-amoy)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## Why BlockCert

Traditional certificate verification depends on calling the issuing institution or checking paper seals — slow, manual, and easy to forge. BlockCert adds a **cryptographic trust layer**:

1. Each PDF gets a unique SHA-256 hash.
2. That hash is written to a smart contract (`CertificateRegistry.sol`).
3. Anyone can verify by ID or QR — no login required.
4. If the PDF is altered, the hash no longer matches → **Certificate Tampered**.

---

## Quick start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | ≥ 20 | Runtime |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | MySQL 8 |
| Git | Any | Clone the repo |

### One-command setup & run

```bash
git clone <repository-url> blockcert
cd blockcert

npm run setup    # install deps, env files, MySQL, migrate, seed, compile contracts
npm start        # Hardhat node → deploy contract → backend → frontend
```

In a **second terminal**, upload sample certificates:

```bash
npm run seed:demo
```

### Open the app

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 (or the next free port Vite prints) |
| **API** | http://localhost:5000/api/v1 |
| **Swagger** | http://localhost:5000/api/v1/docs |
| **Health** | http://localhost:5000/api/v1/health |

> **Note:** There is no admin registration. Admins are seeded into the database — use the [demo credentials](#demo-credentials) below.

---

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@blockcert.edu` | `Admin@123456` |
| Employer | `employer@blockcert.edu` | `Employer@123456` |

After login, admins can upload certificates, view the dashboard, and manage records. Employers use the public verify flow (no login required).

---

## How it works

```
Admin uploads PDF
       │
       ▼
Backend computes SHA-256 hash
       │
       ├──► Metadata saved to MySQL
       │
       └──► Hash registered on blockchain (CertificateRegistry)
                 │
                 ▼
            QR code generated → links to /verify/:id
                 │
                 ▼
Employer scans QR or enters certificate ID
                 │
                 ▼
Backend recalculates PDF hash + fetches on-chain hash
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  VERIFIED            TAMPERED
(Authentic)      (Hash mismatch)
```

---

## Architecture

```mermaid
flowchart TB
    subgraph clients [Clients]
        Admin[College Admin]
        Employer[Employer / Verifier]
    end

    subgraph frontend [Frontend — TanStack Start]
        UI[BlockCert Verifier UI]
    end

    subgraph backend [Backend — Express API]
        API[REST API]
        Hash[SHA-256 Engine]
        QR[QR Generator]
    end

    subgraph storage [Storage]
        DB[(MySQL)]
        Files[PDF + QR Files]
    end

    subgraph chain [Blockchain]
        SC[CertificateRegistry.sol]
    end

    Admin --> UI
    Employer --> UI
    UI -->|HTTPS / JSON| API
    API --> Hash
    API --> QR
    API --> DB
    API --> Files
    API -->|ethers.js v6| SC
```

More diagrams: [Architecture](docs/diagrams/ARCHITECTURE.md) · [ER](docs/diagrams/ER_DIAGRAM.md) · [Flow](docs/diagrams/FLOW_DIAGRAM.md) · [Sequence](docs/diagrams/SEQUENCE_DIAGRAM.md)

---

## Tech stack

| Layer | Package | Technologies |
|-------|---------|--------------|
| **Frontend** | `@blockcert/frontend` | TanStack Start, React 19, TanStack Router, React Query, Axios, Tailwind CSS v4, shadcn/ui |
| **Backend** | `@blockcert/backend` | Node.js, Express, Sequelize, MySQL, JWT, bcrypt, Zod, Winston, Swagger |
| **Blockchain** | `@blockcert/blockchain` | Solidity 0.8.24, Hardhat, OpenZeppelin, ethers.js v6 |
| **Infrastructure** | — | Docker Compose (MySQL), npm workspaces |

---

## Project structure

```
blockcert/
├── frontend/              @blockcert/frontend   TanStack Start UI
│   └── src/routes/        File-based routes (/, /login, /verify, /admin/*)
├── backend/               @blockcert/backend    Express REST API
│   ├── src/               Controllers, services, middleware
│   ├── database/          Sequelize migrations & seeds
│   └── docs/              Database, security, blockchain guides
├── blockchain/            @blockcert/blockchain Hardhat + CertificateRegistry.sol
├── demo/                  Sample PDF generator & certificate files
├── docs/                  Installation, API, deployment guides
├── scripts/
│   ├── setup.mjs          One-command project setup
│   ├── start.mjs          Start Hardhat + backend + frontend
│   └── seed-demo.mjs      Upload demo certificates via API
├── docker-compose.yml     MySQL 8 (host port 3307)
└── package.json           npm workspaces root
```

### Frontend routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/verify` | Public | Enter certificate ID to verify |
| `/verify/:id` | Public | Verification result + hash audit |
| `/login` | Public | Admin sign-in |
| `/admin/dashboard` | Admin | Stats, recent certificates |
| `/admin/upload` | Admin | Issue new certificate |
| `/admin/certificates` | Admin | Paginated certificate list |
| `/admin/certificates/:id` | Admin | Certificate detail, PDF/QR download |

---

## Development

### Run services individually

```bash
npm run db:up              # Start MySQL container
npm run dev:blockchain     # Hardhat local node (port 8545)
npm run deploy:local       # Deploy contract to local node
npm run dev:backend        # Express API (port 5000)
npm run dev:frontend       # Vite dev server (port 5173)
```

### Database

MySQL runs in Docker on **host port 3307** (mapped from container 3306):

```bash
npm run db:migrate         # Apply migrations
npm run db:seed            # Seed admin + employer accounts
```

| Table | Purpose |
|-------|---------|
| `users` | Admin and employer accounts |
| `certificates` | Metadata, hash, blockchain tx, status |
| `verification_logs` | Every public verification attempt |
| `audit_logs` | Admin actions (login, upload, delete) |

### Build for production

```bash
npm run build              # frontend + backend
npm run build:frontend     # TanStack Start → .output/
npm run build:backend      # TypeScript → dist/
```

### Useful scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Full first-time setup |
| `npm start` | Start blockchain + backend + frontend together |
| `npm run seed:demo` | Upload 3 sample certificates |
| `npm run generate:samples` | Regenerate PDF files in `demo/samples/` |
| `npm run compile:contracts` | Compile Solidity + export ABI |
| `npm run deploy:local` | Deploy to local Hardhat |
| `npm run deploy:amoy` | Deploy to Polygon Amoy testnet |
| `npm test` | Run all test suites |

---

## Environment variables

Copy the example files (or let `npm run setup` do it):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp blockchain/.env.example blockchain/.env
```

### Backend (`backend/.env`)

| Variable | Local dev | Amoy testnet |
|----------|-----------|--------------|
| `DATABASE_URL` | `mysql://blockcert:blockcert123@localhost:3307/blockcert` | Same pattern |
| `JWT_SECRET` | Min 32 characters | Strong random secret |
| `RPC_URL` | `http://127.0.0.1:8545` | `https://rpc-amoy.polygon.technology` |
| `CHAIN_ID` | `31337` | `80002` |
| `CONTRACT_ADDRESS` | Set by `npm start` / deploy | From `blockchain/deployments/amoy.json` |
| `PRIVATE_KEY` | Hardhat account #0 (local only) | Your wallet private key |
| `FRONTEND_URL` | `http://localhost:5173` | Your deployed frontend URL |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` |
| `VITE_CHAIN_ID` | `31337` (local) or `80002` (Amoy) |
| `VITE_CHAIN_NAME` | Display name for the network |
| `VITE_EXPLORER_URL` | Block explorer base URL (empty for local) |

---

## API overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | — | Service health |
| GET | `/health/blockchain` | — | Chain connectivity |
| POST | `/login` | — | JWT authentication |
| GET | `/me` | JWT | Current user profile |
| GET | `/dashboard` | Admin | Statistics |
| POST | `/upload` | Admin | Issue certificate (multipart PDF) |
| GET | `/certificates` | Admin | Paginated list |
| GET | `/certificate/:id` | JWT | Certificate details |
| DELETE | `/certificate/:id` | Admin | Delete certificate |
| GET | `/verify/:id` | — | Public verification |

Interactive docs: **http://localhost:5000/api/v1/docs**

Full reference: [docs/API.md](docs/API.md)

---

## Testing

```bash
npm test                   # All tests
npm run test:contracts     # 17 Hardhat tests
npm run test:backend       # 28 Vitest tests (unit + integration)
```

| Suite | Location | Tests |
|-------|----------|-------|
| Smart contract | `blockchain/test/` | 17 |
| Backend unit | `backend/tests/unit/` | Hash, auth, validation |
| Backend integration | `backend/tests/integration/` | HTTP endpoints |

Guide: [docs/TESTING.md](docs/TESTING.md)

---

## Deploying to Polygon Amoy

Local development uses Hardhat. For testnet:

1. Install [MetaMask](https://metamask.io/) and add Polygon Amoy (Chain ID `80002`).
2. Get test MATIC from the [Polygon Faucet](https://faucet.polygon.technology/).
3. Set `PRIVATE_KEY`, `RPC_URL`, and `CHAIN_ID` in `blockchain/.env` and `backend/.env`.
4. Deploy:

```bash
npm run deploy:amoy
# Copy contractAddress from blockchain/deployments/amoy.json → backend/.env
```

| Property | Value |
|----------|-------|
| Chain ID | `80002` |
| RPC | `https://rpc-amoy.polygon.technology` |
| Explorer | https://amoy.polygonscan.com |

Guides: [MetaMask Setup](docs/METAMASK_SETUP.md) · [Polygon Amoy Setup](docs/POLYGON_AMOY_SETUP.md) · [Hardhat Deployment](docs/HARDHAT_DEPLOYMENT.md)

---

## Troubleshooting

### "Network Error" or "Cannot reach the API" on login

- Ensure the backend is running: `curl http://localhost:5000/api/v1/health`
- Use the frontend URL Vite prints in the terminal (may be `5174` if `5173` is busy).
- In development, any `localhost` port is allowed for CORS. Restart the backend after env changes.

### MySQL connection refused

- Start Docker: `npm run db:up`
- Confirm port **3307** in `DATABASE_URL` (matches `docker-compose.yml`).
- Wait for healthy status: `docker ps`

### Blockchain registration failed

- For local dev, use `npm start` — it starts Hardhat, deploys the contract, and updates `backend/.env`.
- Check: `curl http://localhost:5000/api/v1/health/blockchain`

### Certificate shows TAMPERED

- The PDF file was modified after issuance, or the on-chain hash does not match.
- Re-upload the original PDF or verify the correct certificate ID.

---

## Security

- Helmet headers + CSP (production)
- Tiered rate limiting (global, login, verify)
- CORS origin validation
- JWT with HS256 algorithm pinning
- bcrypt password hashing (12 rounds)
- Zod validation + XSS sanitization
- PDF magic-byte validation
- Duplicate hash detection
- Persistent audit logs

Full guide: [backend/docs/SECURITY.md](backend/docs/SECURITY.md)

---

## Documentation

| Topic | Link |
|-------|------|
| **Faculty presentation & project report** | [docs/PROJECT_PRESENTATION.md](docs/PROJECT_PRESENTATION.md) |
| **Railway deployment (live hosting)** | [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md) |
| Installation (detailed) | [docs/INSTALLATION.md](docs/INSTALLATION.md) |
| MySQL setup | [docs/MYSQL_SETUP.md](docs/MYSQL_SETUP.md) |
| API reference | [docs/API.md](docs/API.md) |
| Testing | [docs/TESTING.md](docs/TESTING.md) |
| Blockchain integration | [backend/docs/BLOCKCHAIN_INTEGRATION.md](backend/docs/BLOCKCHAIN_INTEGRATION.md) |
| Smart contract spec | [blockchain/docs/CONTRACT.md](blockchain/docs/CONTRACT.md) |
| All docs index | [docs/README.md](docs/README.md) |

---

## License

MIT — see [LICENSE](LICENSE) if present in the repository.
