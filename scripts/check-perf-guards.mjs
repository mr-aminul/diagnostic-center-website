#!/usr/bin/env node
/**
 * Hard guards so navigation latency regressions cannot silently return.
 * Run via: npm run check:perf
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// 1) Locale-wide loading.tsx forces a skeleton flash on every soft nav.
const localeLoading = path.join(root, "src/app/[locale]/loading.tsx");
if (fs.existsSync(localeLoading)) {
  errors.push(
    "Forbidden: src/app/[locale]/loading.tsx — removes instant soft nav. Delete it (use per-route loading only for intentionally slow pages).",
  );
}

// 2) Page-entry entrance animations delay perceived navigation after paint.
const pageFiles = walk(path.join(root, "src/app")).filter((file) =>
  file.endsWith("page.tsx"),
);
const entrance =
  /\banimate-in\b[\s\S]{0,80}\b(?:fade-in|slide-in-from-|zoom-in-)[\s\S]{0,80}\bduration-(?:500|700)\b/;

for (const file of pageFiles) {
  // Admin can keep heavier chrome; public locale pages must stay snappy.
  if (!file.includes(`${path.sep}[locale]${path.sep}`)) continue;
  const text = fs.readFileSync(file, "utf8");
  if (entrance.test(text)) {
    errors.push(
      `Forbidden page-entry animation in ${path.relative(root, file)} — remove animate-in/fade-in/slide-in duration-500/700 from page shells.`,
    );
  }
}

// 3) Booking form must not disable SSR (extra chunk wait on every /book visit).
const bookingLazy = path.join(root, "src/components/site/booking-form-lazy.tsx");
if (fs.existsSync(bookingLazy)) {
  const text = fs.readFileSync(bookingLazy, "utf8");
  if (/ssr\s*:\s*false/.test(text)) {
    errors.push(
      "Forbidden: booking-form-lazy.tsx uses ssr:false — import BookingForm directly instead.",
    );
  }
}

// 4) Footer must not query Postgres directly — only tagged-cache helpers.
const footer = path.join(root, "src/components/site/footer.tsx");
if (fs.existsSync(footer)) {
  const text = fs.readFileSync(footer, "utf8");
  if (/from\s+["']@\/lib\/db["']|\bdb\./.test(text)) {
    errors.push(
      "Forbidden: footer.tsx must not import db directly — use cached helpers only.",
    );
  }
  const dataImports = [...text.matchAll(/from\s+["'](@\/lib\/data\/[^"']+)["']/g)].map(
    (match) => match[1],
  );
  const allowed = new Set([
    "@/lib/data/site-settings",
    "@/lib/data/display-branches",
  ]);
  for (const importPath of dataImports) {
    if (!allowed.has(importPath)) {
      errors.push(
        `Forbidden: footer.tsx may only import cached ${[...allowed].join(" or ")} (found ${importPath}).`,
      );
    }
  }
}

// 5) Client router cache must stay enabled.
const nextConfig = path.join(root, "next.config.ts");
if (fs.existsSync(nextConfig)) {
  const text = fs.readFileSync(nextConfig, "utf8");
  if (!/staleTimes/.test(text) || !/dynamic:\s*([1-9]\d*)/.test(text)) {
    errors.push(
      "Missing experimental.staleTimes.dynamic (>0) in next.config.ts — without it every soft nav refetches RSC.",
    );
  }
}

if (errors.length > 0) {
  console.error("Performance guard failed:\n");
  for (const error of errors) console.error(`  • ${error}`);
  console.error("");
  process.exit(1);
}

console.log("Performance guards passed.");
