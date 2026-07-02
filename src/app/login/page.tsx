"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else if (!data.session) {
        setNotice(
          "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesion.",
        );
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded border border-border bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg bg-surface p-8 shadow-md">
        <h1 className="mb-1 text-2xl font-bold text-primary">MyEvo</h1>
        <p className="mb-6 text-sm text-text-secondary">
          Seguimiento de desempeno por sprint
        </p>

        <div className="mb-6 flex rounded border border-border text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-l px-3 py-2 ${mode === "login" ? "bg-primary text-surface" : "text-text-secondary"}`}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-r px-3 py-2 ${mode === "signup" ? "bg-primary text-surface" : "text-text-secondary"}`}
          >
            Registrarme
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Correo</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contrasena</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {notice && <p className="text-sm text-info">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Procesando..."
              : mode === "login"
                ? "Entrar"
                : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
