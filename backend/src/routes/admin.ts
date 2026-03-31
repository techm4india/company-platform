import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserBody = z.object({
  email: z.string().email().max(320),
  password: z.string().min(10).max(200),
  name: z.string().min(1).max(120),
  grade: z.string().min(1).max(60).default("Unknown"),
  track: z.enum(["Robotics", "Coding", "Drone", "AI", "Innovation"]).default("Coding"),
  role: z.enum(["student", "mentor", "admin"]).default("student"),
  avatar: z.string().min(1).max(8).optional(),
  school: z.string().min(1).max(200).default("TechM4Schools"),
  pin: z.string().min(4).max(12).optional()
});

const resetPasswordBody = z.object({
  newPassword: z.string().min(10).max(200)
});

const adminRoutes: FastifyPluginAsync = async (app) => {
  async function requireAdmin(userId: string) {
    const u = await app.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) throw app.httpErrors.unauthorized("User not found");
    if (u.role !== "admin") throw app.httpErrors.forbidden("Admin only");
  }

  app.get(
    "/admin/users",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      await requireAdmin(req.authUser!.id);
      const users = await app.prisma.user.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          email: true,
          name: true,
          grade: true,
          track: true,
          role: true,
          xp: true,
          level: true,
          streak: true,
          rank: true,
          avatar: true,
          school: true,
          createdAt: true
        }
      });
      return users;
    }
  );

  app.post(
    "/admin/users",
    { preHandler: async (req) => app.authenticate(req) },
    async (req, reply) => {
      await requireAdmin(req.authUser!.id);
      const body = createUserBody.parse(req.body);
      const email = body.email.toLowerCase();

      const existing = await app.prisma.user.findUnique({ where: { email } });
      if (existing) throw app.httpErrors.conflict("Email already exists");

      const passwordHash = await bcrypt.hash(body.password, 12);
      const pinHash = body.pin ? await bcrypt.hash(body.pin, 12) : null;

      const user = await app.prisma.user.create({
        data: {
          email,
          passwordHash,
          pinHash: pinHash ?? undefined,
          name: body.name,
          grade: body.grade,
          track: body.track as any,
          role: body.role as any,
          xp: 0,
          level: 1,
          streak: 0,
          rank: 0,
          avatar: body.avatar ?? body.name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2),
          school: body.school,
          badges: [],
          completedTasks: []
        },
        select: { id: true, email: true, name: true, role: true, track: true, grade: true, school: true, avatar: true, createdAt: true }
      });

      reply.code(201);
      return user;
    }
  );

  app.post(
    "/admin/users/:id/reset-password",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      await requireAdmin(req.authUser!.id);
      const targetId = (req.params as any).id as string;
      const body = resetPasswordBody.parse(req.body);

      const passwordHash = await bcrypt.hash(body.newPassword, 12);
      await app.prisma.user.update({
        where: { id: targetId },
        data: { passwordHash }
      });

      return { ok: true };
    }
  );
};

export default adminRoutes;

