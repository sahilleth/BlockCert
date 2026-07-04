import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  ForeignKey,
} from "sequelize";
import { sequelize } from "../config/database";
import { Certificate } from "./Certificate";

export enum VerificationResult {
  VERIFIED = "VERIFIED",
  TAMPERED = "TAMPERED",
  NOT_FOUND = "NOT_FOUND",
}

export class VerificationLog extends Model<
  InferAttributes<VerificationLog>,
  InferCreationAttributes<VerificationLog>
> {
  declare id: CreationOptional<string>;
  declare certificateId: ForeignKey<Certificate["id"]>;
  declare verifiedByIp: CreationOptional<string | null>;
  declare verifiedTime: CreationOptional<Date>;
  declare result: VerificationResult;
}

VerificationLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    certificateId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "certificate_id",
      references: { model: "certificates", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      validate: {
        isUUID: { args: 4, msg: "certificate_id must be a valid UUID" },
        notEmpty: { msg: "certificate_id is required" },
      },
    },
    verifiedByIp: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "verified_by_ip",
    },
    verifiedTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "verified_time",
    },
    result: {
      type: DataTypes.ENUM(...Object.values(VerificationResult)),
      allowNull: false,
      validate: {
        isIn: {
          args: [Object.values(VerificationResult)],
          msg: "Result must be VERIFIED, TAMPERED, or NOT_FOUND",
        },
      },
    },
  },
  {
    sequelize,
    tableName: "verification_logs",
    timestamps: false,
    underscored: true,
  }
);
