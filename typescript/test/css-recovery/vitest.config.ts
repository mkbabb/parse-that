// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.b — the malformed-inverse suite's own vitest project.
//
// WHY IT EXISTS, measured before it was written: `typescript/vitest.config.ts` includes
// `test/*.test.ts` — ONE level — so `test/css-recovery/labels.test.ts` is collected by no config in
// this root, and vitest's positional arguments FILTER the collected set rather than extend it. The
// literal command `W3.md` §6 G-8 names (`npx vitest run test/css-recovery/labels.test.ts`) therefore
// collects zero files today, for a configuration reason and not a subject reason.
//
// The library's config is NOT this unit's to widen (§4a gives `.b` `src/css/{lower,diagnostics,
// codes}`, `scripts/css-recovery-closure.mjs` and `test/css-recovery/**`), so the suite carries its
// own project instead of editing a file that belongs to no seat of this wave:
//
//     npx vitest run --config typescript/test/css-recovery/vitest.config.ts
//
// The one-row gap between that and the gate's literal form is RAISED, not papered over — it is the
// same gap `.a`'s G-6 command and `.c`'s G-9 command will meet, so it is a wave-level row for the
// orchestrator rather than three private workarounds.
//
// The include glob covers the whole `test/css-recovery` tree, `boundary/**` included, so the
// boundary suite `.c` authors is collected by this project the moment it lands. This unit opens no
// file under `boundary/**` (the §4a lock); a glob that will match one is not an opening of it.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: path.resolve(HERE, "../.."),
    test: {
        include: ["test/css-recovery/**/*.test.ts"],
        pool: "forks",
    },
});
