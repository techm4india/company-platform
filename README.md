# Product-Based Innovation Training Platform (20,000+)

This repo contains a **Supabase-first** (Auth + Postgres + Storage) production-style student operating system with a **mobile-first Tailwind UI** and a full **Admin panel**.

## Folder structure

- `frontend/`: Vite + React + Tailwind v4 web app (Student OS + Admin panel)
- `supabase/`: SQL schema + seed + Supabase setup docs
- `backend/`: legacy Node backend from earlier iteration (not required for the Supabase architecture)

## Features implemented

### Student
- Auth: **Email OTP** login + password reset
- Dashboard: today’s live class, progress %, upcoming sessions, notifications
- Live class: YouTube Live embed + schedule + recordings
- Program: 25-day timeline + completion tracking
- Assignments: daily assignments, **file upload (PDF/Image)**, submission tracking
- Quizzes/Exams: MCQ, timer, **server-side grading RPC**
- Hackathon: project submission + results leaderboard (published entries)
- Kit: address storage + dispatch status
- Payments: transaction details + proof upload + status
- Notifications: in-app (broadcast + personal) + mark read
- Support: FAQ + support tickets
- Gamification: points/level/streak tables + leaderboard UI
- Certificate: **PDF generate & download** (client-side) + optional upload to Supabase Storage
- AI assistant: basic chatbot UI with optional Edge Function hook

### Admin
- Students: view all users, assign track, promote role
- Payments: approve/reject payments + view proof (signed URL)
- Content: manage program days + class sessions (live/recorded URLs)
- Assignments: create assignments
- Submissions: review submissions, score + feedback, view uploaded files
- Hackathon: evaluate entries, publish leaderboard results
- Kits: manage dispatch status + tracking details
- Broadcast: send in-app notifications
- Analytics: overview + top students
- Performance insights: weak signals dashboard (progress %, quiz avg, submissions)

## Setup (local)

1) Supabase
- Follow `supabase/README.md`
- Run `supabase/schema.sql` then `supabase/seed.sql` in Supabase SQL editor
- Create Storage buckets:
  - `assignment-uploads` (private)
  - `payment-proofs` (private)
  - `certificates` (private)

2) Frontend
- Create `frontend/.env` (copy from `frontend/.env.example`)
- Run:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deploy (Vercel)

This repo is a monorepo; the Vercel deploy target is the Vite app in `frontend/`.

- **Environment variables (Vercel → Project Settings → Environment Variables)**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - (optional) `VITE_YT_LIVE_EMBED_URL`

- **Build**: `npm run build` (runs inside `frontend/`)
- **Output directory**: `frontend/dist`
- **SPA routing**: configured via `vercel.json` rewrite to `index.html`

## Production notes (architecture)

- **Scale**: Supabase Auth + Postgres + Storage scales horizontally; use RLS and indexes included in `schema.sql`.
- **Security**: RLS is enabled for all tables. Admin is bootstrapped via `admin_allowlist`.
- **Performance**: Add route-level code splitting (dynamic imports) for large bundles (pdf generation, admin pages).
- **AI assistant**: Use Supabase Edge Functions to keep LLM API keys server-side.

