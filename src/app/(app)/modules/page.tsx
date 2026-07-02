import { createClient } from "@/lib/supabase/server";
import { createModule } from "./actions";

interface ModuleWithCount {
  id: string;
  name: string;
  issues: { count: number }[];
}

export default async function ModulesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("modules")
    .select("id, name, issues(count)")
    .order("name");
  const modules = (data ?? []) as unknown as ModuleWithCount[];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-accent">Modulos tecnicos</h1>

      {modules.length === 0 ? (
        <p className="text-text-secondary">Sin modulos registrados.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-accent">
              <th className="py-2 pr-4">Modulo</th>
              <th className="py-2 text-right">Incidencias</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.id} className="border-b border-border/50">
                <td className="py-2 pr-4">{m.name}</td>
                <td className="py-2 text-right">
                  {m.issues[0]?.count ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={createModule} className="flex gap-3">
        <input
          name="name"
          placeholder="Nuevo modulo (ej. Checkout)"
          className="flex-1 rounded border border-border bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90"
        >
          Agregar
        </button>
      </form>
    </div>
  );
}
