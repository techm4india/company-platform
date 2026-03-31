import crypto from "crypto";
import type { FastifyInstance } from "fastify";

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
};

export function newJti(): string {
  return crypto.randomUUID();
}

export function signAccessToken(app: FastifyInstance, payload: AccessTokenPayload): string {
  return (app as any).jwt.access.sign(payload);
}

export function signRefreshToken(app: FastifyInstance, payload: RefreshTokenPayload): string {
  return (app as any).jwt.refresh.sign(payload);
}

export function verifyAccessToken(app: FastifyInstance, token: string): AccessTokenPayload {
  return (app as any).jwt.access.verify(token) as AccessTokenPayload;
}

export function verifyRefreshToken(app: FastifyInstance, token: string): RefreshTokenPayload {
  return (app as any).jwt.refresh.verify(token) as RefreshTokenPayload;
}

