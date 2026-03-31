import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import underPressure from "@fastify/under-pressure";
import { loadConfig, type AppConfig } from "./config";
import prismaPlugin from "./plugins/prisma";
import redisPlugin from "./plugins/redis";
import authPlugin from "./plugins/auth";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import publicDataRoutes from "./routes/public-data";
import submissionsRoutes from "./routes/submissions";
import adminRoutes from "./routes/admin";
import manageRoutes from "./routes/manage";
import programRoutes from "./routes/program";

declare module "fastify" {
  interface FastifyInstance {
    config: AppConfig;
  }
}

export async function buildServer() {
  const config = loadConfig();

  const app = Fastify({
    logger: {
      level: config.isProd ? "info" : "debug"
    },
    trustProxy: true
  });

  app.decorate("config", config);

  app.register(sensible);
  app.register(helmet);
  app.register(cors, {
    origin: (origin, cb) => {
      // Allow server-to-server / curl / same-origin requests
      if (!origin) return cb(null, true);
      const allowed = config.CORS_ORIGIN.split(",").map((s) => s.trim());
      cb(null, allowed.includes(origin));
    },
    credentials: true
  });
  app.register(cookie, { secret: config.COOKIE_SECRET });
  app.register(jwt, {
    secret: config.JWT_ACCESS_SECRET,
    sign: { expiresIn: config.ACCESS_TOKEN_TTL_SEC },
    namespace: "access"
  });
  app.register(jwt, {
    secret: config.JWT_REFRESH_SECRET,
    sign: { expiresIn: config.REFRESH_TOKEN_TTL_SEC },
    namespace: "refresh"
  });
  app.register(underPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 1024 * 1024 * 1024,
    maxRssBytes: 1024 * 1024 * 1024,
    message: "Server under pressure",
    retryAfter: 50
  });

  await app.register(redisPlugin);
  await app.register(rateLimit, {
    redis: app.redis,
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_TIME_WINDOW_MS,
    allowList: ["127.0.0.1"],
    keyGenerator: (req) => req.ip
  });

  await app.register(prismaPlugin);
  await app.register(authPlugin);

  await app.register(async (api) => {
    api.register(healthRoutes);
    api.register(authRoutes);
    api.register(meRoutes);
    api.register(publicDataRoutes);
    api.register(submissionsRoutes);
    api.register(adminRoutes);
    api.register(manageRoutes);
    api.register(programRoutes);
  }, { prefix: "/api/v1" });

  app.setErrorHandler((err: any, req, reply) => {
    req.log.error({ err }, "request error");
    const statusCode = err.statusCode ?? 500;
    reply.code(statusCode).send({
      error: err.name ?? "Error",
      message: err.message ?? "Unknown error"
    });
  });

  return app;
}

