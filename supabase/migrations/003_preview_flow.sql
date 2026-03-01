-- ─── 003: Preview → Approve → HD staging flow ───────────────────────────────
-- Run this in Supabase SQL Editor after 001_initial.sql and 002_admin.sql

-- Extend staging_style enum with all new styles (safe: only adds new values)
alter type staging_style add value if not exists 'bohemian';
alter type staging_style add value if not exists 'japandi';
alter type staging_style add value if not exists 'farmhouse';
alter type staging_style add value if not exists 'art_deco';
alter type staging_style add value if not exists 'mediterranean';
alter type staging_style add value if not exists 'mid_century';
alter type staging_style add value if not exists 'minimalist';
alter type staging_style add value if not exists 'maximalist';
alter type staging_style add value if not exists 'contemporary';
alter type staging_style add value if not exists 'rustic';
alter type staging_style add value if not exists 'eclectic';
alter type staging_style add value if not exists 'french_country';
alter type staging_style add value if not exists 'hamptons';
alter type staging_style add value if not exists 'tropical';
alter type staging_style add value if not exists 'wabi_sabi';
alter type staging_style add value if not exists 'hollywood_regency';
alter type staging_style add value if not exists 'craftsman';
alter type staging_style add value if not exists 'victorian';
alter type staging_style add value if not exists 'bauhaus';
alter type staging_style add value if not exists 'biophilic';
alter type staging_style add value if not exists 'zen';
alter type staging_style add value if not exists 'urban_modern';
alter type staging_style add value if not exists 'dark_academia';
alter type staging_style add value if not exists 'cottagecore';
alter type staging_style add value if not exists 'southwestern';
alter type staging_style add value if not exists 'moroccan';
alter type staging_style add value if not exists 'japanese_modern';
alter type staging_style add value if not exists 'korean_minimal';
alter type staging_style add value if not exists 'chinoiserie';
alter type staging_style add value if not exists 'italian_villa';
alter type staging_style add value if not exists 'tuscan';
alter type staging_style add value if not exists 'parisian';
alter type staging_style add value if not exists 'brooklyn_loft';
alter type staging_style add value if not exists 'alpine';
alter type staging_style add value if not exists 'transitional';
alter type staging_style add value if not exists 'organic_modern';
alter type staging_style add value if not exists 'moody_dark';
alter type staging_style add value if not exists 'retro_70s';
alter type staging_style add value if not exists 'futuristic';
alter type staging_style add value if not exists 'grandmillennial';
alter type staging_style add value if not exists 'art_nouveau';
alter type staging_style add value if not exists 'neoclassical';
alter type staging_style add value if not exists 'ski_chalet';
alter type staging_style add value if not exists 'renovation';
alter type staging_style add value if not exists 'declutter';

-- ─── Staging request status enum ────────────────────────────────────────────
create type staging_request_status as enum (
  'queued',
  'preview_generating',
  'preview_ready',
  'approved',
  'hd_generating',
  'hd_ready',
  'failed'
);

-- ─── staging_requests ────────────────────────────────────────────────────────
-- One row per user attempt at a style+image combo
create table public.staging_requests (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references public.profiles(id) on delete cascade,
  project_id             uuid not null references public.projects(id) on delete cascade,
  original_image_url     text not null,
  style                  text not null,                      -- not enum so we can extend freely
  options_hash           text not null,                      -- md5(style||options_json) for dedup
  status                 staging_request_status not null default 'queued',
  preview_prediction_id  text,
  hd_prediction_id       text,
  approved_at            timestamptz,
  approved_by            uuid references public.profiles(id),
  preview_regen_count    integer not null default 0,
  hd_credit_deducted     boolean not null default false,
  error_message          text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Prevent duplicate in-flight requests for same project+style+options
create unique index staging_requests_project_hash_active_idx
  on public.staging_requests (project_id, options_hash)
  where status not in ('hd_ready', 'failed');

create index staging_requests_user_id_idx      on public.staging_requests (user_id);
create index staging_requests_project_id_idx   on public.staging_requests (project_id);
create index staging_requests_status_idx       on public.staging_requests (status);

-- ─── staging_outputs ─────────────────────────────────────────────────────────
-- Stores the actual image outputs (preview = watermarked+low-res, hd = full-res)
create type staging_output_type as enum ('preview', 'hd');

create table public.staging_outputs (
  id               uuid primary key default uuid_generate_v4(),
  request_id       uuid not null references public.staging_requests(id) on delete cascade,
  output_type      staging_output_type not null,
  storage_path     text,                                     -- supabase storage bucket path
  url              text not null,                            -- replicate or supabase url
  width            integer,
  height           integer,
  watermarked      boolean not null default false,
  file_size_bytes  bigint,
  expires_at       timestamptz,                              -- for signed preview URLs
  created_at       timestamptz not null default now()
);

create index staging_outputs_request_id_idx on public.staging_outputs (request_id);
create index staging_outputs_type_idx       on public.staging_outputs (request_id, output_type);

-- ─── preview_rate_limits ─────────────────────────────────────────────────────
-- Per-user rate limiting table for preview regenerations
create table public.preview_rate_limits (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  window_start timestamptz not null default now(),
  regen_count  integer not null default 0,
  unique (user_id, window_start)
);

create index preview_rate_limits_user_window_idx
  on public.preview_rate_limits (user_id, window_start);

-- ─── Audit log events for preview flow ───────────────────────────────────────
-- (Adds to existing audit_logs if it exists from 002, else standalone)
do $$ begin
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'audit_logs') then
    create table public.audit_logs (
      id          uuid primary key default uuid_generate_v4(),
      user_id     uuid references public.profiles(id) on delete set null,
      event       text not null,
      resource_id text,
      metadata    jsonb,
      created_at  timestamptz not null default now()
    );
    create index audit_logs_user_id_idx on public.audit_logs (user_id);
    create index audit_logs_event_idx   on public.audit_logs (event);
  end if;
end $$;

-- ─── RLS Policies ────────────────────────────────────────────────────────────
alter table public.staging_requests enable row level security;
alter table public.staging_outputs   enable row level security;
alter table public.preview_rate_limits enable row level security;

-- staging_requests: users can only see/modify their own
create policy "users_own_requests"
  on public.staging_requests for all
  using (auth.uid() = user_id);

-- staging_outputs: users can only see outputs for their own requests
create policy "users_own_outputs"
  on public.staging_outputs for all
  using (
    exists (
      select 1 from public.staging_requests sr
      where sr.id = staging_outputs.request_id
        and sr.user_id = auth.uid()
    )
  );

-- Service role can always bypass (for background workers)
create policy "service_role_requests"
  on public.staging_requests for all
  using (current_setting('role') = 'service_role');

create policy "service_role_outputs"
  on public.staging_outputs for all
  using (current_setting('role') = 'service_role');

-- ─── updated_at trigger on staging_requests ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger staging_requests_updated_at
  before update on public.staging_requests
  for each row execute function public.set_updated_at();
