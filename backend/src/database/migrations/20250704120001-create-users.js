"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "bcrypt hash — never store plaintext",
      },
      role: {
        type: Sequelize.ENUM("ADMIN", "EMPLOYER"),
        allowNull: false,
        defaultValue: "EMPLOYER",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("users", ["email"], {
      unique: true,
      name: "users_email_unique",
    });

    await queryInterface.addIndex("users", ["role"], {
      name: "users_role_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
