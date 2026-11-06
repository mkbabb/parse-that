import { writeFile } from "node:fs/promises";
import { runV3Witnesses, sha256 } from "./witnesses.mjs";
import { v3 } from "./v3-adapter.mjs";

const results = await runV3Witnesses(v3);
const serialized = `${JSON.stringify(results, null, 2)}\n`;
const output = new URL("./baseline-v3-results.json", import.meta.url);
await writeFile(output, serialized);
process.stdout.write(`${JSON.stringify({ output: output.pathname, sha256: sha256(serialized), cases: Object.keys(results).length }, null, 2)}\n`);
