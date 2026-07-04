# Architecture Diagram

## System Overview

```mermaid
flowchart TB
    subgraph Clients
        ADMIN[College Admin Browser]
        EMP[Employer Browser]
        QR[QR Code Scanner]
    end

    subgraph Frontend["React Frontend (Vite)"]
        PAGES[Pages & Components]
        RQ[React Query]
        API_CLIENT[Axios API Client]
    end

    subgraph Backend["Express Backend (Node.js)"]
        ROUTES[REST Routes]
        AUTH_MW[JWT + RBAC Middleware]
        VALID[Zod Validation]
        SVC[Services Layer]
        REPO[Sequelize Repositories]
    end

    subgraph Storage
        MYSQL[(MySQL 8)]
        FILES[Local PDF / QR Storage]
    end

    subgraph Blockchain
        ETHERS[ethers.js v6]
        CONTRACT[CertificateRegistry.sol]
        POLYGON[Polygon Amoy / Hardhat]
    end

    ADMIN --> PAGES
    EMP --> PAGES
    QR --> PAGES
    PAGES --> RQ --> API_CLIENT
    API_CLIENT -->|HTTPS REST| ROUTES
    ROUTES --> AUTH_MW --> VALID --> SVC
    SVC --> REPO --> MYSQL
    SVC --> FILES
    SVC --> ETHERS --> CONTRACT --> POLYGON
```

---

## Layered Architecture

```mermaid
flowchart LR
    subgraph Presentation
        FE[React SPA]
        SW[Swagger UI]
    end

    subgraph Application
        CTRL[Controllers]
        SVC2[Services]
    end

    subgraph Domain
        MODELS[Sequelize Models]
        VALIDATORS[Zod Schemas]
    end

    subgraph Infrastructure
        DB[(MySQL)]
        BC[Blockchain RPC]
        FS[File System]
    end

    FE --> CTRL
    SW --> CTRL
    CTRL --> SVC2
    SVC2 --> MODELS
    SVC2 --> BC
    SVC2 --> FS
    MODELS --> DB
```

---

## Monorepo Structure

```
College-Blockchain/
├── frontend/          @blockcert/frontend   TanStack Start + React
├── backend/           @blockcert/backend    Express + Sequelize
├── blockchain/        @blockcert/blockchain Hardhat + Solidity
├── demo/              Sample PDFs + generators
├── docs/              Project documentation
├── scripts/           setup.mjs, start.mjs, seed-demo.mjs
├── docker-compose.yml MySQL container
└── package.json       npm workspaces root
```

---

## Security Architecture

```mermaid
flowchart TD
    REQ[Incoming Request]
    REQ --> HELMET[Helmet Headers]
    HELMET --> CORS[CORS Check]
    CORS --> ORIGIN[Origin Guard]
    ORIGIN --> RATE[Rate Limiter]
    RATE --> JWT{JWT Required?}
    JWT -->|Yes| AUTH[Verify HS256 Token]
    JWT -->|No| VALIDATE[Zod Validation]
    AUTH --> RBAC[Role Check]
    RBAC --> VALIDATE
    VALIDATE --> HANDLER[Controller / Service]
    HANDLER --> AUDIT[Audit Log]
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind, Shadcn UI, React Query |
| Backend | Node.js 20, Express, Sequelize, JWT, bcrypt, Winston |
| Database | MySQL 8.0 |
| Blockchain | Solidity 0.8.24, Hardhat, ethers.js v6, OpenZeppelin |
| Network | Polygon Amoy (80002) / Hardhat Local (31337) |
| DevOps | Docker Compose, npm workspaces |
