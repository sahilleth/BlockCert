# Polygon Amoy Setup

**Polygon Amoy** is Polygon's public testnet (replacing Mumbai). BlockCert stores certificate SHA-256 hashes on this network.

---

## Network Details

| Property | Value |
|----------|-------|
| Network Name | Polygon Amoy Testnet |
| Chain ID | `80002` |
| RPC URL | `https://rpc-amoy.polygon.technology` |
| Explorer | https://amoy.polygonscan.com |
| Currency | MATIC (test) |
| Faucet | https://faucet.polygon.technology/ |

---

## Setup Checklist

### 1. Wallet & MATIC

- [ ] MetaMask installed ([guide](./METAMASK_SETUP.md))
- [ ] Polygon Amoy network added (Chain ID 80002)
- [ ] Test MATIC received from faucet

### 2. Environment variables

**`blockchain/.env`:**

```env
PRIVATE_KEY=your_deployer_private_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your_api_key
```

**`backend/.env`:**

```env
RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_backend_wallet_private_key
CONTRACT_ADDRESS=0x...   # after deployment
CHAIN_ID=80002
```

> Use the **same wallet** for deploy and backend, or transfer contract ownership after deployment.

### 3. Deploy contract

```bash
cd blockchain
npm run compile
npm run deploy:amoy
```

Deployment record saved to `blockchain/deployments/amoy.json`.

### 4. Configure backend

Copy `contractAddress` from deployment JSON to `backend/.env`:

```env
CONTRACT_ADDRESS=0xYourDeployedAddress
```

Export ABI:

```bash
npm run export:abi --workspace=@blockcert/blockchain
```

### 5. Verify on Polygonscan (optional)

```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS>
```

Requires `POLYGONSCAN_API_KEY` in `blockchain/.env`.

### 6. Test blockchain health

```bash
curl http://localhost:5000/api/v1/health/blockchain
```

Expected response includes `"chainId": 80002`, `"contractDeployed": true`, `"isOwner": true`.

---

## Architecture on Amoy

Only the **SHA-256 hash** is stored on-chain — no PDF, no student PII:

```
PDF bytes → SHA-256 → issueCertificate(certId, hash) → Polygon Amoy
```

Verify on explorer:

```
https://amoy.polygonscan.com/tx/{blockchain_tx}
```

See also: `backend/docs/BLOCKCHAIN_INTEGRATION.md`
