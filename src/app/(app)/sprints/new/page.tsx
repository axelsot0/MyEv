import { createSprint } from "../actions";

const inputClass =
  "w-full rounded border border-border bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function NewSprintPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-accent">Crear sprint</h1>

      <form action={createSprint} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            name="name"
            className={inputClass}
            placeholder="Sprint 2026-14"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Fecha de inicio (miercoles del planning)
          </label>
          <input name="start_date" type="date" className={inputClass} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Hora real de fin del sprint planning
          </label>
          <input
            name="planning_time"
            type="time"
            defaultValue="13:00"
            className={inputClass}
            required
          />
          <p className="mt-1 text-xs text-text-secondary">
            El tiempo de ciclo de cada incidencia se mide desde esta hora hasta
            el merge del PR.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Fecha de fin (opcional)
          </label>
          <input name="end_date" type="date" className={inputClass} />
          <p className="mt-1 text-xs text-text-secondary">
            Vacio = inicio + 13 dias (sprint de 2 semanas).
          </p>
        </div>
        <button
          type="submit"
          className="rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface hover:opacity-90"
        >
          Crear sprint
        </button>
      </form>
    </div>
  );
}
