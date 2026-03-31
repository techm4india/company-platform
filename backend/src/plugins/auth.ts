import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { verifyAccessToken } from "../auth/tokens";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: {
      id: string;
      email: string;
    };
  }
}

function getBearerToken(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("authenticate", async (req: FastifyRequest) => {
    const token = getBearerToken(req);
    if (!token) {
      throw fastify.httpErrors.unauthorized("Missing Authorization bearer token");
    }
    const payload = verifyAccessToken(fastify, token);
    req.authUser = { id: payload.sub, email: payload.email };
  });
};

export default fp(authPlugin, { name: "auth" });

