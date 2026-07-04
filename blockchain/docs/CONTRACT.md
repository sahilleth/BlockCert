# CertificateRegistry — Smart Contract Reference

Solidity **0.8.24** | OpenZeppelin **Ownable** | Polygon Amoy

---

## Design Principle

**Only SHA-256 hashes are stored on-chain.** PDF files, student names, emails, courses, and departments remain off-chain in MySQL (and optionally IPFS). This minimizes gas costs and keeps PII off the public blockchain.

---

## State Variables

| Name | Type | Description |
|------|------|-------------|
| `totalIssued` | `uint256` | Counter of all certificates ever issued. Public getter. |
| `_certificates` | `mapping(bytes32 => Certificate)` | Internal map from certificateId to record. |
| `_hashRegistered` | `mapping(bytes32 => bool)` | Prevents duplicate SHA-256 hashes. |

---

## Struct: `Certificate`

```solidity
struct Certificate {
    bytes32 hash;      // SHA-256 of PDF
    uint256 issuedAt;  // block.timestamp at issuance
    address issuer;    // owner address that issued
    bool exists;       // registration flag
}
```

---

## Events

### `CertificateIssued`

```solidity
event CertificateIssued(
    bytes32 indexed certificateId,
    bytes32 indexed hash,
    address indexed issuer,
    uint256 issuedAt
);
```

**When:** Owner calls `issueCertificate`.
**Use:** Indexers, Polygonscan logs, backend confirmation listener.

### `CertificateVerified`

```solidity
event CertificateVerified(
    bytes32 indexed certificateId,
    bytes32 indexed hash,
    address indexed verifier,
    uint256 verifiedAt
);
```

**When:** Anyone calls `verifyCertificate`.
**Use:** On-chain audit trail of employer verification attempts.

---

## Functions

### `constructor()`

| | |
|---|---|
| **Access** | Deploy transaction |
| **Effect** | Sets `msg.sender` as owner via OpenZeppelin `Ownable` |
| **Params** | None |

---

### `issueCertificate(bytes32 certificateId, bytes32 hash)`

| | |
|---|---|
| **Access** | `onlyOwner` |
| **Params** | `certificateId` — unique bytes32 ID (backend: `keccak256(uuid)`); `hash` — SHA-256 of PDF as bytes32 |
| **Returns** | None |
| **Reverts** | `duplicate certificateId` · `zero hash` · `duplicate hash` · `OwnableUnauthorizedAccount` |
| **Emits** | `CertificateIssued` |
| **Gas** | ~80,000 |

Registers the hash on-chain. Does **not** accept or store PDF data.

---

### `verifyCertificate(bytes32 certificateId)`

| | |
|---|---|
| **Access** | Anyone (public) |
| **Params** | `certificateId` — ID to verify |
| **Returns** | `(bool exists, bytes32 hash)` — always `true` + hash on success |
| **Reverts** | `certificate not found` |
| **Emits** | `CertificateVerified` |
| **Gas** | ~30,000 |

State-changing verification that writes an audit event. For gas-free reads, use `getCertificate`.

---

### `getCertificate(bytes32 certificateId)`

| | |
|---|---|
| **Access** | Anyone (view) |
| **Params** | `certificateId` |
| **Returns** | `(bytes32 hash, uint256 issuedAt, address issuer, bool exists)` |
| **Reverts** | Never — returns `exists=false` for unknown IDs |
| **Gas** | Free (view) |

Used by the backend to fetch the on-chain hash and compare against a recalculated SHA-256 of the PDF.

---

### `isHashRegistered(bytes32 hash)`

| | |
|---|---|
| **Access** | Anyone (view) |
| **Returns** | `bool registered` |
| **Gas** | Free |

---

### `isCertificateIssued(bytes32 certificateId)`

| | |
|---|---|
| **Access** | Anyone (view) |
| **Returns** | `bool issued` |
| **Gas** | Free |

---

## Security

| Threat | Mitigation |
|--------|------------|
| Unauthorized issuance | OpenZeppelin `onlyOwner` on `issueCertificate` |
| Duplicate certificates | `require(!_certificates[id].exists)` |
| Same PDF re-issued | `_hashRegistered` mapping |
| Zero/empty hash | `require(hash != bytes32(0))` |
| PII on-chain | Only bytes32 hash stored — no strings, no PDF |

---

## bytes32 Conversion (Backend)

```typescript
// UUID string → certificateId bytes32
const certificateIdBytes = ethers.id("550e8400-e29b-41d4-a716-446655440000");

// SHA-256 hex → hash bytes32
const hashBytes = "0x" + sha256Hex.padStart(64, "0");
```

---

## Inherited: OpenZeppelin Ownable

| Function | Description |
|----------|-------------|
| `owner()` | Current owner address |
| `transferOwnership(address)` | Transfer issue rights to new wallet (e.g. backend hot wallet) |
| `renounceOwnership()` | Remove owner permanently (irreversible — do not call in production) |
