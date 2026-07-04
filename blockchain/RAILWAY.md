# ⚠️ Do NOT deploy this as a Railway web service.

The `@blockcert/blockchain` package is for **local Hardhat development** and **one-time Amoy deploy** from your machine:

```bash
npm run deploy:amoy
```

Production uses Polygon Amoy RPC — the backend talks to the chain directly.

**In Railway:** delete the `@blockcert/blockchain` service, or remove it from the project.

Only deploy:
- `@blockcert/backend` (Dockerfile.backend)
- `@blockcert/frontend` (Dockerfile.frontend)
- **MySQL** database plugin
