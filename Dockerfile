FROM node:22-alpine AS deps
WORKDIR /app

# --ignore-scripts: the postinstall `prisma generate` needs the schema, which is
# copied later in the builder stage.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client and build the app, then drop dev-only dependencies
# (typescript, eslint, vitest, tailwind, @types) so the runtime image — which
# copies this node_modules for `prisma migrate deploy` + the optional seed —
# stays small and the image export step is fast.
RUN npx prisma generate \
  && npm run build \
  && npm prune --omit=dev --ignore-scripts --no-audit --no-fund \
  # Drop build-only artifacts that the production server never loads at runtime:
  # @next/swc (compiler binaries), typescript, and caches. This shrinks the image
  # and speeds up the layer export.
  && rm -rf node_modules/@next/swc-* node_modules/typescript node_modules/.cache .next/cache

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# openssl is required by the Prisma migration engine on Alpine.
RUN apk add --no-cache openssl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone server + static assets.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI, engines, generated client and migrations for `migrate deploy` at boot.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# src (generated client + lib/csv) so the boot-time migrate/seed can run.
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
# Small root files in one layer: prisma config, package.json, and the CSVs that
# `RUN_SEED=true` reads on first boot.
COPY --from=builder --chown=nextjs:nodejs \
  /app/prisma.config.ts /app/package.json \
  /app/journals_list.csv /app/focus-and-scope_formidable_entries.csv ./
COPY --chown=nextjs:nodejs --chmod=755 docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
