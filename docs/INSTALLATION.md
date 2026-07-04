# Installation Guide

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | ≥ 20.0.0 | Runtime for all packages |
| **npm** | ≥ 10 | Package manager (workspaces) |
| **Docker Desktop** | Latest | MySQL 8 container |
| **Git** | Latest | Clone repository |

**Optional (Polygon Amoy production demo):**

| Requirement | Purpose |
|-------------|---------|
| MetaMask browser extension | Wallet for testnet MATIC |
| Polygon Amoy MATIC | Gas for on-chain transactions |
| Polygonscan API key | Contract verification |

---

## One-Command Setup (Recommended)

```bash
git clone <repository-url> blockcert
cd blockcert
npm run setup
```

This automatically:

1. Installs all workspace dependencies
2. Creates `.env` files from examples
3. Starts MySQL via Docker
4. Runs database migrations and seeds admin user
5. Compiles Solidity contracts and exports ABI
6. Generates sample PDF certificates

Then start everything:

```bash
npm start
```

Upload demo certificates (in a second terminal while `npm start` is running):

```bash
npm run seed:demo
```

---

## Manual Installation

### Step 1 — Clone and install

```bash
git clone <repository-url> blockcert
cd blockcert
npm install --legacy-peer-deps
```

### Step 2 — Environment configuration

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp blockchain/.env.example blockchain/.env
```

Edit each file with your values. See [Environment Variables](../README.md#environment-variables) in the root README.

### Step 3 — MySQL

```bash
docker compose up -d mysql
# Wait ~15 seconds for MySQL to be ready
npm run db:migrate
npm run db:seed
```

### Step 4 — Smart contracts

```bash
npm run compile:contracts
```

**Local development (Hardhat node):**

```bash
npm run dev:blockchain          # Terminal 1
npm run deploy:local            # Terminal 2
# Copy CONTRACT_ADDRESS from blockchain/deployments/localhost.json to backend/.env
```

**Polygon Amoy testnet:**

See [Polygon Amoy Setup](./POLYGON_AMOY_SETUP.md) and [Hardhat Deployment](./HARDHAT_DEPLOYMENT.md).

### Step 5 — Run services

```bash
npm run dev:backend             # Terminal 1 — http://localhost:5000
npm run dev:frontend            # Terminal 2 — http://localhost:5173
```

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@blockcert.edu` | `Admin@123456` |
| Employer | `employer@blockcert.edu` | `Employer@123456` |

---

## Verify Installation

| Check | URL / Command |
|-------|---------------|
| API health | http://localhost:5000/api/v1/health |
| Swagger docs | http://localhost:5000/api/v1/docs |
| Frontend | http://localhost:5173 |
| Blockchain health | http://localhost:5000/api/v1/health/blockchain |
| Run tests | `npm test` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Port 3306 already in use` | Stop local MySQL or change Docker port mapping |
| `Missing CONTRACT_ADDRESS` | Run `npm run deploy:local` or set Amoy address in `backend/.env` |
| `Blockchain verification failed` | Ensure Hardhat node is running on port 8545 |
| `EADDRINUSE :5000` | Kill process on port 5000 or change `PORT` in backend `.env` |
| Hardhat peer dependency errors | Use `npm install --legacy-peer-deps` |
