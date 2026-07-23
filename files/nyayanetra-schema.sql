-- =========================================================
-- NyayaNetra — Supabase schema + Row Level Security
-- Starts completely empty. No seeded people, cases, or FIRs.
-- =========================================================

-- ---------- helper: read the caller's own profile row ----------
create or replace function my_role() returns text
language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function my_station() returns uuid
language sql stable security definer as $$
  select station_id from profiles where id = auth.uid();
$$;

-- ---------- stations ----------
create table stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text not null,
  created_at timestamptz default now()
);

-- ---------- profiles (one row per auth.users, created on signup) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  badge_id text unique,
  role text not null check (role in ('investigator','admin')) default 'investigator',
  station_id uuid references stations(id),
  access_status text not null check (access_status in ('pending','active','revoked')) default 'pending',
  created_at timestamptz default now()
);

-- ---------- cases (FIRs) ----------
create table cases (
  id uuid primary key default gen_random_uuid(),
  fir_number text not null unique,
  station_id uuid not null references stations(id),
  title text not null,
  description text,
  status text not null check (status in ('open','under_review','closed')) default 'open',
  priority text not null check (priority in ('low','medium','high')) default 'medium',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ---------- suspects ----------
create table suspects (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  name text not null,
  aliases text[] default '{}',
  risk_score numeric check (risk_score between 0 and 100),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ---------- suspect-to-suspect links (network graph edges) ----------
create table suspect_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  suspect_a_id uuid not null references suspects(id) on delete cascade,
  suspect_b_id uuid not null references suspects(id) on delete cascade,
  link_type text not null check (link_type in ('cdr_call','anpr','secondary_associate')),
  detail text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ---------- evidence / CDR / ANPR records ----------
create table evidence_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  suspect_id uuid references suspects(id),
  type text not null check (type in ('cdr','anpr','document','other')),
  cell_tower text,
  phone_number text,
  captured_at timestamptz,
  details jsonb default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ---------- conversations (chat sessions, tied to a case) ----------
create table conversations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  user_id uuid not null references profiles(id),
  title text not null default 'New Investigation',
  created_at timestamptz default now()
);

-- ---------- messages (chat turns) ----------
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  language text not null check (language in ('en','kn')) default 'en',
  cited_record_ids uuid[] default '{}',
  confidence_score numeric check (confidence_score between 0 and 100),
  created_at timestamptz default now()
);

-- ---------- audit log (every read/write of significance) ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- =========================================================
-- Row Level Security — station-scoped for investigators,
-- unrestricted for admins. No table is left open.
-- =========================================================
alter table stations enable row level security;
alter table profiles enable row level security;
alter table cases enable row level security;
alter table suspects enable row level security;
alter table suspect_links enable row level security;
alter table evidence_records enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table audit_logs enable row level security;

-- stations: everyone authenticated can read (needed for signup form)
create policy stations_read on stations for select using (auth.role() = 'authenticated');

-- profiles: read own row, or any row if admin
create policy profiles_self_read on profiles for select
  using (id = auth.uid() or my_role() = 'admin');
create policy profiles_self_update on profiles for update
  using (id = auth.uid() or my_role() = 'admin');
create policy profiles_insert on profiles for insert
  with check (id = auth.uid());

-- cases: investigators see only their station's cases; admins see all
create policy cases_select on cases for select
  using (my_role() = 'admin' or station_id = my_station());
create policy cases_insert on cases for insert
  with check (my_role() = 'admin' or station_id = my_station());
create policy cases_update on cases for update
  using (my_role() = 'admin' or station_id = my_station());

-- suspects / suspect_links / evidence: scoped via parent case's station
create policy suspects_all on suspects for all
  using (exists (select 1 from cases c where c.id = case_id
                 and (my_role() = 'admin' or c.station_id = my_station())));
create policy suspect_links_all on suspect_links for all
  using (exists (select 1 from cases c where c.id = case_id
                 and (my_role() = 'admin' or c.station_id = my_station())));
create policy evidence_all on evidence_records for all
  using (exists (select 1 from cases c where c.id = case_id
                 and (my_role() = 'admin' or c.station_id = my_station())));

-- conversations/messages: only the owning investigator or an admin
create policy conversations_owner on conversations for all
  using (user_id = auth.uid() or my_role() = 'admin');
create policy messages_owner on messages for all
  using (exists (select 1 from conversations c where c.id = conversation_id
                 and (c.user_id = auth.uid() or my_role() = 'admin')));

-- audit_logs: investigators can insert (system writes on their behalf),
-- only admins can read
create policy audit_insert on audit_logs for insert with check (true);
create policy audit_read on audit_logs for select using (my_role() = 'admin');
