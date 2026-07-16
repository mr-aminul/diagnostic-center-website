# Multi-stage build for self-hosted deployment (VPS + Docker Compose).

FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN corepack disable

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Prisma CLI + engines for `npx prisma migrate deploy` inside the container.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /app/storage/reports && chown -R nextjs:nodejs /app/storage

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
