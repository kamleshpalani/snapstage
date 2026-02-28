-- ─── Enable UUID extension ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type staging_style as enum (
  'modern', 'scandinavian', 'luxury', 'coastal', 'industrial', 'traditional'
);

create type project_status as enum (
  'pending', 'processing', 'completed', 'failed'
);

create type plan as enum (
  'free', 'pro', 'agency', 'payg'
);

-- ─── Profiles table ───────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  plan          plan not null default 'free',
  credits_remaining integer not null default 3,
  credits_used  integer not null default 0,
  stripe_customer_id text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Projects table ───────────────────────────────────────────────────────────
create table public.projects (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  name                     text not null,
  original_image_url       text not null,
  staged_image_url         text,
  style                    staging_style not null default 'modern',
  status                   project_status not null default 'pending',
  replicate_prediction_id  text,
  error_message            text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ─── Credit transactions ─────────────────────────────────────────────────────
create table public.credit_transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  amount      integer not null, -- negative = debit, positive = credit
  description text not null,
  created_at  timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_status on public.projects(status);
create index idx_credit_transactions_user_id on public.credit_transactions(user_id);

-- ─── Updated at trigger ──────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- ─── Auto-create profile on signup ──────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.credit_transactions enable row level security;

-- Profiles: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects: users can only CRUD their own projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Credit transactions: read only
create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- ─── Storage buckets ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('room-images', 'room-images', true);

create policy "Users can upload room images"
  on storage.objects for insert
  with check (bucket_id = 'room-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view room images"
  on storage.objects for select
  using (bucket_id = 'room-images');
