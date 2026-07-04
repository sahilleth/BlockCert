import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import bcrypt from "bcrypt";
import { sequelize } from "../config/database";

export enum UserRole {
  ADMIN = "ADMIN",
  EMPLOYER = "EMPLOYER",
}

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: UserRole;
  declare createdAt: CreationOptional<Date>;

  async validatePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }

  toSafeJSON(): {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
  } {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Name is required" },
        len: { args: [2, 120], msg: "Name must be 2–120 characters" },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Must be a valid email address" },
        notEmpty: { msg: "Email is required" },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Password is required" },
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.EMPLOYER,
      validate: {
        isIn: {
          args: [Object.values(UserRole)],
          msg: "Role must be ADMIN or EMPLOYER",
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
    tableName: "users",
    timestamps: true,
    updatedAt: false,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && !user.password.startsWith("$2")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password") && !user.password.startsWith("$2")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);
