import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { authService } from "../services/auth.service";
import { auditContextFromRequest } from "../services/audit.service";
import { sendSuccess } from "../utils/response.util";

export class AuthController {
  async login(req: AuthRequest, res: Response) {
    const context = auditContextFromRequest(req);
    const result = await authService.login(req.body, context);
    sendSuccess(res, result, 200, "Login successful");
  }

  async me(req: AuthRequest, res: Response) {
    const user = await authService.getProfile(req.user!.userId);
    sendSuccess(res, user);
  }
}

export const authController = new AuthController();
