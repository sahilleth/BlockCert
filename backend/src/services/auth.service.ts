import { userRepository } from "../repositories/user.repository";
import { signToken } from "../config/jwt";
import { UnauthorizedError } from "../errors/AppError";
import { logger } from "../utils/logger";
import { auditService, AuditContext } from "./audit.service";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async login(
    input: LoginInput,
    auditContext: AuditContext
  ): Promise<{ user: SafeUser; token: string }> {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      logger.warn("Login failed — user not found", { email: input.email });
      auditService.loginFailed(auditContext, input.email);
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await user.validatePassword(input.password);
    if (!valid) {
      logger.warn("Login failed — invalid password", { email: input.email });
      auditService.loginFailed(auditContext, input.email);
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    logger.info("User logged in", { userId: user.id, role: user.role });
    auditService.loginSuccess(auditContext, user.id, user.email);

    return { user: user.toSafeJSON(), token };
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError("User not found");
    return user.toSafeJSON();
  }
}

export const authService = new AuthService();
