<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Navigation performance (do not regress)

Soft navigation between public pages must feel instant. These rules are enforced by `npm run check:perf` (also via `npm run lint`).

## Never do this on the public site

1. **Do not add `src/app/[locale]/loading.tsx`.** A locale-wide loading UI flashes a skeleton on every click. Prefer keeping the previous page visible until the next RSC payload arrives. Per-route `loading.tsx` is allowed only for intentionally slow screens (`book`, `patient-portal`, admin).
2. **Do not add page-entry entrance animations** (`animate-in` + `fade-in` / `slide-in-from-*` + `duration-500` / `duration-700`) on `src/app/[locale]/**/page.tsx`. They delay perceived navigation after content arrives. Keep motion for interactive overlays (dialogs, menus) only.
3. **Do not query Postgres directly from shared layout chrome** (Header / Footer / SiteChrome). Use only tagged-cache helpers (`getResolvedSiteConfig`, `getDisplayBranches`) — never import `db` in the footer.
4. **Do not ship booking (or other large forms) with `dynamic(..., { ssr: false })`.** That adds a chunk-download skeleton on every visit.
5. **Do not remove `experimental.staleTimes` from `next.config.ts`.** Next defaults `dynamic` stale time to `0`, which refetches RSC on every soft nav.

## Always do this

1. Keep `PrefetchWarmup` in the locale layout and `prefetch` on primary nav `Link`s.
2. Cache catalog/data fetchers (`React.cache` + tagged cache). Prefer `getResolvedSiteConfig` / `getDisplayBranches` for contact and branch copy that admins can edit.
3. When local nav feels slow, run **one** server with `npm run dev:clean` (kills duplicate `:3000` processes). Auto Link prefetch is production-only — use `npm run dev:prod` to verify real navigation speed.

## Why local `next dev` can still feel slow once

The first hit to a route may compile (Turbopack). That is expected. After compile + prefetch warmup, soft navigations should reuse the client cache (`staleTimes`) and stay near-instant.
