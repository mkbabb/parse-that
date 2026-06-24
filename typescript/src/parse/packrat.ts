import { Parser } from "./parser.js";
import type { ParserFunction } from "./parser.js";
import { createParserContext } from "./state.js";
import type { ParserState } from "./state.js";

// ── Opt-in packrat memoization + (id, offset)-keyed left-recursion ───────────
//
// This is the Warth-Douglass-Millstein packrat-with-left-recursion algorithm
// ("Packrat Parsers Can Support Left Recursion", PEPM '08), keyed on
// (id, offset). It is OFF the default parse path: non-backtracking LL(1)-ish
// grammars (CSS values, JSON, CSV) do not need it, and the Rust port — the
// project's SOTA-performance artifact — omits left-recursion / packrat entirely.
// The default parse() pays no per-parse MEMO.clear() tax; a left-recursive
// grammar opts in by wrapping its recursive parser with memoize() / mergeMemos()
// and resetting the caches per parse via resetPackrat().
//
// THE (id, offset) SOUNDNESS FIX. The memo table MEMO is keyed strictly on
// (id, offset) — getCijKey(p, offset). A memoized result for parser P at offset
// O1 lives at a DIFFERENT key from P at offset O2, so a non-recursive reuse of P
// at a later/disjoint offset can NEVER mis-restore the earlier result. This
// closes the id-only hazard, where a P-at-offset-6 result mis-restored for an
// independent P-at-offset-0 because the key ignored position (see
// memoize.test.ts "(id, offset)-keyed memo does NOT mis-restore across
// offsets").
//
// LEFT RECURSION. Soundness alone would forbid the seed-sharing a left-recursive
// grammar needs, so the WDM machinery layers on top of the (id, offset) memo:
//
//   * A memo entry may hold either a finished ParserState OR an in-progress `LR`
//     marker. On re-entry, recall() returns the marker's growing seed and notes
//     (via the LR stack + head records) which rules are "involved" in the
//     recursion at that position.
//   * setupLR / growLR drive the seed-and-grow: the head re-evaluates its body,
//     and while each pass advances strictly past the recorded seed it re-stores
//     the longer result and repeats; a non-advancing pass stops the grow. The
//     involved-set bookkeeping is what lets a head appear MULTIPLE times in its
//     own body (mSL), recurse through OTHER rules (mutual / indirect LR: mZ→mY→
//     mZ), and re-enter at a post-.trim() offset (the math grammar) — each
//     correctly served the seed at the right (id, offset).
//
// MULTI-OCCURRENCE HEAD. A head that names itself MORE THAN ONCE in its own body
// (mSL's `mSL.then(mSL).then(ms)`) needs the SECOND occurrence — reached at a
// later position still inside the head's growing span — to contribute an empty
// (ε) match without spawning an independent sub-head that greedily over-consumes
// the tail. The GROWING table records each head's growing (id, offset) cell
// during its grow phase; recall() serves such an in-span second occurrence a
// non-advancing ε so the rest of the body tiles the remaining input.
//
// Strictly-monotonic seed advance bounds the grow; the involved-set evalSet
// bounds re-evaluation within a grow pass. No count cap is needed.

// OFFSET BUDGET — widened to the full safe-integer headroom (PT-Q2). The memo key
// is the float64 expression `id * MEMO_OFFSET_SPAN + offset`. The offset component
// must NOT alias: two distinct offsets under the same parser id must yield two
// distinct keys, so the span has to exceed any source length we will ever memoize.
//
// The OLD budget was 20 bits (MEMO_OFFSET_SPAN = 2^20 = 1_048_576). That silently
// aliased memo cells for any source ≥ 1MB: `getCijKey(1, 2^20 + 3) === getCijKey(1, 3)`
// because the offset was masked with `& (2^20 - 1)`. A >1MB memoized parse then
// mis-restored cells from offsets exactly 1MB apart — a silent-wrong-answer residual.
//
// The cure: choose the span so that BOTH (a) the offset never aliases for any
// realistic source AND (b) the composite key stays a SAFE integer (≤ 2^53 − 1, the
// float64 mantissa ceiling) for every parser id we mint. JS strings cap at
// 2^53 − 1 chars but practical sources are bounded by the ~512MB-string V8 ceiling
// (< 2^29). A 32-bit span (4_294_967_296) covers any addressable source with margin,
// and leaves the id ~2^21 (≈ 2.1M distinct parser instances) of safe-integer
// headroom (32 + 21 = 53). Parser ids are a process-global counter; 2M instances is
// far beyond any grammar (value.js's CSS grammar mints a few thousand). The offset
// is NO LONGER masked — it is added whole, so it cannot alias below the span.
const MEMO_OFFSET_BITS = 32;
const MEMO_OFFSET_SPAN = 2 ** MEMO_OFFSET_BITS; // 4_294_967_296 — > any addressable source
// Above this id the composite key `id * SPAN + offset` could exceed
// Number.MAX_SAFE_INTEGER and lose precision → silent key collisions. We fail loud
// rather than alias (the PT-Q2 fail-loud arm), so an out-of-budget grammar is a
// throw at memo time, never a wrong answer.
const MEMO_MAX_ID = Math.floor(Number.MAX_SAFE_INTEGER / MEMO_OFFSET_SPAN); // ≈ 2_097_151

export function getCijKey(parser: Parser<unknown>, offset: number): number {
    // FLOAT64-SAFE multiply key. The old `parser.id << MEMO_OFFSET_BITS` was a
    // 32-bit SIGNED shift: at parser.id >= 4096 (2^12) it overflows int32 and
    // aliases — getCijKey(4096, 0) === getCijKey(0, 0) === 0 — silently colliding
    // two distinct parsers' memo cells. Parser.id is a process-global PARSER_ID++,
    // so any non-trivial grammar (value.js's CSS value grammar) routinely exceeds
    // 4096 parser instances. A JS number is a float64: `id * MEMO_OFFSET_SPAN +
    // offset` is EXACT as long as the sum stays ≤ Number.MAX_SAFE_INTEGER (2^53 − 1).
    // With a 2^32 span, that holds for every id ≤ MEMO_MAX_ID (≈ 2.1M) and every
    // offset < 2^32 (any addressable source) — so the offset is added WHOLE (no mask)
    // and cannot alias. A Map keyed on that number is exactly as fast as an int32 key.
    if (parser.id > MEMO_MAX_ID || offset >= MEMO_OFFSET_SPAN) {
        // Fail loud at the boundary rather than silently alias a memo cell. This is
        // unreachable for any realistic grammar/source; it guards the float64
        // mantissa ceiling so a degenerate input can never produce a wrong answer.
        throw new RangeError(
            `packrat memo key out of float64-safe budget: parser.id=${parser.id} ` +
                `(max ${MEMO_MAX_ID}), offset=${offset} (max ${MEMO_OFFSET_SPAN - 1})`,
        );
    }
    return parser.id * MEMO_OFFSET_SPAN + offset;
}

/** A finished parse result snapshot at a memo position. */
interface Answer {
    offset: number;
    value: unknown;
    isError: boolean;
}

/** In-progress left-recursion marker held in a memo cell during evaluation. */
interface LR {
    seed: Answer;
    parser: Parser<unknown>;
    head: Head | undefined;
    next: LR | undefined;
}

/** Head record for the rule heading a left-recursion at a given position. */
interface Head {
    parser: Parser<unknown>;
    involvedSet: Set<number>;
    evalSet: Set<number>;
}

/** A memo cell holds either a finished Answer or an in-progress LR marker. */
interface MemoCell {
    ans: Answer | LR;
}

function isLR(x: Answer | LR): x is LR {
    return (x as LR).parser !== undefined;
}

let MEMO = new Map<number, MemoCell>();
let HEADS = new Map<number, Head>();
let LR_STACK: LR | undefined;

// CROSS-INPUT + RE-ENTRANCY SOUNDNESS — the parseState-entry epoch (PT-Q1).
//
// MEMO/HEADS/GROWING/LR_STACK are module-global and keyed on (id, offset) with NO
// source component. Two soundness hazards arise:
//
//   1. CROSS-INPUT (PT-B1, fixed at 0.12.0): a memoized parser re-run against a
//      DIFFERENT source would mis-restore the previous input's cells —
//      `memoize(p).parse('hello')` then `.parse('world')` returning 'hello'.
//
//   2. RE-ENTRANCY (PT-Q1, the 0.12.0 regression this fixes): the 0.12.0 cure put
//      the reset INSIDE `memoizeFn`, firing per-node whenever `state.src !==
//      CURRENT_SRC`. A memoized parser whose `.map` runs a NESTED top-level
//      `.parse(differentSrc)` mid-grow then wiped the OUTER grow's in-progress
//      cells → `growLR` non-null-asserted a just-deleted cell → `TypeError`.
//
// The cure is a SYNCHRONOUS parse-stack SAVE/RESTORE at the parseState ENTRY
// boundary (`parser.ts` → packratEnter/packratExit). Each top-level `parse()`
// snapshots the current packrat tables (the outer parse's, or empty at depth-0)
// and installs fresh ones; on return it restores the snapshot. A nested
// `parse(differentSrc)` therefore runs with its OWN clean tables (no cross-input
// alias) AND, on return, the outer parse resumes against its own UN-WIPED MEMO
// (re-entrancy sound). The cost is one snapshot per top-level parse — cheaper than
// the per-node reference compare it replaces — and packrat is opt-in / OFF the
// default LL(1) path, so the fast path is untouched.
//
// CURRENT_SRC is retained only as a within-epoch assertion anchor (a single epoch
// owns exactly one src); it is part of the snapshot so a nested epoch's src never
// leaks into the parent's.
let CURRENT_SRC: string | undefined;

// Heads currently in their grow phase, keyed by parser id → the (id, pos) key of
// the growing seed. Used to serve a SECOND occurrence of the head that appears
// inside its own body at a LATER position still within the seed's span (e.g.
// mSL's `mSL.then(mSL)`): such an occurrence restores the seed non-advancingly
// rather than spawning an independent, over-consuming head.
let GROWING = new Map<number, number>();

/** A frozen snapshot of the full module-global packrat state. */
interface PackratEpoch {
    memo: Map<number, MemoCell>;
    heads: Map<number, Head>;
    growing: Map<number, number>;
    lrStack: LR | undefined;
    currentSrc: string | undefined;
}

/**
 * packratEnter — open a fresh packrat epoch at the parseState entry boundary.
 * Returns the OUTER epoch's snapshot, which the caller hands back to
 * packratExit() to restore the parent. Installs empty tables so the child parse
 * starts clean (cross-input sound) and cannot see the parent's in-progress cells.
 */
export function packratEnter(): PackratEpoch {
    const saved: PackratEpoch = {
        memo: MEMO,
        heads: HEADS,
        growing: GROWING,
        lrStack: LR_STACK,
        currentSrc: CURRENT_SRC,
    };
    MEMO = new Map();
    HEADS = new Map();
    GROWING = new Map();
    LR_STACK = undefined;
    CURRENT_SRC = undefined;
    return saved;
}

/**
 * packratExit — close the current epoch and restore the parent's snapshot. Called
 * from a `finally` so the parent's tables are restored even if the child parse
 * threw mid-grow (the try/finally unwind hardening — the LR machinery the child
 * dirtied is discarded wholesale with its epoch's tables, never left dangling on
 * the parent's stacks).
 */
export function packratExit(saved: PackratEpoch): void {
    MEMO = saved.memo;
    HEADS = saved.heads;
    GROWING = saved.growing;
    LR_STACK = saved.lrStack;
    CURRENT_SRC = saved.currentSrc;
}

function snapshot(state: ParserState<unknown>): Answer {
    return { offset: state.offset, value: state.value, isError: state.isError };
}

function applyAnswer<T>(state: ParserState<T>, ans: Answer): void {
    state.offset = ans.offset;
    state.value = ans.value as T;
    state.isError = ans.isError;
}

export function resetPackrat(): void {
    MEMO.clear();
    HEADS.clear();
    GROWING.clear();
    LR_STACK = undefined;
    CURRENT_SRC = undefined;
}

/**
 * Build the memoized wrapper. memoize() and mergeMemos() share the SAME
 * left-recursion machinery — they differ only in the `name` recorded on the
 * parser context — so a head and the alternation merged into it cooperate at the
 * same (id, offset) cells.
 */
function makeMemoized<T>(
    parser: Parser<T>,
    name: "memoize" | "mergeMemo",
): Parser<T> {
    const p = parser as Parser<unknown>;

    // EVAL: run the wrapped parser from a clean state at `pos`, return the result.
    const evalParser = (state: ParserState<T>, pos: number): void => {
        state.offset = pos;
        state.isError = false;
        state.value = undefined as T;
        parser.parser(state);
    };

    // recall(): the LR-aware memo lookup. Returns the cell to use, or undefined
    // to signal "evaluate fresh". `live` supplies the source for scratch
    // re-evaluation within a grow pass.
    const recall = (pos: number, live: ParserState<T>): MemoCell | undefined => {
        const key = getCijKey(p, pos);
        const cell = MEMO.get(key);
        const head = HEADS.get(pos);

        // A SECOND occurrence of this head inside its own body, at a later
        // position still within the growing seed's span: serve the seed
        // (non-advancing at this offset) so the occurrence contributes the head's
        // value WITHOUT spawning an independent, over-consuming sub-head. This is
        // what lets `H.then(H)`-style bodies tile correctly (mSL).
        if (cell === undefined) {
            const growKey = GROWING.get(p.id);
            if (growKey !== undefined) {
                const growSeed = MEMO.get(growKey)?.ans;
                if (
                    growSeed !== undefined &&
                    !isLR(growSeed) &&
                    pos > (growKey % MEMO_OFFSET_SPAN) &&
                    pos <= growSeed.offset
                ) {
                    // Non-advancing empty (ε) contribution: the occurrence stays
                    // at `pos` and yields no value, so the rest of the body
                    // consumes the remaining input rather than re-counting the
                    // head's already-accumulated value.
                    return { ans: { offset: pos, value: undefined, isError: false } };
                }
            }
        }

        // No active head at pos → ordinary memoization.
        if (head === undefined) return cell;

        // Active head, but this parser is neither the head nor involved and has
        // no cell yet → it must FAIL (it is not allowed to grow at this pos).
        if (
            cell === undefined &&
            head.parser.id !== p.id &&
            !head.involvedSet.has(p.id)
        ) {
            return { ans: { offset: pos, value: undefined, isError: true } };
        }

        // This parser is in the head's eval set → remove it and re-evaluate so
        // it can grow within the current grow pass.
        if (head.evalSet.has(p.id)) {
            head.evalSet.delete(p.id);
            const scratch = live.clone();
            scratch.offset = pos;
            scratch.isError = false;
            scratch.value = undefined as T;
            parser.parser(scratch);
            const ans = snapshot(scratch as ParserState<unknown>);
            if (cell !== undefined) cell.ans = ans;
            else MEMO.set(key, { ans });
            return MEMO.get(key);
        }
        return cell;
    };

    // setupLR: thread the head record down the LR stack for an active recursion.
    const setupLR = (lr: LR): void => {
        if (lr.head === undefined) {
            lr.head = { parser: p, involvedSet: new Set(), evalSet: new Set() };
        }
        const head = lr.head;
        let s = LR_STACK;
        while (s !== undefined && s.head !== head) {
            s.head = head;
            head.involvedSet.add(s.parser.id);
            s = s.next;
        }
    };

    // growLR: iteratively re-evaluate the head, growing the seed while it
    // advances. Restores the final seed into `state`.
    const growLR = (state: ParserState<T>, pos: number, key: number, head: Head): void => {
        HEADS.set(pos, head);
        const prevGrowing = GROWING.get(p.id);
        GROWING.set(p.id, key);
        // try/finally unwind hardening (PT-Q1): if a pass throws mid-grow (a nested
        // parse defect, an out-of-budget memo key, a user .map throw), the per-head
        // GROWING / HEADS bookkeeping is restored so the surrounding epoch's tables
        // are left in a consistent state for the unwinding parseState boundary. The
        // grow's accumulated seed is discarded with the throw; the parent epoch
        // (restored by packratExit) is never corrupted.
        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                head.evalSet = new Set(head.involvedSet);
                evalParser(state, pos);
                const ans = snapshot(state);
                const seed = (MEMO.get(key)!.ans as Answer);
                // Stop when the pass errors or fails to advance past the seed.
                if (ans.isError || ans.offset <= seed.offset) break;
                MEMO.set(key, { ans });
            }
            applyAnswer(state, MEMO.get(key)!.ans as Answer);
        } finally {
            if (prevGrowing !== undefined) GROWING.set(p.id, prevGrowing);
            else GROWING.delete(p.id);
            HEADS.delete(pos);
        }
    };

    // lrAnswer: resolve a memo cell whose ans became an LR marker.
    const lrAnswer = (state: ParserState<T>, pos: number, key: number, lr: LR): void => {
        const head = lr.head!;
        if (head.parser.id !== p.id) {
            // This parser is not the head — return the seed as the answer.
            applyAnswer(state, lr.seed);
            return;
        }
        // This parser IS the head — install the seed and grow it.
        MEMO.set(key, { ans: lr.seed });
        if (lr.seed.isError) {
            applyAnswer(state, lr.seed);
            return;
        }
        growLR(state, pos, key, head);
    };

    const memoizeFn = (state: ParserState<T>) => {
        // Within a single epoch every node shares ONE src (the epoch is opened per
        // top-level parse by packratEnter at the parseState entry boundary, which
        // installs empty tables). We record the epoch's src on the first memoized
        // node purely as a within-epoch consistency anchor — the reset itself has
        // moved OUT of the hot path to packratEnter (PT-Q1: no per-node reset, so a
        // nested parse(differentSrc) can no longer wipe the outer grow's cells).
        if (CURRENT_SRC === undefined) {
            CURRENT_SRC = state.src;
        }
        const pos = state.offset;
        const key = getCijKey(p, pos);

        const m = recall(pos, state);

        if (m === undefined) {
            // No memo: set up an LR marker (FAIL seed), evaluate, resolve.
            const lr: LR = {
                seed: { offset: pos, value: undefined, isError: true },
                parser: p,
                head: undefined,
                next: LR_STACK,
            };
            LR_STACK = lr;
            MEMO.set(key, { ans: lr });

            evalParser(state, pos);

            LR_STACK = lr.next;
            const cell = MEMO.get(key)!;

            if (lr.head !== undefined) {
                // Left recursion was detected involving this position.
                lr.seed = snapshot(state);
                lrAnswer(state, pos, key, lr);
            } else {
                // No left recursion — store the plain answer.
                cell.ans = snapshot(state);
                applyAnswer(state, cell.ans as Answer);
            }
            return state;
        }

        // Memo hit.
        if (isLR(m.ans)) {
            setupLR(m.ans);
            applyAnswer(state, m.ans.seed);
            return state;
        }
        applyAnswer(state, m.ans);
        return state;
    };

    return new Parser(memoizeFn as ParserFunction<T>, createParserContext(name, p));
}

export function memoize<T>(parser: Parser<T>): Parser<T> {
    return makeMemoized(parser, "memoize");
}

export function mergeMemos<T>(parser: Parser<T>): Parser<T> {
    return makeMemoized(parser, "mergeMemo");
}
