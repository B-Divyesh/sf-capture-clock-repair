import { spawnSync } from "node:child_process";

const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("usage: npm run test:claim -- <claim-id>");
  process.exit(2);
}

const result = spawnSync(process.execPath, [
  "--test",
  `--test-name-pattern=@claim:${id}(?:\\s|$)`,
  "test/claims.test.mjs"
], { stdio: "inherit" });

process.exit(result.status ?? 1);
