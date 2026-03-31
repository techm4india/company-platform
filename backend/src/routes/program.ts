import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const dayParamSchema = z.object({
  day: z.coerce.number().int().min(1).max(365)
});

const submitBodySchema = z.object({
  artifacts: z.record(z.any()).default({}),
  reflection: z.string().max(5000).optional()
});

const reviewBodySchema = z.object({
  status: z.enum(["reviewed", "approved", "needs-revision"]),
  score: z.number().int().min(0).max(100).optional(),
  feedback: z.string().max(5000).optional(),
  xpAwarded: z.number().int().min(0).max(5000).optional()
});

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const programRoutes: FastifyPluginAsync = async (app) => {
  app.get("/program", async () => {
    const program = await app.prisma.program.findFirst({
      orderBy: [{ createdAt: "desc" }],
      include: { state: true }
    });
    if (!program) throw app.httpErrors.notFound("Program not found");

    const totalDays = program.totalDays;
    const now = Date.now();
    const start = program.state?.startDate?.getTime();
    const override = program.state?.currentDayOverride ?? null;
    const computed = start ? Math.floor((now - start) / (24 * 60 * 60 * 1000)) + 1 : 1;
    const currentDay = clamp(override ?? computed, 1, totalDays);

    return {
      program: {
        id: program.id,
        name: program.name,
        year: program.year,
        totalDays
      },
      state: {
        currentDay,
        startDate: program.state?.startDate?.toISOString() ?? null,
        timezone: program.state?.timezone ?? "Asia/Kolkata"
      }
    };
  });

  app.get("/program/days", async () => {
    const program = await app.prisma.program.findFirst({ orderBy: [{ createdAt: "desc" }] });
    if (!program) throw app.httpErrors.notFound("Program not found");
    const days = await app.prisma.programDay.findMany({
      where: { programId: program.id },
      orderBy: [{ dayNumber: "asc" }]
    });
    return days;
  });

  app.get("/program/days/:day", async (req) => {
    const { day } = dayParamSchema.parse(req.params);
    const program = await app.prisma.program.findFirst({ orderBy: [{ createdAt: "desc" }] });
    if (!program) throw app.httpErrors.notFound("Program not found");
    const d = await app.prisma.programDay.findUnique({
      where: { programId_dayNumber: { programId: program.id, dayNumber: day } }
    });
    if (!d) throw app.httpErrors.notFound("Day not found");
    return d;
  });

  app.post(
    "/program/submissions/:day",
    { preHandler: async (req) => app.authenticate(req) },
    async (req, reply) => {
      const { day } = dayParamSchema.parse(req.params);
      const body = submitBodySchema.parse(req.body);

      const program = await app.prisma.program.findFirst({ orderBy: [{ createdAt: "desc" }] });
      if (!program) throw app.httpErrors.notFound("Program not found");
      if (day > program.totalDays) throw app.httpErrors.badRequest("Invalid day");

      const me = await app.prisma.user.findUnique({ where: { id: req.authUser!.id }, select: { role: true } });
      if (!me) throw app.httpErrors.unauthorized("User not found");
      if (me.role !== "student") throw app.httpErrors.forbidden("Only students can submit daily work");

      const created = await app.prisma.daySubmission.upsert({
        where: { programId_dayNumber_userId: { programId: program.id, dayNumber: day, userId: req.authUser!.id } },
        create: {
          programId: program.id,
          dayNumber: day,
          userId: req.authUser!.id,
          artifacts: body.artifacts,
          reflection: body.reflection ?? null,
          status: "pending"
        },
        update: {
          artifacts: body.artifacts,
          reflection: body.reflection ?? null,
          status: "pending"
        }
      });

      reply.code(201);
      return created;
    }
  );

  app.get(
    "/program/submissions",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      const program = await app.prisma.program.findFirst({ orderBy: [{ createdAt: "desc" }] });
      if (!program) throw app.httpErrors.notFound("Program not found");

      const me = await app.prisma.user.findUnique({ where: { id: req.authUser!.id }, select: { role: true } });
      if (!me) throw app.httpErrors.unauthorized("User not found");

      const where: any = { programId: program.id };
      if (me.role === "student") where.userId = req.authUser!.id;

      return await app.prisma.daySubmission.findMany({
        where,
        orderBy: [{ submittedAt: "desc" }],
        include: { user: { select: { id: true, name: true } } }
      });
    }
  );

  app.patch(
    "/program/submissions/:id/review",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      const id = (req.params as any).id as string;
      const body = reviewBodySchema.parse(req.body);

      const me = await app.prisma.user.findUnique({ where: { id: req.authUser!.id }, select: { role: true } });
      if (!me) throw app.httpErrors.unauthorized("User not found");
      if (me.role === "student") throw app.httpErrors.forbidden("Not allowed");

      const updated = await app.prisma.daySubmission.update({
        where: { id },
        data: {
          status: body.status === "needs-revision" ? "needs_revision" : body.status,
          score: body.score ?? undefined,
          feedback: body.feedback ?? undefined,
          xpAwarded: body.xpAwarded ?? undefined
        }
      });
      return updated;
    }
  );
};

export default programRoutes;

