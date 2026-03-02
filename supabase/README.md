# Supabase – Mesa de Ayuda

**No subas `.env.local` a GitHub** (contiene la clave de Supabase). Si ya lo hiciste, quitarlo del repo:  
`git rm --cached .env.local` y hacer commit. En Vercel, configurá las variables en **Settings → Environment Variables**.

## Crear la tabla en Supabase

1. Entrá a tu proyecto en [Supabase](https://supabase.com/dashboard).
2. Abrí **SQL Editor** → **New query**.
3. Copiá y ejecutá el contenido de `supabase/migrations/20260226000000_create_tickets.sql`.
4. En **Project Settings** → **API** copiá:
   - **Project URL** → usalo como `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → usalo como `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Variables de entorno

En la raíz del proyecto creá `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

No subas `.env.local` a Git (ya está en `.gitignore`).

## Comportamiento

- Al **subir un Excel** en la app, los tickets se guardan en la tabla `tickets` (reemplazando por `ticket_id` si ya existen).
- Al **abrir la página de análisis**, se cargan los últimos tickets desde Supabase (si hay).
- Tu jefa puede abrir la app y ver los datos sin subir ningún archivo.
