# Polygon Amoy Blockchain Integration

BlockCert backend connects to **Polygon Amoy testnet** via **ethers.js v6** to register certificate SHA-256 hashes on-chain.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RPC_URL` | Yes | JSON-RPC endpoint. Default: `https://rpc-amoy.polygon.technology` |
| `PRIVATE_KEY` | Yes | Backend hot-wallet private key (must be contract **owner**) |
| `CONTRACT_ADDRESS` | Yes | Deployed `CertificateRegistry` address (`0x` + 40 hex) |
| `CHAIN_ID` | Yes | `80002` for Polygon Amoy |
| `TX_TIMEOUT_MS` | No | Max wait for tx confirmation (default: 120000) |
| `TX_MAX_RETRIES` | No | Retry count for transient errors (default: 3) |
| `TX_RETRY_DELAY_MS` | No | Base retry delay, exponential backoff (default: 2000) |
| `GAS_LIMIT_BUFFER_PERCENT` | No | Extra gas above estimate (default: 20%) |

Legacy aliases `BLOCKCHAIN_RPC_URL` and `BLOCKCHAIN_PRIVATE_KEY` are supported.

---

## Step-by-Step: What Happens on Startup

### Step 1 — Load configuration (`config/env.ts`)

Zod validates all env vars. `RPC_URL`, `PRIVATE_KEY`, and `CONTRACT_ADDRESS` must be set.

### Step 2 — Create ethers provider (`blockchain.service.ts`)

```typescript
new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID)
```

Connects to Polygon Amoy JSON-RPC. `staticNetwork: true` avoids extra network detection calls.

### Step 3 — Load signing wallet

```typescript
new ethers.Wallet(PRIVATE_KEY, provider)
```

The backend wallet signs `issueCertificate` transactions. **Must match contract owner** (deployer or `transferOwnership` target).

### Step 4 — Bind smart contract

```typescript
new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet)
```

ABI loaded from `src/abi/CertificateRegistry.json` (exported via `npm run export:abi` in `blockchain/`).

### Step 5 — Verify deployment (`verifyDeployment()`)

On startup, the backend checks:

1. **Chain ID** — connected network matches `CHAIN_ID` (80002)
2. **Bytecode** — `provider.getCode(CONTRACT_ADDRESS)` is not empty
3. **Owner** — `contract.owner()` equals backend wallet address
4. **Balance** — wallet has MATIC for gas (logged, not blocking)
5. **totalIssued** — on-chain certificate count (informational)

If verification fails in **production**, the server exits. In **development**, it logs a warning and continues.

### Step 6 — Health endpoint

`GET /api/v1/health/blockchain` returns live deployment status anytime.

---

## Step-by-Step: Issuing a Certificate On-Chain

When admin calls `POST /upload`:

### Step A — Gas estimation

```typescript
const estimate = await contract.issueCertificate.estimateGas(certIdBytes, hashBytes);
const gasLimit = estimate * (100 + BUFFER%) / 100;
```

If estimation reverts → wallet is not owner, duplicate cert ID, or duplicate hash.

### Step B — Fee data (EIP-1559)

```typescript
const feeData = await provider.getFeeData();
// Uses maxFeePerGas + maxPriorityFeePerGas for Polygon
```

### Step C — Nonce management

```typescript
const nonce = await nonceManager.acquire();
```

`NonceManager` tracks pending nonces locally to prevent **"nonce too low"** when issuing multiple certificates in quick succession. Resets from network on retry.

### Step D — Send transaction

```typescript
contract.issueCertificate(certIdBytes, hashBytes, { gasLimit, maxFeePerGas, nonce })
```

Returns tx hash immediately — stored in MySQL as `blockchain_tx`.

### Step E — Wait for confirmation (with timeout)

```typescript
await withTimeout(tx.wait(1), TX_TIMEOUT_MS, "Transaction ...")
```

Waits for 1 confirmation. Throws if timeout exceeded.

### Step F — Store tx hash in MySQL

```typescript
certificate.update({
  blockchainTx: receipt.hash,
  blockNumber: receipt.blockNumber,
  contractAddress: CONTRACT_ADDRESS,
  walletAddress: wallet.address,
  verificationStatus: "ON_CHAIN",
})
```

---

## Retry Logic

Transient errors trigger exponential backoff retries (`TX_MAX_RETRIES`):

| Error | Retried? |
|-------|----------|
| Network timeout | Yes |
| RPC 502/503/429 | Yes |
| Nonce too low / too high | Yes (nonce reset) |
| Replacement underpriced | Yes |
| Insufficient funds | No |
| Contract revert (duplicate) | No |
| Not owner | No |

---

## Verification (Read-Only)

`getOnChainCertificate()` uses a **view call** — no gas, no wallet signature:

```typescript
contract.getCertificate(certIdBytes) → { hash, issuedAt, issuer, exists }
```

Used during employer verification to compare against recalculated PDF hash.

---

## Setup Checklist

```bash
# 1. Deploy contract (blockchain/)
cd blockchain && npm run deploy:amoy

# 2. Configure backend/.env
RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=<same wallet that deployed OR current owner>
CONTRACT_ADDRESS=0x<from deployments/amoy.json>
CHAIN_ID=80002

# 3. Fund wallet with Amoy MATIC
# https://faucet.polygon.technology/

# 4. Export ABI to backend
cd blockchain && npm run export:abi

# 5. Start backend
cd backend && npm run dev

# 6. Verify health
curl http://localhost:5000/api/v1/health/blockchain
```

---

## File Map

| File | Role |
|------|------|
| `config/env.ts` | Validates RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, CHAIN_ID |
| `config/blockchain.config.ts` | Typed blockchain settings |
| `services/blockchain.service.ts` | Provider, wallet, contract, tx logic |
| `utils/retry.util.ts` | Retry + timeout helpers |
| `abi/CertificateRegistry.json` | Contract ABI |
| `controllers/blockchain.controller.ts` | Health endpoint |

---

## Explorer Links

After issuance, view transaction on:

`https://amoy.polygonscan.com/tx/{blockchain_tx}`
