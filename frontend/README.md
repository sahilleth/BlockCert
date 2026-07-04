# BlockCert Frontend

TanStack Start application for certificate issuance (admin) and public verification (employers).

Part of the [BlockCert monorepo](../README.md).

## Stack

- **TanStack Start** + **TanStack Router** (file-based routes)
- **React 19** + **TypeScript**
- **TanStack Query** + **Axios** (API client)
- **Tailwind CSS v4** + **shadcn/ui**

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login` | Admin sign-in |
| `/verify` | Certificate ID lookup |
| `/verify/:id` | Verification result |
| `/admin/dashboard` | Stats overview |
| `/admin/upload` | Issue certificate |
| `/admin/certificates` | Certificate list |
| `/admin/certificates/:id` | Certificate detail |

## Setup

From the monorepo root:

```bash
npm run setup          # creates frontend/.env from .env.example
npm run dev:frontend   # or: npm start
```

Or from this directory:

```bash
cp .env.example .env
npm run dev
```

## Environment

| Variable | Local example |
|----------|---------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` |
| `VITE_CHAIN_ID` | `31337` |
| `VITE_CHAIN_NAME` | `Hardhat Local` |
| `VITE_EXPLORER_URL` | _(empty for local)_ |

## Scripts

```bash
npm run dev       # Development server (default port 5173)
npm run build     # Production build → .output/
npm run preview   # Preview production build
npm run lint      # ESLint
```

## API integration

All HTTP calls go through `src/lib/api.ts`:

- JWT stored in `localStorage` (`blockcert_token`, `blockcert_user`)
- Responses unwrap `{ success, data }` envelope from the backend
- 401 on admin routes redirects to `/login`

API contract: [../docs/API.md](../docs/API.md)
