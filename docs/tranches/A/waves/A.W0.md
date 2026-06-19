# A.W0 — Manifest hygiene

- **Band:** manifest · **Class:** low-risk hygiene (no source change) · **Dep:** none
- **Gate:** `manifest-gate.mjs` — born-RED today (stale `typesVersions` path confirmed
  live: `dist/src/parse/` does not exist)
- **Version:** 0.9.1

---

## Context

Two manifest defects ship silently in 0.9.0.

**Defect 1 — stale `typesVersions`.** `package.json` carries:

```json
"typesVersions": {
    "*": {
        "*": [ "dist/src/parse/index.d.ts" ]
    }
}
```

The path `dist/src/parse/index.d.ts` does not exist. The build emits type declarations
to `dist/index.d.ts` (and per-module files in `dist/`), not to `dist/src/parse/`. A
TypeScript consumer on the legacy `moduleResolution: node` (Node10) strategy consults
`typesVersions` before `exports.types` — it hits this stale path and gets TS7016
(`Cannot find module '@mkbabb/parse-that'`). Consumers on `moduleResolution: bundler`
or `node16` find the types via `exports["."].types = "./dist/index.d.ts"` and are
unaffected. value.js and keyframes.js use `moduleResolution: bundler` — both are
unaffected in practice. The stale entry does nothing useful and actively breaks the
legacy path. The correct fix: remove the entire `typesVersions` block. The `exports`
map alone is sufficient for TS 5.x (the project's minimum consumer target).

**Defect 2 — missing `sideEffects`.** `package.json` has no `sideEffects` field.
Without `"sideEffects": false`, bundlers (Rollup, Vite, esbuild, webpack) cannot
tree-shake the package's modules: they must assume any module import may trigger
side effects. parse-that has zero module-level side effects (the `_initWhitespace()`
call in `parser.ts:689` is the only startup side effect, and it is idempotent and
necessary — V8 ICs are warmed by it; but it writes no global state that a consumer
cares about). Adding `"sideEffects": false` allows downstream consumers to import
`{ Parser }` from `@mkbabb/parse-that` and have dead-code elimination remove the
JSON/CSV/diagnostic modules from their bundles. value.js and keyframes.js both
stand to benefit.

---

## Scope

### S1 — Remove stale `typesVersions`

**Breach.** `package.json:13-19` carries the stale `typesVersions` block pointing
to `dist/src/parse/index.d.ts` (non-existent path confirmed: `ls dist/src/` → no
such directory).

**Cure.** Delete lines 13–19 of `package.json` (the entire `typesVersions` block).
The `exports["."].types` entry (`"./dist/index.d.ts"`) is the canonical type path
and is already correct.

**Falsifiable check.** `node -e "const p=require('./package.json'); console.log(Object.keys(p).includes('typesVersions'))"` → `false` after the fix.

### S2 — Add `sideEffects: false`

**Breach.** `package.json` has no `sideEffects` field; confirmed by:
`node -e "const p=require('./package.json'); console.log('sideEffects' in p)"` → `false`.

**Cure.** Add `"sideEffects": false` as a top-level field in `package.json`.

**Falsifiable check.** `node -e "const p=require('./package.json'); console.log(p.sideEffects)"` → `false`.

### S3 — Version bump to 0.9.1

**Cure.** `package.json` `"version"` field: `"0.9.0"` → `"0.9.1"` (patch bump;
no source change, no API change; pure manifest hygiene).

---

## Born-RED gate

**Gate name:** `test/manifest-gate.mjs` (NEW — runs in the TS `test/` dir as a
node script, no vitest required).

**The REAL observable.** A consumer on a legacy TypeScript `moduleResolution` strategy
gets TS7016 from the stale `typesVersions`. The gate simulates this: it reads
`package.json` and validates (1) the `typesVersions` path is absent or points to an
existing file, and (2) `sideEffects: false` is present.

**Gate script:**

```js
// test/manifest-gate.mjs
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require("../package.json");

let failed = false;

// Gate 1: typesVersions absent or points to an existing path.
if (pkg.typesVersions) {
    const paths = Object.values(pkg.typesVersions).flatMap(v =>
        Object.values(v).flat()
    );
    for (const p of paths) {
        const abs = resolve(__dirname, "..", p);
        if (!existsSync(abs)) {
            console.error(`FAIL: typesVersions path does not exist: ${p}`);
            failed = true;
        }
    }
} // absence is valid — the gate passes if typesVersions is gone entirely.

// Gate 2: sideEffects: false present.
if (pkg.sideEffects !== false) {
    console.error(`FAIL: sideEffects !== false (got: ${JSON.stringify(pkg.sideEffects)})`);
    failed = true;
}

if (failed) process.exit(1);
console.log("manifest-gate GREEN — typesVersions valid, sideEffects: false present.");
```

**Today's tree result.** `node test/manifest-gate.mjs` → exits 1:
- Gate 1: `typesVersions` exists and `dist/src/parse/index.d.ts` does not → FAIL.
- Gate 2: `sideEffects` absent → FAIL.

**Green condition.** Both gates pass: `typesVersions` removed, `sideEffects: false`
present, `version: "0.9.1"`.

---

## Dependencies

None. This wave is entirely `package.json`-only with a new test helper. No library
source is touched.

---

## Excluded from this wave

- **The `exports` map shape.** The current `exports` map is correct and sufficient
  for all modern consumers. The subpath additions (`./core`, `./packrat`, etc.) are
  A.W3's concern.
- **Main/module/browser compat fields.** parse-that is ESM-only (confirmed: `"type":
  "module"` in `package.json`; `dist/parse.cjs` ships for consumers that need CJS,
  handled by `exports["."].require`). No `main`/`module` fields are needed.
- **The `files` field.** `"files": ["./dist"]` is correct and stays.
