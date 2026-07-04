# Hardhat Deployment Guide

BlockCert smart contracts are managed with **Hardhat 2.x** and **Solidity 0.8.24**.

---

## Project Structure

```
blockchain/
├── contracts/
│   └── CertificateRegistry.sol    # On-chain hash registry
├── scripts/
│   ├── deploy.ts                  # Deploy + save JSON + export ABI
│   └── export-abi.ts              # ABI → backend/src/abi/
├── test/
│   └── CertificateRegistry.test.ts
├── deployments/
│   ├── localhost.json             # Local Hardhat deployment
│   └── amoy.json                  # Polygon Amoy deployment
├── hardhat.config.ts
└── .env
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile Solidity → `artifacts/` |
| `npm run test` | Run 17 smart contract tests |
| `npm run node` | Start local Hardhat JSON-RPC (port 8545) |
| `npm run deploy:local` | Deploy to running Hardhat node |
| `npm run deploy:amoy` | Deploy to Polygon Amoy testnet |
| `npm run export:abi` | Copy ABI to backend |

From monorepo root:

```bash
npm run compile:contracts
npm run deploy:local
npm run deploy:amoy
npm run test:contracts
```

---

## Local Deployment

```bash
# Terminal 1
npm run dev:blockchain

# Terminal 2
npm run deploy:local
```

Output:

```
Contract : 0x5FbDB2315678afecb367f032d93F642f64180aa3
Owner    : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Saved    : blockchain/deployments/localhost.json
Saved    : backend/src/abi/CertificateRegistry.json
```

`npm start` automates this flow.

---

## Amoy Deployment

Prerequisites: funded wallet, `PRIVATE_KEY` in `blockchain/.env`.

```bash
npm run deploy:amoy
```

Post-deploy:

1. Copy `contractAddress` to `backend/.env` → `CONTRACT_ADDRESS`
2. Set `CHAIN_ID=80002` and `RPC_URL=https://rpc-amoy.polygon.technology`
3. Restart backend

Verify:

```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS>
```

---

## CertificateRegistry Contract

| Function | Access | Description |
|----------|--------|-------------|
| `issueCertificate(bytes32 id, bytes32 hash)` | Owner only | Register hash on-chain |
| `getCertificate(bytes32 id)` | Public view | Read stored hash |
| `isHashRegistered(bytes32 hash)` | Public view | Duplicate check |
| `verifyCertificate(bytes32 id)` | Public | Emit verification event |
| `owner()` | Public view | Current admin address |
| `totalIssued()` | Public view | Certificate count |

Events: `CertificateIssued`, `CertificateVerified`

See `blockchain/docs/CONTRACT.md` for full specification.

---

## Smart Contract Tests

```bash
npm run test:contracts
```

17 tests cover:

- Deployment and ownership
- Hash-only storage (no PDF/metadata)
- Duplicate prevention
- Access control (non-owner revert)
- View functions and events

Coverage includes gas estimation scenarios and edge cases.
