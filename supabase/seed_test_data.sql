-- MyEvo — datos de prueba
-- Requisito: haber registrado tu cuenta en la app (existe 1 developer).
-- Ejecutar en Supabase: SQL Editor > pegar todo > Run.
-- Re-ejecutable: borra y recrea los sprints 'Sprint TEST-%'.
--
-- Crea:
--   Sprint TEST-1 (cerrado): 21 pts asumidos, 16 completados (~76%),
--     PRs mergeados, ramas eliminadas, 1 feature pendiente al cierre.
--   Sprint TEST-2 (activo, va por la mitad): 18 pts asumidos, 5 completados,
--     y casos que disparan TODAS las alertas del dashboard:
--     PR abierto 4 dias, rama activa 7 dias, rama mergeada sin eliminar,
--     asumida sin rama/PR, rama sin PR, Waiting For Dependency, extra
--     fuera de planning.

do $$
declare
  v_dev uuid;
  v_login uuid;
  v_otp uuid;
  v_prelogged uuid;
  v_dash_app uuid;
  v_dash_x uuid;
  v_s1 uuid;
  v_s2 uuid;
  v_issue uuid;
  v_s1_start date := current_date - 21;
  v_s2_start date := current_date - 7;
begin
  select id into v_dev from public.developers limit 1;
  if v_dev is null then
    raise exception 'No hay developer. Registrate primero en la app.';
  end if;

  delete from public.sprints
   where developer_id = v_dev and name like 'Sprint TEST-%';

  select id into v_login     from public.modules where name = 'Login';
  select id into v_otp       from public.modules where name = 'OTP';
  select id into v_prelogged from public.modules where name = 'Prelogged';
  select id into v_dash_app  from public.modules where name = 'Dashboard App';
  select id into v_dash_x    from public.modules where name = 'Dashboard X';

  -- ==========================================================
  -- Sprint TEST-1 (terminado hace ~1 semana)
  -- ==========================================================
  insert into public.sprints (developer_id, name, start_date, end_date, planning_ended_at)
  values (v_dev, 'Sprint TEST-1', v_s1_start, v_s1_start + 13,
          (v_s1_start + time '13:00')::timestamp at time zone 'America/Santo_Domingo')
  returning id into v_s1;

  -- AR-101 feature 5 pts, completada rapido
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s1, v_dev, v_login, 'AR-101', 'Rework de pantalla de login', 'feature', 5, 'Done', true)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on, deleted_on)
  values (v_issue, 'feature/AR-101-login-rework', v_s1_start, v_s1_start + 4);
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at, merged_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/101',
          'feature/AR-101-login-rework', 'develop', 'merged',
          (v_s1_start + 2 + time '10:00')::timestamp at time zone 'America/Santo_Domingo',
          (v_s1_start + 4 + time '15:00')::timestamp at time zone 'America/Santo_Domingo');

  -- AR-102 feature 3 pts, completada
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s1, v_dev, v_otp, 'AR-102', 'Reintento de envio de OTP', 'feature', 3, 'Done', true)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on, deleted_on)
  values (v_issue, 'feature/AR-102-otp-retry', v_s1_start + 1, v_s1_start + 6);
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at, merged_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/102',
          'feature/AR-102-otp-retry', 'develop', 'merged',
          (v_s1_start + 4 + time '09:30')::timestamp at time zone 'America/Santo_Domingo',
          (v_s1_start + 6 + time '11:00')::timestamp at time zone 'America/Santo_Domingo');

  -- AR-103 feature 8 pts, completada al final (PR lento: 5 dias abierto)
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s1, v_dev, v_dash_app, 'AR-103', 'Graficas de consumo en dashboard', 'feature', 8, 'Done', true)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on, deleted_on)
  values (v_issue, 'feature/AR-103-dashboard-charts', v_s1_start + 2, v_s1_start + 12);
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at, merged_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/103',
          'feature/AR-103-dashboard-charts', 'develop', 'merged',
          (v_s1_start + 6 + time '16:00')::timestamp at time zone 'America/Santo_Domingo',
          (v_s1_start + 11 + time '17:45')::timestamp at time zone 'America/Santo_Domingo');

  -- AR-104 bug, completado
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s1, v_dev, v_login, 'AR-104', 'Sesion expira antes de tiempo', 'bug', null, 'Done', true)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on, deleted_on)
  values (v_issue, 'bugfix/AR-104-session-expiry', v_s1_start + 3, v_s1_start + 5);
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at, merged_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/104',
          'bugfix/AR-104-session-expiry', 'develop', 'merged',
          (v_s1_start + 4 + time '14:00')::timestamp at time zone 'America/Santo_Domingo',
          (v_s1_start + 5 + time '10:30')::timestamp at time zone 'America/Santo_Domingo');

  -- AR-105 task, completada
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s1, v_dev, v_prelogged, 'AR-105', 'Actualizar textos legales prelogged', 'task', null, 'Done', true)
  returning id into v_issue;
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at, merged_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/105',
          'task/AR-105-legal-copy', 'develop', 'merged',
          (v_s1_start + 7 + time '11:00')::timestamp at time zone 'America/Santo_Domingo',
          (v_s1_start + 8 + time '09:00')::timestamp at time zone 'America/Santo_Domingo');

  -- AR-106 feature 5 pts, quedo pendiente al cierre (sin PR)
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s1, v_dev, v_dash_x, 'AR-106', 'Export a excel en Dashboard X', 'feature', 5, 'InProgress', true);

  -- ==========================================================
  -- Sprint TEST-2 (activo, dia 8 de 14)
  -- ==========================================================
  insert into public.sprints (developer_id, name, start_date, end_date, planning_ended_at)
  values (v_dev, 'Sprint TEST-2', v_s2_start, v_s2_start + 13,
          (v_s2_start + time '13:30')::timestamp at time zone 'America/Santo_Domingo')
  returning id into v_s2;

  -- AR-201 feature 5 pts: rama activa 7 dias + PR abierto 4 dias (2 alertas)
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s2, v_dev, v_login, 'AR-201', 'Biometria en login', 'feature', 5, 'InProgress', true)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on)
  values (v_issue, 'feature/AR-201-biometric-login', v_s2_start);
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/201',
          'feature/AR-201-biometric-login', 'develop', 'open',
          now() - interval '4 days');

  -- AR-202 feature 3 pts: completada pero rama mergeada sin eliminar (alerta)
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s2, v_dev, v_otp, 'AR-202', 'OTP por correo como fallback', 'feature', 3, 'Done', true)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on)
  values (v_issue, 'feature/AR-202-otp-email-fallback', v_s2_start + 1);
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at, merged_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/202',
          'feature/AR-202-otp-email-fallback', 'develop', 'merged',
          now() - interval '4 days', now() - interval '2 days');

  -- AR-203 feature 8 pts: asumida sin rama ni PR (alerta)
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s2, v_dev, v_dash_app, 'AR-203', 'Widget de notificaciones', 'feature', 8, 'To Do', true);

  -- AR-204 bug: con rama pero sin PR (alerta)
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s2, v_dev, v_prelogged, 'AR-204', 'Crash al abrir prelogged sin red', 'bug', null, 'InProgress', true)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on)
  values (v_issue, 'bugfix/AR-204-prelogged-offline-crash', current_date - 2);

  -- AR-205 task: Waiting For Dependency (alerta)
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s2, v_dev, v_dash_x, 'AR-205', 'Integrar SDK de analitica', 'task', null, 'Waiting For Dependency', true);

  -- AR-206 bug extra, fuera de planning (alerta) con PR abierto reciente
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s2, v_dev, v_login, 'AR-206', 'Hotfix: boton de login deshabilitado', 'bug', null, 'Inspection', false)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on)
  values (v_issue, 'hotfix/AR-206-login-button', current_date - 1);
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/206',
          'hotfix/AR-206-login-button', 'develop', 'open',
          now() - interval '1 day');

  -- AR-207 feature 2 pts: flujo limpio completado (rama eliminada)
  insert into public.issues (sprint_id, developer_id, module_id, jira_key, title, type, points, jira_status, committed)
  values (v_s2, v_dev, v_otp, 'AR-207', 'Contador de reintentos visible', 'feature', 2, 'Done', true)
  returning id into v_issue;
  insert into public.branches (issue_id, name, created_on, deleted_on)
  values (v_issue, 'feature/AR-207-otp-retry-counter', v_s2_start + 1, current_date - 3);
  insert into public.pull_requests (issue_id, url, source_branch, target_branch, status, opened_at, merged_at)
  values (v_issue, 'https://bitbucket.org/x/repo/pull-requests/207',
          'feature/AR-207-otp-retry-counter', 'develop', 'merged',
          now() - interval '5 days', now() - interval '3 days');

  raise notice 'Datos de prueba creados para developer %', v_dev;
end $$;
