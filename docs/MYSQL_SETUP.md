# MySQL Setup

BlockCert uses **MySQL 8.0** with **Sequelize ORM** for certificate metadata, users, verification logs, and audit logs.

---

## Docker (Recommended)

The project includes `docker-compose.yml`:

```yaml
services:
  mysql:
    image: mysql:8.0
    ports: ["3306:3306"]
    environment:
      MYSQL_DATABASE: blockcert
      MYSQL_USER: blockcert
      MYSQL_PASSWORD: blockcert123
```

Start:

```bash
docker compose up -d mysql
docker compose ps          # verify healthy
```

Connection string:

```
mysql://blockcert:blockcert123@localhost:3306/blockcert
```

---

## Manual MySQL Installation

### macOS (Homebrew)

```bash
brew install mysql@8.0
brew services start mysql@8.0
mysql -u root -p
```

```sql
CREATE DATABASE blockcert CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blockcert'@'localhost' IDENTIFIED BY 'blockcert123';
GRANT ALL PRIVILEGES ON blockcert.* TO 'blockcert'@'localhost';
FLUSH PRIVILEGES;
```

### Linux (Ubuntu)

```bash
sudo apt update && sudo apt install mysql-server
sudo mysql_secure_installation
sudo mysql
```

Run the same SQL as above.

---

## Database Commands

```bash
npm run db:migrate          # Apply all migrations
npm run db:seed             # Seed admin + employer users
npm run db:reset            # Undo all, migrate, seed (backend workspace)
```

Migrations live in `backend/src/database/migrations/`:

| Migration | Creates |
|-----------|---------|
| `200001-create-users` | `users` table |
| `200002-create-certificates` | `certificates` table |
| `200003-create-verification-logs` | `verification_logs` table |
| `200004-create-audit-logs` | `audit_logs` table |

---

## Schema Overview

See [ER Diagram](./diagrams/ER_DIAGRAM.md) and `backend/docs/DATABASE.md` for full column documentation.

---

## Backup & Restore

```bash
# Backup
docker exec blockcert-mysql mysqldump -u blockcert -pblockcert123 blockcert > backup.sql

# Restore
docker exec -i blockcert-mysql mysql -u blockcert -pblockcert123 blockcert < backup.sql
```
