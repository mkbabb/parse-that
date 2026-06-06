import { Parser } from "./parser.js";
import type { ParserFunction } from "./parser.js";
import { createParserContext } from "./state.js";
import type { ParserState } from "./state.js";

// ── Opt-in packrat memoization + bounded left-recursion ──────
//
// This is the count-bounded seed-grow packrat tier. It is OFF the default parse
// path: non-backtracking LL(1)-ish grammars (CSS values, JSON, CSV) do not need
// it, and the Rust port — the project's SOTA-performance artifact — omits
// left-recursion / packrat entirely. The default parse() no longer pays a
// per-parse MEMO.clear() tax; a left-recursive grammar opts in by wrapping its
// recursive parser with memoize() / mergeMemos() and resetting the caches per
// parse via resetPackrat().
//
// KNOWN LIMITATION (recorded, NOT on the default path): the MEMO is keyed on the
// parser id only, not (id, offset). This is the seed-sharing mechanism the
// mutual/indirect left-recursion grow relies on — and it is latently unsound for
// the *non-recursive* same-parser-at-two-offsets case (see memoize.test.ts
// "id-only memo is unsound across offsets"). The sound replacement is the full
// Warth-Douglass-Millstein head-recursion algorithm keyed on (id, offset); that
// is a from-scratch reimplementation with real correctness blast radius on a
// tier with zero production consumers, BOOKED as a dedicated packrat-soundness
// tranche rather than bolted on here. Isolating the tier off the default path
// already removes the unsoundness (and the reset tax) from every non-recursive
// parse — only an explicit memoize() opt-in is exposed to it.

const MEMO = new Map<number, ParserState<unknown>>();
const LEFT_RECURSION_COUNTS = new Map<number, number>();

// Numeric LR-count key: eliminates string allocation per lookup.
// Max offset 2^20 (~1M chars) allows parser IDs up to 2^11 = 2048.
const MEMO_OFFSET_BITS = 20;
const MEMO_MAX_OFFSET = (1 << MEMO_OFFSET_BITS) - 1;

function getCijKey(parser: Parser<unknown>, state: ParserState<unknown>): number {
    return (parser.id << MEMO_OFFSET_BITS) | (state.offset & MEMO_MAX_OFFSET);
}

function atLeftRecursionLimit(parser: Parser<unknown>, state: ParserState<unknown>): boolean {
    const cij = LEFT_RECURSION_COUNTS.get(getCijKey(parser, state)) ?? 0;
    return cij > state.src.length - state.offset;
}

/** Clear the packrat caches. Call once before a top-level parse of a
 *  left-recursive grammar (the default parse() path does NOT do this). */
export function resetPackrat(): void {
    MEMO.clear();
    LEFT_RECURSION_COUNTS.clear();
}

/**
 * Packrat memoize with count-bounded left-recursion (seed-and-grow).
 */
export function memoize<T>(parser: Parser<T>): Parser<T> {
    const p = parser as Parser<unknown>;
    const memoizeFn = (state: ParserState<T>) => {
        const cijKey = getCijKey(p, state as ParserState<unknown>);
        const cij = LEFT_RECURSION_COUNTS.get(cijKey) ?? 0;

        const cached = MEMO.get(p.id) as ParserState<T> | undefined;

        if (cached && cached.offset >= state.offset) {
            state.offset = cached.offset;
            state.value = cached.value;
            state.isError = cached.isError;
            return state;
        } else if (atLeftRecursionLimit(p, state as ParserState<unknown>)) {
            state.isError = true;
            return state;
        }

        LEFT_RECURSION_COUNTS.set(cijKey, cij + 1);
        parser.parser(state);

        const cachedAfter = MEMO.get(p.id) as ParserState<T> | undefined;

        if (cachedAfter && cachedAfter.offset > state.offset) {
            state.offset = cachedAfter.offset;
        } else if (!cachedAfter) {
            // Clone before storing so the cache is immutable.
            MEMO.set(p.id, state.clone() as ParserState<unknown>);
        }

        return state;
    };
    return new Parser(
        memoizeFn as ParserFunction<T>,
        createParserContext("memoize", p),
    );
}

/**
 * Companion to memoize() for left-factored alternation.
 */
export function mergeMemos<T>(parser: Parser<T>): Parser<T> {
    const p = parser as Parser<unknown>;
    const mergeMemoFn = (state: ParserState<T>) => {
        const cached = MEMO.get(p.id) as ParserState<T> | undefined;
        if (cached) {
            state.offset = cached.offset;
            state.value = cached.value;
            state.isError = cached.isError;
            return state;
        } else if (atLeftRecursionLimit(p, state as ParserState<unknown>)) {
            state.isError = true;
            return state;
        }

        parser.parser(state);

        const cachedAfter = MEMO.get(p.id) as ParserState<T> | undefined;
        if (!cachedAfter) {
            MEMO.set(p.id, state.clone() as ParserState<unknown>);
        }
        return state;
    };

    return new Parser(
        mergeMemoFn as ParserFunction<T>,
        createParserContext("mergeMemo", p),
    );
}
