import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "../config/swagger";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { adminOnly, adminOrEmployer } from "../middlewares/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middlewares/validate.middleware";
import {
  loginSchema,
  paginationSchema,
  certificateIdParamSchema,
} from "../validators/auth.validator";
import { uploadCertificateSchema } from "../validators/certificate.validator";
import {
  uploadPdf,
  handleMulterError,
} from "../middlewares/upload.middleware";
import { validatePdfUpload } from "../middlewares/security.middleware";
import { loginRateLimiter, verifyRateLimiter } from "../middlewares/rate-limit.middleware";
import { authController } from "../controllers/auth.controller";
import { certificateController } from "../controllers/certificate.controller";
import { dashboardController } from "../controllers/dashboard.controller";
import { blockchainController } from "../controllers/blockchain.controller";

const router = Router();
const swaggerSpec = swaggerJsdoc(swaggerOptions);

router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
router.get("/docs.json", (_req, res) => res.json(swaggerSpec));

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "BlockCert API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

router.get("/health/blockchain", asyncHandler(blockchainController.status.bind(blockchainController)));

router.post(
  "/login",
  loginRateLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login.bind(authController))
);
router.get("/me", authenticate, asyncHandler(authController.me.bind(authController)));

router.get(
  "/verify/:id",
  verifyRateLimiter,
  validateParams(certificateIdParamSchema),
  asyncHandler(certificateController.verify.bind(certificateController))
);

router.get(
  "/verify/:id/history",
  verifyRateLimiter,
  validateParams(certificateIdParamSchema),
  asyncHandler(certificateController.verificationHistory.bind(certificateController))
);

router.post(
  "/upload",
  authenticate,
  adminOnly,
  uploadPdf.single("certificate"),
  handleMulterError,
  validatePdfUpload,
  validateBody(uploadCertificateSchema),
  asyncHandler(certificateController.upload.bind(certificateController))
);

router.get(
  "/certificates",
  authenticate,
  adminOnly,
  validateQuery(paginationSchema),
  asyncHandler(certificateController.list.bind(certificateController))
);

router.get(
  "/certificate/:id",
  authenticate,
  adminOrEmployer,
  validateParams(certificateIdParamSchema),
  asyncHandler(certificateController.getById.bind(certificateController))
);

router.delete(
  "/certificate/:id",
  authenticate,
  adminOnly,
  validateParams(certificateIdParamSchema),
  asyncHandler(certificateController.delete.bind(certificateController))
);

router.get(
  "/dashboard",
  authenticate,
  adminOnly,
  asyncHandler(dashboardController.stats.bind(dashboardController))
);

export default router;
