-- BlockCert MySQL initialization (used by docker-compose)
CREATE DATABASE IF NOT EXISTS blockcert CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tables are created by Sequelize migrations:
--   cd backend && npm run db:migrate && npm run db:seed
