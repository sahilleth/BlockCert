import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { dashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response.util";

export class DashboardController {
  /**
   * @swagger
   * /dashboard:
   *   get:
   *     tags: [Dashboard]
   *     summary: Dashboard statistics (Admin only)
   *     description: Returns certificate counts, verification stats, and recent issuances.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/DashboardStats'
   *       403:
   *         description: Admin access required
   */
  async stats(_req: AuthRequest, res: Response) {
    const stats = await dashboardService.getStatistics();
    sendSuccess(res, stats);
  }
}

export const dashboardController = new DashboardController();
