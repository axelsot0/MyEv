import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  cycleTimeMs,
  daysSinceDate,
  fmtDate,
  fmtDateTime,
  fmtDuration,
  isCompleted,
  nowDOForInput,
  todayDO,
} from "@/lib/metrics";
import type { IssueWithRelations, Sprint } from "@/lib/types";
import {
  createBranch,
  createPr,
  deleteBranch,
  deleteIssue,
  deletePr,
  markBranchDeleted,
  markPrDeclined,
  markPrMerged,
  updateIssue,
  updateJiraStatus,
} from "../actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { Module } from "@/lib/types";

const inputClass =
  "w-full rounded border border-border bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const smallInput =
  "rounded border border-border bg-white/80 px-2 py-1 text-xs focus:outline-none";
const smallButton =
  "rounded bg-primary px-2.5 py-1 text-xs font-medium text-surface hover:opacity-90";

const JIRA_STATUSES = [
  "To Do",
  "InProgress",
  "Waiting For Dependency",
  "Progress Done",
  "Inspection",
  "Done",
];

type IssueFull = IssueWithRelations & { sprints: Sprint };

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("issues")
    .select("*, modules(id, name), branches(*), pull_requests(*), sprints(*)")
    .eq("id", id)
    .maybeSingle();
  if (!raw) notFound();
  const issue = raw as unknown as IssueFull;

  const { data: modulesRaw } = await supabase
    .from("modules")
    .select("id, name")
    .order("name");
  const modules = (modulesRaw ?? []) as Module[];

  const completed = isCompleted(issue);
  const cycle = cycleTimeMs(issue, issue.sprints.planning_ended_at);
  const today = todayDO();
  const nowInput = nowDOForInput();

  const hidden = (
    <>
      <input type="hidden" name="issue_id" value={issue.id} />
      <input type="hidden" name="sprint_id" value={issue.sprint_id} />
    </>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-sm">
          <Link
            href={`/sprints/${issue.sprint_id}`}
            className="text-primary hover:underline"
          >
            {issue.sprints.name}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-bold text-accent">
          <span className="font-mono">{issue.jira_key}</span> — {issue.title}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          <span className="capitalize">{issue.type}</span>
          {issue.points != null && <> · {issue.points} pts</>} ·{" "}
          {issue.modules?.name ?? "sin modulo"} ·{" "}
          {issue.committed ? "asumida en planning" : "fuera de planning"}
        </p>
        <p className="mt-2 text-sm">
          {completed ? (
            <span className="font-medium text-success">
              Completada · tiempo de ciclo:{" "}
              {cycle != null ? fmtDuration(cycle) : "—"}
            </span>
          ) : (
            <span className="text-text-secondary">
              Pendiente (se completa cuando todos sus PRs esten mergeados)
            </span>
          )}
        </p>
      </header>

      <form action={updateJiraStatus} className="flex items-center gap-2">
        {hidden}
        <label className="text-sm font-medium">Estado Jira:</label>
        <select
          name="jira_status"
          defaultValue={issue.jira_status}
          className={smallInput}
        >
          {JIRA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className={smallButton}>Actualizar</button>
      </form>

      <details className="rounded-lg border border-border bg-primary-soft/15 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-accent">
          Editar / eliminar incidencia
        </summary>
        <form
          action={updateIssue}
          className="mt-4 grid gap-3 md:grid-cols-2"
        >
          {hidden}
          <div>
            <label className="mb-1 block text-xs font-medium">Clave Jira</label>
            <input
              name="jira_key"
              defaultValue={issue.jira_key}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Titulo</label>
            <input
              name="title"
              defaultValue={issue.title}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Tipo</label>
            <select name="type" defaultValue={issue.type} className={inputClass}>
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Puntos (solo Features)
            </label>
            <input
              name="points"
              type="number"
              min={0}
              defaultValue={issue.points ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Modulo</label>
            <select
              name="module_id"
              defaultValue={issue.module_id}
              className={inputClass}
              required
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              name="committed"
              defaultChecked={issue.committed}
            />
            Asumida en el sprint planning
          </label>
          <div className="md:col-span-2">
            <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90">
              Guardar cambios
            </button>
          </div>
        </form>
        <form action={deleteIssue} className="mt-3">
          {hidden}
          <ConfirmButton
            message={`Eliminar ${issue.jira_key} con sus ramas y PRs? No se puede deshacer.`}
            className="rounded bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Eliminar incidencia
          </ConfirmButton>
        </form>
      </details>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">Ramas</h2>
        {issue.branches.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin ramas registradas.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-accent">
                <th className="py-2 pr-3">Rama</th>
                <th className="py-2 pr-3">Creada</th>
                <th className="py-2 pr-3">Eliminada</th>
                <th className="py-2 pr-3">Tiempo activa</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {issue.branches.map((br) => {
                const activeDays = br.deleted_on
                  ? Math.max(
                      0,
                      daysSinceDate(br.created_on) -
                        daysSinceDate(br.deleted_on),
                    )
                  : daysSinceDate(br.created_on);
                return (
                  <tr key={br.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-mono text-xs">{br.name}</td>
                    <td className="py-2 pr-3">{fmtDate(br.created_on)}</td>
                    <td className="py-2 pr-3">
                      {br.deleted_on ? (
                        fmtDate(br.deleted_on)
                      ) : (
                        <span className="text-warning">activa</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">{activeDays} dia(s)</td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {!br.deleted_on && (
                          <form
                            action={markBranchDeleted}
                            className="flex gap-2"
                          >
                            {hidden}
                            <input
                              type="hidden"
                              name="branch_id"
                              value={br.id}
                            />
                            <input
                              type="date"
                              name="deleted_on"
                              defaultValue={today}
                              className={smallInput}
                              required
                            />
                            <button className={smallButton}>
                              Marcar eliminada
                            </button>
                          </form>
                        )}
                        <form action={deleteBranch}>
                          {hidden}
                          <input
                            type="hidden"
                            name="branch_id"
                            value={br.id}
                          />
                          <ConfirmButton
                            message={`Borrar el registro de la rama ${br.name}?`}
                            className="rounded bg-danger px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
                          >
                            Borrar
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <form
          action={createBranch}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-primary-soft/15 p-4"
        >
          {hidden}
          <div className="min-w-64 flex-1">
            <label className="mb-1 block text-xs font-medium">
              Nombre de rama
            </label>
            <input
              name="name"
              className={inputClass}
              placeholder={`feature/${issue.jira_key}-descripcion`}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Creada el</label>
            <input
              type="date"
              name="created_on"
              defaultValue={today}
              className={inputClass}
              required
            />
          </div>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90">
            Registrar rama
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent">
          Pull Requests
        </h2>
        {issue.pull_requests.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin PRs registrados.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-accent">
                <th className="py-2 pr-3">PR</th>
                <th className="py-2 pr-3">Ramas</th>
                <th className="py-2 pr-3">Abierto</th>
                <th className="py-2 pr-3">Merge</th>
                <th className="py-2 pr-3">Tiempo abierto</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {issue.pull_requests.map((pr) => {
                const openMs =
                  (pr.merged_at
                    ? new Date(pr.merged_at).getTime()
                    : Date.now()) - new Date(pr.opened_at).getTime();
                return (
                  <tr key={pr.id} className="border-b border-border/50">
                    <td className="py-2 pr-3">
                      {pr.url ? (
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {pr.source_branch} → {pr.target_branch}
                    </td>
                    <td className="py-2 pr-3">{fmtDateTime(pr.opened_at)}</td>
                    <td className="py-2 pr-3">
                      {pr.merged_at ? fmtDateTime(pr.merged_at) : "—"}
                    </td>
                    <td className="py-2 pr-3">{fmtDuration(openMs)}</td>
                    <td className="py-2 pr-3">
                      {pr.status === "merged" && (
                        <span className="text-success">merged</span>
                      )}
                      {pr.status === "open" && (
                        <span className="text-info">open</span>
                      )}
                      {pr.status === "declined" && (
                        <span className="text-danger">declined</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {pr.status === "open" && (
                          <>
                            <form
                              action={markPrMerged}
                              className="flex gap-2"
                            >
                              {hidden}
                              <input
                                type="hidden"
                                name="pr_id"
                                value={pr.id}
                              />
                              <input
                                type="datetime-local"
                                name="merged_at"
                                defaultValue={nowInput}
                                className={smallInput}
                                required
                              />
                              <button className={smallButton}>Merge</button>
                            </form>
                            <form action={markPrDeclined}>
                              {hidden}
                              <input
                                type="hidden"
                                name="pr_id"
                                value={pr.id}
                              />
                              <button className="rounded bg-warning px-2.5 py-1 text-xs font-medium text-white hover:opacity-90">
                                Declinar
                              </button>
                            </form>
                          </>
                        )}
                        <form action={deletePr}>
                          {hidden}
                          <input type="hidden" name="pr_id" value={pr.id} />
                          <ConfirmButton
                            message="Borrar el registro de este PR?"
                            className="rounded bg-danger px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
                          >
                            Borrar
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <form
          action={createPr}
          className="mt-4 grid gap-3 rounded-lg border border-border bg-primary-soft/15 p-4 md:grid-cols-2"
        >
          {hidden}
          <div>
            <label className="mb-1 block text-xs font-medium">
              URL del PR (opcional)
            </label>
            <input name="url" type="url" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Abierto el
            </label>
            <input
              type="datetime-local"
              name="opened_at"
              defaultValue={nowInput}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Rama origen
            </label>
            <input
              name="source_branch"
              list="branch-names"
              className={inputClass}
              placeholder={`feature/${issue.jira_key}-descripcion`}
              required
            />
            <datalist id="branch-names">
              {issue.branches.map((br) => (
                <option key={br.id} value={br.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Rama destino
            </label>
            <input
              name="target_branch"
              defaultValue="develop"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90">
              Registrar PR
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
