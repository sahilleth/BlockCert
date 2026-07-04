import QRCode from "qrcode";
import path from "path";
import { env } from "../config/env";
import { qrDir } from "../middlewares/upload.middleware";

export async function generateVerificationQR(
  certificateId: string
): Promise<{ qrCodePath: string; verificationUrl: string }> {
  const verificationUrl = `${env.FRONTEND_URL}/verify/${certificateId}`;
  const fileName = `${certificateId}.png`;
  const qrCodePath = path.join(qrDir, fileName);

  await QRCode.toFile(qrCodePath, verificationUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: {
      dark: "#6366f1",
      light: "#0f172a",
    },
  });

  return { qrCodePath, verificationUrl };
}
