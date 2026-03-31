import type { FastifyPluginAsync } from "fastify";

const meRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/me",
    {
      preHandler: async (req) => app.authenticate(req)
    },
    async (req) => {
      const userId = req.authUser!.id;
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, createdAt: true, updatedAt: true }
      });
      if (!user) {
        throw app.httpErrors.notFound("User not found");
      }
      return user;
    }
  );
};

export default meRoutes;

