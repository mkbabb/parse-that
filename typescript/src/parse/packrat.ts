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

const MEMO_OFFSET_BITS = 20;
const MEMO_MAX_OFFSET = (1 << MEMO_OFFSET_BITS) - 1;
const MEMO_OFFSET_SPAN = MEMO_MAX_OFFSET + 1; // 2^20 = 1_048_576

export function getCijKey(parser: Parser<unknown>, offset: number): number {
    // FLOAT64-SAFE multiply key. The old `parser.id << MEMO_OFFSET_BITS` was a
    // 32-bit SIGNED shift: at parser.id >= 4096 (2^12) it overflows int32 and
    // aliases — getCijKey(4096, 0) === getCijKey(0, 0) === 0 — silently colliding
    // two distinct parsers' memo cells. Parser.id is a process-global PARSER_ID++,
    // so any non-trivial grammar (value.js's CSS value grammar) routinely exceeds
    // 4096 parser instances. A JS number is a float64: `id * 2^20 + offset` is
    // exact for id up to 2^33 with offset < 2^20, and a Map keyed on that number
    // is exactly as fast as an int32 key. The offset is extracted elsewhere with
    // `key % MEMO_OFFSET_SPAN` (NOT `& MEMO_MAX_OFFSET`, which would re-truncate to
    // int32 on a large key).
    return parser.id * MEMO_OFFSET_SPAN + (offset & MEMO_MAX_OFFSET);
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

const MEMO = new Map<number, MemoCell>();
const HEADS = new Map<number, Head>();
let LR_STACK: LR | undefined;

// CROSS-INPUT SOUNDNESS — the src-epoch guard. MEMO/HEADS/GROWING are
// module-global and keyed on (id, offset) with NO source component. A memoized
// parser re-run against a DIFFERENT source would mis-restore the previous input's
// cells — `memoize(p).parse('hello')` then `.parse('world')` returning 'hello'
// (a silent-wrong-answer correctness BLOCKER for any hot re-parse session). We
// auto-reset when the source identity changes. The reset fires at most ONCE per
// top-level parse — the first memoized node of a new src; every clone within a
// single parse preserves `state.src` — so a caller needs ZERO resetPackrat()
// discipline. packrat is opt-in and OFF the default LL(1) parse path, so this
// per-session reference compare never touches the fast path.
let CURRENT_SRC: string | undefined;

// Heads currently in their grow phase, keyed by parser id → the (id, pos) key of
// the growing seed. Used to serve a SECOND occurrence of the head that appears
// inside its own body at a LATER position still within the seed's span (e.g.
// mSL's `mSL.then(mSL)`): such an occurrence restores the seed non-advancingly
// rather than spawning an independent, over-consuming head.
const GROWING = new Map<number, number>();

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
        if (prevGrowing !== undefined) GROWING.set(p.id, prevGrowing);
        else GROWING.delete(p.id);
        HEADS.delete(pos);
        applyAnswer(state, MEMO.get(key)!.ans as Answer);
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
        // src-epoch guard: a new top-level source auto-invalidates the
        // cross-input-unsafe (id, offset) memo before the first lookup, so the
        // caller needs no resetPackrat() discipline. Fires at most once per parse.
        if (state.src !== CURRENT_SRC) {
            resetPackrat();
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
