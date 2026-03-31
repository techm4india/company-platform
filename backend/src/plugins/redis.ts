import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import Redis from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  const redis = new Redis(fastify.config.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false
  });

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async (app) => {
    try {
      await app.redis.quit();
    } catch {
      // ignore
    }
  });
};

export default fp(redisPlugin, { name: "redis" });

