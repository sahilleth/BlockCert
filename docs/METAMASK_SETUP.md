# MetaMask Setup

MetaMask is required when deploying to **Polygon Amoy testnet** or submitting transactions from your personal wallet. For local development, Hardhat provides pre-funded accounts automatically.

---

## Step 1 — Install MetaMask

1. Visit [metamask.io](https://metamask.io/)
2. Install the browser extension (Chrome, Firefox, Brave, Edge)
3. Create a new wallet or import an existing one
4. **Save your Secret Recovery Phrase offline** — never share it

---

## Step 2 — Add Polygon Amoy Testnet

### Option A — Auto-add via Chainlist

1. Go to [chainlist.org](https://chainlist.org/?search=amoy&testnets=true)
2. Connect MetaMask
3. Click **Add to MetaMask** for **Polygon Amoy**

### Option B — Manual network configuration

| Field | Value |
|-------|-------|
| Network Name | Polygon Amoy |
| RPC URL | `https://rpc-amoy.polygon.technology` |
| Chain ID | `80002` |
| Currency Symbol | MATIC |
| Block Explorer | `https://amoy.polygonscan.com` |

---

## Step 3 — Get Test MATIC

1. Copy your wallet address from MetaMask
2. Visit [Polygon Faucet](https://faucet.polygon.technology/)
3. Select **Polygon Amoy** and paste your address
4. Request test MATIC (may take 1–2 minutes)

Verify balance in MetaMask — you need ~0.01 MATIC for contract deployment.

---

## Step 4 — Export Private Key (Backend / Hardhat)

> **Warning:** Never commit private keys. Use a dedicated hot wallet for the backend, not your main wallet.

1. MetaMask → Account details → **Show private key**
2. Copy the key (without `0x` prefix is fine)
3. Set in `blockchain/.env` and `backend/.env`:

```env
PRIVATE_KEY=your_private_key_here
```

The backend wallet **must be the contract owner** (deployer or `transferOwnership` target).

---

## Step 5 — Verify Network in App

After deploying to Amoy, update frontend `.env`:

```env
VITE_CHAIN_ID=80002
VITE_CHAIN_NAME=Polygon Amoy
VITE_EXPLORER_URL=https://amoy.polygonscan.com
```

Transaction links in the admin dashboard will point to Amoy Polygonscan.

---

## Local Development (No MetaMask Required)

`npm start` uses Hardhat's built-in account #0:

| Field | Value |
|-------|-------|
| Address | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Private Key | Hardcoded in `scripts/setup.mjs` |
| Chain ID | `31337` |
| RPC | `http://127.0.0.1:8545` |

Pre-funded with 10,000 ETH (Hardhat test ether).
