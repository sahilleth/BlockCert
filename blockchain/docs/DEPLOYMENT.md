# CertificateRegistry — Deployment Guide (Polygon Amoy)

This guide walks through compiling, testing, deploying, and verifying the **CertificateRegistry** smart contract on **Polygon Amoy testnet**.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Node.js | ≥ 20 |
| Wallet | MetaMask with a dedicated deployer account |
| Test MATIC | Fund wallet from [Polygon Faucet](https://faucet.polygon.technology/) |
| Polygonscan API key | [polygonscan.com](https://polygonscan.com/myapikey) (works for Amoy) |

---

## 1. Install Dependencies

```bash
cd blockchain
npm install
```

---

## 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PRIVATE_KEY=your_private_key_without_0x
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your_api_key
```

> **Security:** Never commit `.env` or share your private key.

---

## 3. Compile

```bash
npm run compile
```

Outputs:
- `artifacts/` — bytecode + ABI
- `typechain-types/` — TypeScript bindings

Export ABI only:

```bash
npm run export:abi
```

Outputs:
- `abi/CertificateRegistry.json`
- `backend/src/abi/CertificateRegistry.json`

---

## 4. Run Unit Tests

```bash
npm test
```

Tests cover:
- Owner-only issuance
- Duplicate `certificateId` rejection
- Duplicate hash rejection
- Zero hash rejection
- `getCertificate` view reads
- `verifyCertificate` event emission
- Ownership transfer

---

## 5. Deploy to Polygon Amoy

```bash
npm run deploy:amoy
```

Expected output:

```
═══════════════════════════════════════════════════════
 BlockCert — CertificateRegistry Deployment
═══════════════════════════════════════════════════════
Network  : amoy
Chain ID : 80002
Deployer : 0xYourAddress...
Contract : 0xDeployedContractAddress...
Owner    : 0xYourAddress...
═══════════════════════════════════════════════════════
Saved    : deployments/amoy.json
Saved    : abi/CertificateRegistry.json
```

---

## 6. Update Backend `.env`

Copy the deployed address:

```env
CONTRACT_ADDRESS=0xDeployedContractAddress...
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=same_owner_wallet_private_key
CHAIN_ID=80002
```

The backend wallet **must be the contract owner** (deployer) to call `issueCertificate`.

---

## 7. Verify on Polygonscan

```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS>
```

View on: `https://amoy.polygonscan.com/address/<CONTRACT_ADDRESS>`

---

## 8. Local Development (Optional)

Terminal 1 — local Hardhat node:

```bash
npm run node
```

Terminal 2 — deploy locally:

```bash
npm run deploy:local
```

Uses chain ID `31337`. Deployment saved to `deployments/localhost.json`.

---

## Network Configuration

| Network | Chain ID | RPC |
|---------|----------|-----|
| Hardhat | 31337 | Built-in |
| Localhost | 31337 | `http://127.0.0.1:8545` |
| Polygon Amoy | 80002 | `https://rpc-amoy.polygon.technology` |

Configured in `hardhat.config.ts`.

---

## Contract Functions (Quick Reference)

| Function | Access | Gas | Description |
|----------|--------|-----|-------------|
| `issueCertificate(id, hash)` | Owner only | ~80k | Register SHA-256 hash |
| `verifyCertificate(id)` | Anyone | ~30k | Verify + emit event |
| `getCertificate(id)` | Anyone | Free (view) | Read hash without event |
| `isHashRegistered(hash)` | Anyone | Free (view) | Check duplicate hash |
| `isCertificateIssued(id)` | Anyone | Free (view) | Check if ID exists |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `insufficient funds` | Get Amoy MATIC from faucet |
| `OwnableUnauthorizedAccount` | Backend wallet is not contract owner |
| `duplicate certificateId` | UUID already issued — use new certificate |
| `duplicate hash` | Same PDF hash already on-chain |
| `Invalid API Key` on verify | Set `POLYGONSCAN_API_KEY` in `.env` |

---

## File Outputs After Deploy

```
blockchain/
├── abi/CertificateRegistry.json       ← ABI + bytecode
├── deployments/amoy.json              ← Address + metadata
├── deployments/latest.json              ← Latest deployment pointer
└── artifacts/.../CertificateRegistry.json
```
