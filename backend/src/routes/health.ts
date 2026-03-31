import type { FastifyPluginAsync } from "fastify";

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/healthz", async () => {
    return { ok: true, ts: new Date().toISOString() };
  });

  app.get("/readyz", async () => {
    // DB check
    await app.prisma.$queryRaw`SELECT 1`;
    // Redis check
    const pong = await app.redis.ping();
    if (pong !== "PONG") {
      throw app.httpErrors.serviceUnavailable("Redis not ready");
    }
    return { ok: true };
  });
};

export default healthRoutes;

