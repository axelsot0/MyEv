import type { AlertSettings, IssueWithRelations, Sprint } from "./types";

// Republica Dominicana: UTC-4 fijo (sin DST). Los datetime-local del
// formulario se interpretan con este offset.
export const TZ_OFFSET = "-04:00";

const DAY_MS = 86_400_000;

// Fecha de hoy (YYYY-MM-DD) en Republica Dominicana
export function todayDO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santo_Domingo",
  }).format(new Date());
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

export function daysSinceDate(dateOnly: string): number {
  return daysSince(`${dateOnly}T00:00:00${TZ_OFFSET}`);
}

export function daysUntilDate(dateOnly: string): number {
  return -daysSince(`${dateOnly}T23:59:59${TZ_OFFSET}`);
}

// "2026-07-01" -> "01/07/2026" sin pasar por Date (evita corrimiento de TZ)
export function fmtDate(dateOnly: string): string {
  const [y, m, d] = dateOnly.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Santo_Domingo",
  }).format(new Date(iso));
}

// Valor default para <input type="datetime-local"> con hora actual de RD
export function nowDOForInput(): string {
  return new Date(Date.now() - 4 * 3_600_000).toISOString().slice(0, 16);
}

export function fmtDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

// Tiempo de ciclo: fin del sprint planning -> ultimo merge (REQUIREMENTS.md #9)
export function cycleTimeMs(
  issue: IssueWithRelations,
  planningEndedAt: string,
): number | null {
  if (!isCompleted(issue)) return null;
  const merges = issue.pull_requests
    .filter((pr) => pr.merged_at)
    .map((pr) => new Date(pr.merged_at!).getTime());
  if (merges.length === 0) return null;
  return Math.max(...merges) - new Date(planningEndedAt).getTime();
}

// Criterio de completado: >=1 PR y todos mergeados (REQUIREMENTS.md #8)
export function isCompleted(issue: IssueWithRelations): boolean {
  return (
    issue.pull_requests.length > 0 &&
    issue.pull_requests.every((pr) => pr.status === "merged")
  );
}

export function assumedPoints(issues: IssueWithRelations[]): number {
  return issues
    .filter((i) => i.committed && i.type === "feature")
    .reduce((sum, i) => sum + (i.points ?? 0), 0);
}

export function completedPoints(issues: IssueWithRelations[]): number {
  return issues
    .filter((i) => i.type === "feature" && isCompleted(i))
    .reduce((sum, i) => sum + (i.points ?? 0), 0);
}

export function buildAlerts(
  issues: IssueWithRelations[],
  settings: AlertSettings,
  sprint: Sprint,
): string[] {
  const alerts: string[] = [];

  for (const issue of issues) {
    const completed = isCompleted(issue);

    for (const pr of issue.pull_requests) {
      if (pr.status === "open") {
        const days = daysSince(pr.opened_at);
        if (days > settings.pr_open_days) {
          alerts.push(`PR de ${issue.jira_key} abierto hace ${days} dias.`);
        }
      }
    }

    for (const br of issue.branches) {
      if (br.deleted_on) continue;
      if (completed) {
        const merges = issue.pull_requests
          .filter((pr) => pr.merged_at)
          .map((pr) => new Date(pr.merged_at!).getTime());
        const lastMerge = Math.max(...merges);
        const days = Math.floor((Date.now() - lastMerge) / DAY_MS);
        if (days > settings.merged_not_deleted_days) {
          alerts.push(
            `Rama ${br.name} mergeada hace ${days} dias y sin eliminar.`,
          );
        }
      } else {
        const days = daysSinceDate(br.created_on);
        if (days > settings.branch_active_days) {
          alerts.push(`Rama ${br.name} activa hace ${days} dias.`);
        }
      }
    }

    if (issue.committed && issue.branches.length === 0 && issue.pull_requests.length === 0) {
      alerts.push(`${issue.jira_key} asumida sin rama ni PR registrado.`);
    }
    if (issue.branches.length > 0 && issue.pull_requests.length === 0) {
      alerts.push(`${issue.jira_key} tiene rama pero ningun PR.`);
    }
    if (issue.jira_status === "Waiting For Dependency") {
      alerts.push(`${issue.jira_key} en Waiting For Dependency.`);
    }
    if (!issue.committed) {
      alerts.push(`${issue.jira_key} trabajada fuera del planning inicial.`);
    }
  }

  const daysLeft = daysUntilDate(sprint.end_date);
  if (daysLeft >= 0 && daysLeft <= 2) {
    for (const issue of issues) {
      if (!isCompleted(issue)) {
        alerts.push(
          `${issue.jira_key} sin completar y el sprint cierra en ${daysLeft} dia(s).`,
        );
      }
    }
  }

  return alerts;
}
