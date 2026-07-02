-- MyEvo — schema inicial (v1)
-- Ejecutar en Supabase: Dashboard > SQL Editor > pegar todo > Run.
-- Diseño multi-dev desde el día 1: todo cuelga de developers.id = auth.users.id.

-- ============================================================
-- Tablas
-- ============================================================

create table public.developers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.alert_settings (
  developer_id uuid primary key references public.developers (id) on delete cascade,
  pr_open_days integer not null default 2,          -- PR abierto > N dias
  branch_active_days integer not null default 3,    -- rama activa > N dias
  merged_not_deleted_days integer not null default 1 -- rama mergeada sin eliminar > N dias
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  -- Hora real de fin del sprint planning: base del tiempo de ciclo.
  planning_ended_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint sprint_dates check (end_date > start_date)
);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references public.sprints (id) on delete cascade,
  developer_id uuid not null references public.developers (id) on delete cascade,
  module_id uuid not null references public.modules (id),
  jira_key text not null,
  title text not null,
  type text not null check (type in ('feature', 'bug', 'task')),
  points integer check (points is null or points >= 0),
  jira_status text not null default 'To Do'
    check (jira_status in ('To Do', 'InProgress', 'Waiting For Dependency', 'Progress Done', 'Inspection', 'Done')),
  -- true = asumida en el sprint planning; false = trabajo fuera del compromiso inicial
  committed boolean not null default true,
  created_at timestamptz not null default now(),
  -- Solo las Features tienen puntos
  constraint points_only_for_features check (type = 'feature' or points is null)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  name text not null,
  created_on date not null,
  deleted_on date,
  created_at timestamptz not null default now(),
  constraint branch_lifetime check (deleted_on is null or deleted_on >= created_on)
);

create table public.pull_requests (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  url text,
  source_branch text not null,
  target_branch text not null default 'develop',
  status text not null default 'open' check (status in ('open', 'merged', 'declined')),
  opened_at timestamptz not null,
  merged_at timestamptz,
  created_at timestamptz not null default now(),
  constraint merged_needs_timestamp check (status <> 'merged' or merged_at is not null)
);

create index issues_sprint_idx on public.issues (sprint_id);
create index issues_developer_idx on public.issues (developer_id);
create index issues_module_idx on public.issues (module_id);
create index branches_issue_idx on public.branches (issue_id);
create index prs_issue_idx on public.pull_requests (issue_id);
create index sprints_developer_idx on public.sprints (developer_id);

-- ============================================================
-- Perfil automatico al registrarse (auth.users -> developers)
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.developers (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  insert into public.alert_settings (developer_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS (el proyecto tiene "automatic RLS" activo; se explicita igual)
-- ============================================================

alter table public.developers enable row level security;
alter table public.alert_settings enable row level security;
alter table public.modules enable row level security;
alter table public.sprints enable row level security;
alter table public.issues enable row level security;
alter table public.branches enable row level security;
alter table public.pull_requests enable row level security;

-- developers: cada quien ve/edita su perfil
create policy developers_select on public.developers
  for select using (id = auth.uid());
create policy developers_update on public.developers
  for update using (id = auth.uid());

-- alert_settings: propias
create policy alert_settings_all on public.alert_settings
  for all using (developer_id = auth.uid()) with check (developer_id = auth.uid());

-- modules: catalogo compartido, cualquier usuario autenticado
create policy modules_select on public.modules
  for select to authenticated using (true);
create policy modules_insert on public.modules
  for insert to authenticated with check (true);

-- sprints / issues: por developer_id
create policy sprints_all on public.sprints
  for all using (developer_id = auth.uid()) with check (developer_id = auth.uid());
create policy issues_all on public.issues
  for all using (developer_id = auth.uid()) with check (developer_id = auth.uid());

-- branches / pull_requests: via la incidencia dueña
create policy branches_all on public.branches
  for all using (
    exists (select 1 from public.issues i where i.id = issue_id and i.developer_id = auth.uid())
  ) with check (
    exists (select 1 from public.issues i where i.id = issue_id and i.developer_id = auth.uid())
  );
create policy pull_requests_all on public.pull_requests
  for all using (
    exists (select 1 from public.issues i where i.id = issue_id and i.developer_id = auth.uid())
  ) with check (
    exists (select 1 from public.issues i where i.id = issue_id and i.developer_id = auth.uid())
  );

-- ============================================================
-- Seed: modulos iniciales
-- ============================================================

insert into public.modules (name) values
  ('Login'),
  ('Prelogged'),
  ('OTP'),
  ('Dashboard App'),
  ('Dashboard X');
