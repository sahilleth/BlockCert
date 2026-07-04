"use strict";

const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const users = [
      {
        email: "employer@blockcert.edu",
        name: "Demo Employer",
        role: "EMPLOYER",
        password: "Employer@123456",
      },
    ];

    for (const u of users) {
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = :email LIMIT 1`,
        { replacements: { email: u.email }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (existing.length > 0) {
        console.log(`Seed skipped — ${u.email} already exists`);
        continue;
      }

      await queryInterface.bulkInsert("users", [
        {
          id: uuidv4(),
          name: u.name,
          email: u.email,
          password: await bcrypt.hash(u.password, 12),
          role: u.role,
          created_at: new Date(),
        },
      ]);
      console.log(`Seeded ${u.role}: ${u.email} / ${u.password}`);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      email: "employer@blockcert.edu",
    });
  },
};
