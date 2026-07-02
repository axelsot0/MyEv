import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isoToDOInput } from "@/lib/metrics";
import type { Sprint } from "@/lib/types";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteSprint, updateSprint } from "../../actions";

const inputClass =
  "w-full rounded border border-border bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default async function EditSprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: raw } = await supabase
    .from("sprints")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!raw) notFound();
  const sprint = raw as Sprint;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-accent">Editar sprint</h1>

      <form action={updateSprint} className="space-y-4">
        <input type="hidden" name="sprint_id" value={sprint.id} />
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            name="name"
            defaultValue={sprint.name}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Fecha de inicio
          </label>
          <input
            name="start_date"
            type="date"
            defaultValue={sprint.start_date}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Fecha de fin
          </label>
          <input
            name="end_date"
            type="date"
            defaultValue={sprint.end_date}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Fin real del sprint planning
          </label>
          <input
            name="planning_ended_at"
            type="datetime-local"
            defaultValue={isoToDOInput(sprint.planning_ended_at)}
            className={inputClass}
            required
          />
        </div>
        <button className="rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface hover:opacity-90">
          Guardar cambios
        </button>
      </form>

      <form action={deleteSprint} className="border-t border-border pt-4">
        <input type="hidden" name="sprint_id" value={sprint.id} />
        <ConfirmButton
          message={`Eliminar ${sprint.name} con TODAS sus incidencias, ramas y PRs? No se puede deshacer.`}
          className="rounded bg-danger px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Eliminar sprint
        </ConfirmButton>
      </form>
    </div>
  );
}
