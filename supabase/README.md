# Supabase setup (Auth + DB + Storage)

## 1) Apply database schema

- In Supabase Dashboard → **SQL Editor**
  - Run `schema.sql`
  - Then run `seed.sql` (optional)

### Bootstrap your first admin

Before your first admin logs in, add their email to the allowlist:

```sql
insert into public.admin_allowlist(email) values ('admin@yourdomain.com')
on conflict do nothing;
```

## 2) Auth settings (Email OTP)

- Supabase Dashboard → **Authentication → Providers → Email**
  - Enable **Email** provider
  - Enable **Email OTP** / **One-time password** (code-based)
  - Set **Site URL** to your frontend URL (e.g. `http://localhost:5173`)
  - Add redirect URL: `http://localhost:5173/reset-password`

## 3) Storage buckets

Create these buckets in **Storage**:

- `assignment-uploads` (private)
- `payment-proofs` (private)
- `certificates` (private)
- (optional) `hackathon-entries` (private)

Then apply storage policies (SQL Editor):
- Run `storage_policies.sql`

## 4) Frontend env

Create `frontend/.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_YT_LIVE_EMBED_URL=https://www.youtube.com/embed/YOUR_LIVE_ID
```

Then run:

```bash
cd frontend
npm run dev
```

