// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — G-6: SPEC CONFORMANCE ROWS (the parser-band born-REDs, folded).
//
// `W3.md` §6 G-6 enumerates them (L451-455) and states the falsifier that shapes this file:
// "each row is an INDEPENDENT assertion — a candidate that fixes the clamps and regresses the
// legacy forms fails, and the gate names which row." So every row is its own `it(...)`, named by
// its letter and its input; no row shares a body with another, and no loop hides a failure behind
// a first-failure abort.
//
// THE ROWS ARE NOT TYPED HERE. They are read from `lib/adjudications.mjs`, which reads them off
// `registry/adjudicated/parser-band.md`'s MEASURED table — the same rows the 52-row matrix uses as
// its oracle override. One source, two consumers: a row this suite proves green and the matrix does
// not know about would be exactly the drift the generator exists to prevent.
//
// COUNT, MEASURED AND STATED PLAINLY. `W3.md` §6 G-6 L451-455 enumerates **twelve** named
// assertions — five accept-side (two legacy 4-argument forms, one bit-for-bit spelling equivalence,
// one channel clamp, one alpha clamp) and seven reject-side. The wave record's dispatch row and
// this seat's brief both say "eleven". The spec's own bytes govern (E-3: the record is corrected
// beside, never the spec), so this file lands TWELVE and says so, and the discrepancy is recorded
// as finding F-a.2 in `X-P-W3.md`.

import { describe, expect, it } from "vitest";

import { G6_ROWS } from "./lib/adjudications.mjs";

type Issue = Readonly<{
    code: string;
    start: number;
    end: number;
    expected: readonly string[];
    actual: string | null;
}>;
type ParseResult<T> =
    | { readonly ok: true; readonly value: T; readonly diagnostics: readonly [] }
    | { readonly ok: false; readonly diagnostics: readonly [Issue, ...Issue[]] };
type Color = Readonly<{ space: string; channels: readonly number[]; alpha: number }>;

const candidate = (await import("../../src/css/build/ac1.js")) as unknown as {
    parseCssColor: (source: string) => ParseResult<Color>;
};

/** Every row's first duty: the call returns, it does not throw. A throw is a totality violation. */
const parse = (input: string): ParseResult<Color> => {
    let result: ParseResult<Color> | undefined;
    expect(() => {
        result = candidate.parseCssColor(input);
    }, `parseCssColor(${JSON.stringify(input)}) must not throw`).not.toThrow();
    if (result === undefined) throw new Error("unreachable: no result");
    return result;
};

const row = (id: string) => {
    const found = G6_ROWS.find((r) => r.id === id);
    if (!found) throw new Error(`G-6 row ${id} is not in the adjudication table`);
    return found;
};

describe("G-6 — the twelve spec-conformance rows, each an independent assertion", () => {
    it("the adjudication table carries exactly the twelve rows W3.md §6 G-6 enumerates", () => {
        expect(G6_ROWS.map((r) => r.g6)).toEqual([
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
        ]);
    });

    // ── accept side ─────────────────────────────────────────────────────────

    it("(a) PB-01 `rgba(1, 2, 3, 0.5)` → {rgb,[1,2,3],0.5}", () => {
        const { inputs, expectShape } = row("PB-01");
        const result = parse(inputs[0]!);
        expect(result.ok, `incumbent REJECTS this (P-012); the candidate must accept`).toBe(true);
        expect(result.ok && result.value).toEqual(expectShape);
    });

    it("(b) PB-02 `hsla(120, 50%, 50%, 0.5)` → {hsl,[120,0.5,0.5],0.5}", () => {
        const { inputs, expectShape } = row("PB-02");
        const result = parse(inputs[0]!);
        expect(result.ok, `incumbent REJECTS this (P-015); the candidate must accept`).toBe(true);
        expect(result.ok && result.value).toEqual(expectShape);
    });

    it("(c) PB-03 `hsl(120 50 50)` ≡ `hsl(120 50% 50%)` bit-for-bit", () => {
        const [bare, percent] = row("PB-03").equivalence as [string, string];
        const a = parse(bare);
        const b = parse(percent);
        expect(a.ok).toBe(true);
        expect(b.ok).toBe(true);
        // The incumbent disagrees by 100× between these two spellings (R6). The assertion is
        // EQUALITY OF THE TWO, not equality with a number typed here: a candidate that made both
        // wrong in the same way would still be caught by the shape row below.
        expect(a, "the two spec-identical spellings must parse bit-for-bit alike").toEqual(b);
        expect(a.ok && a.value.channels).toEqual([120, 0.5, 0.5]);
    });

    it("(d) PB-04 `rgb(300 -20 3)` → [255,0,3] (§8.1 clamp)", () => {
        const { inputs, expectShape } = row("PB-04");
        const result = parse(inputs[0]!);
        expect(result.ok).toBe(true);
        expect(result.ok && result.value).toEqual(expectShape);
    });

    it("(e) PB-05 `rgb(1 2 3 / 1.5)` → alpha 1 (§4.2 says clamp, not reject)", () => {
        const { inputs, expectShape } = row("PB-05");
        const result = parse(inputs[0]!);
        expect(result.ok, "the incumbent REJECTS this; §4.2 says clamp").toBe(true);
        expect(result.ok && result.value).toEqual(expectShape);
    });

    // ── reject side: seven inputs the incumbent unsoundly ACCEPTS ───────────

    const rejects = (id: string, letter: string) => {
        const entry = row(id);
        it(`(${letter}) ${id} ${JSON.stringify(entry.inputs[0])} rejects — ${entry.title}`, () => {
            const result = parse(entry.inputs[0]!);
            expect(result.ok, `the incumbent ACCEPTS this; ${entry.specCitation}`).toBe(false);
            // A reject that is not a typed rejection is not a cure: the frozen type demands a
            // non-empty diagnostics tuple, and G-3's falsifier names the empty-array dodge.
            expect(result.ok === false && result.diagnostics.length).toBeGreaterThan(0);
            expect(result.ok === false && typeof result.diagnostics[0]!.code).toBe("string");
        });
    };

    rejects("PB-06", "f");
    rejects("PB-07", "g");
    rejects("PB-08", "h");
    rejects("PB-09", "i");
    rejects("PB-10", "j");
    rejects("PB-11", "k");
    rejects("PB-12", "l");
});
