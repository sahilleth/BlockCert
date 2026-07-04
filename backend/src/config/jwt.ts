import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { env } from "./env";
import { securityConfig } from "./security.config";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

const signOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  algorithm: securityConfig.jwtAlgorithm,
};

const verifyOptions: VerifyOptions = {
  algorithms: [securityConfig.jwtAlgorithm],
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, signOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, verifyOptions) as JwtPayload;
}
