# NFC Gifting Monorepo — Setup Guide

Every command needed, in order. Tested structure: pnpm workspaces + Turborepo,
two React apps (web, admin), one Express API, four shared packages.

```
nfc-gifting/
├── package.json            root scripts (turbo)
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── supabase/
│   └── migrations/
│       └── 0001_init.sql   full schema + RLS (run in Supabase SQL Editor)
├── apps/
│   ├── web/                storefront, claim flow, customer builder, viewer (:5173)
│   ├── admin/              template builder (Puck), products, orders (:5174)
│   └── api/                Express + TS: claims, orders, publish (:4000)
└── packages/
    ├── puck-config/        shared Puck block registry (admin + web + viewer)
    ├── ui/                 Button, theme presets
    ├── validation/         Zod schemas (shared by api + frontends)
    └── db/                 generated Supabase types
```

---

## 0. Prerequisites (one time)

```bash
# Node 20+
node -v

# pnpm
npm install -g pnpm@9

# Supabase CLI (for type generation only, no local stack)
npm install -g supabase
```

## 1. Install

```bash
cd nfc-gifting
pnpm install
```

## 2. Supabase (hosted, no Docker)

1. Create TWO projects at https://supabase.com/dashboard: `gifting-dev` and `gifting-prod`.
2. In `gifting-dev` → SQL Editor → paste `supabase/migrations/0001_init.sql` → Run.
3. Dashboard → Settings → API → copy: Project URL, anon key, service_role key.

## 3. Environment files

```bash
cp apps/web/.env.example   apps/web/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/api/.env.example   apps/api/.env
```

Fill each with the dev project values. Rules:
- anon key → web + admin only (browser safe, RLS is the wall)
- service_role key → api only, NEVER in a VITE_ variable

## 4. Run everything

```bash
# all three apps in parallel via turbo
pnpm dev

# or individually
pnpm --filter @gifting/api dev     # http://localhost:4000
pnpm --filter @gifting/web dev     # http://localhost:5173
pnpm --filter @gifting/admin dev   # http://localhost:5174
```

## 5. Verify the wiring

```bash
# API alive
curl http://localhost:4000/health
# → {"ok":true}

# JWT guard rejects anonymous
curl http://localhost:4000/health/me
# → {"error":"No token"}

# JWT guard accepts a real Supabase session:
# sign up a user in the web app, then in browser console:
#   const { data } = await supabase.auth.getSession()
#   data.session.access_token
curl -H "Authorization: Bearer <token>" http://localhost:4000/health/me
# → {"user":{"id":"..."}}
```

## 6. Make yourself admin

Sign up once through the web app, then in Supabase SQL Editor:

```sql
update profiles set role = 'admin' where id = 'YOUR_AUTH_UID';
```

Find your UID in Dashboard → Authentication → Users.

## 7. Generate DB types (after every migration)

```bash
supabase login
SUPABASE_PROJECT_ID=your_dev_project_ref pnpm gen:types
```

Project ref is the subdomain in your Supabase URL.

## 8. Everyday commands

```bash
pnpm dev                                  # run all apps
pnpm build                                # build all
pnpm typecheck                            # typecheck all
pnpm --filter @gifting/api add <pkg>      # add dep to one app
pnpm --filter @gifting/web add <pkg>
pnpm add -w -D <pkg>                      # add dep to root
```

## 9. New migrations

1. Create `supabase/migrations/0002_description.sql`
2. Run it in the dev project SQL Editor
3. `pnpm gen:types`
4. When ready for prod: run the same file in `gifting-prod`

Numbered files in the repo are the source of truth. Never edit 0001 after
it has run; always add a new file.

## 10. Deploy

```bash
# web + admin → Vercel (two projects, same repo)
#   Root Directory: apps/web (and apps/admin)
#   Build Command:  cd ../.. && pnpm turbo build --filter=@gifting/web
#   Output Dir:     apps/web/dist
#   Env vars:       VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

# api → Railway or Render
#   Build:  pnpm install && pnpm --filter @gifting/api build
#   Start:  node apps/api/dist/index.js
#   Env:    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEB_ORIGIN, ADMIN_ORIGIN, PORT
```

## What's stubbed and where each milestone lands

| Milestone | Files to fill |
|---|---|
| M1 auth | `apps/web/src/pages/` login/signup, admin role gate in `apps/admin` |
| M2 orders | `apps/api/src/routes/orders.ts` (stub returns 501), admin product CRUD |
| M3 templates | `packages/puck-config/src/blocks/` (only Paragraph exists), `apps/admin/src/pages/TemplateEditor.tsx` save-to-Supabase |
| M4 claim + customer builder | `apps/api/src/routes/claims.ts`, `apps/web/src/pages/TagLanding.tsx` |
| M5 viewer | new `apps/web/src/pages/Experience.tsx` using `<Render>` from Puck |

Grep for `TODO M` to find every stub.
