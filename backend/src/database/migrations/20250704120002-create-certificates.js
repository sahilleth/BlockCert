"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("certificates", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: "Internal primary key — never exposed in QR codes",
      },
      certificate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        comment: "Public UUID embedded in QR verification URL",
      },
      student_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      student_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      course: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      pdf_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: "Local path or future IPFS reference to source PDF",
      },
      sha256_hash: {
        type: Sequelize.CHAR(64),
        allowNull: false,
        unique: true,
        comment: "SHA-256 hex digest of PDF bytes — compared against blockchain",
      },
      blockchain_tx: {
        type: Sequelize.STRING(66),
        allowNull: true,
        comment: "Polygon transaction hash after on-chain registration",
      },
      contract_address: {
        type: Sequelize.STRING(42),
        allowNull: true,
        comment: "CertificateRegistry contract address on Amoy",
      },
      wallet_address: {
        type: Sequelize.STRING(42),
        allowNull: true,
        comment: "Backend/admin wallet that signed the issueCertificate tx",
      },
      verification_status: {
        type: Sequelize.ENUM("PENDING", "ON_CHAIN", "FAILED"),
        allowNull: false,
        defaultValue: "PENDING",
        comment: "Issuance lifecycle — not the employer verify result",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("certificates", ["certificate_id"], {
      unique: true,
      name: "certificates_certificate_id_unique",
    });

    await queryInterface.addIndex("certificates", ["sha256_hash"], {
      unique: true,
      name: "certificates_sha256_hash_unique",
    });

    await queryInterface.addIndex("certificates", ["student_name"], {
      name: "certificates_student_name_idx",
    });

    await queryInterface.addIndex("certificates", ["verification_status"], {
      name: "certificates_verification_status_idx",
    });

    await queryInterface.addIndex("certificates", ["blockchain_tx"], {
      name: "certificates_blockchain_tx_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("certificates");
  },
};
