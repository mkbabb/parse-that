// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.c — the boundary suite's own vitest project, and the ONE reason it exists.
//
// `W3.md` §6 G-9's command is literal:
//
//     npx vitest run test/css-recovery/boundary/depth.test.ts test/css-recovery/boundary/latch.test.ts
//
// MEASURED AT THIS SEAT, before this file was written, from `<p2>/typescript` — the directory whose
// `vitest.config.ts` is the nearest config to those paths:
//
//     ⟨cmd⟩ npx vitest run test/css-recovery/boundary/depth.test.ts test/css-recovery/boundary/latch.test.ts
//     No test files found, exiting with code 1
//     filter: test/css-recovery/boundary/depth.test.ts, test/css-recovery/boundary/latch.test.ts
//     include: test/*.test.ts
//
// The library config includes `test/*.test.ts` — ONE level — and vitest positionals FILTER the
// collected set rather than extend it, so the gate's literal form collects **zero files for a
// configuration reason, not a subject reason**. `.b` met the identical gap on G-8's literal form
// (`X-P-W3.md` b.5 **E-3**) and `.a` on G-6's; it is one orchestrator row, recorded three times and
// worked around zero times.
//
// The lawful cure, and why it is this one. Widening `typescript/vitest.config.ts` is a write to a
// library file in **no unit's writable set** in this wave (`W3.md` §4a; the same refusal `.b` made).
// This seat's create row is `test/css-recovery/boundary/**`, so the project lives INSIDE it:
//
//     npx vitest run --config typescript/test/css-recovery/boundary/vitest.config.ts
//
// That is not a narrowing of the gate. The include glob below collects **every** `.test.ts` under
// this directory, so a suite this seat forgot to register is collected anyway, and the gate's two
// named files are a subset of what runs rather than a hand-picked pair.
//
// `pool: "forks"` with vitest's default per-file isolation is DECLARED, not incidental: `entry.mjs`
// carries a module-global shield ledger (`SHIELD.caught`), and a suite that asserted an absolute
// ledger reading would be asserting the run order of its sibling files. Every ledger assertion in
// this suite is therefore a DELTA taken at its own file's load — true under isolation and true
// without it — and this line is the second half of that belt.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // The library root, so a positional written as the gate writes it (`test/css-recovery/...`)
    // resolves exactly as it does under the library's own config.
    root: path.resolve(HERE, "../../.."),
    test: {
        include: ["test/css-recovery/boundary/**/*.test.ts"],
        pool: "forks",
        isolate: true,
        testTimeout: 600_000,
    },
});
