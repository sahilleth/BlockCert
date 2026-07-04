import { User, UserRole } from "../models/User";

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    return User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role ?? UserRole.EMPLOYER,
    });
  }
}

export const userRepository = new UserRepository();
