import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const listQuery = z.object({
  status: z.enum(["pending", "reviewed", "approved", "needs-revision"]).optional()
});

const createBody = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["code", "assembly", "project", "quiz"]),
  fileType: z.string().min(1).max(60)
});

const reviewBody = z.object({
  status: z.enum(["reviewed", "approved", "needs-revision"]),
  score: z.number().int().min(0).max(100).optional(),
  feedback: z.string().max(2000).optional(),
  xpAwarded: z.number().int().min(0).max(5000).optional()
});

const submissionsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/submissions",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      const q = listQuery.parse(req.query);
      const user = req.authUser!;

      const dbStatus =
        q.status === "needs-revision" ? "needs_revision" : q.status;

      const where: any = {};
      if (dbStatus) where.status = dbStatus;

      // Students see only their submissions
      const me = await app.prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
      });
      if (!me) throw app.httpErrors.unauthorized("User not found");
      if (me.role === "student") where.studentId = user.id;

      const subs = await app.prisma.submission.findMany({
        where,
        orderBy: [{ submittedAt: "desc" }],
        include: { student: { select: { id: true, name: true } } }
      });

      return subs.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        studentName: s.student.name,
        track: s.track,
        title: s.title,
        type: s.type,
        submittedAt: s.submittedAt.toISOString(),
        status: s.status === "needs_revision" ? "needs-revision" : s.status,
        score: s.score ?? undefined,
        feedback: s.feedback ?? undefined,
        fileType: s.fileType,
        xpAwarded: s.xpAwarded ?? undefined
      }));
    }
  );

  app.post(
    "/submissions",
    { preHandler: async (req) => app.authenticate(req) },
    async (req, reply) => {
      const body = createBody.parse(req.body);
      const user = req.authUser!;

      const dbUser = await app.prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, track: true, name: true }
      });
      if (!dbUser) throw app.httpErrors.unauthorized("User not found");
      if (dbUser.role !== "student") {
        throw app.httpErrors.forbidden("Only students can submit");
      }

      const created = await app.prisma.submission.create({
        data: {
          studentId: dbUser.id,
          track: dbUser.track,
          title: body.title,
          type: body.type as any,
          status: "pending",
          fileType: body.fileType
        },
        include: { student: { select: { id: true, name: true } } }
      });

      reply.code(201);
      return {
        id: created.id,
        studentId: created.studentId,
        studentName: created.student.name,
        track: created.track,
        title: created.title,
        type: created.type,
        submittedAt: created.submittedAt.toISOString(),
        status: created.status,
        fileType: created.fileType
      };
    }
  );

  // Mentor/admin review
  app.patch(
    "/submissions/:id/review",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      const id = (req.params as any).id as string;
      const body = reviewBody.parse(req.body);
      const user = req.authUser!;

      const dbUser = await app.prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
      });
      if (!dbUser) throw app.httpErrors.unauthorized("User not found");
      if (dbUser.role === "student") throw app.httpErrors.forbidden("Not allowed");

      const updated = await app.prisma.submission.update({
        where: { id },
        data: {
          status: body.status === "needs-revision" ? "needs_revision" : body.status,
          score: body.score ?? undefined,
          feedback: body.feedback ?? undefined,
          xpAwarded: body.xpAwarded ?? undefined
        },
        include: { student: { select: { id: true, name: true } } }
      });

      return {
        id: updated.id,
        studentId: updated.studentId,
        studentName: updated.student.name,
        track: updated.track,
        title: updated.title,
        type: updated.type,
        submittedAt: updated.submittedAt.toISOString(),
        status: updated.status === "needs_revision" ? "needs-revision" : updated.status,
        score: updated.score ?? undefined,
        feedback: updated.feedback ?? undefined,
        fileType: updated.fileType,
        xpAwarded: updated.xpAwarded ?? undefined
      };
    }
  );
};

export default submissionsRoutes;

