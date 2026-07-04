require("dotenv").config();

function normalizeDatabaseUrl(url) {
  if (!url) return url;
  return url.replace(/^mysql2:\/\//i, "mysql://");
}

const dbUrl = normalizeDatabaseUrl(
  process.env.DATABASE_URL ?? process.env.MYSQL_URL ?? process.env.MYSQL_PUBLIC_URL
);

/** @type {import('sequelize-cli').Options} */
module.exports = {
  development: {
    url: dbUrl,
    dialect: "mysql",
    logging: console.log,
  },
  test: {
    url: dbUrl,
    dialect: "mysql",
    logging: false,
  },
  production: {
    url: dbUrl,
    dialect: "mysql",
    logging: false,
  },
};
