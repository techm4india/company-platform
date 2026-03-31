# TechM4Schools Backend

Production-oriented API backend designed to scale horizontally (multiple instances behind a load balancer).

## Features

- Fastify HTTP API (stateless)
- Postgres via Prisma
- Redis for rate limiting + readiness checks
- Access JWT (short-lived) + Refresh JWT in HttpOnly cookie (rotating)
- Health endpoints: `GET /api/v1/healthz`, `GET /api/v1/readyz`

## Quick start (Docker)

1. Start services:

```bash
docker compose up --build
```

2. Apply DB migrations (first time):

```bash
docker compose exec backend npx prisma migrate deploy
```

3. Seed demo data (optional, matches `techm4schools_platform_v2.jsx`):

```bash
docker compose exec backend npm run prisma:seed
```

3. Test endpoints:

```bash
curl http://localhost:3000/api/v1/healthz
```

## Local dev (without Docker)

1. Copy env:

```bash
copy .env.example .env
```

2. Install + generate:

```bash
npm i
npx prisma generate
```

3. Run migrations (requires local Postgres):

```bash
npx prisma migrate dev
```

4. Start dev server:

```bash
npm run dev
```

## Using Supabase Postgres

- Create tables in Supabase (SQL Editor) using the schema we generated.
- Set `DATABASE_URL` to your Supabase connection string **with SSL**:
  - `...?sslmode=require`
- Recommended: keep Supabase **service role key** server-only and do not embed it in the frontend.

## Auth flow

- **Register**: `POST /api/v1/auth/register`
- **Login**: `POST /api/v1/auth/login` → returns `accessToken` and sets `refresh_token` cookie
- **Refresh**: `POST /api/v1/auth/refresh` → rotates refresh token cookie + returns new `accessToken`
- **Logout**: `POST /api/v1/auth/logout` → revokes refresh token + clears cookie
- **Me**: `GET /api/v1/me` with `Authorization: Bearer <accessToken>`

## Scaling notes (20k concurrent users)

- Run multiple backend containers/VMs (stateless) behind a load balancer.
- Keep refresh tokens in DB (already) and rate limiting in Redis (already).
- In production, use a Postgres pooler (e.g., PgBouncer) to avoid too many DB connections.

