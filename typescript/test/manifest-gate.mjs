// A.W0 manifest-hygiene gate (inv-A-3).
//
// Born-RED on 0.9.0: `typesVersions` mapped "*" → "dist/src/parse/index.d.ts",
// a path that does not exist (the build emits to dist/, not dist/src/parse/),
// and `sideEffects` was absent (a tree-shaking consumer over-includes the barrel).
//
// Green after A.W0: the stale `typesVersions` block is removed (the `exports`
// map already resolves types correctly for every modern resolver) and
// `sideEffects: false` is present.
//
// Pure manifest read — no build required.
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require("../package.json");

let failed = false;

// Gate 1: typesVersions absent, or every mapped path actually exists.
if (pkg.typesVersions) {
    for (const versionMap of Object.values(pkg.typesVersions)) {
        for (const paths of Object.values(versionMap)) {
            for (const p of paths) {
                if (!existsSync(resolve(__dirname, "..", p))) {
                    console.error(`FAIL: typesVersions maps to a non-existent path: ${p}`);
                    failed = true;
                }
            }
        }
    }
}

// Gate 2: sideEffects explicitly false (unlocks tree-shaking downstream).
if (pkg.sideEffects !== false) {
    console.error(`FAIL: package.json sideEffects must be false, got: ${JSON.stringify(pkg.sideEffects)}`);
    failed = true;
}

// Gate 3: the exports "." types target actually exists (the real resolver path).
const typesTarget = pkg.exports?.["."]?.types;
if (!typesTarget || !existsSync(resolve(__dirname, "..", typesTarget))) {
    console.error(`FAIL: exports["."].types missing or unresolvable: ${typesTarget}`);
    failed = true;
}

if (failed) process.exit(1);
console.log("manifest-gate GREEN — typesVersions clean, sideEffects:false, types resolve.");
