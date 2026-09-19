// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.c — THE DECLARED BOUNDS OF THE PUBLIC SURFACE.
//
// `W3.md` §5 `.c` names two files for this seat — `entry` and `bounds` — and gives `bounds` the
// limits that the entry module then APPLIES. A bound that lives only in the grammar it constrains
// is a bound nobody can read, test, or re-declare; three of this wave's rows exist precisely
// because a limit was written once, in one place, and never checked against the thing it claimed:
//
//   * §11 item 3 — OR05 declared 18 predicate IDs against a 20-formula domain and LOOKED closed;
//   * COHESION §0n.1 — `buildGrammar`'s "written against the twenty-two" was a COMMENT until `.b`
//     made it a check;
//   * O-15 PT-04 — `Parser.lazy` had no declared depth at all: the ceiling was the native stack,
//     and it announced itself as a thrown `RangeError` at 7,762.
//
// So every bound here is a VALUE, an ASSERTION that the mechanism actually carries that value, and
// a WITNESS GENERATOR that produces an input sitting exactly on it. Nothing below is a fallback,
// a clamp, or a rescue: a bound reached is an ordinary `ok:false` with a frozen code, which is
// `W3.md` §3 item 6's whole sentence ("make depth exhaustion an ORDINARY `ok:false`").
//
// FOUR BOUNDS, and what each one answers:
//
//   1. DEPTH (§3 item 6 · G-9 depth leg · cand-O debt 3). The one lazy back-edge — `REF` at
//      `algebra/grammar.mjs:94`, `balanced-tail := ( balanced-tail ) | …` — carries an explicit
//      Θ.depthBound. `assertDepthBound` reads it back off BOTH lowerings and off the label surface,
//      so the bound, the mechanism and the diagnostic text cannot drift apart.
//   2. PERCENT EXACTNESS (§5 `.c`, folded: "(p * 255) / 100 … 2.55 is inexact in binary; 100% must
//      be exactly 255"). The discipline is `SCALE`'s own two-operation form (`values.mjs`,
//      OP-18/D-4); this module asserts it at load against the folded constant that would break it.
//   3. THE PACKRAT ARM-STATE (O-15 PT-03 · G-9 latch leg). Readable here, and measured here —
//      including the part that is NOT curable from inside this seat's bounds, which is stated as a
//      measurement rather than worked around. See `measurePackratLatch()`.
//   4. THE CAPACITIES (X.P.W3.f · COHESION §0p/§0q · G-3 proof leg · G-9 capacity leg). Every
//      fixed region of the Wasm memory model, declared in Θ beside `depthBound`, its VALUE read
//      from `lowering-wasm/layout.mjs` and never re-typed by hand; both lowerings reject at each
//      bound as an ordinary `ok:false css_syntax` with a label naming it. See the section below.

import { L } from "./algebra/tables.mjs";
import { R_disp, R_kw } from "./algebra/tables.mjs";
import { selectCode } from "./codes.mjs";
import { PRODUCTION_LABELS, promoteLabel } from "./diagnostics.mjs";
import { scaleValue } from "./lowering-js/values.mjs";
import {
    ARENA_CAP, C_CAP, D_CAP, EXPSNAP_CAP, INPUT_CAP, MARK_CAP, P_CAP, REC_CAP, VSTACK_CAP,
} from "./lowering-wasm/layout.mjs";
import { reifiedDispatchTerms, reifiedGrammar } from "./reify/term-alg.mjs";

/* ── bound 1: depth ─────────────────────────────────────────────────────────────────────────── */

/**
 * The declared depth bound of the ONE lazy back-edge. It is the value Θ carries into both
 * lowerings (`lowering-js/index.mjs:21`, `lowering-wasm/index.mjs:30`) and the value the raw label
 * at `algebra/tables.mjs:218` names in its own text.
 */
export const DEPTH_BOUND = 64;

// Θ is declared in bound 4 below (`THETA`): `depthBound` beside the nine capacities, because the
// input capacity is DERIVED from the class-3 proof and a frozen record cannot be widened afterwards.

/** The raw σ label the `REF` operator raises when the bound is exceeded (`js-alg.mjs:700`). */
export const DEPTH_LABEL = `nesting <= ${DEPTH_BOUND}`;

/** The frozen code a depth rejection carries. `css_syntax`, selected — never a ninth code. */
export const DEPTH_CODE = selectCode("css_syntax");

/**
 * An input whose `REF` nesting is EXACTLY `depth`.
 *
 * The back-edge is `balanced-tail` and the only production that enters it is `context` —
 * `headVar := ( CUT REF balanced-tail )` (`algebra/grammar.mjs:100`). Entering `var(` costs the
 * first level; each further `(` … `)` pair inside the tail costs one more. So a witness at depth
 * `d` is `var(` + `(`×(d−1) + `)`×(d−1) + `)`, and `witnessAtDepth(DEPTH_BOUND + 1)` is the input
 * G-9's falsifier asks for: "generate an input one level past the declared bound".
 *
 * This is a GENERATOR, not a fixture: the suite may not pin a string, because a pinned string is a
 * string whose author can re-pin it when the bound moves (`W3.md` §3, no silent re-pin).
 */
export function witnessAtDepth(depth) {
    if (!Number.isInteger(depth) || depth < 1) {
        throw new Error(`HALT: witnessAtDepth(${String(depth)}) — depth must be an integer >= 1.`);
    }
    const inner = depth - 1;
    return `var(${"(".repeat(inner)}${")".repeat(inner)})`;
}

/**
 * The bound is CARRIED, not assumed. Read back off a lowering and off the label surface:
 *
 *   * the lowering's published Θ must equal `DEPTH_BOUND` — a lowering that quietly widened its
 *     default would otherwise make every "at bound + 1" assertion below test a different bound;
 *   * the raw label must exist in `L` and must name the same number — the diagnostic a consumer
 *     reads is part of the bound, and a label that says 64 while the mechanism stops at 128 is the
 *     misbinding class §11 item 3 names, one level down.
 */
export function assertDepthBound(lowering) {
    const theta = lowering.theta();
    const carried = theta && theta.depthBound;
    if (carried !== DEPTH_BOUND) {
        throw new Error(
            `HALT: the '${lowering.kind}' lowering carries Θ.depthBound=${String(carried)}, not ${DEPTH_BOUND}. ` +
                `The bound the public entry declares and the bound the back-edge enforces must be ONE value ` +
                `(W3.md §3 item 6); a declared bound the mechanism does not carry is a comment.`,
        );
    }
    if (!L.includes(DEPTH_LABEL)) {
        throw new Error(
            `HALT: the raw label '${DEPTH_LABEL}' is not a member of L. The REF operator raises it by name ` +
                `(js-alg.mjs, wasm-alg.mjs); a bound whose diagnostic text does not exist cannot be read by a consumer.`,
        );
    }
    if (typeof promoteLabel(DEPTH_LABEL) !== "string") {
        throw new Error(`HALT: '${DEPTH_LABEL}' has no named production in the label surface (G-8).`);
    }
    return Object.freeze({ kind: lowering.kind, depthBound: DEPTH_BOUND, label: DEPTH_LABEL });
}

/** The promoted production a depth rejection's `expected[0]` carries (G-8's idiom). */
export const DEPTH_PRODUCTION = PRODUCTION_LABELS[DEPTH_LABEL];

/* ── bound 4: the capacities of the fixed memory model (X.P.W3.f · COHESION §0p / §0q) ──────── */
//
// SERVED MODEL: claude-fable-5-1 (this section). The Wasm lowering runs in ONE fixed 12 MB linear
// memory (`lowering-wasm/layout.mjs`: no `memory.grow` anywhere). Nine of its regions are guarded
// by the module's overflow flag `W_OVF` — the input window, the C/P/D journals, the mark journal,
// the recovery journal, `EXPECT`'s snapshot stack, the value stack and the arena — and until this
// section existed only ONE bound of the parser was declared. ESC-e1 (`.e`, L-14) measured the
// consequence: a valid stylesheet of 8,191 rules overflowed the mark journal, the Wasm boundary
// THREW, the public entry's shield re-shaped the throw, and the JS lowering answered `ok:true` —
// the shield was LOAD-BEARING and the two targets DIVERGED on valid input.
//
// §0p's ruling is this module's own law applied to every fixed region: a bound is a VALUE, an
// ASSERTION that the mechanism carries it, and a WITNESS GENERATOR; a bound reached is an ORDINARY
// `ok:false` with a frozen code. §0q rules the nine per class:
//
//   CLASS 1 (input · marks · recoveries · D) — boundary-visible in BOTH lowerings, identical by
//     measurement: the JS lowering's `marks.length` / `recoveries.length` / `D.length` equal the
//     module's `markn` / `recn` / `dlen` on every input (the counters are monotone, or — for D in
//     this grammar — pushed only by `RECOVER` under no restoring scope and by Π last). Each lowering
//     compares its own counter against the SAME value and lowers the SAME diagnostic.
//   CLASS 2 (C · P) — restored journals whose guarded quantity is a PEAK: a high-water counter
//     rides the Wasm appender (`runtime.mjs` `appendC`/`appendP`) and the JS push sites
//     (`js-alg.mjs`, `lowering-js/index.mjs`'s residue), and the boundary compares the PEAK.
//     Final-count-with-proof is REFUSED by the ruling: a restored journal's final count does not
//     bound its peak.
//   CLASS 3 (value stack · arena · expsnap) — no σ-side quantity exists (`ALGEBRA.md` EQ-5: the JS
//     lowering reports `arena = 0`), and the arena's overflow is a Wasm TRAP rather than a flag.
//     They are made UNREACHABLE-BY-CONSTRUCTION: a per-unit ceiling K is DERIVED below from the
//     emitter's own node table over the reified grammar, and `cap₃ >= K × bound₁` is ASSERTED AT
//     LOAD. Shadow counters are REFUSED.
//
// WHICH bound₁, measured rather than assumed (X.P.W3.f, 2026-09-18, at `<p2>` ab6d694). The emitted
// module never STOPS a run at an overflow: every appender refuses the write, sets `ovf` and keeps
// counting, and the term functions (`wasm-alg.mjs`, read-only for this unit) never read the flag.
// So a bound that is checked AFTER the run — marks, recoveries, D, C, P — cannot keep the value
// stack or the arena from being reached during that same run: `a{}`×40,000 (120,000 code units),
// `linear(` + `0, `×70,000 + `1)` (210,009) and `;`×70,000 (70,000) each TRAPPED the module
// (`RuntimeError: memory access out of bounds`) with `ovf` never read, and the shield fired on all
// three. The ONE bound checked BEFORE the run is the input window. §0q's own instruction — "lowering
// the declared class-1 bound in Θ (both lowerings) where the built module's regions require it, so
// a class-1 rejection always fires first" — therefore lands on Θ.input: it is set to the largest
// window under which the derived class-3 ceilings fit their regions, and it is the ONLY declared
// bound that differs from its region's layout CAP. No CAP is re-sized (`layout.mjs` is untouched
// in value); the layout's `INPUT_CAP` still bounds the bytes the boundary will write.

/**
 * The nine guarded regions, in the ORDER the boundary names a breach — §0q's own listing order,
 * class 1 · class 2 · class 3. Order is meaning: an input that breaches two regions in one run is
 * rejected with one diagnostic per breached region, in this order, and G-5's canonical six-tuple
 * takes the first.
 */
export const CAPACITY_REGIONS = Object.freeze([
    Object.freeze({ region: "input", cls: 1, cap: INPUT_CAP, unit: "code units", production: "<input-window>", when: "before the run" }),
    Object.freeze({ region: "marks", cls: 1, cap: MARK_CAP, unit: "marks", production: "<mark-journal>", when: "after the run" }),
    Object.freeze({ region: "recoveries", cls: 1, cap: REC_CAP, unit: "recoveries", production: "<recovery-journal>", when: "after the run" }),
    Object.freeze({ region: "D", cls: 1, cap: D_CAP, unit: "diagnostics", production: "<diagnostic-journal>", when: "after the run" }),
    Object.freeze({ region: "C", cls: 2, cap: C_CAP, unit: "entries", production: "<complement-journal>", when: "after the run (peak)" }),
    Object.freeze({ region: "P", cls: 2, cap: P_CAP, unit: "entries", production: "<provenance-journal>", when: "after the run (peak)" }),
    Object.freeze({ region: "vstack", cls: 3, cap: VSTACK_CAP, unit: "slots", production: "<value-stack>", when: "unreachable by construction" }),
    Object.freeze({ region: "arena", cls: 3, cap: ARENA_CAP, unit: "bytes", production: "<arena>", when: "unreachable by construction" }),
    Object.freeze({ region: "expsnap", cls: 3, cap: EXPSNAP_CAP, unit: "frames", production: "<expectation-snapshots>", when: "unreachable by construction" }),
]);

/** The regions the boundary checks AFTER the run, in naming order (input is checked before it). */
export const BOUNDARY_REGIONS = Object.freeze(["marks", "recoveries", "D", "C", "P"]);

/* ── the class-3 derivation: K from the emitter's node table, over the reified grammar ───────── */

/**
 * THE NODE TABLE, transcribed from the emitter and NOT from the grammar: every arena allocation a
 * term function or a constructor performs, in bytes, as `runtime.mjs` sizes it.
 *
 *   mkSpan / mkStr / mkNum ............ 16      (`node2`, `mkNum`: `alloc(16)`)
 *   mkFold(n) ......................... n + 15  (`alloc(n + 8)`, rounded up to 8)
 *   mkSeqNode(count) .................. 4·count + 15   (`alloc(4·count + 8)`, rounded)
 *   mkRec(pairs) ...................... 8·pairs + 8    (`alloc(8·pairs + 8)`, a multiple of 8)
 *
 * and per operation (`wasm-alg.mjs`): SCAN/LIT → one mkSpan; NUM/DIGITS → one mkNum; TEXT → one
 * mkStr; KW/DISPATCH/END/CUT/PURE/FAIL → none (constants and static rows); SEQ/CTOR → one tuple
 * (mkSeqNode over the survivors) when two or more survive; REP → one list (mkSeqNode over the
 * items); CLAMP/SCALE → one mkNum when the value is a number; RECOVER → none (NONE is static).
 *
 * The constructors (`emitCtors`), per row — `fixed` bytes per successful construction and `rate`
 * bytes per code unit of the constructed span (for the rows that walk a list whose element count is
 * bounded by the span's own bytes: `listToArr`, `splitSelectors`, `mkFold`):
 */
const CTOR_ALLOC = Object.freeze({
    rgb: { fixed: 24 + 32, rate: 0 }, //           colorOf: channels mkSeqNode(3) + mkRec(3)
    hsl: { fixed: 24 + 32, rate: 0 },
    oklch: { fixed: 24 + 32, rate: 0 },
    hex8: { fixed: 24 + 32, rate: 0 },
    hex6: { fixed: 24 + 32, rate: 0 },
    hex4: { fixed: 24 + 32, rate: 0 },
    hex3: { fixed: 24 + 32, rate: 0 },
    context: { fixed: 0, rate: 0 }, //             its only result is the failure
    "named-color": { fixed: 24 + 32, rate: 0 },
    transparent: { fixed: 24 + 32, rate: 0 },
    "timing-keyword": { fixed: 8 * 2 + 8, rate: 0 }, //          mkRec(2)
    "step-alias": { fixed: 8 * 3 + 8, rate: 0 }, //              mkRec(3)
    "cubic-bezier": { fixed: 8 * 5 + 8, rate: 0 }, //            mkRec(5)
    steps: { fixed: 8 * 3 + 8, rate: 0 }, //                     mkRec(3)
    "linear-function": { fixed: 8 * 2 + 8 + 15, rate: 4 }, //    mkRec(2) + listToArr: 4 B per stop, each stop >= 1 code unit
    "linear-stop": { fixed: 8 * 2 + 8 + 4 * 2 + 15, rate: 0 }, // mkRec(2) + listToArr over at most 2 percents
    "style-rule": { fixed: 8 * 3 + 8 + 15 + 15, rate: 4 + 16 + 4 }, // mkRec(3) + declarations array (4 B/decl) + selectors: one part per top-level comma (4 B slot + 16 B mkStr per part), each part >= 1 code unit of the prelude
    declaration: { fixed: 8 * 3 + 8 + 15 + 16, rate: 1 }, //     mkRec(3) + X.P.W3.j's trimWs T_STR node + mkFold over the name's own bytes
    "value-color": { fixed: (8 * 2 + 8) * 2, rate: 0 }, //       mkRec(2) holding mkRec(2)
    stylesheet: { fixed: 15, rate: 4 }, //                        the surviving-items array, 4 B per rule
    //  X.P.W3.h — the CTOR family landed with `tables.mjs` R_ctor, `js-alg.mjs` CTORS and
    //  `wasm-alg.mjs` emitCtors (E-h1); the same four name-sets, asserted equal below
    hwb: { fixed: 24 + 32, rate: 0 }, //                          colorOf, as rgb
    lab: { fixed: 24 + 32, rate: 0 },
    lch: { fixed: 24 + 32, rate: 0 },
    oklab: { fixed: 24 + 32, rate: 0 },
    xyz: { fixed: 24 + 32, rate: 0 },
    "srgb-linear": { fixed: 24 + 32, rate: 0 },
    "display-p3": { fixed: 24 + 32, rate: 0 },
    "a98-rgb": { fixed: 24 + 32, rate: 0 },
    "prophoto-rgb": { fixed: 24 + 32, rate: 0 },
    rec2020: { fixed: 24 + 32, rate: 0 },
    "xyz-d50": { fixed: 16 * 3 + 24 + 32, rate: 0 }, //            three adapted mkNum + colorOf
    "value-number": { fixed: (8 * 2 + 8) + (8 * 3 + 8), rate: 0 }, // mkRec(2) holding mkRec(3); the empty unit is static
    "value-keyword": { fixed: (8 * 2 + 8) * 2, rate: 0 }, //       mkRec(2) holding mkRec(2)
    "value-operator": { fixed: (8 * 2 + 8) * 2, rate: 0 }, //      mkRec(2) holding mkRec(2); the spelling is static
    "value-string": { fixed: 16 + (8 * 2 + 8) * 2, rate: 0 }, //   one mkStr over the source span + mkRec(2) holding mkRec(2)
    "value-call": { fixed: 8 * 3 + 8 + 8, rate: 0 }, //             mkRec(3) + the empty argument array (the array is `value-args`'s)
    "value-args": { fixed: 15 + 4, rate: 4 }, //                    the items array: 4 B per item (first + rest), each >= 1 code unit
    "value-group": { fixed: 8 * 3 + 8 + 15 + 4, rate: 4 }, //       mkRec(3) + the items array: 4 B per item (first + rest), each >= 1 code unit
    "value-wrap": { fixed: 8 * 3 + 8 + 16, rate: 0 }, //            mkRec(3) + a one-item array, when the value is not a list
    //  X.P.W3.i — the animation family, landed with `tables.mjs` R_ctor, `js-alg.mjs` CTORS and
    //  `wasm-alg.mjs` emitCtors (E-h1); the same four name-sets, asserted equal below
    "lp-text": { fixed: 16, rate: 0 }, //                           one mkStr over the token's own span
    "lp-auto": { fixed: 0, rate: 0 }, //                            answers the TEXT leaf it was given
    "range-phase": { fixed: 8 * 1 + 8, rate: 0 }, //                mkRec(1)
    "range-phase-offset": { fixed: 8 * 2 + 8, rate: 0 }, //         mkRec(2)
    "range-offset": { fixed: 8 * 1 + 8, rate: 0 }, //               mkRec(1)
    "range-single": { fixed: 8 * 1 + 8, rate: 0 }, //               mkRec(1)
    "range-pair": { fixed: 8 * 2 + 8, rate: 0 }, //                 mkRec(2)
    "keyframe-word": { fixed: 8 * 2 + 8, rate: 0 }, //              mkRec(2)
    "keyframe-percent": { fixed: 16 + 8 * 2 + 8, rate: 0 }, //      mkNum(v/100) + mkRec(2)
    "keyframe-named": { fixed: 16 + 8 * 3 + 8, rate: 0 }, //        mkNum(offset) + mkRec(3)
    "timeline-mode": { fixed: 8 * 1 + 8, rate: 0 }, //              mkRec(1)
    "timeline-name": { fixed: 8 * 2 + 8, rate: 0 }, //              mkRec(2)
    "timeline-scroll": { fixed: 8 * 3 + 8, rate: 0 }, //            mkRec(at most 3); the args are the REP's
    "timeline-view": { fixed: 8 * 3 + 8 + 8 * 2 + 8, rate: 0 }, //  mkRec(at most 3) holding the inset mkRec(at most 2)
    //  the kept-items array: 4 B per part. A BLANK part is zero-width, so a part is not worth a code
    //  unit — but every part after the first is introduced by a comma, and the first pays the list's
    //  own header, so 4 B per code unit plus one part's worth at zero width bounds it.
    "animation-option": { fixed: 15, rate: 4 }, //                 the part's own token array, 4 B per token
    "animation-option-list": { fixed: 15 + 4, rate: 4 },
    //  X.P.W3.j — the stylesheet family, landed with `tables.mjs` R_ctor, `js-alg.mjs` CTORS and
    //  `wasm-alg.mjs` emitCtors (E-h1); the same four name-sets, asserted equal below. A comment
    //  answers the STATIC `NONE` sentinel and allocates nothing at all.
    "sheet-comment": { fixed: 0, rate: 0 },
});

/**
 * The value-stack cells a constructor holds TRANSIENTLY beyond its arguments: `colorOf` pushes the
 * three channels then six record cells over a reset base (6); `rec(pairs)` pushes 2·pairs
 * (cubic-bezier: 10); `value-color` nests a record inside a record (2 + 4). `listToArr`,
 * `splitSelectors` and `stylesheet` push ONE cell per list element / selector part / surviving
 * rule — those are the per-code-unit cells the walk charges to the input, never to the frame.
 */
const CTOR_SCRATCH_CELLS = Object.freeze({
    rgb: 6, hsl: 6, oklch: 6, hex8: 6, hex6: 6, hex4: 6, hex3: 6, context: 0, "named-color": 6, transparent: 6,
    "timing-keyword": 4, "step-alias": 6, "cubic-bezier": 10, steps: 6, "linear-function": 4, "linear-stop": 4,
    "style-rule": 6, declaration: 6, "value-color": 6, stylesheet: 0,
    //  X.P.W3.h: colorOf rows 6; `scalarRec` nests 2 + (2·pairs) cells — number 2 + 6, keyword /
    //  operator / string 2 + 4 (the string's mkStr is a value, not a cell); call / list `rec(3)` 6
    hwb: 6, lab: 6, lch: 6, oklab: 6, xyz: 6, "srgb-linear": 6, "display-p3": 6, "a98-rgb": 6, "prophoto-rgb": 6, rec2020: 6,
    "xyz-d50": 6, "value-number": 8, "value-keyword": 6, "value-operator": 6, "value-string": 6, "value-call": 6, "value-args": 1, "value-group": 7, "value-wrap": 7,
    //  X.P.W3.i: `rec(pairs)` holds 2·pairs cells over a reset base; `recDyn` holds at most its
    //  maximum pair count; `timeline-view` nests the inset record inside the outer one (6 + 4); the
    //  option list pushes ONE cell per kept part, which is charged to the input, not to the frame
    "lp-text": 0, "lp-auto": 0, "range-phase": 2, "range-phase-offset": 4, "range-offset": 2,
    "range-single": 2, "range-pair": 4, "keyframe-word": 4, "keyframe-percent": 4, "keyframe-named": 6,
    "timeline-mode": 2, "timeline-name": 4, "timeline-scroll": 6, "timeline-view": 10,
    "animation-option": 1, "animation-option-list": 1,
    //  X.P.W3.j: the comment's constructor pushes nothing — its value is the static sentinel
    "sheet-comment": 0,
});

const pad8 = (n) => Math.ceil(n / 8) * 8;
const isTerm = (a) => a !== null && typeof a === "object" && typeof a.op === "string";
const children = (t) => t.args.filter(isTerm);
const litArg = (t, k) => t.args[k].lit;
/** A child that yields UNIT is not a tuple survivor (`seqFinish`, §5.3). */
const yieldsUnit = (t) => t.op === "DROP" || t.op === "CUT" || t.op === "END" || (t.op === "PURE" && t.args[0].lit === null);

/**
 * THE WALK. Every term answers one PROFILE:
 *
 *   rate    — arena bytes per code unit beyond a vertex: for every successful parse of width w
 *             there is a vertex v of `verts` with  alloc <= v.num + rate·(w − v.mw)
 *   verts   — the Pareto front of (num, mw) vertices: the bytes a parse allocates at one of its
 *             minimum-width shapes, and that width (one vertex per surviving alternative shape)
 *   mw      — the minimum width of any vertex (keyword and dispatch idents at their table's
 *             shortest key)
 *   fixed   — the bytes of the zero-width vertex, when one exists (a `SCAN … 0` span, an empty list)
 *   cells   — value-stack cells held on the deepest active chain, EXCLUDING one cell per completed
 *             REP item / list element / selector part, which are charged to the input at 1 cell per
 *             code unit (each such cell owns >= 1 code unit: the progress law and INV-OWN's tiling)
 *   exp     — `EXPECT` frames open on the deepest active chain (the snapshot stack's depth)
 *   *Via    — the same two, along the chain that reaches a `REF` back-edge (−1 when none does)
 *   mwVia   — the mandatory width of one recursion level along that chain
 *
 * SOUNDNESS. A sequence's bytes are the sum of its children's, and each child sits at one of its
 * own vertices plus `rate` per code unit beyond it, so the sequence's vertices are the sums of the
 * children's (a Minkowski sum, pruned: a vertex with no more bytes and no less width than another
 * is dominated and dropped, which keeps the bound valid because the dominating vertex bounds it).
 * Bytes per code unit of any parse are then at most `max(rate, max over vertices of num / mw)`.
 * A `REF` back-edge is the one recursion, bounded by Θ.depthBound: with the back-edge cut, the
 * level's rate already covers its items, and its zero-width bytes recur once per level — charged
 * to the level's own mandatory width (`mwVia`), or multiplied by the depth bound if a level can be
 * zero-width; the cells and expects that recur per level are multiplied by the depth bound.
 */
export function walkCeilings(grammar, dispatch, depthBound) {
    const memo = new Map();
    const active = new Set();
    const cyc = { hit: false };

    const minKey = (rows) => Math.min(...Object.keys(rows).map((k) => k.length));
    /** The Pareto front: for each width the most bytes, and no vertex that a narrower one dominates. */
    const front = (verts) => {
        const byMw = new Map();
        for (const v of verts) if (!byMw.has(v.mw) || byMw.get(v.mw) < v.num) byMw.set(v.mw, v.num);
        const out = [];
        let best = -1;
        for (const [mw, num] of [...byMw].sort((a, b) => a[0] - b[0])) {
            if (num > best) {
                out.push(Object.freeze({ num, mw }));
                best = num;
            }
        }
        return out;
    };
    const sumFronts = (A, B) => front(A.flatMap((a) => B.map((b) => ({ num: a.num + b.num, mw: a.mw + b.mw }))));
    const shift = (V, bytes, perUnit = 0) => V.map((v) => ({ num: v.num + bytes + perUnit * v.mw, mw: v.mw }));
    const minMw = (V) => Math.min(...V.map((v) => v.mw));
    const zeroWidth = (V) => (V.find((v) => v.mw === 0) ?? { num: 0 }).num;
    const perUnit = (V) => Math.max(0, ...V.filter((v) => v.mw >= 1).map((v) => v.num / v.mw));
    const viaOf = (rs) => Math.min(Infinity, ...rs.filter((r) => r.cellsVia >= 0).map((r) => r.mwVia));

    const make = (rate, verts, more) => ({
        rate: Math.max(rate, perUnit(verts)), verts, mw: minMw(verts), fixed: zeroWidth(verts),
        cells: 1, cellsVia: -1, mwVia: Infinity, exp: 0, expVia: -1, ...more,
    });
    const leaf = (alloc, mw) => make(0, [{ num: alloc, mw }], {});
    const none = () => make(0, [{ num: 0, mw: 0 }], {});
    const maxOf = (rs, key) => Math.max(...rs.map((r) => r[key]));
    /** The choice among arms: every arm's vertices, and the worst of each measure. */
    const altOf = (rs) => make(maxOf(rs, "rate"), front(rs.flatMap((r) => r.verts)), {
        cells: maxOf(rs, "cells"), cellsVia: maxOf(rs, "cellsVia"), mwVia: viaOf(rs),
        exp: maxOf(rs, "exp"), expVia: maxOf(rs, "expVia"),
    });
    /** One more fixed allocation on top of a term (`CLAMP`/`SCALE`'s mkNum). */
    const plusFixed = (r, bytes) => make(r.rate, shift(r.verts, bytes), {
        cells: r.cells, cellsVia: r.cellsVia, mwVia: r.mwVia, exp: r.exp, expVia: r.expVia,
    });

    function walk(t) {
        switch (t.op) {
            case "SCAN": return leaf(16, litArg(t, 1));
            case "TEXT": return leaf(16, litArg(t, 1));
            case "LIT": return leaf(16, t.args[0].lit.length);
            case "NUM": return leaf(16, 1);
            case "DIGITS": return leaf(16, litArg(t, 1));
            case "KW": return leaf(0, minKey(R_kw[t.args[1].reg.slice("R_kw.".length)].rows));
            case "END": case "CUT": case "PURE": case "FAIL": return none();
            case "SEQ": return seqLike(children(t).map(walk), children(t), 0, 0, 0);
            case "CTOR": {
                const row = t.args[0].reg.slice("R_ctor.".length);
                const a = CTOR_ALLOC[row];
                if (!a) throw new Error(`HALT: the node table has no row for constructor '${row}'`);
                return seqLike(children(t).map(walk), children(t), a.fixed, a.rate, CTOR_SCRATCH_CELLS[row]);
            }
            case "ALT": return altOf(children(t).map(walk));
            case "REP": {
                const [op, sep] = children(t);
                const o = walk(op);
                const s = sep ? walk(sep) : none();
                const min = litArg(t, 1);
                //  one item and its separator, plus the 4 B list slot, over the pair's width (>= 1 by
                //  the progress law); the 8 B list header (rounded up) once
                const pair = shift(sumFronts(o.verts, s.verts), 4);
                const rate = Math.max(o.rate, s.rate, ...pair.map((v) => v.num / Math.max(1, v.mw)));
                let verts = [{ num: 15, mw: 0 }];
                for (let k = 0; k < min; k++) verts = sumFronts(verts, k === 0 ? shift(o.verts, 4) : pair);
                return make(rate, front(verts), {
                    cells: Math.max(o.cells, s.cells), cellsVia: Math.max(o.cellsVia, s.cellsVia), mwVia: viaOf([o, s]),
                    exp: Math.max(o.exp, s.exp), expVia: Math.max(o.expVia, s.expVia),
                });
            }
            case "DROP": case "TRY": return walk(children(t)[0]);
            case "EXPECT": {
                const r = walk(children(t)[0]);
                return { ...r, exp: r.exp + 1, expVia: r.expVia >= 0 ? r.expVia + 1 : -1 };
            }
            case "CLAMP": case "SCALE": return plusFixed(walk(children(t)[0]), 16);
            case "RECOVER": {
                const [op, sync] = children(t);
                const o = walk(op);
                const s = walk(sync);
                //  success through the body, or through `sync` after a full restore (>= 1 code unit)
                return altOf([o, make(s.rate, s.verts.map((v) => ({ num: v.num, mw: Math.max(1, v.mw) })), { ...s })]);
            }
            case "DISPATCH": {
                const table = t.args[1].reg.slice("R_disp.".length);
                const ident = leaf(0, minKey(R_disp[table].rows));
                const targets = [...new Set(Object.values(R_disp[table].rows))].map((name) => {
                    const term = dispatch[name];
                    if (!term) throw new Error(`HALT: R_disp names '${name}', which the grammar does not define`);
                    return walk(term);
                });
                return seqLike([ident, altOf(targets)], [null, null], 0, 0, 0);
            }
            case "REF": return ref(t.args[0].ref);
            default: throw new Error(`HALT: the ceiling walk knows no operation '${t.op}'`);
        }
    }

    /** SEQ and CTOR: children in order; the frame holds k completed cells while child k runs. */
    function seqLike(rs, ops, fixedOwn, rateOwn, scratch) {
        const survivors = ops.filter((o) => o === null || !yieldsUnit(o)).length;
        const tuple = survivors >= 2 ? pad8(8 + 4 * survivors) : 0;
        let verts = [{ num: 0, mw: 0 }];
        for (const r of rs) verts = sumFronts(verts, r.verts);
        verts = front(shift(verts, tuple + fixedOwn, rateOwn));
        const mw = rs.reduce((n, r) => n + r.mw, 0);
        let cells = 0;
        let cellsVia = -1;
        let mwVia = Infinity;
        rs.forEach((r, k) => {
            cells = Math.max(cells, k + r.cells);
            if (r.cellsVia >= 0) {
                cellsVia = Math.max(cellsVia, k + r.cellsVia);
                mwVia = Math.min(mwVia, mw - r.mw + r.mwVia);
            }
        });
        cells = Math.max(cells, rs.length + scratch);
        return make(Math.max(0, ...rs.map((r) => r.rate)) + rateOwn, verts, {
            cells, cellsVia, mwVia,
            exp: Math.max(0, ...rs.map((r) => r.exp)), expVia: Math.max(-1, ...rs.map((r) => r.expVia)),
        });
    }

    /** The back-edge: cut when re-entered, and its per-level costs folded when the frame closes. */
    function ref(name) {
        if (active.has(name)) {
            cyc.hit = true;
            //  the chain passes THROUGH the back-edge here: zero cost, marked as a via-point
            return make(0, [{ num: 0, mw: 0 }], { cells: 0, cellsVia: 0, mwVia: 0, exp: 0, expVia: 0 });
        }
        if (memo.has(name)) return memo.get(name);
        const term = grammar.terms[name];
        if (!term) throw new Error(`HALT: REF '${name}' resolves to no production`);
        active.add(name);
        const hitBefore = cyc.hit;
        cyc.hit = false;
        const level = walk(term);
        const recursive = cyc.hit;
        cyc.hit = hitBefore;
        active.delete(name);
        let r = level;
        if (recursive) {
            //  every level consumes its own mandatory bytes (`mwVia`); the level's zero-width bytes
            //  recur per level and are charged to them — or, if a level can be zero-width, multiplied
            //  by the depth bound; the cells and expects that recur per level are multiplied likewise
            const perLevel = level.mwVia >= 1 && Number.isFinite(level.mwVia);
            r = make(perLevel ? level.rate + level.fixed / level.mwVia : level.rate, perLevel ? level.verts : shift(level.verts, level.fixed * (depthBound - 1)), {
                cells: level.cells + Math.max(0, level.cellsVia) * depthBound, cellsVia: -1, mwVia: Infinity,
                exp: level.exp + Math.max(0, level.expVia) * depthBound, expVia: -1,
            });
        }
        memo.set(name, r);
        return r;
    }

    const out = {};
    for (const [prod, root] of Object.entries(grammar.entries)) out[prod] = walk(grammar.terms[root]);
    return out;
}

/**
 * The derived ceilings, at load, over the reified grammar — the same authored grammar both lowerings
 * instantiate (`reify/term-alg.mjs`). Nothing is parsed; the walk is off the parse path.
 */
export function deriveClass3Ceilings(depthBound = DEPTH_BOUND) {
    const perEntry = walkCeilings(reifiedGrammar(), reifiedDispatchTerms(), depthBound);
    const rows = Object.values(perEntry);
    const arenaRate = Math.ceil(Math.max(...rows.map((r) => r.rate)));
    const arenaFixed = Math.ceil(Math.max(...rows.map((r) => r.fixed)));
    const cellsStatic = Math.max(...rows.map((r) => r.cells));
    const expects = Math.max(...rows.map((r) => r.exp));
    return Object.freeze({
        perEntry: Object.freeze(Object.fromEntries(Object.entries(perEntry).map(([k, r]) => [k, Object.freeze({ ...r })]))),
        //  vstack: one cell per code unit (REP items, list elements, selector parts) + the static chain
        vstack: Object.freeze({ K: 1, unit: "code unit", S: cellsStatic }),
        //  arena: K bytes per code unit + a per-parse constant
        arena: Object.freeze({ K: arenaRate, unit: "code unit", S: arenaFixed }),
        //  expsnap: a static depth (no EXPECT recurs through a REF cycle in this grammar; if one did,
        //  the walk multiplies it by the depth bound)
        expsnap: Object.freeze({ K: 0, unit: "depth level", S: expects }),
    });
}

export const CLASS3_CEILINGS = deriveClass3Ceilings();

/**
 * Θ.input — the largest window under which every class-3 region fits, and never more than the
 * layout's own `INPUT_CAP`. This is the ONE declared bound that differs from its region's CAP, and
 * the derivation above is the reason, printed rather than pinned: a grammar change that raises a
 * ceiling moves this number at load, and the label surface (asserted below) halts until the label
 * names the new value.
 */
export const INPUT_BOUND = Math.min(
    INPUT_CAP,
    VSTACK_CAP - CLASS3_CEILINGS.vstack.S,
    Math.floor((ARENA_CAP - CLASS3_CEILINGS.arena.S) / CLASS3_CEILINGS.arena.K),
);

/** The declared capacity of every region: the layout's CAP, except the derived input window. */
export const CAPACITY = Object.freeze({
    input: INPUT_BOUND,
    marks: MARK_CAP,
    recoveries: REC_CAP,
    D: D_CAP,
    C: C_CAP,
    P: P_CAP,
    vstack: VSTACK_CAP,
    arena: ARENA_CAP,
    expsnap: EXPSNAP_CAP,
});

/** Θ as the public entry hands it to a lowering. Frozen: a caller cannot widen a bound in place. */
export const THETA = Object.freeze({ depthBound: DEPTH_BOUND, ...CAPACITY });

/**
 * The class-3 proof, asserted AT LOAD: `cap₃ >= K × bound₁ + S` for each of the three, with
 * bound₁ = Θ.input (the value stack and the arena) or Θ.depthBound (the snapshot stack). A grammar
 * whose ceilings no longer fit halts here — before any entry exists — rather than shipping a
 * window under which a valid input can trap the module.
 */
export function assertClass3Unreachable(c = CLASS3_CEILINGS, input = INPUT_BOUND) {
    //  the two parameters exist ONLY so the suite can run a NEGATIVE CONTROL against this very
    //  function (the `assertClosedOperatorSet(build)` precedent): every production call takes the defaults
    const vstack = c.vstack.K * input + c.vstack.S;
    const arena = c.arena.K * input + c.arena.S;
    const expsnap = c.expsnap.K * DEPTH_BOUND + c.expsnap.S;
    const violated = [];
    if (!(vstack <= VSTACK_CAP)) violated.push(`vstack ${vstack} > ${VSTACK_CAP}`);
    if (!(arena <= ARENA_CAP)) violated.push(`arena ${arena} > ${ARENA_CAP}`);
    if (!(expsnap <= EXPSNAP_CAP)) violated.push(`expsnap ${expsnap} > ${EXPSNAP_CAP}`);
    if (!(input >= 2) || !(input <= INPUT_CAP)) violated.push(`input ${input} outside [2, ${INPUT_CAP}]`);
    if (violated.length > 0) {
        throw new Error(
            `HALT: a class-3 region is reachable under Θ.input=${input}: [${violated.join(" · ")}]. ` +
                `The value stack, the arena and the snapshot stack have no σ-side quantity and their overflow is a ` +
                `trap or a corruption, so they must be unreachable by construction (COHESION §0q E-f2 class 3).`,
        );
    }
    return Object.freeze({
        input,
        vstack: Object.freeze({ ceiling: vstack, cap: VSTACK_CAP, ...c.vstack }),
        arena: Object.freeze({ ceiling: arena, cap: ARENA_CAP, ...c.arena }),
        expsnap: Object.freeze({ ceiling: expsnap, cap: EXPSNAP_CAP, ...c.expsnap }),
    });
}

/** Wired at LOAD, like every other proof in this module. */
export const CLASS3_PROOF = assertClass3Unreachable();

/* ── the labels, the diagnostic, and the read-backs ─────────────────────────────────────────── */

/** The raw σ label a capacity rejection carries — the `nesting <= 64` form, one per region. */
export const capacityLabel = (region) => `${region} <= ${CAPACITY[region]}`;
export const CAPACITY_LABELS = Object.freeze(Object.fromEntries(CAPACITY_REGIONS.map((r) => [r.region, capacityLabel(r.region)])));

/** The frozen code a capacity rejection carries. `css_syntax`, selected — never a ninth code. */
export const CAPACITY_CODE = selectCode("css_syntax");

/**
 * The raw diagnostic BOTH lowerings lower at their boundary for one breached region: the whole
 * input is the span, because the quantity that breached is a property of the input as a whole and
 * the module's journals hold no position for the refused append. A source that breaches a bound is
 * never empty (every counter is 0 on ""), so `actual` is the source itself — the Π idiom for a
 * frontier at 0.
 */
export const capacityIssue = (region, source) =>
    Object.freeze({ code: "css_syntax", start: 0, end: source.length, expected: Object.freeze([CAPACITY_LABELS[region]]), actual: source });

/**
 * The breached regions among the boundary-checked five, in naming order. Called by both lowerings
 * with their OWN counters — the JS σ's lengths and high-waters, the module's result block and
 * high-water exports — against the ONE declared value.
 */
export const capacityBreaches = (counters) => BOUNDARY_REGIONS.filter((region) => counters[region] > CAPACITY[region]);

/**
 * The σ product a lowering answers for a breached run — AUTHORED ONCE, so both lowerings answer
 * with the same bytes (the `boundaryIssue` precedent). The run's journals are NOT carried: a
 * breached run's journals are partial by construction (the module refused the appends past the
 * cap), and a partial journal presented as the run's journal is the misbinding class this module's
 * header names. `peaks` carries the class-2 high-waters the boundary measured.
 */
export const capacityProduct = (regions, source, peaks) => ({
    ok: false,
    V: undefined,
    C: [],
    P: [],
    D: regions.map((region) => capacityIssue(region, source)),
    far: { f: 0, code: "css_syntax", labels: regions.map((region) => CAPACITY_LABELS[region]) },
    sigma: { i: 0, depth: 0, arena: 0 },
    marks: [],
    recoveries: [],
    peaks: { C: peaks.C, P: peaks.P },
});

/**
 * The bound is CARRIED, not assumed — `assertDepthBound`'s three read-backs, per region: the
 * lowering's published Θ must equal the declared value; the raw label must be a member of `L` and
 * name the same number; the label must promote to a named production.
 */
export function assertCapacityBound(lowering, region) {
    const row = CAPACITY_REGIONS.find((r) => r.region === region);
    if (!row) throw new Error(`HALT: '${String(region)}' is not a declared region — [${CAPACITY_REGIONS.map((r) => r.region).join(", ")}]`);
    const theta = lowering.theta();
    const carried = theta && theta[region];
    if (carried !== CAPACITY[region]) {
        throw new Error(
            `HALT: the '${lowering.kind}' lowering carries Θ.${region}=${String(carried)}, not ${CAPACITY[region]}. ` +
                `A declared capacity the lowering does not carry is a comment (COHESION §0p).`,
        );
    }
    if (!(CAPACITY[region] <= row.cap)) {
        throw new Error(`HALT: Θ.${region}=${CAPACITY[region]} exceeds the region's layout CAP ${row.cap}; a declared bound never widens a region.`);
    }
    const label = CAPACITY_LABELS[region];
    if (!L.includes(label)) {
        throw new Error(`HALT: the raw label '${label}' is not a member of L (algebra/tables.mjs); a bound whose diagnostic text does not exist cannot be read by a consumer.`);
    }
    const production = promoteLabel(label);
    if (typeof production !== "string" || !production.startsWith(row.production)) {
        throw new Error(`HALT: '${label}' promotes to ${JSON.stringify(production)}, not a '${row.production}' production (G-8).`);
    }
    return Object.freeze({ kind: lowering.kind, region, cls: row.cls, capacity: CAPACITY[region], label, production });
}

/** All nine, and the class-3 proof, for one lowering — what the public entry runs at construction. */
export function assertCapacityBounds(lowering) {
    const rows = CAPACITY_REGIONS.map((r) => assertCapacityBound(lowering, r.region));
    return Object.freeze({ kind: lowering.kind, regions: Object.freeze(rows), class3: CLASS3_PROOF });
}

/* ── the witness generators ─────────────────────────────────────────────────────────────────── */

/**
 * GENERATORS, not fixtures (`W3.md` §3: no silent re-pin). Each takes a repetition count and
 * returns an input whose named counter grows with it; the suite finds the bound's own coordinate
 * by reading the counter back off the lowering (the census method, binary-searched), so the
 * witness sits AT the bound and ONE PAST it by measurement rather than by a pinned string.
 *
 *   input       `"a"×(n−2) + "{}"` — exactly n code units, a valid one-rule stylesheet; §0q's own
 *               ruled shape is `"a"×(INPUT_CAP−1) + "{}"`, i.e. `witnessAtCapacity("input", INPUT_CAP + 1)`
 *   marks       `a{}` × n — every empty rule records the same fixed number of restores
 *   recoveries  `a{c}` × n — every malformed rule is exactly one recovery and one diagnostic
 *   D           the same family: in this grammar D is pushed by RECOVER (never restored) and by Π last
 *   C · P       `linear(` + `0, `×n + `1)` — the densest journal family the census found; under the
 *               derived Θ.input neither can be reached (C ⊔ P tiles the consumed input, so
 *               C + P <= Θ.input < C_CAP), which the suite asserts rather than assumes
 *   vstack      `;` × n — one recovered rule per code unit, the census's 1-cell-per-code-unit family
 *   arena       `linear(` + `0, `×n + `1)` — the census's densest arena family
 *   expsnap     `var(` + `(`×(d−1) + `)`×(d−1) + `)` — the one recursion; EXPECT does not nest through it
 */
export function witnessAtCapacity(region, n) {
    if (!Number.isInteger(n) || n < 1) throw new Error(`HALT: witnessAtCapacity(${String(region)}, ${String(n)}) — n must be an integer >= 1.`);
    switch (region) {
        case "input": return n < 2 ? "{}".slice(0, n) : `${"a".repeat(n - 2)}{}`;
        case "marks": return "a{}".repeat(n);
        case "recoveries": case "D": return "a{c}".repeat(n);
        case "C": case "P": case "arena": return `linear(${"0, ".repeat(n)}1)`;
        case "vstack": return ";".repeat(n);
        case "expsnap": return witnessAtDepth(n);
        default: throw new Error(`HALT: witnessAtCapacity — '${String(region)}' is not a declared region.`);
    }
}

/** The production the witness family parses under. */
export const WITNESS_PRODUCTION = Object.freeze({
    input: "P:stylesheet", marks: "P:stylesheet", recoveries: "P:stylesheet", D: "P:stylesheet",
    C: "P:timing-function", P: "P:timing-function", arena: "P:timing-function", vstack: "P:stylesheet", expsnap: "P:color",
});

/* ── bound 2: percent exactness ─────────────────────────────────────────────────────────────── */

/**
 * `(p * 255) / 100`, and the reason it is written that way rather than `p * 2.55`.
 *
 * Both candidates converged on this independently and `W3.md` §5 `.c` folds it here by name:
 * cand-F's comment is "2.55 is inexact in binary; 100% must be exactly 255". The nearest f64 to
 * 2.55 is 2.54999999999999982236431605997495353221893310546875, so `100 * 2.55` evaluates to
 * 254.99999999999997 — a full-intensity channel that is not 255, silently, in every `rgb(100% …)`
 * on the web. Multiplying first keeps the intermediate exactly representable (100 * 255 = 25500)
 * and the single division lands on 255 exactly.
 *
 * The arithmetic itself is NOT re-implemented here: it is `SCALE`'s (OP-18, debt D-4), whose
 * two-operation form both lowerings already carry byte for byte. This module asserts it.
 */
export const PERCENT_NUMERATOR = 255;
export const PERCENT_DENOMINATOR = 100;

/** The scaled channel, through the lowering's own operator. */
export const scalePercent = (p) => scaleValue(p, PERCENT_NUMERATOR, PERCENT_DENOMINATOR);

/** The folded constant that must NOT be used, kept so the falsifier is executable and not a story. */
export const INEXACT_FOLDED_FACTOR = PERCENT_NUMERATOR / PERCENT_DENOMINATOR;

/**
 * The exactness law, asserted at load over the whole integer percent range.
 *
 * Two conjuncts, and the second is what makes the first non-vacuous: every integer percent must
 * agree with the exact rational `p * 255 / 100`, AND the folded form must be measurably different
 * somewhere — a discipline that no input can distinguish from its alternative is not a discipline.
 */
export function assertPercentExactness() {
    const disagreements = [];
    let foldedDiffers = 0;
    for (let p = 0; p <= 100; p++) {
        const exact = (p * PERCENT_NUMERATOR) / PERCENT_DENOMINATOR;
        if (scalePercent(p) !== exact) disagreements.push(p);
        if (p * INEXACT_FOLDED_FACTOR !== exact) foldedDiffers++;
    }
    if (disagreements.length > 0 || scalePercent(100) !== 255 || foldedDiffers === 0) {
        throw new Error(
            `HALT: the (p * ${PERCENT_NUMERATOR}) / ${PERCENT_DENOMINATOR} exactness discipline does not hold. ` +
                `disagreements=[${disagreements.join(", ")}] scalePercent(100)=${scalePercent(100)} ` +
                `foldedDiffers=${foldedDiffers}. 100% must be exactly 255 (W3.md §5 .c).`,
        );
    }
    return Object.freeze({ checked: 101, disagreements: 0, foldedDiffers, full: scalePercent(100) });
}

/** Wired at LOAD, like `.b`'s closure proofs — not offered as a function nobody calls. */
export const PERCENT_EXACTNESS = assertPercentExactness();

/* ── bound 3: the packrat arm-state (O-15 PT-03) ────────────────────────────────────────────── */

/**
 * The measured latch, at THIS root's own bytes rather than at the published dist's line numbers.
 *
 * O-15 PT-03 read the defect in the published bundle (`:678` false, `:722` true, read at
 * `:682`/`:714`, no assignment back to false anywhere). The same defect is in this root's own
 * library source at the coordinates below — re-measured by this seat, not inherited:
 *
 *     src/parse/packrat.ts:158   let PACKRAT_ARMED = false;            the declaration
 *     src/parse/packrat.ts:224   if (!PACKRAT_ARMED) return null;      packratEnter, the reader
 *     src/parse/packrat.ts:273   if (!PACKRAT_ARMED) return;           resetPackrat, the early out
 *     src/parse/packrat.ts:297   PACKRAT_ARMED = true;                 makeMemoized, the one-way arm
 *
 * `resetPackrat()` clears MEMO/HEADS/GROWING and leaves the latch armed. That is the asymmetry
 * G-9's latch leg names, and it is NOT in this seat's writable set (`W3.md` §4 admits
 * `typescript/src/css/**`; `typescript/src/parse/**` is in no row of it, and X.P.W3.0's dated §4
 * addendum §A-3 deliberately declines to admit it). It is therefore MEASURED here and returned,
 * never patched from above: a re-export that pretended to disarm would be exactly the masking
 * fallback `W3.md` §6 G-3 refuses by name.
 */
export const PACKRAT_LATCH_SITES = Object.freeze({
    module: "typescript/src/parse/packrat.ts",
    declaration: 158,
    reader: 224,
    reset: 273,
    arm: 297,
    publishedDistCoordinates: Object.freeze({ false: 678, true: 722, readAt: Object.freeze([682, 714]) }),
});

/**
 * The library, loaded through the root's own pinned `tsx` — the same mechanism `js-alg.mjs:48`
 * uses, because the library is TypeScript source whose internal specifiers are TS-style.
 *
 * DECLARED, because it decides what the reading below MEANS: `tsImport` does NOT dedupe. Two calls
 * with the same specifier and the same parent yield two module namespaces with two distinct
 * `PACKRAT_ARMED` bindings (measured by this seat: `ns_a === ns_b` is false, and
 * `ns_a.resetPackrat === ns_b.resetPackrat` is false). So this instrument reads THE LATCH IN ITS
 * OWN LIBRARY INSTANCE, and says so; it does not claim to read the instance the lowerings' parse
 * path holds, because that instance is reachable from no module in this seat's bounds. Both facts
 * are part of the finding, not around it.
 */
let instrument = null;
export async function loadPackratInstrument() {
    if (instrument !== null) return instrument;
    const { createRequire } = await import("node:module");
    const require_ = createRequire(import.meta.url);
    const { tsImport } = require_("tsx/esm/api");
    const packrat = await tsImport("../parse/packrat.ts", import.meta.url);
    const parser = await tsImport("../parse/parser.ts", import.meta.url);
    instrument = Object.freeze({ packrat, parser });
    return instrument;
}

/**
 * READ the arm-state. `packratEnter()` returns `null` while unarmed and a snapshot once armed
 * (`packrat.ts:224`), so it IS the readback the gate asks for; the snapshot is handed straight back
 * to `packratExit` so the observation leaves the tables exactly as it found them.
 */
export async function readPackratArmState() {
    const { packrat } = await loadPackratInstrument();
    const saved = packrat.packratEnter();
    if (saved === null) return false;
    packrat.packratExit(saved);
    return true;
}

/**
 * ARM it, the only way the library allows: construct a memoized wrapper (`makeMemoized` arms at
 * CONSTRUCTION — `packrat.ts:297`). The parser wrapped is a no-op; nothing is parsed. This is the
 * instrument's own act and never the candidate's — the candidate's reachable set constructs no
 * memoizer, which the boundary suite asserts statically.
 */
export async function armPackratArmState() {
    const { packrat, parser } = await loadPackratInstrument();
    packrat.memoize(new parser.Parser((state) => state, { name: "x-p-w3.c/arm-probe", args: [] }));
    return readPackratArmState();
}

/** RESET it through the library's own entry point, and return what the arm-state reads back as. */
export async function resetPackratArmState() {
    const { packrat } = await loadPackratInstrument();
    packrat.resetPackrat();
    return readPackratArmState();
}

/**
 * The whole reading, in one frozen record: arm-state before, after arming, after `resetPackrat()`,
 * and the verdict `symmetric` that G-9's latch leg requires to be true.
 */
export async function measurePackratLatch() {
    const before = await readPackratArmState();
    const armed = await armPackratArmState();
    const afterReset = await resetPackratArmState();
    return Object.freeze({
        sites: PACKRAT_LATCH_SITES,
        readable: true,
        before,
        armed,
        afterReset,
        symmetric: armed === true && afterReset === false,
    });
}
