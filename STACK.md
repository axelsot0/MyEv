# STACK — MyEvo

Decidido 2026-07-01. Criterio: deploy en Vercel + Supabase (preferencia de Axel).

| Capa | Elección | Nota |
|---|---|---|
| Framework | Next.js (App Router, TypeScript, `src/`) | Un solo codebase, deploy nativo en Vercel |
| Estilos | Tailwind CSS v4 | Paleta en `src/app/globals.css` (`@theme`), ver REQUIREMENTS.md #14 |
| DB | Supabase (Postgres) | RLS para el futuro multi-dev/supervisor |
| Auth | Supabase Auth | v1 single-user; roles developer/supervisor después |
| Cliente DB | `@supabase/supabase-js` + `@supabase/ssr` | SSR helpers para App Router |
| PDF | `@react-pdf/renderer` (pendiente confirmar) | Funciona en serverless Vercel; Puppeteer NO (peso) |
| Deploy | Vercel | Variables de entorno = las de `.env.example` |
| Repo | https://github.com/axelsot0/MyEv (personal, independiente de ORA) | rama `master` |

## Convenciones

- Registro 100 % manual en v1 (sin API Jira/Bitbucket).
- Criterio de completado: PR mergeado, no Done de Jira.
- Tiempo de ciclo: fin de sprint planning → merge del PR.
- Diseñar tablas con `developer_id` desde el día 1 (expansión multi-dev).

## Pendientes de setup

- [x] Crear proyecto en Supabase y llenar `.env.local` (2026-07-01): proyecto
      `myevo` ref `giaimnhjdjygjgliujgy`, org "Axel S's projects" (managed vía
      Vercel Marketplace), us-east-1, RLS automático activado. Key usada:
      publishable (nueva generación, reemplaza anon JWT). DB password:
      autogenerado, no guardado — resetear en Settings > Database si hace falta.
- [x] Definir esquema de DB (2026-07-01): `supabase/migrations/0001_init.sql`
      aplicado por Axel en SQL Editor. Env vars agregadas en Vercel.
- [x] Conectar a Vercel (2026-07-01, CLI): proyecto `axel-ss-projects/myevo`,
      producción en https://myevo-two.vercel.app
