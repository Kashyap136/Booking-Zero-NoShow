import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

// Force production semantics for `next build`.
// Next.js auto-assigns NODE_ENV=production when it is unset, but if the
// caller's environment exports NODE_ENV=development (shell, IDE, CI), the
// `_global-error` prerender crashes with an internal invariant (vercel/next.js#87719).
// Pinning it here makes the build deterministic regardless of ambient env.
process.env.NODE_ENV = "production";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next", {
  paths: [process.cwd()],
});

const result = spawnSync(process.execPath, [nextBin, "build", ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);