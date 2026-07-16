# Setting Up a New Diagnostic Center

This codebase is a template: one Next.js app that can be re-branded and
redeployed for any diagnostic center by editing a config file and a few JSON
seed files — no code changes required for a standard launch.

Follow this runbook top to bottom for a first-time setup. Skip to
[Rebranding an Existing Deployment](#rebranding-an-existing-deployment) if
you're just changing an already-launched center's branding.

## 1. Prerequisites

- A VPS (Ubuntu 22.04+ recommended) with Docker and the Docker Compose plugin installed.
- A domain name pointed at the VPS's IP address (A record).
- An account with a Bangladeshi SMS gateway (e.g. BulkSMSBD, SSL Wireless) if you want real SMS — otherwise leave `SMS_PROVIDER=console` and SMS just gets logged.
- Node.js 20.9+ and Docker Desktop if you also want to run this locally before deploying.

## 2. Clone and customize the branding config

```bash
git clone <this-repo-url> <new-center-folder>
cd <new-center-folder>
```

Edit `src/config/site.ts`:

- `name`, `shortName`, `tagline`, `description` — the center's identity.
- `logo` — replace `public/logo.svg` and `public/favicon.ico` with the center's assets, then update the paths if you renamed the files.
- `theme` — pick `primary`, `secondary`, `accent` hex colors and a `radius`. Text color on top of these is computed automatically for contrast (see `src/lib/theme.ts`) — you only need to pick colors, not worry about legibility.
- `contact` — phone numbers, WhatsApp number, email.
- `hours` — working hours, in both English and Bangla.
- `social` — social links (omit any you don't have).
- `branches` — seed data for branch locations (also editable later from the admin dashboard; this array is only used once by the seed script).
- `features` — toggle `homeCollection`, `multiBranch`, `onlinePayment`, `testimonials`, and `doctorsPage` depending on what this center offers.
- `payment.provider` — keep `"demo"` for the in-app sandbox checkout (bKash / Nagad / card UI, no real charge). Switch to `"live"` after you implement a real gateway in `src/lib/payment.ts`.
- `seo.keywords` — a few relevant search keywords.

This file is the single source of truth for branding. It is read at request
time (not baked into the build), so you can also tweak it and redeploy
without a database migration.

## 3. Customize the test catalog seed data

The tests, packages, and doctors shown on a freshly-seeded site come from
`prisma/seed-data/*.json`:

- `categories.json` — test categories (e.g. Pathology, Imaging).
- `tests.json` — individual tests with price, sample type, prep notes, and turnaround time.
- `doctors.json` — consulting doctors, if `features.doctorsPage` is enabled.
- `packages.json` — bundled health packages; each references test names from `tests.json`.

Replace the demo data with this center's real catalog and prices. You can
also manage all of this later from `/admin` without redeploying — the JSON
files are only used for the *initial* seed.

## 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Use a strong password for the Postgres user. |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32`. Rotating this logs out all staff sessions. |
| `SEED_ADMIN_NAME` / `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` | Bootstrap admin account, created once by the seed script if no admin exists yet. **Change this password after first login.** |
| `NEXT_PUBLIC_APP_URL` | The public URL of this center's site, e.g. `https://example-diagnostics.com`. |
| `REPORTS_STORAGE_DIR` | Where uploaded PDF reports are stored on disk. Leave as-is for Docker (it's a mounted volume). |
| `SMS_PROVIDER` | `console` (dev/logging only) or `http` (see `src/lib/sms.ts`). |
| `SMS_API_URL` / `SMS_API_KEY` / `SMS_SENDER_ID` | Your SMS gateway's credentials, if `SMS_PROVIDER=http`. |
| `DEV_TOOLS` / `NEXT_PUBLIC_DEV_TOOLS` | Optional. Defaults on in non-production; set `false` to hide subtle form autofill buttons. **Hard-disabled in production builds.** |
| `DEV_OTP_BYPASS` | Optional. Defaults on in non-production so any OTP opens Track. Set `false` to enforce real SMS OTP matching while testing. **Hard-disabled in production** — real OTP verification in `src/lib/phone-otp.ts` is what runs at go-live. |

Also update `docker-compose.yml`'s `POSTGRES_PASSWORD` env (or set it via a
`.env`-driven `POSTGRES_PASSWORD` variable) to match `DATABASE_URL`.

## 5. First-time local run (optional, recommended before deploying)

```bash
npm install
docker compose up -d db
npm run db:migrate      # creates tables
npm run db:seed         # loads this center's catalog + bootstrap admin
npm run dev
```

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/admin/login` for the admin dashboard.

## 6. Deploy to the VPS

On the VPS:

```bash
git clone <this-repo-url> /opt/<center-slug>
cd /opt/<center-slug>
cp .env.example .env   # then fill in production values, see step 4
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

Seed the catalog **from the host** (the production image is slim and does not
include `tsx` / seed dependencies). With Postgres published on
`127.0.0.1:5432`:

```bash
npm ci
DATABASE_URL="postgresql://diagnostic_app:<password>@127.0.0.1:5432/diagnostic_center?schema=public" npm run db:seed
```

The app listens on `127.0.0.1:3000` inside the VPS. Put Nginx in front of it
for TLS termination and a real domain:

```bash
sudo cp docker/nginx.conf.example /etc/nginx/sites-available/<center-domain>
sudo ln -s /etc/nginx/sites-available/<center-domain> /etc/nginx/sites-enabled/
# edit server_name in that file to match your domain, then:
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d <center-domain>
```

## 7. Post-launch checklist

- [ ] Log into `/admin` with the bootstrap credentials and change the password immediately (Settings page).
- [ ] Invite additional staff from `/admin/staff` (admins only).
- [ ] Send a real test booking through the public site and confirm the SMS arrives (if `SMS_PROVIDER=http`).
- [ ] Upload a sample report from the admin dashboard and confirm it downloads from the patient portal after OTP.
- [ ] Verify both `/` (Bangla default) and `/en` (English) render correctly.
- [ ] Confirm `payment.provider` is not left on `"demo"` if you intend to take real payments.
- [ ] Set up a periodic backup of the `db_data` and `reports_data` Docker volumes (e.g. nightly `pg_dump` + `rsync` off-box).

## Rebranding an Existing Deployment

To change an already-running center's look (colors, logo, contact info):

1. Edit `src/config/site.ts` in the repo.
2. Commit, `git pull` on the VPS, then `docker compose up -d --build`.

No database migration is needed for branding-only changes. Test catalog,
branches, and doctors are managed live from `/admin` and don't require a
redeploy.

## Adding a Brand New SMS Gateway

If your gateway isn't a simple GET-style API like the built-in
`HttpGetSmsProvider` (`src/lib/sms.ts`), add a new class implementing the
same `SmsProvider` interface in that file and wire it up in
`getSmsProvider()`. Nothing else in the app needs to change.
