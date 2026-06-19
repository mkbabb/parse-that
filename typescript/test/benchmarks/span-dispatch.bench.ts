import { bench, describe, type BenchOptions } from "vitest";
import { ParserState, type Span } from "../../src/parse/state.js";
import {
    stringSpan,
    regexSpan,
    altSpan,
    manySpan,
    optSpan,
    takeUntilAnySpan,
    type Parser,
} from "../../src/parse/index.js";
import {
    callSpan,
    stringSpanNode,
    regexSpanNode,
    altSpanNode,
    manySpanNode,
    optSpanNode,
    takeUntilAnyNode,
    type SpanParser,
} from "../../src/parse/span.js";

// ── A.W3 Gate 2 — SpanParser tagged-union dispatch vs closure baseline ──
//
// A representative span-heavy, CSS-value-like token scan: a long stream of
// heterogeneous tokens (idents, numbers, hex colors, strings, punctuation,
// whitespace), scanned as `many( alt(8 distinct span kinds) )`. Both lanes do
// IDENTICAL scan work; the ONLY difference is the dispatch mechanism at the
// alternation hot site:
//
//   • baseline — `altSpan(...)` loops `state.unsafeCall(parser)` over 8
//     distinct closure shapes at ONE call site. >4 targets is V8's megamorphic
//     IC threshold (perf-optimization-ts.md §5 documents the structural
//     ceiling of the closure pattern).
//   • tagged — the same 8 alternatives are `SpanParser` data nodes inside an
//     `Alt`; `callSpan()` dispatches each by a dense numeric `kind` through one
//     monomorphic recursive switch (future-research.md §7).
//
// MEASURE-FIRST / HONEST: the printed delta is whatever was actually observed.
// The §7 hypothesis is 10–20% in the tagged lane's favour; this bench reports
// the REAL number on the V8/TS implementation either way (observable-truth: a
// real 4% beats a fabricated 10%).

// ── Input: a representative CSS-value-like token stream ──────
function makeInput(tokenCount: number): string {
    const tokens = [
        "translateX",
        "120px",
        "#ff8800",
        '"label"',
        "16.5",
        "rgba",
        "auto",
        "-42",
        "#abc",
        "calc",
        "1fr",
        "url",
    ];
    const seps = [" ", ", ", " + ", " ", "  "];
    const parts: string[] = [];
    for (let i = 0; i < tokenCount; i++) {
        parts.push(tokens[i % tokens.length]!);
        parts.push(seps[i % seps.length]!);
    }
    return parts.join("");
}

const INPUT = makeInput(6000);

// Eight distinct token recognizers (the alternation members). The leading
// literal/regex members FAIL on most tokens — each failure is one trip through
// the alternation's dispatch site — before the matching member is reached, so
// the scan exercises the full 8-arm dispatch repeatedly across the input.
const IDENT = /[a-zA-Z][a-zA-Z0-9_-]*/;
const NUMBER = /-?[0-9]+(?:\.[0-9]+)?(?:px|fr|em|%)?/;
const HEX = /#[0-9a-fA-F]+/;
const WS = / +/;
const EXCLUDED = " ,+#\"0123456789";

// ── Baseline: closure-based Parser<Span> alternation ─────────
const altB: Parser<Span> = altSpan(
    stringSpan(", "),
    stringSpan(" + "),
    regexSpan(HEX),
    regexSpan(NUMBER),
    regexSpan(IDENT),
    stringSpan('"label"'),
    takeUntilAnySpan(EXCLUDED),
    regexSpan(WS),
);
const scanB: Parser<Span> = manySpan(optSpan(altB), 1, Infinity);

function runBaseline(src: string): number {
    const state = new ParserState<Span>(src);
    state.unsafeCall(scanB as Parser<unknown>);
    return state.offset;
}

// ── Tagged: the same 8 alternatives as SpanParser nodes ──────
const altT: SpanParser = altSpanNode(
    stringSpanNode(", "),
    stringSpanNode(" + "),
    regexSpanNode(HEX),
    regexSpanNode(NUMBER),
    regexSpanNode(IDENT),
    stringSpanNode('"label"'),
    takeUntilAnyNode(EXCLUDED),
    regexSpanNode(WS),
);
const scanT: SpanParser = manySpanNode(optSpanNode(altT), 1, Infinity);

function runTagged(src: string): number {
    const state = new ParserState<Span>(src);
    callSpan(scanT, state);
    return state.offset;
}

// Sanity: both lanes consume the same prefix (catches an accidental
// divergence between the two grammars — a non-equivalent bench is worthless).
{
    const a = runBaseline(INPUT);
    const b = runTagged(INPUT);
    if (a !== b) {
        // eslint-disable-next-line no-console
        console.error(
            `span-dispatch: lanes disagree (baseline=${a} tagged=${b}) — bench is not measuring equivalent work`,
        );
    }
}

const options: BenchOptions = { warmupIterations: 100, time: 2000 };

describe("SpanParser dispatch — alt-token-scan", () => {
    bench(
        "closure altSpan baseline",
        () => {
            runBaseline(INPUT);
        },
        options,
    );

    bench(
        "tagged SpanParser callSpan",
        () => {
            runTagged(INPUT);
        },
        options,
    );
});
