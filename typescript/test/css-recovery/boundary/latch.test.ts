// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.c — G-9's LATCH LEG: THE PACKRAT ARM-STATE, READABLE AND RESETTABLE.
//
//   npx vitest run --config typescript/test/css-recovery/boundary/vitest.config.ts test/css-recovery/boundary/latch.test.ts
//
// `W3.md` §6 G-9's command: "the latch suite arms, measures, resets, and asserts the arm-state
// readback returns to false within one process", and its falsifier: "the latch leg fails if the
// arm-state cannot be observed and restored within one process".
//
// THE RED BASELINE, O-15 **PT-03**: `PACKRAT_ARMED` is a ONE-WAY LATCH — `:678` false, `:722` true,
// read at `:682`/`:714`, **no assignment back to false anywhere in the bundle**; UNARMED 93.9
// ns/parse → ARMED 138.2 = 1.47×, and `resetPackrat()` leaves it at 139.3, i.e. it clears the memo
// store and does not disarm.
//
// RE-MEASURED AT THIS ROOT'S OWN BYTES by this seat, and the defect reproduces exactly:
//
//     typescript/src/parse/packrat.ts:158   let PACKRAT_ARMED = false;
//     typescript/src/parse/packrat.ts:224   if (!PACKRAT_ARMED) return null;     ← packratEnter, the reader
//     typescript/src/parse/packrat.ts:273   if (!PACKRAT_ARMED) return;          ← resetPackrat, the early out
//     typescript/src/parse/packrat.ts:297   PACKRAT_ARMED = true;                ← makeMemoized, the one-way arm
//
// THIS FILE CARRIES ONE BORN-RED ASSERTION, ON PURPOSE. L-3 below is the "resettable" half and it
// FAILS, because `resetPackrat()` clears MEMO/HEADS/GROWING and leaves the latch armed. The cure is
// a write in `typescript/src/parse/packrat.ts`, which is in **no row** of `W3.md` §4 (it admits
// `typescript/src/css/**`) and which X.P.W3.0's dated §4 addendum §A-3 deliberately declines to
// admit. A write there is a §3a **File-bound expansion**, which halts rather than proceeds — so the
// leg is returned RED with its measurement, exactly as `.b` returned G-4's two inherited fallback
// arms, rather than being silenced with `test.skip`, an allowlist, or a re-export that pretends to
// disarm. See this seat's receipt (`X-P-W3.md`, X.P.W3.c, ESC-c1).
//
// The escalation is not only a bounds question. The library's own comment at `packrat.ts:147-152`
// argues the latch MUST NOT disarm while a memoizer exists — "a memoized parser, once built, could
// be invoked at any later parse … so from the moment any memoizer exists the epoch machinery must
// run for cross-input + re-entrancy soundness (PT-B1 / PT-Q1)". So the naive one-line cure is a
// SOUNDNESS REGRESSION, and the real cure is a symmetric arm-state (a live-memoizer count, or an
// explicit disarm that is lawful only when none exists). That is an architecture question for the
// library, which is exactly the class §3a routes away from a local edit.

import { describe, expect, it } from "vitest";

import {
    PACKRAT_LATCH_SITES,
    armPackratArmState,
    measurePackratLatch,
    readPackratArmState,
    resetPackratArmState,
} from "../../../src/css/bounds.mjs";

/* ── L-4 · the candidate never arms it — static and dynamic, before anything below arms ────── */
//
// ONE MEASUREMENT DECIDES WHAT EVERY READING IN THIS FILE MEANS, so it is stated first rather than
// discovered: **`tsImport` does not dedupe.** Two calls with the same specifier and the same parent
// yield two module namespaces with two distinct `PACKRAT_ARMED` bindings — measured by this seat:
//
//     ⟨cmd⟩ const a = await tsImport("../parse/packrat.ts", base), b = await tsImport(same)
//           a === b                         → false
//           a.resetPackrat === b.resetPackrat → false
//
// `js-alg.mjs:48` loads the library with its own `tsImport`, so THE LOWERINGS' LATCH IS NOT THE
// INSTRUMENT'S LATCH, and the library exports no reader (`src/parse/index.ts` re-exports
// `resetPackrat` and nothing else). The parse path's arm-state is therefore reachable from no
// module in this seat's bounds — a second, independent reason the latch leg cannot close here, and
// part of ESC-c1 rather than around it. What IS provable is stated below and nothing more.

describe("L-4 — the candidate's parse path constructs no memoizer", () => {
    it("exactly ONE `memoize(` / `mergeMemos(` site under src/css: the declared instrument", async () => {
        const { readdirSync, readFileSync, statSync } = await import("node:fs");
        const path = await import("node:path");
        const { fileURLToPath } = await import("node:url");
        const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../src/css");

        const walk = (dir: string): string[] =>
            readdirSync(dir).flatMap((name: string) => {
                const full = path.join(dir, name);
                return statSync(full).isDirectory() ? walk(full) : [full];
            });

        const sites: string[] = [];
        for (const file of walk(ROOT).filter((f) => f.endsWith(".mjs") || f.endsWith(".js"))) {
            const lines = readFileSync(file, "utf8").split("\n");
            lines.forEach((line: string, i: number) => {
                // Comment-aware: a prose line quoting the call is not a call site. (`.b`'s rule —
                // an inspection that cannot tell the difference fails for a reason not its own.)
                const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, "");
                if (/\b(memoize|mergeMemos)\s*\(/.test(code)) sites.push(`${path.relative(ROOT, file)}:${i + 1}`);
            });
        }
        // Printed in the assertion so a reader can refute it at the bytes rather than trust a
        // count. The FILE is asserted exactly and the line is printed rather than pinned: a line
        // number that reddens this leg because a comment above it grew would fail for a reason that
        // is not its own, and a second site anywhere — including a second one in `bounds.mjs` —
        // still fails, because the list must have exactly one element.
        expect({ sites }).toMatchObject({ sites: [expect.stringMatching(/^bounds\.mjs:\d+$/)] });
        expect(sites).toHaveLength(1);
    });

    it("the PUBLIC ENTRY module names no part of the arming surface, so no entry can reach it", async () => {
        const { readFileSync } = await import("node:fs");
        const path = await import("node:path");
        const { fileURLToPath } = await import("node:url");
        const entry = readFileSync(
            path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../src/css/entry.mjs"),
            "utf8",
        );
        const code = entry
            .split("\n")
            .filter((line: string) => !/^\s*(\/\/|\*|\/\*)/.test(line))
            .join("\n");
        expect(code.match(/\b(memoize|mergeMemos|armPackratArmState)\b/g) ?? []).toEqual([]);
    });

    it("parsing does not arm the instrument's latch — read before anything in this file arms it", async () => {
        const { loadPublicSurfaces } = await import("../../../src/css/entry.mjs");
        const surfaces = await loadPublicSurfaces();
        for (const src of ["oklch(0.7 0.1 30)", "oklch()", "cubic-bezier(0,0,1,1)", "a{color:red}", "var(((())))"]) {
            (surfaces.js as unknown as { parseCssColor: (s: string) => unknown }).parseCssColor(src);
            (surfaces.wasm as unknown as { parseCssColor: (s: string) => unknown }).parseCssColor(src);
        }
        await expect(readPackratArmState()).resolves.toBe(false);
    });
});

/* ── L-1 … L-3 · arm, measure, reset, read back — in one process, in this order ─────────────── */

describe("the arm-state, within one process", () => {
    it("L-1 READABLE — the arm-state can be observed, and reads false before anything arms it", async () => {
        expect(PACKRAT_LATCH_SITES.module).toBe("typescript/src/parse/packrat.ts");
        await expect(readPackratArmState()).resolves.toBe(false);
    });

    it("L-2 ARMS — constructing a memoizer sets it, so the reader is not stuck on one value", async () => {
        await expect(armPackratArmState()).resolves.toBe(true);
        await expect(readPackratArmState()).resolves.toBe(true);
    });

    it("L-3 RESETTABLE — resetPackrat() must DISARM, not merely clear the memo store", async () => {
        const after = await resetPackratArmState();
        expect(
            after,
            "BORN-RED (O-15 PT-03, reproduced at typescript/src/parse/packrat.ts:273/297): resetPackrat() " +
                "clears MEMO/HEADS/GROWING and returns early while PACKRAT_ARMED stays true — the latch is " +
                "one-way. The cure is a write in typescript/src/parse/packrat.ts, which is in no row of W3.md " +
                "§4 and which X.P.W3.0's dated §4 addendum §A-3 declines to admit; a write there is a §3a " +
                "File-bound expansion, and the library's own comment at :147-152 makes the naive one-line " +
                "disarm a cross-input/re-entrancy soundness regression. Returned as ESC-c1, not worked around.",
        ).toBe(false);
    });

    it("the whole reading, published as one record", async () => {
        const reading = await measurePackratLatch();
        expect(reading.readable).toBe(true);
        expect(reading.armed).toBe(true);
        expect(reading.sites).toEqual(PACKRAT_LATCH_SITES);
        // `symmetric` is the gate's own conjunct. It is asserted, and it is the same RED as L-3 —
        // recorded twice on purpose: once as the leg, once as the record `.e` reads.
        expect(reading.symmetric).toBe(true);
    });
});
