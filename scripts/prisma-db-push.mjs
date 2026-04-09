import { execFileSync } from "node:child_process";
import { loadProjectEnv } from "./_env.mjs";

const env = loadProjectEnv();

if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Add it to .env.local or .env before running db push."
  );
}

const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";

execFileSync(npxBin, ["prisma", "db", "push"], {
  stdio: "inherit",
  env,
});
