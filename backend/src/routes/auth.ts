import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { newJti, signAccessToken, signRefreshToken, verifyRefreshToken } from "../auth/tokens";

const registerBody = z.object({
  email: z.string().email().max(320),
  password: z.string().min(10).max(200),
  name: z.string().min(1).max(120).optional(),
  grade: z.string().min(1).max(60).optional(),
  track: z.enum(["Robotics", "Coding", "Drone", "AI", "Innovation"]).optional(),
  role: z.enum(["student", "mentor", "admin"]).optional(),
  avatar: z.string().min(1).max(8).optional(),
  school: z.string().min(1).max(200).optional(),
  pin: z.string().min(4).max(12).optional()
});

const loginBody = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200)
});

const loginPinBody = z.object({
  userId: z.string().min(1),
  pin: z.string().min(4).max(12)
});

function refreshCookieOptions(app: any) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: app.config.cookieSecure,
    path: "/api/v1/auth",
    maxAge: app.config.REFRESH_TOKEN_TTL_SEC
  };
}

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", async (req, reply) => {
    const body = registerBody.parse(req.body);
    const email = body.email.toLowerCase();

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw app.httpErrors.conflict("Email already registered");
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const pinHash = body.pin ? await bcrypt.hash(body.pin, 12) : null;
    const user = await app.prisma.user.create({
      data: {
        email,
        passwordHash,
        pinHash: pinHash ?? undefined,
        name: body.name ?? email.split("@")[0],
        grade: body.grade ?? "Unknown",
        track: (body.track as any) ?? "Coding",
        role: (body.role as any) ?? "student",
        xp: 0,
        level: 1,
        streak: 0,
        rank: 0,
        avatar: body.avatar ?? (email.slice(0, 2).toUpperCase()),
        school: body.school ?? "TechM4Schools",
        badges: [],
        completedTasks: []
      },
      select: { id: true, email: true, name: true, role: true, track: true, createdAt: true }
    });

    reply.code(201);
    return user;
  });

  app.post("/auth/login", async (req, reply) => {
    const body = loginBody.parse(req.body);
    const email = body.email.toLowerCase();

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw app.httpErrors.unauthorized("Invalid credentials");
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      throw app.httpErrors.unauthorized("Invalid credentials");
    }

    const accessToken = signAccessToken(app, { sub: user.id, email: user.email });
    const jti = newJti();
    const refreshToken = signRefreshToken(app, { sub: user.id, jti });

    await app.prisma.refreshToken.create({
      data: {
        id: jti,
        userId: user.id,
        expiresAt: new Date(Date.now() + app.config.REFRESH_TOKEN_TTL_SEC * 1000)
      }
    });

    reply.setCookie("refresh_token", refreshToken, refreshCookieOptions(app));
    return {
      accessToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        name: user.name,
        grade: user.grade,
        track: user.track,
        role: user.role,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        rank: user.rank,
        avatar: user.avatar,
        school: user.school,
        badges: user.badges,
        completedTasks: user.completedTasks
      }
    };
  });

  // PIN login used by the demo UI (select profile + PIN)
  app.post("/auth/login-pin", async (req, reply) => {
    const body = loginPinBody.parse(req.body);
    const user = await app.prisma.user.findUnique({ where: { id: body.userId } });
    if (!user || !user.pinHash) {
      throw app.httpErrors.unauthorized("Invalid credentials");
    }
    const ok = await bcrypt.compare(body.pin, user.pinHash);
    if (!ok) {
      throw app.httpErrors.unauthorized("Invalid credentials");
    }

    const accessToken = signAccessToken(app, { sub: user.id, email: user.email });
    const jti = newJti();
    const refreshToken = signRefreshToken(app, { sub: user.id, jti });

    await app.prisma.refreshToken.create({
      data: {
        id: jti,
        userId: user.id,
        expiresAt: new Date(Date.now() + app.config.REFRESH_TOKEN_TTL_SEC * 1000)
      }
    });

    reply.setCookie("refresh_token", refreshToken, refreshCookieOptions(app));
    return {
      accessToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        name: user.name,
        grade: user.grade,
        track: user.track,
        role: user.role,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        rank: user.rank,
        avatar: user.avatar,
        school: user.school,
        badges: user.badges,
        completedTasks: user.completedTasks
      }
    };
  });

  app.post("/auth/refresh", async (req, reply) => {
    const token = req.cookies?.refresh_token;
    if (!token) {
      throw app.httpErrors.unauthorized("Missing refresh token");
    }

    const payload = verifyRefreshToken(app, token);
    const record = await app.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!record || record.revokedAt) {
      throw app.httpErrors.unauthorized("Refresh token revoked");
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw app.httpErrors.unauthorized("Refresh token expired");
    }

    // Rotate refresh token
    const newTokenId = newJti();
    const newRefreshToken = signRefreshToken(app, { sub: payload.sub, jti: newTokenId });

    await app.prisma.$transaction([
      app.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() }
      }),
      app.prisma.refreshToken.create({
        data: {
          id: newTokenId,
          userId: record.userId,
          expiresAt: new Date(Date.now() + app.config.REFRESH_TOKEN_TTL_SEC * 1000)
        }
      })
    ]);

    const user = await app.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      throw app.httpErrors.unauthorized("User not found");
    }

    const accessToken = signAccessToken(app, { sub: user.id, email: user.email });
    reply.setCookie("refresh_token", newRefreshToken, refreshCookieOptions(app));
    return {
      accessToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        name: user.name,
        grade: user.grade,
        track: user.track,
        role: user.role,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        rank: user.rank,
        avatar: user.avatar,
        school: user.school,
        badges: user.badges,
        completedTasks: user.completedTasks
      }
    };
  });

  app.post("/auth/logout", async (req, reply) => {
    const token = req.cookies?.refresh_token;
    if (token) {
      try {
        const payload = verifyRefreshToken(app, token);
        await app.prisma.refreshToken.update({
          where: { id: payload.jti },
          data: { revokedAt: new Date() }
        });
      } catch {
        // ignore invalid token
      }
    }
    reply.clearCookie("refresh_token", { path: "/api/v1/auth" });
    return { ok: true };
  });
};

export default authRoutes;

