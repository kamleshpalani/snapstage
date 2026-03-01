-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Admin Panel, Audit Logs, Email Reset Tokens
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Add is_admin flag to profiles ────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ─── 2. Audit logs ───────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_email text,
  action      text not null,         -- e.g. 'update_user_plan', 'delete_project'
  target_type text,                  -- e.g. 'user', 'project'
  target_id   text,                  -- UUID or string ID of the affected record
  before_data jsonb,                 -- snapshot before change
  after_data  jsonb,                 -- snapshot after change
  ip          text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor_id   on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action      on public.audit_logs(action);
create index if not exists idx_audit_logs_target_id   on public.audit_logs(target_id);
create index if not exists idx_audit_logs_created_at  on public.audit_logs(created_at desc);

-- ─── 3. Project admin notes ──────────────────────────────────────────────────
create table if not exists public.project_notes (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  author_email text,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_project_notes_project_id on public.project_notes(project_id);

-- ─── 4. Password reset tokens ────────────────────────────────────────────────
-- Used for admin-triggered resets OR future "forgot password" outside Supabase auth
create table if not exists public.password_reset_tokens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token_hash  text not null unique,  -- sha256 of the raw token
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_prt_token_hash on public.password_reset_tokens(token_hash);
create index if not exists idx_prt_user_id    on public.password_reset_tokens(user_id);

-- ─── 5. Notifications (for future in-app notifications) ──────────────────────
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  message     text not null,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_id  on public.notifications(user_id);
create index if not exists idx_notifications_read_at  on public.notifications(read_at);

-- ─── 6. RLS on new tables ────────────────────────────────────────────────────
alter table public.audit_logs         enable row level security;
alter table public.project_notes       enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.notifications       enable row level security;

-- audit_logs: only admins can read; service role writes
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- project_notes: admins see all; regular users see notes on their own projects
drop policy if exists "Admins can view all project notes" on public.project_notes;
create policy "Admins can view all project notes"
  on public.project_notes for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "Users can view notes on own projects" on public.project_notes;
create policy "Users can view notes on own projects"
  on public.project_notes for select
  using (
    exists (
      select 1 from public.projects
      where id = project_notes.project_id and user_id = auth.uid()
    )
  );

-- notifications: users read their own
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- password_reset_tokens: service role only (no user-level select policy)

-- ─── 7. Admin can SELECT all profiles + projects (for admin panel queries) ───
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.is_admin = true
    )
  );

-- Drop the old single-user policy (replaced by the combined one above)
drop policy if exists "Users can view own profile" on public.profiles;

drop policy if exists "Admins can view all projects" on public.projects;
create policy "Admins can view all projects"
  on public.projects for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Drop old single-user policy (replaced above)
drop policy if exists "Users can view own projects" on public.projects;

-- ─── 8. Grant yourself admin access (run once, replace the UUID) ────────────
-- UPDATE public.profiles SET is_admin = true WHERE id = 'YOUR_USER_UUID';
-- Example:
-- UPDATE public.profiles SET is_admin = true
-- WHERE id = 'a4e982b5-9f1d-4960-8881-8c4ecffdef1e';
