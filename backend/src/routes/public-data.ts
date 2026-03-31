import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const leaderboardQuery = z.object({
  sortBy: z.enum(["xp", "streak", "tasks"]).optional()
});

const publicDataRoutes: FastifyPluginAsync = async (app) => {
  app.get("/classes", async () => {
    const sessions = await app.prisma.classSession.findMany({
      orderBy: [{ day: "asc" }]
    });

    return sessions.map((c) => ({
      id: c.id,
      day: c.day,
      title: c.title,
      track: c.trackAll ? "All" : c.track,
      topic: c.topic,
      time: c.time,
      mentor: c.mentor,
      status: c.status,
      objectives: c.objectives,
      materials: c.materials,
      recordingUrl: c.recordingUrl ?? undefined
    }));
  });

  app.get("/announcements", async () => {
    const anns = await app.prisma.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }]
    });
    return anns.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.body,
      date: a.dateLabel,
      pinned: a.pinned
    }));
  });

  app.get("/leaderboard", async (req) => {
    const q = leaderboardQuery.parse(req.query);
    const sortBy = q.sortBy ?? "xp";

    const users = await app.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        track: true,
        xp: true,
        streak: true,
        rank: true,
        avatar: true
      }
    });

    const rows = users.map((u) => ({
      rank: u.rank,
      name: u.name,
      track: u.track,
      xp: u.xp,
      streak: u.streak,
      tasks: 0,
      avatar: u.avatar,
      color: "#10B981",
      userId: u.id
    }));

    rows.sort((a, b) => {
      if (sortBy === "streak") return b.streak - a.streak;
      if (sortBy === "tasks") return b.tasks - a.tasks;
      return b.xp - a.xp;
    });

    // re-rank if no stored rank, otherwise keep provided rank
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].rank) rows[i].rank = i + 1;
    }

    return rows;
  });
};

export default publicDataRoutes;

