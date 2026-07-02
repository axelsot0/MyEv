import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/metrics";
import type { Sprint } from "@/lib/types";

const linkClass =
  "rounded bg-primary px-3 py-1.5 text-xs font-medium text-surface hover:opacity-90";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sprints")
    .select("*")
    .order("start_date", { ascending: false });
  const sprints = (data ?? []) as Sprint[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-accent">Reportes</h1>
      <p className="text-sm text-text-secondary">
        Cada reporte se genera en PDF con los datos actuales del sprint.
      </p>

      {sprints.length === 0 ? (
        <p className="text-text-secondary">
          Sin sprints registrados todavia.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-accent">
              <th className="py-2 pr-4">Sprint</th>
              <th className="py-2 pr-4">Periodo</th>
              <th className="py-2">Reportes</th>
            </tr>
          </thead>
          <tbody>
            {sprints.map((s) => (
              <tr key={s.id} className="border-b border-border/50">
                <td className="py-3 pr-4 font-medium">{s.name}</td>
                <td className="py-3 pr-4">
                  {fmtDate(s.start_date)} — {fmtDate(s.end_date)}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <a
                      href={`/reports/${s.id}/initial`}
                      target="_blank"
                      className={linkClass}
                    >
                      Inicial
                    </a>
                    <a
                      href={`/reports/${s.id}/weekly`}
                      target="_blank"
                      className={linkClass}
                    >
                      Semanal
                    </a>
                    <a
                      href={`/reports/${s.id}/final`}
                      target="_blank"
                      className={linkClass}
                    >
                      Final
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
