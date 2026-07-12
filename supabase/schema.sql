-- =====================================================================
-- Daily Life Dash · Supabase Schema
-- =====================================================================
-- Im Supabase-Dashboard: SQL Editor öffnen, diesen kompletten Text
-- einfügen und "Run" klicken. Legt die Tabelle + Sicherheitsregeln an.
--
-- Design: Die App hält ihren gesamten Zustand in EINEM JSON-Objekt
-- (finance, habits, training, chess, ...). Wir speichern genau dieses
-- Objekt pro Nutzer in einer Spalte. Das hält die Migration vom
-- Artifact-Speicher (window.storage) trivial: dasselbe JSON, nur woanders.
-- Claude Code darf das später normalisieren, wenn gewünscht – für den
-- Start ist ein JSONB-Blob völlig ausreichend und am robustesten.
-- =====================================================================

create table if not exists public.dashboards (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: jeder Nutzer sieht und ändert NUR seine eigene Zeile.
alter table public.dashboards enable row level security;

create policy "own row: select"
  on public.dashboards for select
  using (auth.uid() = user_id);

create policy "own row: insert"
  on public.dashboards for insert
  with check (auth.uid() = user_id);

create policy "own row: update"
  on public.dashboards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at automatisch pflegen
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_updated_at on public.dashboards;
create trigger trg_touch_updated_at
  before update on public.dashboards
  for each row execute function public.touch_updated_at();
