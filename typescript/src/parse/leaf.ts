import { Parser } from "./parser.js";
import type { ParserFunction } from "./parser.js";
import type { ParserState, ParserContext, Span } from "./state.js";
import { createParserContext } from "./state.js";
import { mergeErrorState } from "./utils.js";

function makeParser<T>(parser: ParserFunction<T>, context?: ParserContext): Parser<T> {
    return new Parser(parser, context);
}

export function eof<T>() {
    const eof = (state: ParserState<T>) => {
        if (state.offset >= state.src.length) {
            return state.ok(undefined);
        } else {
            mergeErrorState(state as ParserState<unknown>, "<end of input>");
            state.isError = true;
            return state;
        }
    };
    return makeParser(
        eof,
        createParserContext("eof", undefined),
    ) as Parser<unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function any<T extends Array<Parser<any>>>(...parsers: T) {
    type Result = T[number] extends Parser<infer V> ? V : never;
    const n = parsers.length;

    // PT-B3 fusion (semantics-preserving): indexed `for` (no `for…of` iterator
    // object), monomorphic over the static parser list. Each arm restores
    // `savedOffset` + clears the error before the next trial — the EXACT
    // sequential-trial backtracking of the original. The arity-2 arm is fully
    // unrolled (the dominant `or`-style 2-way alternation) so V8 sees two
    // constant-bound positional trials with no array load in the hot path.
    let anyParser: ParserFunction<Result>;
    if (n === 2) {
        const p0 = parsers[0];
        const p1 = parsers[1];
        anyParser = ((state: ParserState<Result>) => {
            const savedOffset = state.offset;
            p0.parser(state as ParserState<unknown>);
            if (!state.isError) return state;
            state.offset = savedOffset;
            state.isError = false;

            p1.parser(state as ParserState<unknown>);
            if (!state.isError) return state;
            state.offset = savedOffset;
            state.isError = false;

            mergeErrorState(state as ParserState<unknown>);
            state.isError = true;
            return state;
        }) as ParserFunction<Result>;
    } else {
        anyParser = ((state: ParserState<Result>) => {
            const savedOffset = state.offset;
            for (let i = 0; i < n; i++) {
                parsers[i].parser(state as ParserState<unknown>);
                if (!state.isError) {
                    return state;
                }
                state.offset = savedOffset;
                state.isError = false;
            }
            mergeErrorState(state as ParserState<unknown>);
            state.isError = true;
            return state;
        }) as ParserFunction<Result>;
    }

    return makeParser(
        n === 1 ? parsers[0].parser : anyParser,
        createParserContext("any", undefined, ...parsers),
    ) as Parser<Result>;
}

/**
 * O(1) first-character dispatch for alternation.
 * Maps ASCII characters to parsers for instant lookup instead of
 * sequential trial-and-error like any().
 *
 * @param table - Maps characters (or char ranges) to parsers.
 *   Keys can be single chars ("a"), ranges ("0-9"), or multi-char ("tf" = 't' or 'f").
 *
 * PT-Q5 RETRACT note: a speculative 2nd-byte `subTable` widening shipped in
 * 0.12.0 to flatten the residual megamorphism of a deep first-char bucket
 * (value.js's `c`-bucket: calc/clamp/cos/conic/cubic). It had ZERO production
 * consumers — value.js's only `dispatch()` calls pass NO subTable — so the
 * widening was a no-consumer perf seam gated against a SYNTHETIC corpus no
 * consumer runs. Per the terminal-or-KILL disposition it is RETRACTED in 0.13.0:
 * the seam is a localized revert (no consumer passed the 2nd arg, so removing it
 * breaks no published contract). If value.js's coordinated Q session measures an
 * on-path win, the widening is re-introduced as the CONSUME upgrade with the perf
 * gate re-anchored to value.js's real `c`-bucket grammar — not before.
 */
export function dispatch<T>(table: Record<string, Parser<T>>) {
    const tbl = new Int8Array(128).fill(-1);
    const parsers: Parser<T>[] = [];

    const internParser = (parser: Parser<T>): number => {
        let idx = parsers.indexOf(parser);
        if (idx === -1) {
            idx = parsers.length;
            parsers.push(parser);
        }
        return idx;
    };

    for (const [chars, parser] of Object.entries(table)) {
        const idx = internParser(parser);
        // Support "0-9" range syntax
        if (chars.length === 3 && chars[1] === '-') {
            const lo = chars.charCodeAt(0);
            const hi = chars.charCodeAt(2);
            for (let c = lo; c <= hi; c++) tbl[c] = idx;
        } else {
            for (let i = 0; i < chars.length; i++) {
                tbl[chars.charCodeAt(i)] = idx;
            }
        }
    }

    // Pre-compute label at construction time
    const labelChars = Object.keys(table).map(k => {
        if (k.length === 3 && k[1] === '-') return `'${k[0]}'-'${k[2]}'`;
        return [...k].map(c => `'${c}'`).join(", ");
    }).join(", ");
    const label = `one of [${labelChars}]`;

    const dispatchParser = (state: ParserState<T>) => {
        const off = state.offset;
        const ch = state.src.charCodeAt(off);
        const idx = ch < 128 ? tbl[ch] : -1;

        if (idx >= 0) {
            return parsers[idx].parser(state);
        }
        mergeErrorState(state as ParserState<unknown>, label);
        state.isError = true;
        return state;
    };

    return makeParser(
        dispatchParser as ParserFunction<T>,
        createParserContext("dispatch", undefined, ...parsers),
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function all<T extends Array<Parser<any>>>(...parsers: T) {
    type ExtractValue<T extends ReadonlyArray<Parser<unknown>>> = {
        [K in keyof T]: T[K] extends Parser<infer V> ? V : never;
    };
    type Result = ExtractValue<T>;

    return makeParser(
        parsers.length === 1 ? parsers[0].parser : fuseAll<Result>(parsers),
        createParserContext("all", undefined, ...parsers),
    ) as Parser<Result>;
}

/**
 * PT-B3 fusion (semantics-preserving): build the monomorphic sequencing
 * closure for a static parser list. ONE result array per call (the deliverable),
 * grown by index — NO per-element `push`-growth realloc, NO `for…of` iterator
 * object, and the EXACT drop-`undefined` + backtracking/offset-restore semantics
 * of the original `all()`. Arity-2 / arity-3 are fully unrolled into positional
 * closures (the value.js hot shapes — 59 `all()` sites) so V8 sees a monomorphic
 * call site with constant-folded parser bindings; the general arm threads by
 * index. The fused closure threads state by position and never allocates an
 * intermediate tuple (the unfused `a.then(b).then(c)` builds N−1 nested 2-tuples;
 * the fused list builds exactly one flat array).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fuseAll<Result = unknown[]>(parsers: Array<Parser<any>>): ParserFunction<Result> {
    const n = parsers.length;

    // Arity-2: fully unrolled, two positional bindings, no array indexing.
    if (n === 2) {
        const p0 = parsers[0];
        const p1 = parsers[1];
        return ((state: ParserState<Result>): ParserState<Result> => {
            const savedOffset = state.offset;
            // one result array — the deliverable, sized to the max (2); trimmed
            // to the live count when an arm yields `undefined`.
            let w = 0;
            const out: unknown[] = [undefined, undefined];

            p0.parser(state as ParserState<unknown>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            if (state.value !== undefined) out[w++] = state.value;

            p1.parser(state as ParserState<unknown>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            if (state.value !== undefined) out[w++] = state.value;

            if (w !== 2) out.length = w;
            return state.ok(out) as ParserState<Result>;
        }) as ParserFunction<Result>;
    }

    // Arity-3: the hottest value.js shape (calc/rgb/hsl triples), fully unrolled.
    if (n === 3) {
        const p0 = parsers[0];
        const p1 = parsers[1];
        const p2 = parsers[2];
        return ((state: ParserState<Result>): ParserState<Result> => {
            const savedOffset = state.offset;
            let w = 0;
            const out: unknown[] = [undefined, undefined, undefined];

            p0.parser(state as ParserState<unknown>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            if (state.value !== undefined) out[w++] = state.value;

            p1.parser(state as ParserState<unknown>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            if (state.value !== undefined) out[w++] = state.value;

            p2.parser(state as ParserState<unknown>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            if (state.value !== undefined) out[w++] = state.value;

            if (w !== 3) out.length = w;
            return state.ok(out) as ParserState<Result>;
        }) as ParserFunction<Result>;
    }

    // General arity: ONE pre-sized array, indexed write cursor, classic `for`
    // (no `for…of` iterator). Identical drop-undefined + backtracking.
    return ((state: ParserState<Result>): ParserState<Result> => {
        const savedOffset = state.offset;
        const out: unknown[] = new Array(n);
        let w = 0;

        for (let i = 0; i < n; i++) {
            parsers[i].parser(state as ParserState<unknown>);
            if (state.isError) {
                state.offset = savedOffset;
                state.isError = true;
                return state;
            }
            if (state.value !== undefined) out[w++] = state.value;
        }

        if (w !== n) out.length = w;
        return state.ok(out) as ParserState<Result>;
    }) as ParserFunction<Result>;
}

// Step 2: string() with startsWith + single-char charCodeAt fast path
export function string(str: string) {
    const len = str.length;
    const label = `"${str}"`;

    let stringParser: ParserFunction<string>;

    if (len === 1) {
        const code = str.charCodeAt(0);
        stringParser = ((state: ParserState<string>) => {
            if (state.src.charCodeAt(state.offset) === code) {
                state.offset += 1;
                state.unsafeSetValue(str);
                state.isError = false;
                return state;
            }
            mergeErrorState(state as ParserState<unknown>, label);
            state.isError = true;
            return state;
        }) as ParserFunction<string>;
    } else {
        stringParser = ((state: ParserState<string>) => {
            if (state.src.startsWith(str, state.offset)) {
                state.offset += len;
                state.unsafeSetValue(str);
                state.isError = false;
                return state;
            }
            mergeErrorState(state as ParserState<unknown>, label);
            state.isError = true;
            return state;
        }) as ParserFunction<string>;
    }

    return makeParser(
        stringParser,
        createParserContext("string", undefined, str),
    );
}

// regex() with test()+substring() for zero-alloc default path,
// exec() only when matchFunction needs full RegExpMatchArray.
export function regex(
    r: RegExp,
    matchFunction?: (match: RegExpMatchArray | null) => string | null,
) {
    const flags = r.flags.replace(/y/g, "");
    const sticky = new RegExp(r, flags + "y");
    const hasCustomMatch = matchFunction != null;
    const label = `/${r.source}/${r.flags}`;

    const regexParser = (state: ParserState<string>) => {
        if (state.offset >= state.src.length) {
            state.isError = true;
            return state;
        }

        const savedOffset = state.offset;
        sticky.lastIndex = savedOffset;

        if (hasCustomMatch) {
            // Custom match functions need the full RegExpMatchArray
            const execResult = sticky.exec(state.src);
            const match = matchFunction!(execResult);
            if (match) {
                return state.ok(match, sticky.lastIndex - savedOffset);
            } else if (match === "") {
                return state.ok(undefined);
            }
        } else if (sticky.test(state.src)) {
            // test() advances lastIndex without allocating a RegExpMatchArray.
            // Inline ok() to set offset directly (avoids += arithmetic).
            const end = sticky.lastIndex;
            if (end > savedOffset) {
                state.offset = end;
                state.unsafeSetValue(state.src.substring(savedOffset, end));
                state.isError = false;
                return state;
            }
            // Empty match
            state.unsafeSetValue(undefined);
            state.isError = false;
            return state;
        }

        mergeErrorState(state as ParserState<unknown>, label);
        state.isError = true;
        return state;
    };

    return makeParser(
        regexParser as ParserFunction<string>,
        createParserContext("regex", undefined, r),
    );
}

// Step 5: Inline whitespace trimming with charCode loop + fast-exit
export const trimStateWhitespace = <T>(state: ParserState<T>): ParserState<T> => {
    const src = state.src;
    const len = src.length;
    let offset = state.offset;

    // Fast-exit: most calls hit non-whitespace immediately
    if (offset >= len || src.charCodeAt(offset) > 32) return state;

    while (offset < len) {
        const c = src.charCodeAt(offset);
        // space=32, tab=9, lf=10, vt=11, ff=12, cr=13
        if (c === 32 || (c >= 9 && c <= 13)) {
            offset++;
        } else {
            break;
        }
    }
    state.offset = offset;
    return state;
};

// `whitespace` is initialized from parser.ts after module evaluation to avoid
// constructing Parser instances during circular module initialization.
export let whitespace: ReturnType<typeof regex>;
export function _initWhitespace() {
    whitespace = regex(/\s*/);
    whitespace.context.name = "whitespace";
}
