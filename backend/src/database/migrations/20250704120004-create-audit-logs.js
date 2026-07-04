"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "Actor — null for failed login or anonymous actions",
      },
      action: {
        type: Sequelize.ENUM(
          "LOGIN_SUCCESS",
          "LOGIN_FAILED",
          "CERTIFICATE_UPLOAD",
          "CERTIFICATE_DELETE"
        ),
        allowNull: false,
      },
      resource_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "e.g. certificate, user",
      },
      resource_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Public certificate UUID or user ID",
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Non-sensitive context (email on failed login, cert course, etc.)",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("audit_logs", ["user_id"], {
      name: "audit_logs_user_id_idx",
    });
    await queryInterface.addIndex("audit_logs", ["action"], {
      name: "audit_logs_action_idx",
    });
    await queryInterface.addIndex("audit_logs", ["created_at"], {
      name: "audit_logs_created_at_idx",
    });
    await queryInterface.addIndex("audit_logs", ["resource_id"], {
      name: "audit_logs_resource_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("audit_logs");
  },
};
