"use strict";

const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@blockcert.edu' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      console.log("Seed skipped — admin already exists");
      return;
    }

    const passwordHash = await bcrypt.hash("Admin@123456", 12);

    await queryInterface.bulkInsert("users", [
      {
        id: uuidv4(),
        name: "BlockCert Admin",
        email: "admin@blockcert.edu",
        password: passwordHash,
        role: "ADMIN",
        created_at: new Date(),
      },
    ]);

    console.log("Seeded admin: admin@blockcert.edu / Admin@123456");
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { email: "admin@blockcert.edu" });
  },
};
