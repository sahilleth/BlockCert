"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("verification_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      certificate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "certificates",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "FK to certificates.id (internal PK, not public certificate_id)",
      },
      verified_by_ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: "IPv4/IPv6 of employer or scanner — audit trail",
      },
      verified_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      result: {
        type: Sequelize.ENUM("VERIFIED", "TAMPERED", "NOT_FOUND"),
        allowNull: false,
      },
    });

    await queryInterface.addIndex("verification_logs", ["certificate_id"], {
      name: "verification_logs_certificate_id_idx",
    });

    await queryInterface.addIndex("verification_logs", ["verified_time"], {
      name: "verification_logs_verified_time_idx",
    });

    await queryInterface.addIndex("verification_logs", ["result"], {
      name: "verification_logs_result_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("verification_logs");
  },
};
