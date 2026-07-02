import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  assumedPoints,
  completedPoints,
  fmtDate,
  fmtDateTime,
  isCompleted,
} from "@/lib/metrics";
import type { IssueWithRelations, Module, Sprint } from "@/lib/types";
import { createIssue } from "../actions";

const inputClass =
  "w-full rounded border border-border bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

const JIRA_STATUSES = [
  "To Do",
  "InProgress",
  "Waiting For Dependency",
  "Progress Done",
  "Inspection",
  "Done",
];

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sprintRaw } = await supabase
    .from("sprints")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sprintRaw) notFound();
  const sprint = sprintRaw as Sprint;

  const { data: issuesRaw } = await supabase
    .from("issues")
    .select("*, modules(id, name), branches(*), pull_requests(*)")
    .eq("sprint_id", id)
    .order("created_at");
  const issues = (issuesRaw ?? []) as unknown as IssueWithRelations[];

  const { data: modulesRaw } = await supabase
    .from("modules")
    .select("id, name")
    .order("name");
  const modules = (modulesRaw ?? []) as Module[];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent">{sprint.name}</h1>
          <Link
            href={`/sprints/${sprint.id}/edit`}
            className="rounded border border-border px-3 py-1.5 text-sm text-primary hover:bg-primary-soft/20"
          >
            Editar sprint
          </Link>
        </div>
        <p className="text-sm text-text-secondary">
          {fmtDate(sprint.start_date)} — {fmtDate(sprint.end_date)} · planning
          cerrado {fmtDateTime(sprint.planning_ended_at)}
        </p>
        <p className="mt-2 text-sm">
          Puntos asumidos: <strong>{assumedPoints(issues)}</strong> ·
          completados: <strong>{completedPoints(issues)}</strong> ·
          incidencias: <strong>{issues.length}</strong>
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">Incidencias</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Sin incidencias registradas.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-accent">
                <th className="py-2 pr-3">Clave</th>
                <th className="py-2 pr-3">Titulo</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Pts</th>
                <th className="py-2 pr-3">Modulo</th>
                <th className="py-2 pr-3">Estado Jira</th>
                <th className="py-2 pr-3">Ramas</th>
                <th className="py-2 pr-3">PRs</th>
                <th className="py-2">Completada</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-mono text-xs">
                    <Link
                      href={`/issues/${i.id}`}
                      className="text-primary hover:underline"
                    >
                      {i.jira_key}
                    </Link>
                    {!i.committed && (
                      <span className="ml-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
                        extra
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">{i.title}</td>
                  <td className="py-2 pr-3 capitalize">{i.type}</td>
                  <td className="py-2 pr-3">{i.points ?? "—"}</td>
                  <td className="py-2 pr-3">{i.modules?.name ?? "—"}</td>
                  <td className="py-2 pr-3">{i.jira_status}</td>
                  <td className="py-2 pr-3">{i.branches.length}</td>
                  <td className="py-2 pr-3">{i.pull_requests.length}</td>
                  <td className="py-2">
                    {isCompleted(i) ? (
                      <span className="text-success">Si</span>
                    ) : (
                      <span className="text-text-secondary">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-lg border border-border bg-primary-soft/15 p-5">
        <h2 className="mb-4 text-lg font-semibold text-accent">
          Agregar incidencia
        </h2>
        <form action={createIssue} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="sprint_id" value={sprint.id} />
          <div>
            <label className="mb-1 block text-sm font-medium">
              Clave Jira
            </label>
            <input
              name="jira_key"
              className={inputClass}
              placeholder="AR-336"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Titulo</label>
            <input name="title" className={inputClass} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo</label>
            <select name="type" className={inputClass} defaultValue="feature">
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Puntos (solo Features)
            </label>
            <input
              name="points"
              type="number"
              min={0}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Modulo</label>
            <select name="module_id" className={inputClass} required>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Estado Jira
            </label>
            <select name="jira_status" className={inputClass} defaultValue="To Do">
              {JIRA_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="committed" defaultChecked />
            Asumida en el sprint planning
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface hover:opacity-90"
            >
              Guardar incidencia
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
