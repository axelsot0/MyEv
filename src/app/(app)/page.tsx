import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  assumedPoints,
  buildAlerts,
  completedPoints,
  fmtDate,
  fmtDateTime,
  isCompleted,
  todayDO,
} from "@/lib/metrics";
import type {
  AlertSettings,
  IssueWithRelations,
  Sprint,
} from "@/lib/types";
import {
  INSIGHTS_SELECT,
  type InsightSprintRow,
  computeInsights,
  computeOutcomes,
} from "@/lib/insights";
import { fmtDuration } from "@/lib/metrics";
import {
  DonutGauge,
  PercentBars,
  ValueBars,
  VelocityColumns,
} from "@/components/charts";

const DEFAULT_SETTINGS: AlertSettings = {
  developer_id: "",
  pr_open_days: 2,
  branch_active_days: 3,
  merged_not_deleted_days: 1,
};

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-primary-soft/15 p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayDO();
  const { data: sprint } = (await supabase
    .from("sprints")
    .select("*")
    .lte("start_date", today)
    .gte("end_date", today)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: Sprint | null };

  if (!sprint) {
    return (
      <div className="mx-auto max-w-2xl pt-20 text-center">
        <h1 className="text-2xl font-bold text-accent">Sin sprint activo</h1>
        <p className="mt-2 text-text-secondary">
          Registra el sprint actual para empezar a medir carga, velocity y
          tiempos de ciclo.
        </p>
        <Link
          href="/sprints/new"
          className="mt-6 inline-block rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface hover:opacity-90"
        >
          Crear sprint
        </Link>
      </div>
    );
  }

  const { data: issuesRaw } = await supabase
    .from("issues")
    .select("*, modules(id, name), branches(*), pull_requests(*)")
    .eq("sprint_id", sprint.id)
    .order("created_at");
  const issues = (issuesRaw ?? []) as unknown as IssueWithRelations[];

  const { data: settingsRow } = await supabase
    .from("alert_settings")
    .select("*")
    .eq("developer_id", user!.id)
    .maybeSingle();
  const settings = (settingsRow as AlertSettings | null) ?? DEFAULT_SETTINGS;

  const committed = issues.filter((i) => i.committed);
  const unplanned = issues.filter((i) => !i.committed);
  const pending = issues.filter((i) => !isCompleted(i));
  const openPrs = issues.flatMap((i) =>
    i.pull_requests.filter((pr) => pr.status === "open"),
  );
  const activeBranches = issues.flatMap((i) =>
    i.branches.filter((b) => !b.deleted_on),
  );
  const alerts = buildAlerts(issues, settings, sprint);

  const { data: histRaw } = await supabase
    .from("sprints")
    .select(INSIGHTS_SELECT)
    .order("start_date");
  const histRows = (histRaw ?? []) as unknown as InsightSprintRow[];
  const outcomes = computeOutcomes(histRows, today);
  const insights = computeInsights(histRows, outcomes);
  const history = outcomes.map((o) => ({
    name: o.name,
    assumed: o.assumed,
    velocity: o.velocity,
  }));

  const moduleCount = new Map<string, number>();
  for (const i of issues) {
    const name = i.modules?.name ?? "Sin modulo";
    moduleCount.set(name, (moduleCount.get(name) ?? 0) + 1);
  }
  const topModules = [...moduleCount.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent">{sprint.name}</h1>
          <p className="text-sm text-text-secondary">
            {fmtDate(sprint.start_date)} — {fmtDate(sprint.end_date)} · planning
            cerrado {fmtDateTime(sprint.planning_ended_at)}
          </p>
        </div>
        <Link
          href={`/sprints/${sprint.id}`}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90"
        >
          Ver sprint
        </Link>
      </header>

      {alerts.length > 0 && (
        <section className="rounded-lg border border-warning bg-warning/10 p-4">
          <h2 className="mb-2 font-semibold text-accent">
            Alertas ({alerts.length})
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {alerts.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Puntos asumidos" value={assumedPoints(issues)} />
        <MetricCard
          label="Puntos completados (velocity)"
          value={completedPoints(issues)}
        />
        <MetricCard
          label="Features asumidas"
          value={committed.filter((i) => i.type === "feature").length}
        />
        <MetricCard
          label="Bugs / Tasks"
          value={`${issues.filter((i) => i.type === "bug").length} / ${issues.filter((i) => i.type === "task").length}`}
        />
        <MetricCard label="Pendientes" value={pending.length} />
        <MetricCard label="PRs abiertos" value={openPrs.length} />
        <MetricCard label="Ramas activas" value={activeBranches.length} />
        <MetricCard label="Fuera de planning" value={unplanned.length} />
      </section>

      {insights.finishedCount > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-accent">
            Insights historicos · {insights.finishedCount} sprint(s)
            terminado(s)
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label="Pts que acostumbras asumir"
              value={insights.avgAssumed != null ? insights.avgAssumed.toFixed(1) : "—"}
            />
            <MetricCard
              label="Velocity promedio"
              value={insights.avgVelocity != null ? insights.avgVelocity.toFixed(1) : "—"}
            />
            <div className="rounded-lg border border-border bg-primary-soft/15 p-4">
              <p className="text-sm text-text-secondary">
                Prob. de cerrar todo lo asumido
              </p>
              <div className="mt-1">
                {insights.fullCloseRate != null ? (
                  <DonutGauge pct={insights.fullCloseRate} />
                ) : (
                  <p className="text-3xl font-bold text-primary">—</p>
                )}
              </div>
            </div>
            <MetricCard
              label="Mayor carga que cerraste completa"
              value={insights.bestFullCloseLoad ?? "—"}
            />
          </div>
          {insights.avgCloseDaysEarly != null && (
            <p className="text-sm text-text-secondary">
              Cuando cierras todo lo asumido, terminas en promedio{" "}
              <strong className="text-success">
                {insights.avgCloseDaysEarly.toFixed(1)} dia(s) antes
              </strong>{" "}
              del fin del sprint.
            </p>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-primary-soft/15 p-4">
              <h3 className="mb-3 text-sm font-semibold text-accent">
                Probabilidad de cierre segun carga asumida
              </h3>
              {insights.byLoad.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Aun sin sprints terminados con puntos.
                </p>
              ) : (
                <PercentBars
                  items={insights.byLoad.map((b) => ({
                    label: `${b.assumed} pts asumidos`,
                    pct: (b.fullyClosed / b.sprints) * 100,
                    sub: `cerraste todo ${b.fullyClosed} de ${b.sprints} (${Math.round((b.fullyClosed / b.sprints) * 100)}%)`,
                  }))}
                />
              )}
            </div>
            <div className="rounded-lg border border-border bg-primary-soft/15 p-4">
              <h3 className="mb-3 text-sm font-semibold text-accent">
                Que tan rapido cierras una historia
              </h3>
              {insights.cycleBySize.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Aun sin features completadas con puntos.
                </p>
              ) : (
                <ValueBars
                  items={insights.cycleBySize.map((c) => ({
                    label: `Historias de ${c.points} pts`,
                    value: c.avgMs,
                    display: `${fmtDuration(c.avgMs)} promedio · ${c.count} cerrada(s)`,
                  }))}
                />
              )}
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-primary-soft/15 p-4">
          <h2 className="mb-3 font-semibold text-accent">
            Asumido vs trabajado
          </h2>
          <p className="text-sm">
            Comprometidas en planning: <strong>{committed.length}</strong>
          </p>
          <p className="text-sm">
            Trabajadas en total: <strong>{issues.length}</strong>
          </p>
          <p className="text-sm">
            Agregadas fuera de planning:{" "}
            <strong className={unplanned.length > 0 ? "text-warning" : ""}>
              {unplanned.length}
            </strong>
          </p>
          <p className="text-sm">
            Completadas:{" "}
            <strong className="text-success">
              {issues.filter(isCompleted).length}
            </strong>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-primary-soft/15 p-4">
          <h2 className="mb-3 font-semibold text-accent">
            Modulos del sprint
          </h2>
          {topModules.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin incidencias aun.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {topModules.map(([name, count]) => (
                <li key={name} className="flex justify-between">
                  <span>{name}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {history.length > 1 && (
        <section className="rounded-lg border border-border bg-primary-soft/15 p-4">
          <h2 className="mb-3 font-semibold text-accent">
            Historico: carga y velocity por sprint
          </h2>
          <VelocityColumns data={history} />
        </section>
      )}
    </div>
  );
}
