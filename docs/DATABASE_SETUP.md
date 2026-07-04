# Database Setup

BlockCert uses **MySQL 8.0** with **Sequelize ORM** for all persistent data.

---

## Quick Setup

```bash
docker compose up -d mysql
npm run db:migrate
npm run db:seed
```

---

## Tables

| Table | Records |
|-------|---------|
| `users` | Admin and employer accounts |
| `certificates` | Issued certificates + SHA-256 + blockchain tx |
| `verification_logs` | Employer verification attempts |
| `audit_logs` | Admin security audit trail |

---

## Detailed Guides

- **[MySQL Installation & Docker](MYSQL_SETUP.md)** — Install, configure, backup
- **[Schema Documentation](../backend/docs/DATABASE.md)** — Full column reference
- **[ER Diagram](diagrams/ER_DIAGRAM.md)** — Entity relationships

---

## Migrations

Located in `backend/src/database/migrations/`:

```
20250704120001-create-users.js
20250704120002-create-certificates.js
20250704120003-create-verification-logs.js
20250704120004-create-audit-logs.js
```

## Seeders

```
20250704120001-demo-admin.js    → admin@blockcert.edu
20250704120002-demo-employer.js → employer@blockcert.edu
```

Demo certificates are uploaded via `npm run seed:demo` (requires running API).
