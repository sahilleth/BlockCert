# Sequence Diagrams

## Certificate Upload Sequence

```mermaid
sequenceDiagram
    actor Admin
    participant FE as React Frontend
    participant API as Express Backend
    participant DB as MySQL
    participant FS as File Storage
    participant BC as Polygon / Hardhat

    Admin->>FE: Upload PDF + student details
    FE->>API: POST /upload (multipart + JWT)
    API->>API: Validate PDF (MIME + magic bytes)
    API->>API: Compute SHA-256
    API->>DB: Check duplicate sha256_hash
    alt Duplicate
        API-->>FE: 409 Conflict
    end
    API->>FS: Store PDF file
    API->>DB: INSERT certificate (PENDING)
    API->>BC: estimateGas(issueCertificate)
    API->>BC: issueCertificate(id, hash)
    BC-->>API: tx hash
    API->>BC: waitForConfirmation(1 block)
    BC-->>API: receipt
    API->>DB: UPDATE blockchain_tx, ON_CHAIN
    API->>FS: Generate QR PNG
    API->>DB: audit_logs CERTIFICATE_UPLOAD
    API-->>FE: 201 Certificate + verify URL
    FE-->>Admin: Success + QR preview
```

---

## Verification Sequence

```mermaid
sequenceDiagram
    actor Employer
    participant FE as React Frontend
    participant API as Express Backend
    participant DB as MySQL
    participant FS as PDF Storage
    participant BC as Smart Contract

    Employer->>FE: Scan QR → /verify/:id
    FE->>API: GET /verify/:id
    API->>DB: findByCertificateId
    DB-->>API: certificate row
    API->>FS: Read PDF bytes
    API->>API: Recalculate SHA-256
    API->>BC: getCertificate(id) [view call]
    BC-->>API: on-chain hash
    API->>API: Compare hashes
    API->>DB: INSERT verification_log
    API-->>FE: VERIFIED or TAMPERED + hashAudit
    FE-->>Employer: Verification result UI
```

---

## Login Sequence

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant API as Express Backend
    participant DB as MySQL
    participant AUD as audit_logs

    User->>FE: Enter email + password
    FE->>API: POST /login
    API->>API: Rate limit check
    API->>API: Zod validate input
    API->>DB: findByEmail
    DB-->>API: user row (bcrypt hash)
    API->>API: bcrypt.compare(password)
    alt Invalid
        API->>AUD: LOGIN_FAILED
        API-->>FE: 401 Unauthorized
    else Valid
        API->>API: jwt.sign(HS256)
        API->>AUD: LOGIN_SUCCESS
        API-->>FE: 200 { token, user }
        FE->>FE: Store token in memory/localStorage
    end
```

---

## Startup Sequence (npm start)

```mermaid
sequenceDiagram
    participant Script as start.mjs
    participant HH as Hardhat Node
    participant Deploy as deploy.ts
    participant BE as Backend
    participant FE as Frontend

    Script->>HH: spawn hardhat node
    HH-->>Script: port 8545 ready
    Script->>Deploy: npm run deploy:local
    Deploy->>HH: deploy CertificateRegistry
    HH-->>Deploy: contract address
    Deploy-->>Script: update backend/.env
    Script->>BE: spawn npm run dev
    BE->>HH: verifyDeployment()
    HH-->>BE: chainId, owner, bytecode OK
    BE-->>Script: /health 200
    Script->>FE: spawn npm run dev
    FE-->>Script: port 5173 ready
```

---

## Blockchain Transaction Sequence

```mermaid
sequenceDiagram
    participant SVC as BlockchainService
    participant NM as NonceManager
    participant RPC as JSON-RPC Provider
    participant SC as CertificateRegistry

    SVC->>SC: estimateGas(issueCertificate)
    SC-->>SVC: gas estimate + 20% buffer
    SVC->>RPC: getFeeData()
    SVC->>NM: acquire nonce
    SVC->>SC: issueCertificate (signed tx)
    SC-->>SVC: tx hash
    SVC->>RPC: wait(1 confirmation) + timeout
    RPC-->>SVC: receipt (status=1)
    SVC-->>SVC: return txHash, blockNumber
```

See `backend/docs/BLOCKCHAIN_INTEGRATION.md` for retry and error handling details.
