import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const trackSchema = z.enum(["Robotics", "Coding", "Drone", "AI", "Innovation", "All"]);
const classStatusSchema = z.enum(["done", "live", "upcoming"]);

const createClassBody = z.object({
  day: z.number().int().min(1).max(365),
  title: z.string().min(1).max(200),
  track: trackSchema,
  topic: z.string().min(1).max(400),
  time: z.string().min(1).max(100),
  mentor: z.string().min(1).max(120),
  status: classStatusSchema.default("upcoming"),
  objectives: z.array(z.string().min(1).max(200)).default([]),
  materials: z.array(z.string().min(1).max(200)).default([]),
  recordingUrl: z.string().url().optional()
});

const updateClassBody = createClassBody.partial();

const announcementTypeSchema = z.enum(["urgent", "info", "event", "achievement"]);
const createAnnouncementBody = z.object({
  type: announcementTypeSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  date: z.string().min(1).max(60),
  pinned: z.boolean().default(false)
});
const updateAnnouncementBody = createAnnouncementBody.partial();

const manageRoutes: FastifyPluginAsync = async (app) => {
  async function requireStaff(userId: string) {
    const u = await app.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) throw app.httpErrors.unauthorized("User not found");
    if (u.role === "student") throw app.httpErrors.forbidden("Staff only");
    return u.role;
  }

  async function requireAdmin(userId: string) {
    const u = await app.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) throw app.httpErrors.unauthorized("User not found");
    if (u.role !== "admin") throw app.httpErrors.forbidden("Admin only");
  }

  // ---- Classes CRUD (mentor/admin) ----
  app.post(
    "/classes",
    { preHandler: async (req) => app.authenticate(req) },
    async (req, reply) => {
      await requireStaff(req.authUser!.id);
      const body = createClassBody.parse(req.body);

      const trackAll = body.track === "All";
      const created = await app.prisma.classSession.create({
        data: {
          day: body.day,
          title: body.title,
          trackAll,
          track: trackAll ? null : (body.track as any),
          topic: body.topic,
          time: body.time,
          mentor: body.mentor,
          status: body.status as any,
          objectives: body.objectives,
          materials: body.materials,
          recordingUrl: body.recordingUrl ?? undefined
        }
      });

      reply.code(201);
      return created;
    }
  );

  app.patch(
    "/classes/:id",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      await requireStaff(req.authUser!.id);
      const id = (req.params as any).id as string;
      const body = updateClassBody.parse(req.body);

      const trackAll = body.track ? body.track === "All" : undefined;
      const updated = await app.prisma.classSession.update({
        where: { id },
        data: {
          day: body.day ?? undefined,
          title: body.title ?? undefined,
          trackAll: trackAll ?? undefined,
          track: body.track ? (body.track === "All" ? null : (body.track as any)) : undefined,
          topic: body.topic ?? undefined,
          time: body.time ?? undefined,
          mentor: body.mentor ?? undefined,
          status: body.status ? (body.status as any) : undefined,
          objectives: body.objectives ?? undefined,
          materials: body.materials ?? undefined,
          recordingUrl: body.recordingUrl ?? undefined
        }
      });
      return updated;
    }
  );

  app.delete(
    "/classes/:id",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      await requireAdmin(req.authUser!.id);
      const id = (req.params as any).id as string;
      await app.prisma.classSession.delete({ where: { id } });
      return { ok: true };
    }
  );

  // ---- Announcements CRUD (mentor/admin) ----
  app.post(
    "/announcements",
    { preHandler: async (req) => app.authenticate(req) },
    async (req, reply) => {
      await requireStaff(req.authUser!.id);
      const body = createAnnouncementBody.parse(req.body);

      const created = await app.prisma.announcement.create({
        data: {
          type: body.type as any,
          title: body.title,
          body: body.body,
          dateLabel: body.date,
          pinned: body.pinned
        }
      });
      reply.code(201);
      return created;
    }
  );

  app.patch(
    "/announcements/:id",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      await requireStaff(req.authUser!.id);
      const id = (req.params as any).id as string;
      const body = updateAnnouncementBody.parse(req.body);

      const updated = await app.prisma.announcement.update({
        where: { id },
        data: {
          type: body.type ? (body.type as any) : undefined,
          title: body.title ?? undefined,
          body: body.body ?? undefined,
          dateLabel: body.date ?? undefined,
          pinned: body.pinned ?? undefined
        }
      });
      return updated;
    }
  );

  app.delete(
    "/announcements/:id",
    { preHandler: async (req) => app.authenticate(req) },
    async (req) => {
      await requireAdmin(req.authUser!.id);
      const id = (req.params as any).id as string;
      await app.prisma.announcement.delete({ where: { id } });
      return { ok: true };
    }
  );
};

export default manageRoutes;

