import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export enum VerificationStatus {
  PENDING = "PENDING",
  ON_CHAIN = "ON_CHAIN",
  FAILED = "FAILED",
}

export class Certificate extends Model<
  InferAttributes<Certificate>,
  InferCreationAttributes<Certificate>
> {
  declare id: CreationOptional<string>;
  declare certificateId: string;
  declare studentName: string;
  declare studentEmail: CreationOptional<string | null>;
  declare course: string;
  declare department: string;
  declare issueDate: string;
  declare pdfPath: string;
  declare sha256Hash: string;
  declare blockchainTx: CreationOptional<string | null>;
  declare contractAddress: CreationOptional<string | null>;
  declare walletAddress: CreationOptional<string | null>;
  declare verificationStatus: VerificationStatus;
  declare createdAt: CreationOptional<Date>;
}

Certificate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    certificateId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: "certificate_id",
      validate: {
        isUUID: { args: 4, msg: "certificate_id must be a valid UUID v4" },
      },
    },
    studentName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "student_name",
      validate: {
        notEmpty: { msg: "Student name is required" },
        len: { args: [2, 150], msg: "Student name must be 2–150 characters" },
      },
    },
    studentEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "student_email",
      validate: {
        isEmail: { msg: "Student email must be valid" },
      },
    },
    course: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Course is required" },
        len: { args: [2, 200], msg: "Course must be 2–200 characters" },
      },
    },
    department: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Department is required" },
        len: { args: [2, 150], msg: "Department must be 2–150 characters" },
      },
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "issue_date",
      validate: {
        isDate: true,
        notEmpty: { msg: "Issue date is required" },
      },
    },
    pdfPath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "pdf_path",
      validate: {
        notEmpty: { msg: "PDF path is required" },
      },
    },
    sha256Hash: {
      type: DataTypes.CHAR(64),
      allowNull: false,
      unique: true,
      field: "sha256_hash",
      validate: {
        len: { args: [64, 64], msg: "SHA-256 hash must be exactly 64 hex characters" },
        is: {
          args: /^[a-f0-9]{64}$/i,
          msg: "SHA-256 hash must be lowercase/uppercase hex",
        },
      },
    },
    blockchainTx: {
      type: DataTypes.STRING(66),
      allowNull: true,
      field: "blockchain_tx",
    },
    contractAddress: {
      type: DataTypes.STRING(42),
      allowNull: true,
      field: "contract_address",
    },
    walletAddress: {
      type: DataTypes.STRING(42),
      allowNull: true,
      field: "wallet_address",
    },
    verificationStatus: {
      type: DataTypes.ENUM(...Object.values(VerificationStatus)),
      allowNull: false,
      defaultValue: VerificationStatus.PENDING,
      field: "verification_status",
      validate: {
        isIn: {
          args: [Object.values(VerificationStatus)],
          msg: "Invalid verification status",
        },
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "certificates",
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);
