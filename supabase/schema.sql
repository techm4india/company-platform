-- TechM4Schools / Product-Based Innovation Training Program
-- Supabase Postgres schema + RLS (production-ready baseline)
--
-- Apply in Supabase SQL Editor (order matters). If you're using Supabase CLI migrations,
-- split this into migrations as needed.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('admin','student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_submission_status as enum ('draft','submitted','reviewed','approved','needs_revision');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kit_status as enum ('pending_address','pending_dispatch','dispatched','delivered','issue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quiz_attempt_status as enum ('in_progress','submitted','expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('info','urgent','reminder','success');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Core tables (required list + supporting)
-- ─────────────────────────────────────────────────────────────────────────────

-- Required: tracks
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Required: users (profile + RBAC). This is NOT auth.users. This is app-level user profile.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  email text,
  full_name text,
  phone text,
  grade text,
  school text,
  track_id uuid references public.tracks(id),
  points int not null default 0,
  level int not null default 1,
  streak int not null default 0,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists users_role_idx on public.users(role);
create index if not exists users_track_idx on public.users(track_id);

-- Bootstrap table: grant initial admin(s) by email (safe; no frontend secrets).
create table if not exists public.admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Required: students (student-only operational fields)
create table if not exists public.students (
  user_id uuid primary key references public.users(id) on delete cascade,
  address jsonb,
  guardian_name text,
  guardian_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Program structure: 25-day timeline + day-wise modules
create table if not exists public.program_days (
  day int primary key,
  track_id uuid references public.tracks(id),
  title text not null,
  topic text not null,
  summary text,
  content jsonb,
  youtube_recorded_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Live class schedule (supports YouTube live embed + playback)
create table if not exists public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  day int references public.program_days(day) on delete set null,
  track_id uuid references public.tracks(id),
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  youtube_live_url text,
  youtube_recorded_url text,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists class_sessions_day_idx on public.class_sessions(day);
create index if not exists class_sessions_live_idx on public.class_sessions(is_live) where is_live = true;

-- Required: progress (completion tracking)
create table if not exists public.progress (
  user_id uuid not null references public.users(id) on delete cascade,
  day int not null references public.program_days(day) on delete cascade,
  completion_percent int not null default 0 check (completion_percent between 0 and 100),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index if not exists progress_user_idx on public.progress(user_id);

-- Required: assignments (daily assignments)
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  day int not null references public.program_days(day) on delete cascade,
  track_id uuid references public.tracks(id),
  title text not null,
  description text,
  due_at timestamptz,
  allow_file_upload boolean not null default true,
  allow_text boolean not null default true,
  max_points int not null default 100,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assignments_day_idx on public.assignments(day);
create index if not exists assignments_track_idx on public.assignments(track_id);

-- Required: submissions (file upload + tracking)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  text_answer text,
  file_paths jsonb, -- array of storage paths
  status public.assignment_submission_status not null default 'submitted',
  score int,
  feedback text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (assignment_id, user_id)
);
create index if not exists submissions_user_idx on public.submissions(user_id);
create index if not exists submissions_assignment_idx on public.submissions(assignment_id);

-- Exam / Quiz system
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  day int references public.program_days(day) on delete set null,
  track_id uuid references public.tracks(id),
  title text not null,
  duration_sec int not null default 900,
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quizzes_day_idx on public.quizzes(day);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  options jsonb not null, -- string[]
  correct_index int not null,
  points int not null default 1,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists quiz_questions_quiz_idx on public.quiz_questions(quiz_id);

-- Public copy without answers (prevents leaking correct_index)
create table if not exists public.quiz_questions_public (
  id uuid primary key references public.quiz_questions(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  points int not null default 1,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists quiz_questions_public_quiz_idx on public.quiz_questions_public(quiz_id);

create or replace function public.sync_quiz_question_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.quiz_questions_public where id = old.id;
    return old;
  end if;

  insert into public.quiz_questions_public (id, quiz_id, prompt, options, points, sort_order, created_at)
  values (new.id, new.quiz_id, new.prompt, new.options, new.points, new.sort_order, new.created_at)
  on conflict (id) do update set
    quiz_id = excluded.quiz_id,
    prompt = excluded.prompt,
    options = excluded.options,
    points = excluded.points,
    sort_order = excluded.sort_order;
  return new;
end;
$$;

do $$ begin
  create trigger quiz_questions_sync_public
  after insert or update or delete on public.quiz_questions
  for each row execute function public.sync_quiz_question_public();
exception when duplicate_object then null; end $$;

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.quiz_attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int not null default 0,
  created_at timestamptz not null default now(),
  unique (quiz_id, user_id)
);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_index int,
  is_correct boolean,
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- Server-side grading (prevents leaking answers; works with RLS)
create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  attempt_id uuid;
  q record;
  sel int;
  correct boolean;
  score_total int := 0;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Ensure quiz is visible
  if not exists (select 1 from public.quizzes q where q.id = p_quiz_id and (q.is_published = true or public.is_admin())) then
    raise exception 'Quiz not available';
  end if;

  insert into public.quiz_attempts (quiz_id, user_id, status, started_at)
  values (p_quiz_id, uid, 'in_progress', now())
  on conflict (quiz_id, user_id) do update set status = public.quiz_attempts.status
  returning id into attempt_id;

  -- p_answers is expected as JSON array: [{question_id, selected_index}, ...]
  for q in
    select id, correct_index, points
    from public.quiz_questions
    where quiz_id = p_quiz_id
  loop
    select (elem->>'selected_index')::int
      into sel
    from jsonb_array_elements(p_answers) as elem
    where (elem->>'question_id')::uuid = q.id
    limit 1;

    correct := (sel is not null and sel = q.correct_index);
    if correct then
      score_total := score_total + q.points;
    end if;

    insert into public.quiz_answers (attempt_id, question_id, selected_index, is_correct, points_awarded)
    values (attempt_id, q.id, sel, correct, case when correct then q.points else 0 end)
    on conflict (attempt_id, question_id) do update set
      selected_index = excluded.selected_index,
      is_correct = excluded.is_correct,
      points_awarded = excluded.points_awarded;
  end loop;

  update public.quiz_attempts
    set status = 'submitted', finished_at = now(), score = score_total
    where id = attempt_id;

  return score_total;
end;
$$;

-- Hackathon module
create table if not exists public.hackathons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.hackathon_entries (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  team_name text,
  title text not null,
  description text,
  repo_url text,
  demo_url text,
  file_paths jsonb,
  submitted_at timestamptz not null default now(),
  score int,
  feedback text,
  published boolean not null default false,
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz
);
create index if not exists hackathon_entries_hackathon_idx on public.hackathon_entries(hackathon_id);

-- Required: kits (student address + dispatch tracking)
create table if not exists public.kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  track_id uuid references public.tracks(id),
  address jsonb,
  status public.kit_status not null default 'pending_address',
  courier text,
  tracking_number text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists kits_status_idx on public.kits(status);

-- Required: payments (manual/admin verification)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  provider text,
  reference text,
  proof_path text, -- storage path
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  verified_by uuid references public.users(id),
  verified_at timestamptz,
  notes text
);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_user_idx on public.payments(user_id);

-- Required: notifications (in-app + broadcast)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade, -- null => broadcast
  type public.notification_type not null default 'info',
  title text not null,
  body text,
  link text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_created_idx on public.notifications(created_at desc);

-- Support system
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gamification
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  points int not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists points_ledger_user_idx on public.points_ledger(user_id);

-- Certificates
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  program_name text not null default 'Product-Based Innovation Training Program',
  issued_at timestamptz not null default now(),
  storage_path text,
  unique (user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper functions (RBAC)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Auth trigger: create app profile rows automatically
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_role public.user_role := 'student';
begin
  if exists (select 1 from public.admin_allowlist a where lower(a.email) = lower(new.email)) then
    desired_role := 'admin';
  end if;

  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do update set email = excluded.email;

  update public.users set role = desired_role where id = new.id;

  insert into public.students (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

do $$ begin
  create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.tracks enable row level security;
alter table public.program_days enable row level security;
alter table public.class_sessions enable row level security;
alter table public.progress enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_questions_public enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.hackathons enable row level security;
alter table public.hackathon_entries enable row level security;
alter table public.kits enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.faqs enable row level security;
alter table public.support_tickets enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.points_ledger enable row level security;
alter table public.certificates enable row level security;
alter table public.admin_allowlist enable row level security;

-- users
do $$ begin
  create policy "users: read self" on public.users for select
    using (id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users: update self" on public.users for update
    using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

-- admin_allowlist
do $$ begin
  create policy "admin_allowlist: admin only" on public.admin_allowlist for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- students
do $$ begin
  create policy "students: read self" on public.students for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "students: update self" on public.students for update
    using (user_id = auth.uid() or public.is_admin())
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

-- public read tables
do $$ begin
  create policy "tracks: read all" on public.tracks for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "program_days: read all" on public.program_days for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "class_sessions: read all" on public.class_sessions for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "faqs: read all" on public.faqs for select using (true);
exception when duplicate_object then null; end $$;

-- admin write for content tables
do $$ begin
  create policy "tracks: admin write" on public.tracks for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "program_days: admin write" on public.program_days for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "class_sessions: admin write" on public.class_sessions for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "assignments: read all" on public.assignments for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "assignments: admin write" on public.assignments for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- progress
do $$ begin
  create policy "progress: read self" on public.progress for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "progress: upsert self" on public.progress for insert
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "progress: update self" on public.progress for update
    using (user_id = auth.uid() or public.is_admin())
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

-- submissions
do $$ begin
  create policy "submissions: read self" on public.submissions for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "submissions: insert self" on public.submissions for insert
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "submissions: update self or admin" on public.submissions for update
    using (user_id = auth.uid() or public.is_admin())
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

-- quizzes
do $$ begin
  create policy "quizzes: read published" on public.quizzes for select using (is_published = true or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quizzes: admin write" on public.quizzes for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_questions: admin only" on public.quiz_questions for select
    using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_questions: admin write" on public.quiz_questions for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_questions_public: read if quiz visible" on public.quiz_questions_public for select
    using (exists (select 1 from public.quizzes q where q.id = quiz_id and (q.is_published = true or public.is_admin())));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_attempts: read self" on public.quiz_attempts for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_attempts: upsert self" on public.quiz_attempts for insert
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_attempts: update self" on public.quiz_attempts for update
    using (user_id = auth.uid() or public.is_admin())
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_answers: read self" on public.quiz_answers for select
    using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin())));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_answers: insert self" on public.quiz_answers for insert
    with check (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin())));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_answers: update self" on public.quiz_answers for update
    using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin())))
    with check (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin())));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "quiz_answers: delete self" on public.quiz_answers for delete
    using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin())));
exception when duplicate_object then null; end $$;

-- hackathon
do $$ begin
  create policy "hackathons: read all" on public.hackathons for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hackathons: admin write" on public.hackathons for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hackathon_entries: read own or published" on public.hackathon_entries for select
    using (published = true or user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hackathon_entries: insert own" on public.hackathon_entries for insert
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hackathon_entries: update own" on public.hackathon_entries for update
    using (user_id = auth.uid() or public.is_admin())
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

-- kits
do $$ begin
  create policy "kits: read own" on public.kits for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "kits: upsert own" on public.kits for insert
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "kits: update own" on public.kits for update
    using (user_id = auth.uid() or public.is_admin())
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

-- payments
do $$ begin
  create policy "payments: read own" on public.payments for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "payments: insert own" on public.payments for insert
    with check (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "payments: admin verify" on public.payments for update
    using (public.is_admin())
    with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- notifications
do $$ begin
  create policy "notifications: read broadcast or own" on public.notifications for select
    using (user_id is null or user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "notifications: admin broadcast" on public.notifications for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- support tickets
do $$ begin
  create policy "support: read own" on public.support_tickets for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "support: insert own" on public.support_tickets for insert
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "support: admin update" on public.support_tickets for update
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- gamification (read all leaderboard, write admin/secure jobs)
do $$ begin
  create policy "badges: read all" on public.badges for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "badges: admin write" on public.badges for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_badges: read all" on public.user_badges for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_badges: admin insert" on public.user_badges for insert
    with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_badges: admin delete" on public.user_badges for delete
    using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "points: read self" on public.points_ledger for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "points: admin insert" on public.points_ledger for insert
    with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "points: admin delete" on public.points_ledger for delete
    using (public.is_admin());
exception when duplicate_object then null; end $$;

-- certificates
do $$ begin
  create policy "certificates: read own" on public.certificates for select
    using (user_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "certificates: admin insert" on public.certificates for insert
    with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "certificates: admin update" on public.certificates for update
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Analytics views (admin)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.analytics_overview as
select
  (select count(*) from public.users) as total_users,
  (select count(*) from public.users where last_seen_at > now() - interval '15 minutes') as active_users_15m,
  (select coalesce(avg(case when completion_percent=100 then 1 else 0 end),0) from public.progress) as avg_completion_rate,
  (select count(*) from public.submissions) as total_submissions,
  (select count(*) from public.payments where status='approved') as approved_payments;

-- Grants for RPC
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

-- Performance insights (advanced)
create or replace view public.student_performance_insights as
select
  u.id as user_id,
  u.email,
  u.full_name,
  u.track_id,
  u.points,
  u.level,
  u.streak,
  coalesce((select round(avg(qa.score)::numeric, 2) from public.quiz_attempts qa where qa.user_id = u.id and qa.status = 'submitted'), 0) as avg_quiz_score,
  coalesce((select count(*) from public.quiz_attempts qa where qa.user_id = u.id and qa.status = 'submitted'), 0) as quizzes_submitted,
  coalesce((select count(*) from public.submissions s where s.user_id = u.id), 0) as assignments_submitted,
  coalesce((select round(avg(p.completion_percent)::numeric, 2) from public.progress p where p.user_id = u.id), 0) as avg_progress_percent
from public.users u;

