# Diagnostic Center Website

Multi-tenant-ready template for a diagnostic center: public bilingual site (Bangla / English), patient portal, and staff admin dashboard. Built with Next.js, Prisma, and Postgres.

## Features

- Public site with tests, packages, doctors, home collection booking, and search
- Patient portal with SMS OTP verification and report downloads
- Admin dashboard for bookings, catalog, branches, staff, and settings
- Per-center branding via `src/config/site.ts` (no code fork required for a standard launch)
- Docker Compose deployment for VPS self-hosting

## Quick start (local)

```bash
cp .env.example .env   # then set AUTH_SECRET and DB credentials
npm install
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

- Site: [http://localhost:3000](http://localhost:3000) (Bangla default; English at `/en`)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Bootstrap admin credentials come from `SEED_ADMIN_*` in `.env`. Change the password after first login.

## Launching a new center

See **[NEW_CENTER_SETUP.md](./NEW_CENTER_SETUP.md)** for branding, seed data, environment variables, Docker/Nginx deployment, and the go-live checklist.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed catalog + bootstrap admin |
| `npm run db:studio` | Prisma Studio |

## Important production notes

- Keep `payment.provider: "demo"` only for sandbox. Implement a real gateway in `src/lib/payment.ts` before charging patients.
- Set `SMS_PROVIDER=http` with real gateway credentials for live OTP/SMS.
- Never commit `.env`. Use `.env.example` as the template.
