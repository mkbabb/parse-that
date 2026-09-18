// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — the config this seat's suites run under.
//
// WHY THIS FILE EXISTS, stated rather than assumed. `W3.md` §6 G-6's literal command is
// `npx vitest run test/css-totality/spec-conformance.test.ts`. Run against the workspace config it
// collects ZERO files: `typescript/vitest.config.ts:5` scopes `include` to `test/*.test.ts` — one
// directory level — and a Vitest CLI positional is a FILTER over the collected set, not an
// addition to it. Widening that glob would be a write to `typescript/vitest.config.ts`, which is in
// no row of `W3.md` §4 and would therefore be a §3a File-bound expansion; `test/css-totality/**` is
// this seat's own create row, so the minimal lawful cure is a config inside it:
//
//   npx vitest run --config typescript/test/css-totality/vitest.config.ts
//
// Recorded in `X-P-W3.md` as finding F-a.3 with the literal command's own reading beside it. This
// is a bounds reconciliation, not a spec patch (E-3), and it narrows nothing: the config collects
// every `*.test.ts` under this directory, so a suite added here cannot escape the gate.

import { defineConfig } from "vitest/config";

export default defineConfig({
    root: new URL("../..", import.meta.url).pathname,
    test: {
        include: ["test/css-totality/**/*.test.ts"],
        pool: "forks",
        testTimeout: 60_000,
        hookTimeout: 60_000,
    },
});
