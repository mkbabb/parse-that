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
// THREE BOUNDS, and what each one answers:
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

import { L } from "./algebra/tables.mjs";
import { selectCode } from "./codes.mjs";
import { PRODUCTION_LABELS, promoteLabel } from "./diagnostics.mjs";
import { scaleValue } from "./lowering-js/values.mjs";

/* ── bound 1: depth ─────────────────────────────────────────────────────────────────────────── */

/**
 * The declared depth bound of the ONE lazy back-edge. It is the value Θ carries into both
 * lowerings (`lowering-js/index.mjs:21`, `lowering-wasm/index.mjs:30`) and the value the raw label
 * at `algebra/tables.mjs:218` names in its own text.
 */
export const DEPTH_BOUND = 64;

/** Θ as the public entry hands it to a lowering. Frozen: a caller cannot widen a bound in place. */
export const THETA = Object.freeze({ depthBound: DEPTH_BOUND });

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
