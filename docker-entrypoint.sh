#!/bin/sh
set -e

# Apply any pending database migrations before starting the server.
# Safe to run on every boot: `migrate deploy` only applies new migrations.
echo "Running database migrations…"
node node_modules/prisma/build/index.js migrate deploy

# Optionally seed on first boot when RUN_SEED=true (idempotent upserts).
if [ "$RUN_SEED" = "true" ]; then
  echo "Seeding database…"
  node node_modules/.bin/tsx prisma/seed.ts || echo "Seed step failed (continuing)."
fi

echo "Starting Next.js server…"
exec node server.js
