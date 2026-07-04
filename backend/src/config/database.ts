import { Sequelize } from "sequelize";
import { env } from "./env";

const globalForSequelize = globalThis as unknown as { sequelize: Sequelize | undefined };

export const sequelize =
  globalForSequelize.sequelize ??
  new Sequelize(env.DATABASE_URL, {
    dialect: "mysql",
    logging: env.NODE_ENV === "development" ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30_000,
      idle: 10_000,
    },
  });

if (env.NODE_ENV !== "production") {
  globalForSequelize.sequelize = sequelize;
}

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
}

export async function disconnectDatabase(): Promise<void> {
  await sequelize.close();
}
