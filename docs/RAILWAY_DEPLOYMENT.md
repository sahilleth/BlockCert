# Railway Deployment Guide — BlockCert

Deploy BlockCert to production using [Railway](https://railway.com). This guide covers:

1. **Backend API** (Express + MySQL + file uploads + Polygon Amoy)
2. **Frontend UI** (TanStack Start / Nitro)
3. **MySQL database** and **persistent volume** for PDFs

Repository: [github.com/sahilleth/BlockCert](https://github.com/sahilleth/BlockCert)

---

## Architecture on Railway

```
┌─────────────────────┐         ┌──────────────────────────────┐
│  Frontend Service   │  HTTPS  │  Backend Service             │
│  (Dockerfile.       │ ──────► │  (Dockerfile.backend)        │
│   frontend)         │         │  + Volume @ /data/uploads    │
└─────────────────────┘         └───────────┬──────────────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              │  MySQL (Railway plugin)   │
                              └───────────────────────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              │  Polygon Amoy (external)  │
                              └───────────────────────────┘
```

**Alternative:** Host frontend on [Vercel](https://vercel.com) and only run backend + MySQL on Railway (cheaper / simpler).

---

## Prerequisites

Before deploying:

| Requirement | Action |
|-------------|--------|
| GitHub repo | [sahilleth/BlockCert](https://github.com/sahilleth/BlockCert) pushed |
| Railway account | Sign up at [railway.com](https://railway.com) |
| MetaMask wallet | With Polygon Amoy testnet configured |
| Test MATIC | From [Polygon Faucet](https://faucet.polygon.technology/) |
| Smart contract | Deploy once: `npm run deploy:amoy` (from your machine) |

Save the contract address from `blockchain/deployments/amoy.json` — you will need it for backend env vars.

---

## Step 1 — Create Railway Project

1. Go to [railway.com/new](https://railway.com/new)
2. Click **Deploy from GitHub repo**
3. Select **sahilleth/BlockCert**
4. Railway creates an initial service — you can delete/rename it later

---

## Step 2 — Add MySQL Database

1. In your Railway project, click **+ New**
2. Choose **Database → MySQL**
3. Wait until the MySQL service shows **Active**
4. Open the MySQL service → **Variables** tab
5. Note these variables (Railway generates them):
   - `MYSQL_URL` or `DATABASE_URL` (depends on Railway version)
   - `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

### Link MySQL to Backend

When you create the backend service (Step 3), use **Variable Reference**:

```
DATABASE_URL = ${{MySQL.MYSQL_URL}}
```

Or construct manually:

```
mysql://USER:PASSWORD@HOST:PORT/railway
```

> Sequelize expects a `mysql://` URL. If Railway gives `mysql2://`, change the prefix to `mysql://`.

---

## Step 3 — Deploy Backend API

### 3.1 Create backend service

1. **+ New → GitHub Repo → BlockCert** (same repo, second service)
2. Rename service to `blockcert-api`

### 3.2 Configure build (Docker)

1. Open **blockcert-api → Settings**
2. **Build → Builder:** Dockerfile
3. **Dockerfile path:** `Dockerfile.backend`
4. Or set **Config-as-code path:** `railway.backend.toml`

### 3.3 Add persistent volume (required for PDFs)

Without a volume, uploaded PDFs are **lost on every redeploy**.

1. **blockcert-api → Settings → Volumes**
2. Click **Add Volume**
3. Mount path: `/data/uploads`
4. Set env var on the service:

```
UPLOAD_DIR=/data/uploads
```

### 3.4 Backend environment variables

Open **blockcert-api → Variables** and set:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `5000` | Railway may override with `$PORT` — Express reads `env.PORT` |
| `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` | Reference MySQL plugin |
| `JWT_SECRET` | *(64+ random chars)* | Generate: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` | Optional |
| `API_PREFIX` | `/api/v1` | Default |
| `FRONTEND_URL` | `https://YOUR-FRONTEND.up.railway.app` | Set after frontend deploy |
| `ALLOWED_ORIGINS` | `https://YOUR-FRONTEND.up.railway.app` | Comma-separated if multiple |
| `RPC_URL` | `https://rpc-amoy.polygon.technology` | Polygon Amoy |
| `CHAIN_ID` | `80002` | Amoy testnet |
| `CONTRACT_ADDRESS` | `0x...` | From `deploy:amoy` |
| `PRIVATE_KEY` | *(wallet private key, no 0x)* | Must be contract **owner** |
| `UPLOAD_DIR` | `/data/uploads` | Must match volume mount |
| `MAX_FILE_SIZE_MB` | `10` | Optional |
| `ALLOWED_MIME_TYPES` | `application/pdf` | Optional |

**Do not commit these values to GitHub.** Set them only in Railway.

### 3.5 Generate public domain

1. **blockcert-api → Settings → Networking**
2. Click **Generate Domain**
3. You get something like: `https://blockcert-api-production.up.railway.app`
4. Test: `https://YOUR-API.up.railway.app/api/v1/health`

### 3.6 Seed admin user (one time)

After first successful deploy, run migrations automatically via Dockerfile. Seed the admin:

**Option A — Railway CLI (recommended)**

```bash
npm i -g @railway/cli
railway login
railway link          # select project + blockcert-api service
railway run npm run db:seed --workspace=@blockcert/backend
```

**Option B — Local with Railway DATABASE_URL**

Copy `DATABASE_URL` from Railway MySQL variables, then locally:

```bash
DATABASE_URL="mysql://..." npm run db:seed --workspace=@blockcert/backend
```

Default admin after seed:

- Email: `admin@blockcert.edu`
- Password: `Admin@123456`

**Change this password** before sharing the live URL publicly.

---

## Step 4 — Deploy Frontend

### 4.1 Create frontend service

1. **+ New → GitHub Repo → BlockCert** (third service)
2. Rename to `blockcert-web`

### 4.2 Configure build (Docker)

1. **Build → Dockerfile path:** `Dockerfile.frontend`
2. Or config-as-code: `railway.frontend.toml`

### 4.3 Frontend build-time variables

These are baked in at **build** time (Vite). Set as Railway **Variables** on the frontend service:

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://blockcert-api-production.up.railway.app/api/v1` |
| `VITE_CHAIN_ID` | `80002` |
| `VITE_CHAIN_NAME` | `Polygon Amoy` |
| `VITE_EXPLORER_URL` | `https://amoy.polygonscan.com` |
| `VITE_APP_NAME` | `BlockCert` |
| `VITE_APP_TAGLINE` | `Blockchain Certificate Verification` |

> **Important:** After changing `VITE_*` vars, **redeploy** the frontend — they are embedded at build time.

Also set runtime vars:

| Variable | Value |
|----------|-------|
| `HOST` | `0.0.0.0` |
| `NODE_ENV` | `production` |

Railway sets `PORT` automatically — Nitro reads it.

### 4.4 Generate frontend domain

1. **blockcert-web → Settings → Networking → Generate Domain**
2. Example: `https://blockcert-web-production.up.railway.app`

### 4.5 Update backend CORS

Go back to **blockcert-api → Variables** and update:

```
FRONTEND_URL=https://blockcert-web-production.up.railway.app
ALLOWED_ORIGINS=https://blockcert-web-production.up.railway.app
```

Redeploy backend (or restart) so QR codes and CORS use the live frontend URL.

---

## Step 5 — Deploy Smart Contract (if not done)

From your **local machine** (not Railway):

```bash
git clone https://github.com/sahilleth/BlockCert.git
cd BlockCert
npm install --legacy-peer-deps

# Set blockchain/.env:
# PRIVATE_KEY=your_deployer_key
# AMOY_RPC_URL=https://rpc-amoy.polygon.technology

npm run deploy:amoy
```

Copy `contractAddress` from `blockchain/deployments/amoy.json` → Railway backend `CONTRACT_ADDRESS`.

The **same wallet** (or a wallet you `transferOwnership` to) must be used as backend `PRIVATE_KEY`.

---

## Step 6 — Verify Live Deployment

### Health checks

```bash
# API
curl https://YOUR-API.up.railway.app/api/v1/health

# Blockchain connectivity
curl https://YOUR-API.up.railway.app/api/v1/health/blockchain
```

Expected blockchain health:

```json
{
  "success": true,
  "data": {
    "ready": true,
    "chainId": 80002,
    "contractAddress": "0x...",
    "isOwner": true
  }
}
```

If `isOwner: false`, the backend wallet is not the contract owner — uploads will fail.

### Full flow test

1. Open frontend URL → **Admin Login**
2. Sign in with seeded admin credentials
3. **Upload** a sample PDF from `demo/samples/`
4. Confirm status **ON_CHAIN**
5. Open **Verify** page with the certificate ID → **VERIFIED**

---

## Environment Variable Checklist

Copy this checklist when configuring Railway:

### Backend (`blockcert-api`)

```
[ ] NODE_ENV=production
[ ] DATABASE_URL → MySQL reference
[ ] JWT_SECRET → strong random
[ ] FRONTEND_URL → frontend Railway URL
[ ] ALLOWED_ORIGINS → frontend Railway URL
[ ] RPC_URL=https://rpc-amoy.polygon.technology
[ ] CHAIN_ID=80002
[ ] CONTRACT_ADDRESS=0x...
[ ] PRIVATE_KEY=...
[ ] UPLOAD_DIR=/data/uploads
[ ] Volume mounted at /data/uploads
```

### Frontend (`blockcert-web`)

```
[ ] VITE_API_BASE_URL=https://...api.../api/v1
[ ] VITE_CHAIN_ID=80002
[ ] VITE_CHAIN_NAME=Polygon Amoy
[ ] VITE_EXPLORER_URL=https://amoy.polygonscan.com
[ ] HOST=0.0.0.0
```

---

## Troubleshooting

### Login shows "Network Error"

- Confirm `VITE_API_BASE_URL` points to the **backend** URL (with `/api/v1`)
- Confirm `ALLOWED_ORIGINS` on backend includes the **exact** frontend URL (https, no trailing slash mismatch)
- Redeploy frontend after changing `VITE_*` vars

### `Blockchain registration failed` on upload

- Check `/api/v1/health/blockchain` → `isOwner` must be `true`
- Ensure wallet has Amoy MATIC ([faucet](https://faucet.polygon.technology/))
- Verify `CONTRACT_ADDRESS` matches deployed contract

### MySQL connection errors

- Confirm `DATABASE_URL` references the MySQL service
- Use `mysql://` prefix (not `mysql2://`)
- Ensure MySQL service is **Active** before backend starts

### Uploads disappear after redeploy

- Volume not mounted — add volume at `/data/uploads` and set `UPLOAD_DIR=/data/uploads`

### Frontend build fails (Vite / monorepo)

- Ensure Dockerfile.frontend builds from repo root (uses workspace install)
- Check Railway build logs for Vite version conflicts

### Migrations not applied

- Backend Dockerfile runs `sequelize-cli db:migrate` on start
- Check deploy logs for migration errors
- Manually run: `railway run npx sequelize-cli db:migrate` from `backend/` directory context

---

## Alternative: Frontend on Vercel

If you prefer Vercel for the UI:

1. Deploy **only backend + MySQL** on Railway (Steps 2–3)
2. Import repo on [vercel.com](https://vercel.com)
3. Root directory: `frontend`
4. Build: `npm run build` (or `cd .. && npm run build:frontend` with root install)
5. Set `VITE_API_BASE_URL` to Railway backend URL
6. Set backend `FRONTEND_URL` / `ALLOWED_ORIGINS` to Vercel URL

---

## Cost Estimate (Railway)

Railway offers a free trial / hobby tier with usage limits. Typical BlockCert stack:

| Service | Purpose |
|---------|---------|
| blockcert-api | Backend (~512MB RAM) |
| blockcert-web | Frontend (~512MB RAM) |
| MySQL | Database |
| Volume | PDF + QR storage (~1GB) |

Monitor usage in Railway **Usage** tab. Shut down services when not demoing to save credits.

---

## Security Reminders for Production Demo

1. Change default admin password after seeding
2. Use a dedicated wallet for backend — not your main wallet
3. Never commit `.env` or private keys to GitHub
4. Use strong `JWT_SECRET` (64+ characters)
5. Amoy is a **testnet** — suitable for FYP demo, not real credentials

---

## Quick Reference — Deploy Order

```
1. Deploy smart contract to Amoy (local machine)
2. Railway: Add MySQL
3. Railway: Deploy backend (Dockerfile.backend + volume + env vars)
4. Railway: Generate API domain → test /health
5. Railway: Seed admin (railway run db:seed)
6. Railway: Deploy frontend (Dockerfile.frontend + VITE_API_BASE_URL)
7. Railway: Generate frontend domain
8. Update backend FRONTEND_URL + ALLOWED_ORIGINS
9. Test login → upload → verify
```

---

## Related Docs

- [Polygon Amoy Setup](./POLYGON_AMOY_SETUP.md)
- [MetaMask Setup](./METAMASK_SETUP.md)
- [Hardhat Deployment](./HARDHAT_DEPLOYMENT.md)
- [API Reference](./API.md)
- [Project Presentation](./PROJECT_PRESENTATION.md)
