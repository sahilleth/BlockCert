import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { certificateService } from "../services/certificate.service";
import { auditContextFromRequest } from "../services/audit.service";
import { sendCreated, sendNoContent, sendSuccess } from "../utils/response.util";

export class CertificateController {
  /**
   * @swagger
   * /upload:
   *   post:
   *     tags: [Certificates]
   *     summary: Upload and issue a certificate (Admin only)
   *     description: |
   *       Uploads PDF, computes SHA-256, saves to MySQL, registers hash on Polygon,
   *       stores transaction hash, and generates QR code.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/UploadCertificateRequest'
   *     responses:
   *       201:
   *         description: Certificate issued successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Certificate'
   *       400:
   *         description: Validation error
   *       403:
   *         description: Admin access required
   */
  async upload(req: AuthRequest, res: Response) {
    const result = await certificateService.upload(
      { ...req.body, file: req.file! },
      auditContextFromRequest(req)
    );
    sendCreated(res, result, "Certificate issued and registered on blockchain");
  }

  /**
   * @swagger
   * /certificates:
   *   get:
   *     tags: [Certificates]
   *     summary: List all certificates (Admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Paginated certificate list
   */
  async list(req: AuthRequest, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await certificateService.list(page, limit);
    sendSuccess(res, result);
  }

  /**
   * @swagger
   * /certificate/{id}:
   *   get:
   *     tags: [Certificates]
   *     summary: Get certificate by public ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Certificate details
   *       404:
   *         description: Not found
   */
  async getById(req: AuthRequest, res: Response) {
    const id = String(req.params.id);
    const result = await certificateService.getById(id);
    sendSuccess(res, result);
  }

  /**
   * @swagger
   * /certificate/{id}:
   *   delete:
   *     tags: [Certificates]
   *     summary: Delete a certificate (Admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       204:
   *         description: Certificate deleted
   *       404:
   *         description: Not found
   */
  async delete(req: AuthRequest, res: Response) {
    await certificateService.delete(
      String(req.params.id),
      auditContextFromRequest(req)
    );
    sendNoContent(res);
  }

  /**
   * @swagger
   * /verify/{id}:
   *   get:
   *     tags: [Verification]
   *     summary: Verify certificate authenticity (Public)
   *     description: |
   *       Compares SHA-256 hash in database against on-chain hash.
   *       Returns VERIFIED or TAMPERED. Logs verification attempt.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Verification result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/VerificationResult'
   *       404:
   *         description: Certificate not found
   */
  async verify(req: AuthRequest, res: Response) {
    const result = await certificateService.verify(String(req.params.id), req.ip);
    sendSuccess(res, result);
  }

  async verificationHistory(req: AuthRequest, res: Response) {
    const history = await certificateService.getVerificationHistory(String(req.params.id));
    sendSuccess(res, history);
  }
}

export const certificateController = new CertificateController();
