import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtDateTime, todayDO } from "@/lib/metrics";
import type { Sprint } from "@/lib/types";

export default async function SprintsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sprints")
    .select("*")
    .order("start_date", { ascending: false });
  const sprints = (data ?? []) as Sprint[];
  const today = todayDO();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent">Sprints</h1>
        <Link
          href="/sprints/new"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90"
        >
          Crear sprint
        </Link>
      </header>

      {sprints.length === 0 ? (
        <p className="text-text-secondary">
          Ningun sprint registrado todavia.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-accent">
              <th className="py-2 pr-4">Sprint</th>
              <th className="py-2 pr-4">Inicio</th>
              <th className="py-2 pr-4">Fin</th>
              <th className="py-2 pr-4">Fin del planning</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {sprints.map((s) => {
              const active = s.start_date <= today && s.end_date >= today;
              return (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">
                    {s.name}{" "}
                    {active && (
                      <span className="ml-1 rounded bg-success/15 px-2 py-0.5 text-xs text-success">
                        activo
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{fmtDate(s.start_date)}</td>
                  <td className="py-2 pr-4">{fmtDate(s.end_date)}</td>
                  <td className="py-2 pr-4">
                    {fmtDateTime(s.planning_ended_at)}
                  </td>
                  <td className="py-2 text-right">
                    <Link
                      href={`/sprints/${s.id}`}
                      className="text-primary hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
