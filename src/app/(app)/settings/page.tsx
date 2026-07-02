import { createClient } from "@/lib/supabase/server";
import type { AlertSettings } from "@/lib/types";
import { updateAlertSettings, updateProfile } from "./actions";

const inputClass =
  "w-full rounded border border-border bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const buttonClass =
  "rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: developer } = await supabase
    .from("developers")
    .select("name, email")
    .eq("id", user!.id)
    .single();

  const { data: settingsRaw } = await supabase
    .from("alert_settings")
    .select("*")
    .eq("developer_id", user!.id)
    .maybeSingle();
  const settings = (settingsRaw as AlertSettings | null) ?? {
    developer_id: user!.id,
    pr_open_days: 2,
    branch_active_days: 3,
    merged_not_deleted_days: 1,
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-bold text-accent">Configuracion</h1>

      <section className="rounded-lg border border-border bg-primary-soft/15 p-5">
        <h2 className="mb-4 text-lg font-semibold text-accent">Perfil</h2>
        <form action={updateProfile} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              name="name"
              defaultValue={developer?.name ?? ""}
              className={inputClass}
              required
            />
          </div>
          <p className="text-xs text-text-secondary">
            Correo: {developer?.email}
          </p>
          <button className={buttonClass}>Guardar perfil</button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-primary-soft/15 p-5">
        <h2 className="mb-1 text-lg font-semibold text-accent">
          Umbrales de alertas
        </h2>
        <p className="mb-4 text-xs text-text-secondary">
          Las alertas del dashboard se disparan al superar estos limites.
        </p>
        <form action={updateAlertSettings} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              PR abierto por mas de (dias)
            </label>
            <input
              name="pr_open_days"
              type="number"
              min={0}
              defaultValue={settings.pr_open_days}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Rama activa por mas de (dias)
            </label>
            <input
              name="branch_active_days"
              type="number"
              min={0}
              defaultValue={settings.branch_active_days}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Rama mergeada sin eliminar por mas de (dias)
            </label>
            <input
              name="merged_not_deleted_days"
              type="number"
              min={0}
              defaultValue={settings.merged_not_deleted_days}
              className={inputClass}
              required
            />
          </div>
          <button className={buttonClass}>Guardar umbrales</button>
        </form>
      </section>
    </div>
  );
}
