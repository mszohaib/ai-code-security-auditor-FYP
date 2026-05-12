-- Run this in the Supabase SQL editor to provision tables used by the Node API.

create extension if not exists "uuid-ossp";

create table if not exists public.security_scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  language text not null default 'python',
  findings_count integer not null default 0,
  summary text,
  code_sample text,
  raw_engine_response jsonb
);

alter table public.security_scans enable row level security;

create policy "Users read own scans"
  on public.security_scans
  for select
  using (auth.uid() = user_id);

create policy "Users insert own scans"
  on public.security_scans
  for insert
  with check (auth.uid() = user_id);

-- Service role bypasses RLS; the Express server uses the service role key.
