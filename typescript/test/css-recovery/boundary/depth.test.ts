// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.c — G-9's DEPTH LEG: BOUNDED BY CONSTRUCTION.
//
//   npx vitest run --config typescript/test/css-recovery/boundary/vitest.config.ts test/css-recovery/boundary/depth.test.ts
//
// `W3.md` §6 G-9's command: "the depth suite generates an input at `bound` and at `bound + 1` and
// asserts `ok:false` for both with no thrown error". Its falsifier names two ways to fail:
// "generate an input one level past the declared bound; a `RangeError` fails, and so does a silent
// truncation that returns `ok:true` on a partially consumed input (that is a MIS_ACCEPT and reddens
// G-7 as well)". Both are asserted below, in both directions.
//
// THE RED BASELINE THIS REPLACES, O-15 **PT-04**, measured against the published parse-that:
// `Parser.lazy` arity 1, deepest OK **7,761**, **thrown `RangeError` at 7,762**. The candidate's
// answer is not a bigger stack: it is cand-O debt 3 — "bounded by construction, not by catch". The
// one lazy back-edge (`REF`, `algebra/grammar.mjs:94`) counts `σ.depth` against `Θ.depthBound` and
// raises `css_syntax` with the label `nesting <= 64`, which is an ORDINARY `ok:false`
// (`W3.md` §3 item 6). The 7,761/7,762 coordinate is therefore re-run here as a regression fixture,
// not as a limit: both sides of PT-04's cliff must be a typed rejection.

import { describe, expect, it } from "vitest";

import { CAPACITY_LABELS, DEPTH_BOUND, DEPTH_LABEL, DEPTH_PRODUCTION, INPUT_BOUND, THETA, assertDepthBound, witnessAtDepth } from "../../../src/css/bounds.mjs";
import { promoteLabel } from "../../../src/css/diagnostics.mjs";
import { loadPublicSurfaces } from "../../../src/css/entry.mjs";
import { lowerings } from "../../../src/css/harness-adapter.mjs";

const surfaces = await loadPublicSurfaces();
const KINDS = ["js", "wasm"] as const;

type Result = { ok: boolean; value?: unknown; diagnostics: { code: string; expected: readonly string[] }[] };

describe("the bound is a declared value the mechanism actually carries", () => {
    for (const kind of KINDS) {
        it(`${kind}: Θ.depthBound, the lowering's own theta, and the label all read ${DEPTH_BOUND}`, () => {
            expect(assertDepthBound(lowerings[kind])).toEqual({ kind, depthBound: DEPTH_BOUND, label: DEPTH_LABEL });
            expect(lowerings[kind].theta().depthBound).toBe(THETA.depthBound);
            expect(DEPTH_LABEL).toBe(`nesting <= ${DEPTH_BOUND}`);
            expect(DEPTH_PRODUCTION).toBe("<nesting-depth> (at most 64 levels)");
        });
    }

    it("NEGATIVE CONTROL — a lowering whose Θ disagrees with the declaration HALTS", () => {
        const widened = Object.create(lowerings.js) as typeof lowerings.js & { theta: () => { depthBound: number } };
        widened.theta = () => ({ depthBound: DEPTH_BOUND * 2 });
        expect(() => assertDepthBound(widened)).toThrowError(/Θ.depthBound=128, not 64/);
    });

    it("the witness generator produces exactly the nesting it claims", () => {
        expect(witnessAtDepth(1)).toBe("var()");
        expect(witnessAtDepth(3)).toBe("var((()))");
        const w = witnessAtDepth(DEPTH_BOUND + 1);
        expect(w.startsWith("var(")).toBe(true);
        expect((w.match(/\(/g) ?? []).length).toBe(DEPTH_BOUND + 1);
        expect((w.match(/\)/g) ?? []).length).toBe(DEPTH_BOUND + 1);
    });
});

describe("at the bound and one past it — ok:false both times, no thrown error", () => {
    for (const kind of KINDS) {
        it(`${kind}: depth ${DEPTH_BOUND} (AT the bound) is an ordinary rejection, not a depth rejection`, () => {
            const surface = surfaces[kind] as unknown as { parseCssColor: (s: string) => Result };
            let r: Result | undefined;
            expect(() => {
                r = surface.parseCssColor(witnessAtDepth(DEPTH_BOUND));
            }).not.toThrow();
            expect(r!.ok).toBe(false);
            expect(r!.diagnostics.length).toBeGreaterThan(0);
            // The bound is NOT hit here: `var(…)` is a context colour, so the rejection is the
            // context guard's. This is what makes the next assertion non-vacuous — if the bound
            // fired one level early, this row would carry the depth code instead.
            expect(r!.diagnostics[0].code).toBe("color_context_required");
        });

        it(`${kind}: depth ${DEPTH_BOUND + 1} (ONE PAST the bound) is a typed depth rejection`, () => {
            const surface = surfaces[kind] as unknown as { parseCssColor: (s: string) => Result };
            let r: Result | undefined;
            expect(() => {
                r = surface.parseCssColor(witnessAtDepth(DEPTH_BOUND + 1));
            }).not.toThrow();
            expect(r!.ok).toBe(false);
            expect(r!.diagnostics[0].code).toBe("css_syntax");
            expect(r!.diagnostics[0].expected[0]).toBe(DEPTH_PRODUCTION);
            // The MIS_ACCEPT falsifier: a silent truncation that returned ok:true on a partially
            // consumed input would redden G-7 as well.
            expect("value" in r!).toBe(false);
        });
    }
});

describe("PT-04's own coordinate — 7,761 and 7,762 — is a regression fixture, not a limit", () => {
    for (const kind of KINDS) {
        for (const depth of [7761, 7762]) {
            it(`${kind}: depth ${depth} returns ok:false with the depth code, never a RangeError`, () => {
                const surface = surfaces[kind] as unknown as { parseCssColor: (s: string) => Result };
                let r: Result | undefined;
                expect(() => {
                    r = surface.parseCssColor(witnessAtDepth(depth));
                }).not.toThrow();
                expect(r!.ok).toBe(false);
                expect(r!.diagnostics[0].code).toBe("css_syntax");
                // Re-pinned 2026-09-23 (X.P.W5 Repair 1): PT-04's witness is 15,525 / 15,527 code
                // units, past the DERIVED Θ.input (14,107 since W3.h, DIVERGENCE-LEDGER CAP-1), and
                // the window is checked BEFORE the run — so the typed rejection names the input
                // window, not the depth bound. The depth rejection itself is the block above.
                expect(witnessAtDepth(depth).length).toBeGreaterThan(INPUT_BOUND);
                expect(r!.diagnostics[0].expected[0]).toBe(promoteLabel(CAPACITY_LABELS.input));
            });
        }
    }

    it("js: two orders of magnitude past PT-04's cliff is still a typed rejection", () => {
        const surface = surfaces.js as unknown as { parseCssColor: (s: string) => Result };
        const r = surface.parseCssColor(witnessAtDepth(200_000));
        expect(r.ok).toBe(false);
        expect(r.diagnostics[0].code).toBe("css_syntax");
    });
});

describe("the bound is parametric, not a magic number", () => {
    for (const kind of KINDS) {
        it(`${kind}: a caller-declared Θ of 8 moves the cliff to 8/9, in the same shape`, () => {
            const lowering = lowerings[kind] as { parse: (p: string, s: string, t?: { depthBound: number }) => { ok: boolean; D: { code: string }[] } };
            const atBound = lowering.parse("P:color", witnessAtDepth(8), { depthBound: 8 });
            const pastBound = lowering.parse("P:color", witnessAtDepth(9), { depthBound: 8 });
            expect(atBound.ok).toBe(false);
            expect(atBound.D[0].code).toBe("color_context_required");
            expect(pastBound.ok).toBe(false);
            expect(pastBound.D[0].code).toBe("css_syntax");
        });
    }
});
