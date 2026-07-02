import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: developer } = await supabase
    .from("developers")
    .select("name")
    .eq("id", user.id)
    .single();

  const linkClass =
    "block rounded px-3 py-2 text-sm hover:bg-white/10 transition-colors";

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col bg-primary text-surface">
        <div className="px-5 py-5 text-xl font-bold">MyEvo</div>
        <nav className="flex-1 space-y-1 px-3">
          <Link href="/" className={linkClass}>
            Dashboard
          </Link>
          <Link href="/calendar" className={linkClass}>
            Calendario
          </Link>
          <Link href="/sprints" className={linkClass}>
            Sprints
          </Link>
          <Link href="/modules" className={linkClass}>
            Modulos
          </Link>
          <Link href="/reports" className={linkClass}>
            Reportes
          </Link>
          <Link href="/settings" className={linkClass}>
            Configuracion
          </Link>
        </nav>
        <div className="border-t border-white/20 px-5 py-4 text-sm">
          <p className="mb-2 truncate font-medium">
            {developer?.name ?? user.email}
          </p>
          <form action={signOut}>
            <button className="text-primary-soft hover:underline">
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
