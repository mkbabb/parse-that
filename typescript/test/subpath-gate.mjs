// A.W3 Gate 1 — proof:subpath.
//
// Validates the subpath split: after `vite build`, the per-tier outputs the
// `exports` map points at must resolve and carry their tier's surface. We
// resolve the dist target each subpath maps to (reading the `exports` map from
// package.json so the gate tracks the manifest, not a hardcoded path) and
// import it directly — a faithful stand-in for the bare-specifier resolution a
// consumer gets (`@mkbabb/parse-that/core`, `.../packrat`).
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const pkg = require("../package.json");

function fail(msg) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
}

// Every declared subpath must point at a built import target that exists.
const subpaths = ["./core", "./diagnostics", "./packrat", "./utils"];
for (const sp of subpaths) {
    const entry = pkg.exports?.[sp];
    if (!entry) fail(`exports map is missing "${sp}"`);
    for (const field of ["types", "import", "require"]) {
        const rel = entry[field];
        if (!rel) fail(`"${sp}" is missing the "${field}" field`);
        if (!existsSync(resolve(root, rel))) {
            fail(`"${sp}".${field} -> ${rel} does not exist (build first)`);
        }
    }
}

// Resolve the actual import targets and load them.
const corePath = resolve(root, pkg.exports["./core"].import);
const packratPath = resolve(root, pkg.exports["./packrat"].import);

const core = await import(corePath);
const packrat = await import(packratPath);

if (typeof core.Parser !== "function") {
    fail("./core did not export `Parser` as a function");
}
if (typeof core.callSpan !== "function") {
    fail("./core did not export the SpanParser dispatch `callSpan`");
}
if (typeof packrat.memoize !== "function") {
    fail("./packrat did not export `memoize` as a function");
}

console.log(
    `proof:subpath GREEN — ${subpaths.length} subpaths resolve; ` +
        `./core{Parser,callSpan} + ./packrat{memoize} are live functions.`,
);
