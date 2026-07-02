import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  assumedPoints,
  completedPoints,
  cycleTimeMs,
  daysSinceDate,
  fmtDate,
  fmtDateTime,
  fmtDuration,
  isCompleted,
} from "@/lib/metrics";
import type { IssueWithRelations } from "@/lib/types";
import type { SprintReportData } from "./data";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#25231A",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#564F7C",
    marginBottom: 4,
  },
  subtitle: { fontSize: 11, color: "#524C26", marginBottom: 16 },
  section: { marginBottom: 14 },
  h2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#524C26",
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#B2ADD0",
  },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statBox: {
    width: "23%",
    backgroundColor: "#F4F1E3",
    borderWidth: 1,
    borderColor: "#B2ADD0",
    borderRadius: 4,
    padding: 6,
  },
  statLabel: { fontSize: 7.5, color: "#564F7C" },
  statValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#564F7C",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#B2ADD0",
    paddingVertical: 3,
  },
  headRow: {
    backgroundColor: "#564F7C",
    color: "#F4F1E3",
    fontFamily: "Helvetica-Bold",
  },
  cKey: { width: "13%", paddingHorizontal: 3 },
  cTitle: { width: "39%", paddingHorizontal: 3 },
  cSmall: { width: "10%", paddingHorizontal: 3 },
  cMod: { width: "18%", paddingHorizontal: 3 },
  line: { marginBottom: 3 },
  muted: { color: "#6b6555" },
});

function Meta({ data }: { data: SprintReportData }) {
  const { sprint } = data;
  return (
    <Text style={styles.subtitle}>
      {sprint.name} · {fmtDate(sprint.start_date)} — {fmtDate(sprint.end_date)}{" "}
      · planning cerrado {fmtDateTime(sprint.planning_ended_at)} ·{" "}
      {data.developerName}
    </Text>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{String(value)}</Text>
    </View>
  );
}

function IssueTable({ issues }: { issues: IssueWithRelations[] }) {
  return (
    <View>
      <View style={[styles.row, styles.headRow]}>
        <Text style={styles.cKey}>Clave</Text>
        <Text style={styles.cTitle}>Titulo</Text>
        <Text style={styles.cSmall}>Tipo</Text>
        <Text style={styles.cSmall}>Pts</Text>
        <Text style={styles.cMod}>Modulo</Text>
        <Text style={styles.cSmall}>Done</Text>
      </View>
      {issues.map((i) => (
        <View key={i.id} style={styles.row}>
          <Text style={styles.cKey}>{i.jira_key}</Text>
          <Text style={styles.cTitle}>{i.title}</Text>
          <Text style={styles.cSmall}>{i.type}</Text>
          <Text style={styles.cSmall}>{i.points ?? "-"}</Text>
          <Text style={styles.cMod}>{i.modules?.name ?? "-"}</Text>
          <Text style={styles.cSmall}>{isCompleted(i) ? "si" : "no"}</Text>
        </View>
      ))}
    </View>
  );
}

function moduleDistribution(issues: IssueWithRelations[]) {
  const map = new Map<
    string,
    { total: number; completed: number; points: number }
  >();
  for (const i of issues) {
    const name = i.modules?.name ?? "Sin modulo";
    const entry = map.get(name) ?? { total: 0, completed: 0, points: 0 };
    entry.total += 1;
    if (isCompleted(i)) {
      entry.completed += 1;
      entry.points += i.points ?? 0;
    }
    map.set(name, entry);
  }
  return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
}

function ModuleSection({ issues }: { issues: IssueWithRelations[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Distribucion por modulo tecnico</Text>
      {moduleDistribution(issues).map(([name, m]) => (
        <Text key={name} style={styles.line}>
          {name}: {m.total} incidencia(s), {m.completed} completada(s),{" "}
          {m.points} pts completados
        </Text>
      ))}
    </View>
  );
}

function counts(issues: IssueWithRelations[]) {
  return {
    features: issues.filter((i) => i.type === "feature").length,
    bugs: issues.filter((i) => i.type === "bug").length,
    tasks: issues.filter((i) => i.type === "task").length,
  };
}

// ============================================================
// Reporte inicial del sprint
// ============================================================

function InitialDoc({ data }: { data: SprintReportData }) {
  const committed = data.issues.filter((i) => i.committed);
  const c = counts(committed);
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Reporte inicial del sprint</Text>
        <Meta data={data} />
        <View style={styles.section}>
          <View style={styles.statGrid}>
            <Stat label="Puntos asumidos" value={assumedPoints(data.issues)} />
            <Stat label="Features" value={c.features} />
            <Stat label="Bugs" value={c.bugs} />
            <Stat label="Tasks" value={c.tasks} />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.h2}>
            Incidencias asumidas ({committed.length})
          </Text>
          <IssueTable issues={committed} />
        </View>
        <ModuleSection issues={committed} />
      </Page>
    </Document>
  );
}

// ============================================================
// Reporte semanal
// ============================================================

function WeeklyDoc({ data }: { data: SprintReportData }) {
  const { issues } = data;
  const committed = issues.filter((i) => i.committed);
  const unplanned = issues.filter((i) => !i.committed);
  const done = issues.filter(isCompleted);
  const pending = issues.filter((i) => !isCompleted(i));
  const allPrs = issues.flatMap((i) => i.pull_requests);
  const allBranches = issues.flatMap((i) => i.branches);
  const c = counts(issues);
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Reporte semanal</Text>
        <Meta data={data} />
        <Text style={[styles.line, styles.muted]}>
          Generado: {fmtDateTime(new Date().toISOString())}
        </Text>
        <View style={styles.section}>
          <View style={styles.statGrid}>
            <Stat label="Asumidas en planning" value={committed.length} />
            <Stat label="Trabajadas en total" value={issues.length} />
            <Stat label="Completadas" value={done.length} />
            <Stat label="Pendientes" value={pending.length} />
            <Stat
              label="PRs abiertos"
              value={allPrs.filter((p) => p.status === "open").length}
            />
            <Stat
              label="PRs mergeados"
              value={allPrs.filter((p) => p.status === "merged").length}
            />
            <Stat
              label="Ramas activas"
              value={allBranches.filter((b) => !b.deleted_on).length}
            />
            <Stat
              label="Ramas eliminadas"
              value={allBranches.filter((b) => b.deleted_on).length}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.h2}>Bugs y Tasks trabajados</Text>
          <Text style={styles.line}>
            Bugs: {c.bugs} · Tasks: {c.tasks}
          </Text>
        </View>
        {unplanned.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>
              Incidencias fuera del compromiso inicial ({unplanned.length})
            </Text>
            <IssueTable issues={unplanned} />
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.h2}>Completadas ({done.length})</Text>
          {done.length === 0 ? (
            <Text style={[styles.line, styles.muted]}>Ninguna.</Text>
          ) : (
            <IssueTable issues={done} />
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.h2}>Pendientes ({pending.length})</Text>
          {pending.length === 0 ? (
            <Text style={[styles.line, styles.muted]}>Ninguna.</Text>
          ) : (
            <IssueTable issues={pending} />
          )}
        </View>
        <ModuleSection issues={issues} />
      </Page>
    </Document>
  );
}

// ============================================================
// Reporte final del sprint
// ============================================================

function FinalDoc({ data }: { data: SprintReportData }) {
  const { issues, sprint } = data;
  const assumed = assumedPoints(issues);
  const completed = completedPoints(issues);
  const pct = assumed > 0 ? Math.round((completed / assumed) * 100) : 0;
  const c = counts(issues);
  const unplanned = issues.filter((i) => !i.committed);
  const pending = issues.filter((i) => !isCompleted(i));
  const cycles = issues
    .map((i) => cycleTimeMs(i, sprint.planning_ended_at))
    .filter((v): v is number => v != null);
  const avgCycle =
    cycles.length > 0
      ? cycles.reduce((a, b) => a + b, 0) / cycles.length
      : null;

  const slowPrs = issues
    .flatMap((i) =>
      i.pull_requests
        .filter((pr) => pr.merged_at)
        .map((pr) => ({
          label: `${i.jira_key} ${pr.source_branch} -> ${pr.target_branch}`,
          ms:
            new Date(pr.merged_at!).getTime() -
            new Date(pr.opened_at).getTime(),
        })),
    )
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 3);

  const longBranches = issues
    .flatMap((i) =>
      i.branches.map((b) => ({
        label: b.name,
        days: b.deleted_on
          ? daysSinceDate(b.created_on) - daysSinceDate(b.deleted_on)
          : daysSinceDate(b.created_on),
      })),
    )
    .sort((a, b) => b.days - a.days)
    .slice(0, 3);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Reporte final del sprint</Text>
        <Meta data={data} />
        <View style={styles.section}>
          <View style={styles.statGrid}>
            <Stat label="Puntos asumidos" value={assumed} />
            <Stat label="Puntos completados" value={completed} />
            <Stat label="Velocity" value={completed} />
            <Stat label="Cumplimiento" value={`${pct}%`} />
            <Stat
              label="Features completadas"
              value={
                issues.filter((i) => i.type === "feature" && isCompleted(i))
                  .length
              }
            />
            <Stat label="Bugs trabajados" value={c.bugs} />
            <Stat label="Tasks trabajadas" value={c.tasks} />
            <Stat
              label="Prom. hasta merge"
              value={avgCycle != null ? fmtDuration(avgCycle) : "-"}
            />
          </View>
        </View>
        {unplanned.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>
              Incidencias fuera del planning ({unplanned.length})
            </Text>
            <IssueTable issues={unplanned} />
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.h2}>PRs que mas tardaron</Text>
          {slowPrs.length === 0 ? (
            <Text style={[styles.line, styles.muted]}>Sin PRs mergeados.</Text>
          ) : (
            slowPrs.map((p) => (
              <Text key={p.label} style={styles.line}>
                {p.label}: {fmtDuration(p.ms)}
              </Text>
            ))
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.h2}>Ramas que mas duraron</Text>
          {longBranches.length === 0 ? (
            <Text style={[styles.line, styles.muted]}>Sin ramas.</Text>
          ) : (
            longBranches.map((b) => (
              <Text key={b.label} style={styles.line}>
                {b.label}: {b.days} dia(s)
              </Text>
            ))
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.h2}>
            Pendientes al cierre ({pending.length})
          </Text>
          {pending.length === 0 ? (
            <Text style={[styles.line, styles.muted]}>Ninguna.</Text>
          ) : (
            <IssueTable issues={pending} />
          )}
        </View>
        <ModuleSection issues={issues} />
      </Page>
    </Document>
  );
}

export type ReportType = "initial" | "weekly" | "final";

export async function renderReport(
  type: ReportType,
  data: SprintReportData,
): Promise<Buffer> {
  switch (type) {
    case "initial":
      return renderToBuffer(<InitialDoc data={data} />);
    case "weekly":
      return renderToBuffer(<WeeklyDoc data={data} />);
    case "final":
      return renderToBuffer(<FinalDoc data={data} />);
  }
}
