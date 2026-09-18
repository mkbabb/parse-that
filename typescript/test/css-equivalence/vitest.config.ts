// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — the equivalence suite's own vitest project, for the reason `.a`, `.b` and `.c` each
// recorded before this seat: the library config at `typescript/vitest.config.ts` includes
// `test/*.test.ts` — ONE directory level — and a vitest positional FILTERS the collected set rather
// than extending it. So G-7's literal command
//
//     npx vitest run test/css-equivalence/
//
// collects zero files from `<p2>/typescript` for a CONFIGURATION reason, not a subject reason. The
// gap is `.b`'s **E-3**, met now by all four phase-1/2 seats (`.a` G-6 · `.b` G-8 · `.c` G-9 · this
// seat G-7) and worked around by none of them: widening the library config is a write to a file in
// no unit's writable set (`W3.md` §4a), so the project lives inside this seat's own create row and
// the gate is RUN through it:
//
//     npx vitest run --config typescript/test/css-equivalence/vitest.config.ts
//
// It narrows nothing — the include glob collects every `*.test.ts` under `test/css-equivalence/**`.
//
// `testTimeout` is generous and DECLARED: the graduated differential executes 26,551 distinct
// sources × 3 realized entries × (1 oracle + 2 lowerings), which is the whole point of the
// graduation, and a suite that timed out on the real corpus would have silently become a pilot
// again. The W51 lesson (a shared runner is slower than a laptop) is folded in rather than
// rediscovered.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: path.resolve(HERE, "../.."),
    test: {
        include: ["test/css-equivalence/**/*.test.ts"],
        pool: "forks",
        isolate: true,
        testTimeout: 900_000,
        hookTimeout: 900_000,
    },
});
