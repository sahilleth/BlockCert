import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../config/database";

export enum AuditAction {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  CERTIFICATE_UPLOAD = "CERTIFICATE_UPLOAD",
  CERTIFICATE_DELETE = "CERTIFICATE_DELETE",
}

export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  declare id: CreationOptional<string>;
  declare userId: CreationOptional<string | null>;
  declare action: AuditAction;
  declare resourceType: CreationOptional<string | null>;
  declare resourceId: CreationOptional<string | null>;
  declare ipAddress: CreationOptional<string | null>;
  declare userAgent: CreationOptional<string | null>;
  declare metadata: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "user_id",
    },
    action: {
      type: DataTypes.ENUM(...Object.values(AuditAction)),
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "resource_type",
    },
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "resource_id",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "ip_address",
    },
    userAgent: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: "user_agent",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "audit_logs",
    timestamps: false,
    updatedAt: false,
  }
);

export default AuditLog;
