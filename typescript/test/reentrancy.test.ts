import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    string,
    regex,
    any,
    memoize,
    resetPackrat,
    Parser,
    ParserState,
    enableDiagnostics,
    disableDiagnostics,
} from "../src/parse/index.js";

beforeEach(() => enableDiagnostics());
afterEach(() => disableDiagnostics());

// ═════════════════════════════════════════════════════════════════════════
// PT-WAVE-1 — error/diagnostic state is per-parse (threaded onto ParserState),
// not a module global. The reentrancy hazard: a `.map` callback that itself
// runs a nested top-level `.parse()` must NOT corrupt the outer parse's
// furthest-offset / expected-set tracking.
//
// proof:reentrant-furthest — reds on the old module-global state (the inner
// reset() wipes the outer furthest), greens once state-threaded.
// ═════════════════════════════════════════════════════════════════════════

describe("Reentrant / interleaved parsing (per-parse error state)", () => {
    it("preserves the outer parse's furthest-offset across a nested .parse()", () => {
        // An inner grammar that fails partway, advancing its own furthest
        // offset deep into a distinct input.
        const inner = any(string("aaaa"), string("bbbb"));

        // The outer grammar's first branch advances far (matching "xxxx")
        // then runs a nested inner.parse() in its .map callback before the
        // outer second branch fails. The nested parse must not clobber the
        // outer's furthest tracking.
        const outerHead = string("xxxx").map((v) => {
            // Reentrant nested top-level parse mid-rule.
            inner.parse("zzz");
            return v;
        });
        const outer = outerHead.then(string("YYYY"));

        // "xxxxQ" — outerHead matches "xxxx" (offset 4), the nested parse runs,
        // then `then(string("YYYY"))` fails at offset 4.
        const state = new ParserState("xxxxQ");
        outer.parser(state);

        expect(state.isError).toBe(true);
        // The furthest offset the OUTER parse reached is 4 (after "xxxx",
        // expecting "YYYY"). Under module-global state the nested inner.parse()
        // ran reset() and re-tracked at offset 0, corrupting this to a value
        // derived from "zzz" rather than the outer parse.
        expect(state.furthest).toBe(4);
        expect(state.expected).toContain('"YYYY"');
        // The outer expected-set must not leak the inner grammar's labels.
        expect(state.expected).not.toContain('"aaaa"');
        expect(state.expected).not.toContain('"bbbb"');
    });

    it("two interleaved parses keep independent error state", () => {
        const a = regex(/a+/).skip(string("!"));
        const b = regex(/b+/).skip(string("@"));

        // Run two distinct parses and capture each one's own state — the
        // error fields belong to the state object, not a shared global, so
        // reading one does not depend on which parsed most recently.
        const sa = new ParserState("aaaX");
        a.parser(sa);
        const sb = new ParserState("bbbbbbY");
        b.parser(sb);

        expect(sa.isError).toBe(true);
        expect(sb.isError).toBe(true);
        // Each state reached its own furthest offset.
        expect(sa.furthest).toBe(3); // after "aaa", expecting "!"
        expect(sb.furthest).toBe(6); // after "bbbbbb", expecting "@"
        expect(sa.expected).toContain('"!"');
        expect(sb.expected).toContain('"@"');
        // No cross-contamination.
        expect(sa.expected).not.toContain('"@"');
        expect(sb.expected).not.toContain('"!"');
    });
});

// ═════════════════════════════════════════════════════════════════════════
// PT-Q1 — packrat RE-ENTRANCY soundness (the 0.12.0 SHIPPED DEFECT).
//
// 0.12.0's cross-input fix put the src-epoch reset INSIDE memoizeFn, firing
// per-node whenever `state.src !== CURRENT_SRC`. A memoized LR parser whose `.map`
// runs a NESTED top-level `.parse(differentSrc)` mid-grow then wiped the OUTER
// grow's module-global state → `growLR`'s `MEMO.get(key)!.ans` non-null assertion
// read `undefined` → `TypeError`. The cure (PT-Q1) opens a fresh packrat epoch at
// the parseState ENTRY boundary (packratEnter/packratExit) with try/finally unwind:
// the nested parse runs with its own clean tables and restores the parent's on
// return, so the outer grow resumes against its own un-wiped MEMO.
//
// Born-RED: on the per-node-reset tree the nested-parse clause throws. GREEN once
// the entry-boundary epoch lands → the nested parse returns its own result AND the
// outer grow completes correctly.
// ═════════════════════════════════════════════════════════════════════════

describe("PT-Q1 packrat re-entrancy (nested parse of a different src mid-grow)", () => {
    beforeEach(() => resetPackrat());

    it("a nested memoize().parse(differentSrc) inside a left-recursive grow does NOT throw and returns the correct OUTER result", () => {
        // An INNER memoized grammar, parsed on a DIFFERENT source from inside the
        // outer head's .map — the exact re-entrancy the per-node reset wiped.
        const innerDigits = regex(/[0-9]+/);
        const inner: Parser<string> = memoize(
            Parser.lazy(() => inner.or(innerDigits)),
        );

        let nestedResult: unknown;
        let nestedRuns = 0;

        // A single letter whose `.map` re-enters with inner.parse() on a DISTINCT
        // source (digits) — the nested top-level parse that wiped the outer grow.
        const letter = regex(/[a-z]/).map((c) => {
            nestedRuns++;
            nestedResult = inner.parse("98765");
            return c;
        });

        // An OUTER genuinely-left-recursive memoized grammar that GROWS over the
        // letters: `outer = outer letter | letter`, concatenating each letter.
        // The grow re-evaluates the head, advancing past the seed each pass — the
        // exact mid-grow window where a per-node reset wipes the in-progress cell.
        const outer: Parser<string> = memoize(
            Parser.lazy(() =>
                outer
                    .then(letter)
                    .map(([acc, c]: [string, string]) => acc + c)
                    .or(letter),
            ),
        );

        // On the 0.12.0 per-node-reset tree this throws TypeError; the cure makes
        // it grow to the full OUTER result and the nested parse its OWN result.
        let outerResult: unknown;
        expect(() => {
            outerResult = outer.parse("abcde");
        }).not.toThrow();

        expect(outerResult).toBe("abcde");
        expect(nestedRuns).toBeGreaterThan(0); // the nested parse actually ran
        expect(nestedResult).toBe("98765");
    });

    it("the OUTER parse resumes correctly after the nested parse returns (no cross-input pollution either direction)", () => {
        const innerWord = memoize(regex(/[a-z]+/));

        // Outer memoized over digit-runs; its .map re-parses a LETTER source on a
        // nested memoized parser. After the nested call the outer must complete its
        // own digit parse — neither the inner's cells nor src may leak in.
        const numbers = regex(/[0-9]+/).map((n) => {
            const w = innerWord.parse("hello");
            expect(w).toBe("hello");
            return n;
        });
        const outerNum: Parser<string> = memoize(
            Parser.lazy(() => outerNum.or(numbers)),
        );

        const r = outerNum.parse("4242");
        expect(r).toBe("4242");
        // And the inner parser, run standalone afterwards, is unpolluted by the
        // outer epoch.
        expect(innerWord.parse("world")).toBe("world");
    });
});

// ═════════════════════════════════════════════════════════════════════════
// PT-Q2 — the >1MB offset budget (the SHIPPED DEFECT, same fix-class).
//
// `getCijKey` masked the offset with `& (2^20 − 1)` — 20 bits — so a source ≥ 2^20
// (1,048,576) chars aliased memo cells: getCijKey(1, 2^20+3) === getCijKey(1, 3).
// A >1MB memoized parse then mis-restored cells from offsets 1MB apart. The cure
// widens the budget to a 2^32 span (offset added WHOLE, no mask) so any
// addressable source's offsets stay distinct, with a fail-loud guard at the
// float64-safe ceiling.
// ═════════════════════════════════════════════════════════════════════════

describe("PT-Q2 packrat large-offset (no >1MB memo-cell aliasing)", () => {
    it("getCijKey does not alias offsets 2^20 apart (the old 20-bit-mask defect)", async () => {
        const { getCijKey } = await import("../src/parse/packrat.js");
        const p = { id: 1 } as never;
        // On the 20-bit-mask tree these were EQUAL (both masked to offset 3).
        expect(getCijKey(p, 2 ** 20 + 3)).not.toBe(getCijKey(p, 3));
        // A neighbouring high offset stays distinct from its low alias too.
        expect(getCijKey(p, 2 ** 20)).not.toBe(getCijKey(p, 0));
        // Monotone within a parser across the old boundary.
        expect(getCijKey(p, 2 ** 20 + 1)).toBeGreaterThan(getCijKey(p, 2 ** 20));
    });

    it("memoizing a parse of a >1MB source yields no cross-offset mis-restore", () => {
        resetPackrat();
        // A 1.05M-char source: two distinct tokens 1MB+ apart. With the old mask
        // the second token's memo cell aliased the first's offset; the widened
        // budget keeps them distinct.
        const span = 2 ** 20; // 1,048,576
        const src = "a".repeat(span) + "b" + "a".repeat(8);
        const letter = memoize(regex(/[ab]/));
        const st0 = new ParserState(src);
        st0.offset = 0;
        letter.parser(st0);
        expect(st0.value).toBe("a");
        // Parse at offset `span` (the 'b') — distinct memo cell, distinct value.
        const stB = new ParserState(src);
        stB.offset = span;
        letter.parser(stB);
        expect(stB.value).toBe("b");
    });
});
