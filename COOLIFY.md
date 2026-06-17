# Coolify Deployment

Use the GitHub repository `celnetamit/Journal_cover_pages` and deploy the `main` branch.

## Recommended Coolify Settings

- Resource type: Application
- Source: GitHub
- Repository: `celnetamit/Journal_cover_pages`
- Branch: `main`
- Build pack: Dockerfile
- Dockerfile location: `/Dockerfile`
- Port exposed by app: `3000`
- Health check path: `/login`  ← use `/login` (returns 200). `/` returns a 307
  redirect to `/login` when signed out, which some health checks treat as down.

## 1. Add a PostgreSQL database

Create a **PostgreSQL** resource in Coolify (v16/17). Copy its connection string
into the app's `DATABASE_URL`. Uploaded images are stored in the database, so no
separate volume/object storage is required.

## 2. Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | Connection string of the Postgres resource above. |
| `AUTH_SECRET` | yes | `openssl rand -base64 32`. Keep it stable — changing it signs out everyone. |
| `ADMIN_EMAIL` | first boot | Seeded admin login. |
| `ADMIN_PASSWORD` | first boot | Seeded admin password. Change it after first login (Users page → Reset password). |
| `ADMIN_NAME` | optional | Display name for the seeded admin. |
| `RUN_SEED` | first boot | Set `true` for the **first** deploy to seed the admin + the journal catalog from the bundled CSVs. Set `false` (or remove) afterwards. |

## 3. Deploy

On boot the container entrypoint (`docker-entrypoint.sh`):
1. runs `prisma migrate deploy` (applies any pending migrations — safe every boot),
2. if `RUN_SEED=true`, runs the seed (idempotent upserts: admin user, subscription
   plans, and the journal catalog from `journals_list.csv` +
   `focus-and-scope_formidable_entries.csv`),
3. starts the Next.js standalone server (`node server.js`) on port 3000.

After the first successful deploy, set `RUN_SEED=false` and redeploy so each boot
skips the catalog re-seed. Migrations always run.

## 4. Domain

Add your domain in Coolify after the first successful deployment. Coolify proxies
traffic to container port `3000`.

## First login

Sign in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. From the header:
**Journals** manages the catalog (admins + editors), **Users** manages accounts
(admins). Roles: admin (everything), editor (journals + binder drafts + uploads),
viewer (read-only + export).

## Local production-style test

`docker-compose.prod.yml` builds the image and runs it against a throwaway
Postgres for a prod-like smoke test:

```bash
docker compose -f docker-compose.prod.yml up --build
# open http://localhost:3010/login   (admin@example.com / admin12345 by default)
```
