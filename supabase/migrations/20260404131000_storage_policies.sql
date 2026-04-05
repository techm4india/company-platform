-- Storage RLS policies (apply after creating buckets)
-- Buckets expected: assignment-uploads, payment-proofs, certificates

-- Note: In some local setups, the `postgres` role may not own `storage.objects`.
-- RLS is typically enabled by default; policy creation below is guarded to avoid failing migrations.
do $$ begin
  alter table storage.objects enable row level security;
exception when insufficient_privilege then null; end $$;

-- Helper: first folder segment must match auth.uid()
-- Path format we use from frontend: `${uid}/...`

-- Assignment uploads
do $$ begin
  create policy "assignment uploads: read own or admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'assignment-uploads'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

do $$ begin
  create policy "assignment uploads: insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'assignment-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

do $$ begin
  create policy "assignment uploads: update own or admin"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'assignment-uploads'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  )
  with check (
    bucket_id = 'assignment-uploads'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

-- Payment proofs
do $$ begin
  create policy "payment proofs: read own or admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

do $$ begin
  create policy "payment proofs: insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

do $$ begin
  create policy "payment proofs: update own or admin"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  )
  with check (
    bucket_id = 'payment-proofs'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

-- Certificates (read own; write can be admin or the user)
do $$ begin
  create policy "certificates: read own or admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'certificates'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

do $$ begin
  create policy "certificates: insert own or admin"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'certificates'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

do $$ begin
  create policy "certificates: update own or admin"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'certificates'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  )
  with check (
    bucket_id = 'certificates'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
exception when duplicate_object then null; when insufficient_privilege then null; end $$;

