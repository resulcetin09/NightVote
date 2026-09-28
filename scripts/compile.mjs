import { execFileSync } from "node:child_process";
import { mkdir, cp } from "node:fs/promises";
import path from "node:path";

const executable =
  process.env.COMPACTC ?? path.resolve(".tools/compact-0.31.1/compactc");
const checkOnly = process.argv.includes("--skip-zk");
await mkdir("contract/managed", { recursive: true });
execFileSync(
  executable,
  [
    ...(checkOnly ? ["--skip-zk"] : []),
    "contract/voting.compact",
    "contract/managed/voting",
  ],
  { stdio: "inherit" },
);
if (!checkOnly) {
  // The browser fetches proving keys and ZKIR from /contract/voting.
  await mkdir("public/contract/voting", { recursive: true });
  for (const folder of ["keys", "zkir"])
    await cp(
      `contract/managed/voting/${folder}`,
      `public/contract/voting/${folder}`,
      { recursive: true },
    );
}
console.log(
  checkOnly
    ? "Contract compiled (proving keys skipped)."
    : "Contract and proving assets ready.",
);
