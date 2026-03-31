import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    jwt: any;
  }
}

