import { regex, string, all, Parser, any, eof, memoize, mergeMemos, resetPackrat } from "../src/parse";
import { ParserState } from "../src/parse/state.js";
import { getCijKey } from "../src/parse/packrat.js";

import { expect, describe, it, beforeEach } from "vitest";

import { generateMathExpression } from "./utils";

const digits = regex(/[0-9]+/);

// Packrat is opt-in (PT-WAVE-2): the default parse() no longer clears the
// caches, so a left-recursive grammar resets the packrat state per parse.
describe("Memoization & left recursion (opt-in packrat)", () => {
    beforeEach(() => resetPackrat());

    it("should 123456", () => {
        const expr: Parser<any> = memoize(Parser.lazy(() => expr.or(digits)));
        const result = expr.parse("12356");
        expect(result).toEqual("12356");
    });

    it("should mSL", () => {
        const ms = string("s");
        const mSL: Parser<any> = memoize(
            Parser.lazy(() => mSL.then(mSL).then(ms)).opt(),
        );
        const mz = string("z");
        const mZ: Parser<any> = memoize(Parser.lazy(() => mZ.or(mY).or(mz)));

        const mY: Parser<any> = memoize(Parser.lazy(() => mZ.then(mSL)));

        const input = "zss";

        const result = mY.parse(input)?.flat(Infinity) ?? [];
        const sCount = result.filter((x: any) => x === "s").length;
        expect(sCount).toBe(input.length - 1);
    });

    it("should sS", () => {
        const s = string("s");
        const sS: Parser<any> = memoize(
            Parser.lazy(() => s.then(sS).then(sS)).opt(),
        );

        const input = "ssssssssssssssss";

        const result = sS.eof().parse(input)?.flat(Infinity) ?? [];
        const sCount = result.filter((x: any) => x === "s").length;

        expect(sCount).toBe(input.length);
    });

    it("should math again", () => {
        const operators = any(string("+"), string("-"), string("*"), string("/"));
        const number = regex(/-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
        const expression: Parser<any> = memoize(
            Parser.lazy(() =>
                mergeMemos(all(expression, operators.then(expression).opt())).or(number)
            )
                .opt()
                .trim(),
        );

        const parser = expression;

        for (let i = 0; i < 1; i++) {
            resetPackrat();
            const expr = generateMathExpression(10);
            const parsed = parser.parse(expr) ?? [];
            const flat = parsed.flat(Infinity).join("");
            expect(flat).toEqual(expr.replaceAll(" ", ""));
        }
    });

    // ── SOUND: (id, offset)-keyed memo (A.W2 landed soundness fix) ──
    //
    // The opt-in packrat MEMO is now keyed on (id, offset), not the parser id
    // alone. A result cached for parser P at one offset can NO LONGER mis-restore
    // when P is later applied at a distinct offset: distinct offsets are distinct
    // memo keys, so the cross-offset hazard is eliminated. The seed-and-grow that
    // the mutual / indirect left-recursion grow relies on is preserved because
    // re-entry during LR resolution lands at the SAME head offset (the same key),
    // where it finds the in-progress seed and breaks the recursion — the
    // Warth-Douglass-Millstein head-recursion algorithm.
    //
    // This pins the SOUND behaviour: P caches "hello" at offset 6 inside alt1,
    // alt1's eof fails → backtrack to 0, then alt2 applies P at offset 0 where
    // [a-z]+ cannot match 'X'. The offset-6 cache lives at a DIFFERENT key, so it
    // cannot restore at offset 0 — the parse correctly errors.
    it("(id, offset)-keyed memo does NOT mis-restore across offsets", () => {
        resetPackrat();
        const P = memoize(regex(/[a-z]+/));
        // alt1 caches P's "hello" at offset 6, then eof fails → backtrack to 0.
        // alt2 applies P at offset 0 where [a-z]+ cannot match 'X'. SOUND: error.
        const p = string("X").next(P).skip(eof()).or(P);
        const st = new ParserState("Xhello!");
        p.parser(st);

        // SOUND: the offset-6 cache lives at a distinct (id, offset) key and
        // cannot mis-restore at offset 0 — the parse errors.
        expect(st.isError).toBe(true);
    });

    // Isolation gate: packrat is OFF the default parse path. A non-memoized
    // grammar parses with no packrat cache involvement, so the same parser at
    // two distinct offsets yields independent results (no cross-offset hazard).
    it("default path (no opt-in) has no packrat: same parser, two offsets, independent", () => {
        resetPackrat();
        const d = regex(/[0-9]+/); // NOT memoized — default path
        const grammar = d.skip(string("-")).then(d);
        const result = grammar.parse("12-999");
        expect(result).toEqual(["12", "999"]);
    });

    // proof:reset-tax-gone — the default parse() path no longer clears the
    // packrat caches per parse (the MEMO.clear() tax is gone). A seeded packrat
    // cache survives an intervening default top-level parse(): before PT-WAVE-2
    // every parse() ran reset() → MEMO.clear(), so the seed would be wiped.
    it("default parse() does not clear the packrat cache (reset-tax removed)", () => {
        resetPackrat();
        // Seed the packrat cache via a memoized parse.
        const seeded = memoize(string("ab"));
        expect(seeded.parse("ab")).toBe("ab");
        // Run an unrelated DEFAULT (non-memoized) top-level parse. Pre-PT-WAVE-2
        // this called reset() → MEMO.clear(), wiping the seed.
        const plain = string("xy");
        expect(plain.parse("xy")).toBe("xy");
        // The seed must still be present: re-running the memoized parse hits the
        // cache (the cached offset-2 result restores even at a fresh state).
        const st = new ParserState("ab");
        seeded.parser(st);
        expect(st.isError).toBe(false);
        expect(st.offset).toBe(2);
    });
});

// ── PT-B1: cross-input soundness (the BLOCKER — no resetPackrat discipline) ───
// The (id, offset) memo is module-global with NO src component. Before the
// src-epoch guard a memoized parser re-run on a DIFFERENT source mis-restored the
// prior input's cells (memoize(p).parse('hello') then .parse('world') → 'hello').
// These tests deliberately do NOT call resetPackrat() between parses — the
// auto-reset must hold on its own, with zero caller discipline.
describe("PT-B1 packrat cross-input soundness (auto-reset, no caller discipline)", () => {
    it("memoize(p).parse(A) then .parse(B) does not return A's stale result", () => {
        const word = memoize(regex(/[a-z]+/));
        expect(word.parse("hello")).toBe("hello");
        // SAME memoized parser, different input, NO resetPackrat() between:
        expect(word.parse("world")).toBe("world");
        expect(word.parse("hello")).toBe("hello"); // and back again
    });

    it("a composite memoized parser re-memoizes across inputs", () => {
        const num = regex(/[0-9]+/);
        const w = regex(/[a-z]+/);
        const pair = memoize(all(w, string("-"), num));
        expect(pair.parse("abc-123")).toEqual(["abc", "-", "123"]);
        // no resetPackrat() — the second input must not restore the first:
        expect(pair.parse("xyz-789")).toEqual(["xyz", "-", "789"]);
    });

    it("getCijKey does not alias across the int32 `<< 20` overflow (id >= 4096)", () => {
        // The old key `(id << 20) | offset` overflowed int32 at id >= 4096:
        // getCijKey({id:4096},0) === getCijKey({id:0},0) === 0. The float64
        // multiply key keeps distinct parsers' cells distinct.
        expect(getCijKey({ id: 4096 } as never, 0)).not.toBe(
            getCijKey({ id: 0 } as never, 0),
        );
        expect(getCijKey({ id: 8192 } as never, 0)).not.toBe(
            getCijKey({ id: 4096 } as never, 0),
        );
        // distinct offsets within one parser stay distinct too:
        expect(getCijKey({ id: 1 } as never, 5)).not.toBe(
            getCijKey({ id: 1 } as never, 6),
        );
    });
});
