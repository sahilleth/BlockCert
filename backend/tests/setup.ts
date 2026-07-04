/**
 * Test environment — loaded before any app imports.
 */
process.env.NODE_ENV = "test";
process.env.PORT = "5099";
process.env.API_PREFIX = "/api/v1";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "mysql://blockcert:blockcert123@localhost:3306/blockcert";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "test_jwt_secret_minimum_32_characters_long_for_blockcert";
process.env.JWT_EXPIRES_IN = "1h";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.UPLOAD_DIR = "./uploads-test";
process.env.RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
process.env.PRIVATE_KEY =
  process.env.PRIVATE_KEY ?? "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
process.env.CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS ?? "0x5FbDB2315678afecb367f032d93F642f64180aa3";
process.env.CHAIN_ID = process.env.CHAIN_ID ?? "31337";
