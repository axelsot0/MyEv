// Insights historicos sobre todos los sprints del developer.
// Fila cruda que devuelve el select anidado de Supabase (ver INSIGHTS_SELECT).

export const INSIGHTS_SELECT =
  "id, name, start_date, end_date, planning_ended_at, issues(type, points, committed, pull_requests(status, merged_at))";

export interface InsightIssue {
  type: string;
  points: number | null;
  committed: boolean;
  pull_requests: { status: string; merged_at: string | null }[];
}

export interface InsightSprintRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  planning_ended_at: string;
  issues: InsightIssue[];
}

export interface SprintOutcome {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  assumed: number;
  velocity: number;
  committedCount: number;
  committedDone: number;
  finished: boolean;
  fullyClosed: boolean;
  // Fecha (RD) del ultimo merge de lo asumido, solo si cerro todo
  closureDate: string | null;
  daysEarly: number | null;
  // Fecha (RD) del ultimo merge de cualquier incidencia del sprint
  lastMergeDate: string | null;
  // Dias desde el fin del planning hasta cerrar TODO lo asumido
  daysToCloseAssumed: number | null;
  // Promedio de dias por historia (feature) completada en el sprint
  avgStoryDays: number | null;
}

const DAY_MS = 86_400_000;

function dateMs(dateOnly: string): number {
  return new Date(`${dateOnly}T00:00:00Z`).getTime();
}

function isDone(issue: InsightIssue): boolean {
  return (
    issue.pull_requests.length > 0 &&
    issue.pull_requests.every((pr) => pr.status === "merged")
  );
}

function toDODate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santo_Domingo",
  }).format(new Date(iso));
}

export function computeOutcomes(
  rows: InsightSprintRow[],
  today: string,
): SprintOutcome[] {
  return rows.map((s) => {
    const committed = s.issues.filter((i) => i.committed);
    const assumed = committed
      .filter((i) => i.type === "feature")
      .reduce((sum, i) => sum + (i.points ?? 0), 0);
    const velocity = s.issues
      .filter((i) => i.type === "feature" && isDone(i))
      .reduce((sum, i) => sum + (i.points ?? 0), 0);
    const committedDone = committed.filter(isDone).length;
    const fullyClosed = committed.length > 0 && committedDone === committed.length;

    let closureDate: string | null = null;
    let daysEarly: number | null = null;
    if (fullyClosed) {
      const merges = committed.flatMap((i) =>
        i.pull_requests
          .filter((pr) => pr.merged_at)
          .map((pr) => new Date(pr.merged_at!).getTime()),
      );
      closureDate = toDODate(new Date(Math.max(...merges)).toISOString());
      daysEarly = Math.round(
        (dateMs(s.end_date) - dateMs(closureDate)) / DAY_MS,
      );
    }

    const allMerges = s.issues.flatMap((i) =>
      i.pull_requests
        .filter((pr) => pr.merged_at)
        .map((pr) => new Date(pr.merged_at!).getTime()),
    );
    const lastMergeDate =
      allMerges.length > 0
        ? toDODate(new Date(Math.max(...allMerges)).toISOString())
        : null;

    const planningMs = new Date(s.planning_ended_at).getTime();

    let daysToCloseAssumed: number | null = null;
    if (fullyClosed) {
      const merges = committed.flatMap((i) =>
        i.pull_requests
          .filter((pr) => pr.merged_at)
          .map((pr) => new Date(pr.merged_at!).getTime()),
      );
      daysToCloseAssumed = (Math.max(...merges) - planningMs) / DAY_MS;
    }

    const storyCycles = s.issues
      .filter((i) => i.type === "feature" && isDone(i))
      .map((i) => {
        const merges = i.pull_requests
          .filter((pr) => pr.merged_at)
          .map((pr) => new Date(pr.merged_at!).getTime());
        return (Math.max(...merges) - planningMs) / DAY_MS;
      })
      .filter((d) => d >= 0);
    const avgStoryDays =
      storyCycles.length > 0
        ? storyCycles.reduce((a, b) => a + b, 0) / storyCycles.length
        : null;

    return {
      id: s.id,
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      assumed,
      velocity,
      committedCount: committed.length,
      committedDone,
      finished: s.end_date < today,
      fullyClosed,
      closureDate,
      daysEarly,
      lastMergeDate,
      daysToCloseAssumed,
      avgStoryDays,
    };
  });
}

export interface LoadBucket {
  assumed: number;
  sprints: number;
  fullyClosed: number;
}

export interface CycleBucket {
  points: number;
  avgMs: number;
  count: number;
}

export interface Insights {
  sprintCount: number;
  finishedCount: number;
  avgAssumed: number | null;
  avgVelocity: number | null;
  fullCloseRate: number | null; // % de sprints terminados con cierre total
  bestFullCloseLoad: number | null; // mayor carga asumida que cerraste completa
  byLoad: LoadBucket[]; // probabilidad de cierre segun carga asumida
  cycleBySize: CycleBucket[]; // tiempo promedio de ciclo por tamano de historia
  avgCloseDaysEarly: number | null;
  avgStoryCycleMs: number | null; // promedio global por historia completada
  avgDaysToClose: number | null; // promedio de dias hasta cerrar lo asumido
}

export function computeInsights(
  rows: InsightSprintRow[],
  outcomes: SprintOutcome[],
): Insights {
  const withLoad = outcomes.filter((o) => o.assumed > 0);
  const finished = outcomes.filter((o) => o.finished && o.committedCount > 0);
  const closedFull = finished.filter((o) => o.fullyClosed);

  const avg = (values: number[]) =>
    values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;

  const avgAssumed = avg(withLoad.map((o) => o.assumed));
  const avgVelocity = avg(
    outcomes.filter((o) => o.finished).map((o) => o.velocity),
  );
  const fullCloseRate =
    finished.length > 0 ? (closedFull.length / finished.length) * 100 : null;
  const bestFullCloseLoad =
    closedFull.length > 0
      ? Math.max(...closedFull.map((o) => o.assumed))
      : null;
  const avgCloseDaysEarly = avg(
    closedFull
      .map((o) => o.daysEarly)
      .filter((v): v is number => v != null),
  );

  const loadMap = new Map<number, LoadBucket>();
  for (const o of finished) {
    if (o.assumed === 0) continue;
    const b = loadMap.get(o.assumed) ?? {
      assumed: o.assumed,
      sprints: 0,
      fullyClosed: 0,
    };
    b.sprints += 1;
    if (o.fullyClosed) b.fullyClosed += 1;
    loadMap.set(o.assumed, b);
  }
  const byLoad = [...loadMap.values()].sort((a, b) => a.assumed - b.assumed);

  // Ciclo por tamano de historia: fin del planning -> ultimo merge de la historia
  const cycleMap = new Map<number, { total: number; count: number }>();
  for (const s of rows) {
    const planningMs = new Date(s.planning_ended_at).getTime();
    for (const i of s.issues) {
      if (i.type !== "feature" || i.points == null || !isDone(i)) continue;
      const merges = i.pull_requests
        .filter((pr) => pr.merged_at)
        .map((pr) => new Date(pr.merged_at!).getTime());
      if (merges.length === 0) continue;
      const cycle = Math.max(...merges) - planningMs;
      if (cycle < 0) continue;
      const b = cycleMap.get(i.points) ?? { total: 0, count: 0 };
      b.total += cycle;
      b.count += 1;
      cycleMap.set(i.points, b);
    }
  }
  const cycleBySize = [...cycleMap.entries()]
    .map(([points, b]) => ({ points, avgMs: b.total / b.count, count: b.count }))
    .sort((a, b) => a.points - b.points);

  const totalCycles = cycleBySize.reduce((a, c) => a + c.avgMs * c.count, 0);
  const totalStories = cycleBySize.reduce((a, c) => a + c.count, 0);
  const avgStoryCycleMs = totalStories > 0 ? totalCycles / totalStories : null;

  const avgDaysToClose = avg(
    outcomes
      .map((o) => o.daysToCloseAssumed)
      .filter((v): v is number => v != null),
  );

  return {
    sprintCount: outcomes.length,
    finishedCount: finished.length,
    avgAssumed,
    avgVelocity,
    fullCloseRate,
    bestFullCloseLoad,
    byLoad,
    cycleBySize,
    avgCloseDaysEarly,
    avgStoryCycleMs,
    avgDaysToClose,
  };
}

export function addDays(dateOnly: string, n: number): string {
  const d = new Date(`${dateOnly}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
