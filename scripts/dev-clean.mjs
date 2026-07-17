#!/usr/bin/env node
/**
 * Kill stale Next.js listeners on :3000 and start a single clean dev server.
 * Multiple concurrent `next dev` processes are a common cause of multi-second
 * navigations on this machine.
 *
 * Also regenerates the Prisma client so schema changes (new models/relations)
 * are not served from a Turbopack-cached pre-generate client.
 */
import { spawn, execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

function killPort(port) {
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGKILL");
        console.log(`Killed pid ${pid} on :${port}`);
      } catch {
        // already gone
      }
    }
  } catch {
    // nothing listening
  }
}

killPort(3000);

try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch {
  console.warn("prisma generate failed — continuing with existing client");
}

// Drop the Turbopack cache so a freshly generated Prisma client is picked up.
try {
  rmSync(path.join(process.cwd(), ".next"), { recursive: true, force: true });
  console.log("Cleared .next cache");
} catch {
  // ignore
}

const child = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));
