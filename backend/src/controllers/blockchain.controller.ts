import { Response } from "express";
import { getBlockchainService } from "../services/blockchain.service";
import { sendSuccess } from "../utils/response.util";

export class BlockchainController {
  async status(_req: unknown, res: Response) {
    const service = getBlockchainService();
    const status = await service.verifyDeployment();
    sendSuccess(res, status);
  }
}

export const blockchainController = new BlockchainController();
