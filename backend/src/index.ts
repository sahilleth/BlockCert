import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { initBlockchain } from "./services/blockchain.service";
import { logger } from "./utils/logger";
import "./models";

const app = createApp();

async function bootstrap() {
  try {
    await connectDatabase();
    logger.info("Connected to MySQL via Sequelize");

    // Verify Polygon Amoy contract deployment before accepting traffic
    try {
      const chainStatus = await initBlockchain();
      logger.info("Polygon Amoy ready", {
        chainId: chainStatus.chainId,
        contract: chainStatus.contractAddress,
        wallet: chainStatus.walletAddress,
        balance: `${chainStatus.walletBalance} MATIC`,
        isOwner: chainStatus.isOwner,
      });
    } catch (chainError) {
      if (env.NODE_ENV === "production") {
        throw chainError;
      }
      logger.warn("Blockchain verification skipped in development", {
        error: (chainError as Error).message,
      });
    }

    app.listen(env.PORT, () => {
      logger.info(`BlockCert API running on http://localhost:${env.PORT}`);
      logger.info(`API prefix: ${env.API_PREFIX}`);
      logger.info(`Swagger docs: http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
      logger.info(`Blockchain health: http://localhost:${env.PORT}${env.API_PREFIX}/health/blockchain`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error: (error as Error).message });
    process.exit(1);
  }
}

bootstrap();

process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await disconnectDatabase();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message, stack: error.stack });
  process.exit(1);
});
