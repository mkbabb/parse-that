// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.b — THE 403-STRING EQUIVALENCE ORACLE.
//
// Entry: `npx tsx harness/equivalence/harness.ts`, run from the fresh root.
// Gate: W1.md §6 G-2 — "THE ORACLE REPRODUCES GREEN". Exit 0 printing `size 403`,
// the provenance and hint maps unchanged from the RED baseline, `A/B/C = 0/0/0`,
// and the declared-divergence row list as a section distinct from the defect count.
//
// WHAT THIS PROVES: that two deliberately asymmetric engines agree, on the
// intersection of their declared shapes, about every input in a 403-string
// provenance-tagged corpus — and that the rule by which "agree" is judged is the
// authority's own, not this file's.
// WHAT IT DOES NOT PROVE (L-16): nothing about speed, nothing about coverage of
// the shipped surface, and nothing about either engine as a product. It is an
// API-TEST over two libraries, on one box, at one clock.
//
// ── PORTED FROM ───────────────────────────────────────────────────────────────
// /Users/mkbabb/.claude/jobs/9e7dadd0/tmp/parser-proof/equivalence/harness.ts
//   (20,514 B, sha256 ac1b5afcc1e2b09f01bdb2cbbdbb46362836bd8c019134a69b98531eab3971f7)
// The per-door differential logic below — the semantic-core extractors, the
// selector/comment normalisation, the C14 shape oracles, the verdict ladder, and
// the defect predicate — is carried over UNCHANGED. What a port may not do is
// improve the thing it is porting: an oracle that reproduces GREEN under a
// different rule has reproduced nothing.
//
// ── THE FOUR DECLARED CHANGES, each with its reason ───────────────────────────
// 1. LIVE is the VENDORED SHA-PINNED PUBLISHED TARBALL, never the working tree.
//    W1.md §5.b folds the parser band's G6 rule: "the repo's own
//    dist/subpaths/css.js differs from what 4.0.0 ships, and that dist-drift is a
//    separately ledgered finding". The original imported the working-tree dist;
//    that import is the one line of it that could not be carried over. The
//    tarball's digest is asserted at startup, so the engine bytes are a printed
//    coordinate rather than an assumption.
// 2. THE CORPUS IS THE PORT'S OWN COPY (./corpus.json), byte-identical to the
//    job tree's, so this harness has no read dependency on an ephemeral job
//    directory. Item ids and the RAW provenance tags are preserved, which is what
//    makes a row here comparable row-by-row to `equivalence-results.json`.
// 3. THE TAXONOMY IS ASSERTED BYTE-FOR-BYTE against `equivalence.md` §1 (see
//    ./taxonomy.ts), because G-2's falsifier is a WIDENED RULE, not a wrong count.
// 4. THE 22 RULED DIVERGENCES AND THE 4 PRESERVED DISSENTS are printed as their
//    own section (see ./declared-divergences.ts), never summed into the defect
//    count — so a divergence that was ruled is visibly distinct from one that was
//    never seen.
//
// ── THE ENGINES ───────────────────────────────────────────────────────────────
// LIVE   — @mkbabb/value.js 4.0.0, the published tarball vendored byte-for-byte:
//          regex + hand-rolled scanners; the full v4 CSS surface.
// C14    — the c14-css combinator assay over @mkbabb/parse-that@1.0.0: exactly
//          three doors (parseColor oklch-only, parseEasing cubic-bezier-only,
//          parseStylesheet qualified-rules-only), everything else declared
//          born-RED by its own status.json.
// The FROZEN-SURFACE SUBSET is their intersection — { oklch colours,
// cubic-bezier easings, all-qualified stylesheets } — and the asymmetry outside
// it is COVERAGE_NARROWING, a declared non-defect.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
    parseCssColor,
    parseTimingFunction,
    parseStylesheet as liveSheet,
    parseCssValue,
    parseKeyframeSelector as liveKfSel,
    collectKeyframes,
} from "/Users/mkbabb/Programming/value.js/docs/tranches/V/megatranche/prototypes/css-parser/cand-o/vendor/value-js-4.0.0/dist/subpaths/css.js";
import {
    parseColor as c14Color,
    parseEasing as c14Easing,
    parseStylesheet as c14Sheet,
} from "/Users/mkbabb/.claude/jobs/9e7dadd0/tmp/parser-proof/c14-css/src/css/api.js";
import { completeKeyframeSelector as c14KfSel } from "/Users/mkbabb/.claude/jobs/9e7dadd0/tmp/parser-proof/c14-css/src/css/grammar/l4/keyframes.js";

import { checkDivergenceRows, DECLARED_DIVERGENCE_ROWS, PRESERVED_DISSENTS } from "./declared-divergences";
import {
    checkTaxonomyUnmoved,
    DECLARED_NON_DEFECTS,
    MIRROR_DEFECT_CLASSES,
    TAXONOMY_VERBATIM,
} from "./taxonomy";

// ── provenance of the engine bytes ──────────────────────────────────────────
const LIVE_ENGINE_PATH =
    "/Users/mkbabb/Programming/value.js/docs/tranches/V/megatranche/prototypes/css-parser/cand-o/vendor/value-js-4.0.0/dist/subpaths/css.js";
/** cand-O's own pinned digest of the published artifact (`equivalence.test.ts`). */
const LIVE_ENGINE_SHA256 =
    "8b5381305ea26236326f06a38559247b2089a5be7fa78abe43640d0556320c42";
const C14_ENGINE_PATH =
    "/Users/mkbabb/.claude/jobs/9e7dadd0/tmp/parser-proof/c14-css/src/css/api.ts";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const CORPUS_PATH = `${HERE}corpus.json`;
const RESULTS_PATH = `${HERE}equivalence-results.json`;

/** The G-2 RED baseline, pasted from W1.md §6 and pinned here so the re-run
 *  compares against the spec rather than against itself. */
const BASELINE = {
    size: 403,
    provenance: { c: 84, b: 232, seed: 70, d: 27, a: 19 } as Record<string, number>,
    hints: {
        stylesheet: 121,
        color: 84,
        value: 120,
        sheet: 13,
        "keyframe-selector": 22,
        easing: 43,
    } as Record<string, number>,
};

const preflightFailures: string[] = [];

function sha256File(path: string): string {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const liveEngineSha = sha256File(LIVE_ENGINE_PATH);
if (liveEngineSha !== LIVE_ENGINE_SHA256) {
    preflightFailures.push(
        `LIVE engine bytes moved: ${liveEngineSha} != pinned ${LIVE_ENGINE_SHA256}`,
    );
}

const taxonomy = checkTaxonomyUnmoved();
for (const failure of taxonomy.failures) preflightFailures.push(`TAXONOMY: ${failure}`);

const divergences = checkDivergenceRows();
for (const failure of divergences.failures) preflightFailures.push(`DIVERGENCES: ${failure}`);

// ── the corpus ───────────────────────────────────────────────────────────────
interface CorpusItem {
    readonly id: number;
    readonly source: string;
    readonly hint: string;
    readonly provenance: readonly string[];
}
interface Corpus {
    readonly generatedAt: string;
    readonly size: number;
    readonly provenanceCounts: Record<string, number>;
    readonly hintCounts: Record<string, number>;
    readonly c14LedgerNote: string;
    readonly items: readonly CorpusItem[];
}

const corpusSha = sha256File(CORPUS_PATH);
const corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf8")) as Corpus;

function tallyBy<T>(xs: readonly T[], key: (x: T) => readonly string[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const x of xs) for (const k of key(x)) out[k] = (out[k] ?? 0) + 1;
    return out;
}

/** RAW provenance: every composite tag as the harvester stored it. Buckets
 *  overlap (26 items carry more than one tag), so these sum above 403. */
const provenanceRaw = tallyBy(corpus.items, (it) => it.provenance);
/** The FIVE-KEY SUMMARY of W1.md §5.b, DERIVED from the raw tags rather than
 *  copied from the corpus header — finding F-3's ask, so that the spec's summary
 *  is reproducible FROM the port and not merely asserted beside it. An item
 *  counts once per leading key even when it carries two tags of that key. */
const provenanceSummary = tallyBy(corpus.items, (it) => [
    ...new Set(it.provenance.map((p) => p.split(":")[0]!)),
]);
const hintCounts = tallyBy(corpus.items, (it) => [it.hint]);

function sameMap(a: Record<string, number>, b: Record<string, number>): boolean {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
    return ka.every((k) => a[k] === b[k]);
}

if (corpus.items.length !== BASELINE.size) {
    preflightFailures.push(`corpus holds ${corpus.items.length} items, baseline ${BASELINE.size}`);
}
if (corpus.size !== BASELINE.size) {
    preflightFailures.push(`corpus header size ${corpus.size}, baseline ${BASELINE.size}`);
}
if (new Set(corpus.items.map((it) => it.id)).size !== corpus.items.length) {
    preflightFailures.push(`item ids are not unique — rows cannot be compared row-by-row`);
}
if (!sameMap(provenanceSummary, BASELINE.provenance)) {
    preflightFailures.push(
        `provenance summary moved: ${JSON.stringify(provenanceSummary)} != ${JSON.stringify(BASELINE.provenance)}`,
    );
}
if (!sameMap(provenanceSummary, corpus.provenanceCounts)) {
    preflightFailures.push(
        `corpus header provenanceCounts disagrees with the tags on its own items`,
    );
}
if (!sameMap(hintCounts, BASELINE.hints)) {
    preflightFailures.push(
        `hint map moved: ${JSON.stringify(hintCounts)} != ${JSON.stringify(BASELINE.hints)}`,
    );
}
if (!sameMap(hintCounts, corpus.hintCounts)) {
    preflightFailures.push(`corpus header hintCounts disagrees with the hints on its own items`);
}

/** Maximum bracket-nesting depth across the corpus — recorded for G-9 (unit .d),
 *  which owns the depth declaration. Published here as an INPUT, never as a G-9
 *  claim: the margin below the measured `Parser.lazy` ceiling is .d's to state. */
function nestingDepth(s: string): number {
    let depth = 0;
    let max = 0;
    for (const ch of s) {
        if (ch === "{" || ch === "(" || ch === "[") {
            depth += 1;
            if (depth > max) max = depth;
        } else if (ch === "}" || ch === ")" || ch === "]") {
            if (depth > 0) depth -= 1;
        }
    }
    return max;
}
const depths = corpus.items.map((it) => ({ id: it.id, depth: nestingDepth(it.source) }));
const maxDepthRow = depths.reduce((a, b) => (b.depth > a.depth ? b : a), depths[0]!);

// ══ THE DIFFERENTIAL — carried over unchanged from the ported original ═══════

const EPS = 1e-9;
function numEq(a: unknown, b: unknown): boolean {
    if (typeof a === "number" && typeof b === "number") {
        if (Number.isNaN(a) && Number.isNaN(b)) return true;
        return Math.abs(a - b) <= EPS + EPS * Math.max(Math.abs(a), Math.abs(b));
    }
    return a === b;
}
function coreEq(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a === "number" || typeof b === "number") return numEq(a, b);
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((x, i) => coreEq(x, b[i]));
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
        const ka = Object.keys(a).sort(),
            kb = Object.keys(b).sort();
        if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
        return ka.every((k) => coreEq(a[k], b[k]));
    }
    return false;
}

// ── semantic-core extractors ────────────────────────────────────────────────
function liveColorCore(v: any) {
    return { space: v.space, channels: [...v.channels], alpha: v.alpha };
}
function c14ColorCore(v: any) {
    return { space: v.space, channels: [...v.channels], alpha: v.alpha };
}
function liveEasingCore(v: any) {
    return v.kind === "cubic-bezier"
        ? { name: "cubic-bezier", coords: [v.x1, v.y1, v.x2, v.y2] }
        : { name: v.kind };
}
function c14EasingCore(v: any) {
    return { name: v.name, coords: [...v.coordinates] };
}
// live declaration value → comparable core (numeric for color/cubic-bezier, else null)
function liveDeclCore(name: string, value: any): any {
    if (value?.kind === "scalar" && value.payload?.type === "color")
        return { t: "color", ...liveColorCore(value.payload.value) };
    if (value?.kind === "call" && /^cubic-bezier$/i.test(value.name)) {
        const nums = value.args?.map((a: any) => a?.payload?.value);
        if (nums?.length === 4 && nums.every((n: any) => typeof n === "number"))
            return { t: "cb", coords: nums };
    }
    return null; // other declarations: live keeps a value-AST, C14 keeps raw string → incomparable by design
}
function c14DeclCore(name: string, value: any): any {
    if (value?.type === "color") return { t: "color", ...c14ColorCore(value) };
    if (value?.type === "easing") return { t: "cb", coords: [...value.coordinates] };
    return null;
}
// selector canonicalization: whitespace is insignificant around combinators
// and commas (`.a > .b` ≡ `.a>.b`; `*,\n *::before` ≡ `*,*::before`). Live
// canonicalizes; C14 preserves raw source. Normalize both to compare SEMANTICS.
function normSelector(s: string): string {
    return s
        .replace(/\s+/g, " ")
        .replace(/\s*([,>~+()])\s*/g, "$1")
        .trim();
}
// C14's declaration grammar and live differ in comment-trivia attachment;
// strip comments before comparing declaration NAME sets.
function stripComments(name: string): string {
    return name.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
}
function liveSheetCore(v: any) {
    // v is Stylesheet = readonly StylesheetItem[]; C14 only ever yields all-style rules,
    // so compare live's top-level style rules.
    const rules = (v as any[])
        .filter((r) => r.kind === "style")
        .map((r) => ({
            selector: normSelector([...r.selectors].join(",")),
            decls: Object.fromEntries(
                r.declarations.map((d: any) => [
                    stripComments(d.name),
                    liveDeclCore(d.name, d.value),
                ]),
            ),
        }));
    return rules;
}
function c14SheetCore(v: any) {
    return v.cssRules.map((r: any) => ({
        selector: normSelector(r.selectorText),
        decls: Object.fromEntries(
            Object.entries(r.declarations).map(([n, val]) => [
                stripComments(n),
                c14DeclCore(n, val),
            ]),
        ),
    }));
}
// compare sheet cores on selectors + the color/cubic-bezier declaration numerics only
function sheetCoresEq(la: any[], cb: any[]): { eq: boolean; why?: string } {
    if (la.length !== cb.length)
        return { eq: false, why: `rule-count ${la.length} vs ${cb.length}` };
    for (let i = 0; i < la.length; i++) {
        if (la[i].selector !== cb[i].selector)
            return {
                eq: false,
                why: `selector[${i}] "${la[i].selector}" vs "${cb[i].selector}"`,
            };
        const lNames = Object.keys(la[i].decls).sort(),
            cNames = Object.keys(cb[i].decls).sort();
        if (lNames.join("|") !== cNames.join("|"))
            return { eq: false, why: `decl-names[${i}] ${lNames} vs ${cNames}` };
        for (const n of lNames) {
            const lc = la[i].decls[n],
                cc = cb[i].decls[n];
            if (lc === null || cc === null) continue; // non-color/easing decl: representation differs by design
            if (!coreEq(lc, cc))
                return {
                    eq: false,
                    why: `decl[${i}].${n} ${JSON.stringify(lc)} vs ${JSON.stringify(cc)}`,
                };
        }
    }
    return { eq: true };
}

// spec oracle: is this string a VALID member of C14's OWN declared W0 shape?
// oklch W0 shape: oklch( <percentage> <number> <angle|number> [ / <alpha> ] )
function isValidC14Oklch(s: string): boolean {
    const m = s.trim().match(/^oklch\(\s*([^)]*)\)$/i); // case-sensitive-ish; C14 requires lowercase+no-space
    if (!/^oklch\(/.test(s.trim())) return false;
    if (!m) return false;
    const body = m[1]!.trim();
    const slash = body.split("/");
    if (slash.length > 2) return false;
    const comps = slash[0]!.trim().split(/\s+/);
    if (comps.length !== 3) return false;
    const [L, C, H] = comps as [string, string, string];
    const num = String.raw`[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?`;
    if (!new RegExp(`^${num}%$`).test(L)) return false; // L must be percentage
    if (!new RegExp(`^${num}$`).test(C)) return false; // chroma must be number
    if (!new RegExp(`^${num}(?:deg|grad|rad|turn)?$`).test(H)) return false; // hue angle|number
    if (slash[1] !== undefined) {
        const A = slash[1].trim();
        if (!new RegExp(`^${num}%?$`).test(A)) return false;
    }
    return true;
}
// cubic-bezier W0 shape: cubic-bezier(n,n,n,n) with x1,x2 in [0,1]
function isValidC14CubicBezier(s: string): boolean {
    const m = s.trim().match(/^cubic-bezier\((.*)\)$/i);
    if (!/^cubic-bezier\(/.test(s.trim())) return false;
    if (!m) return false;
    const parts = m[1]!.split(",").map((x) => x.trim());
    if (parts.length !== 4) return false;
    const num = String.raw`^[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?$`;
    const nums = parts.map((p) => (new RegExp(num).test(p) ? Number(p) : NaN));
    if (nums.some((n) => Number.isNaN(n))) return false;
    return nums[0]! >= 0 && nums[0]! <= 1 && nums[2]! >= 0 && nums[2]! <= 1;
}
function hasTopLevelAtRule(s: string): boolean {
    return /(^|\})\s*@[a-zA-Z]/.test(s);
}

// ── run one item ────────────────────────────────────────────────────────────
type Verdict =
    | "EXACT_CONGRUENT"
    | "STRUCT_CONGRUENT"
    | "CONGRUENT_REJECT"
    | "COVERAGE_NARROWING"
    | "OUT_OF_SCOPE"
    | "LIVE_STRICTER"
    | "DIVERGENT_VALUE"
    | "MIS_ACCEPT"
    | "FALSE_REJECT_IN_SHAPE"
    | "ENGINE_EXCEPTION";

// balanced-brace structural well-formedness — a coarse "is this even a stylesheet?"
// guard so a genuine C14 mis-accept of MALFORMED input is separated from live
// merely validating known declarations more deeply (LIVE_STRICTER).
function braceBalanced(s: string): boolean {
    let d = 0;
    for (const c of s) {
        if (c === "{") d++;
        else if (c === "}") {
            d--;
            if (d < 0) return false;
        }
    }
    return d === 0 && s.includes("{") && s.includes("}");
}

interface Row {
    id: number;
    source: string;
    hint: string;
    provenance: readonly string[];
    door: string;
    liveOk: boolean;
    c14Ok: boolean;
    verdict: Verdict;
    note?: string;
    liveCore?: any;
    c14Core?: any;
    thrower?: "LIVE" | "C14" | "BOTH";
}

function excRow(base: any, door: string, lv: any, cv: any): Row {
    const thrower: "LIVE" | "C14" | "BOTH" = !lv.ok && !cv.ok ? "BOTH" : !cv.ok ? "C14" : "LIVE";
    return {
        ...base,
        door,
        liveOk: lv.ok,
        c14Ok: cv.ok,
        verdict: "ENGINE_EXCEPTION",
        thrower,
        note: `${thrower} threw: ${cv.err ?? lv.err}`,
    };
}

function safe<T>(fn: () => T): { ok: boolean; val?: T; err?: string } {
    try {
        return { ok: true, val: fn() };
    } catch (e) {
        return { ok: false, err: e instanceof Error ? e.message : String(e) };
    }
}

const rows: Row[] = [];
const misAcceptGuardFailures: any[] = [];

for (const it of corpus.items) {
    const s: string = it.source;
    const hint: string = it.hint === "sheet" ? "stylesheet" : it.hint;
    const base = { id: it.id, source: s, hint, provenance: it.provenance };

    if (hint === "color") {
        const lv = safe(() => parseCssColor(s));
        const cv = safe(() => c14Color(s));
        if (!lv.ok || !cv.ok) {
            rows.push(excRow(base, "color", lv, cv));
            continue;
        }
        const L = lv.val as any,
            C = cv.val as any;
        const declared = isValidC14Oklch(s);
        let verdict: Verdict,
            note: string | undefined,
            liveCore,
            c14Core;
        if (L.ok && C.ok) {
            liveCore = liveColorCore(L.value);
            c14Core = c14ColorCore(C.value);
            verdict = coreEq(liveCore, c14Core) ? "STRUCT_CONGRUENT" : "DIVERGENT_VALUE";
        } else if (L.ok && !C.ok) {
            verdict = declared ? "FALSE_REJECT_IN_SHAPE" : "COVERAGE_NARROWING";
            note = declared
                ? "valid C14-oklch shape rejected by C14"
                : "out-of-C14-shape color (superset live-only)";
        } else if (!L.ok && C.ok) {
            verdict = "MIS_ACCEPT";
            note = "C14 accepted a color the live parser rejects";
        } else {
            verdict = "CONGRUENT_REJECT";
        }
        rows.push({
            ...base,
            door: "color",
            liveOk: L.ok,
            c14Ok: C.ok,
            verdict,
            note,
            liveCore,
            c14Core,
        });
        continue;
    }

    if (hint === "easing") {
        const lv = safe(() => parseTimingFunction(s));
        const cv = safe(() => c14Easing(s));
        if (!lv.ok || !cv.ok) {
            rows.push(excRow(base, "easing", lv, cv));
            continue;
        }
        const L = lv.val as any,
            C = cv.val as any;
        const declared = isValidC14CubicBezier(s);
        let verdict: Verdict,
            note: string | undefined,
            liveCore,
            c14Core;
        if (L.ok && C.ok) {
            liveCore = liveEasingCore(L.value);
            c14Core = c14EasingCore(C.value);
            verdict = coreEq(liveCore, c14Core) ? "STRUCT_CONGRUENT" : "DIVERGENT_VALUE";
        } else if (L.ok && !C.ok) {
            verdict = declared ? "FALSE_REJECT_IN_SHAPE" : "COVERAGE_NARROWING";
            note = declared
                ? "valid C14-cubic-bezier rejected by C14"
                : "non-cubic-bezier easing (superset live-only)";
        } else if (!L.ok && C.ok) {
            verdict = "MIS_ACCEPT";
            note = "C14 accepted an easing the live parser rejects";
        } else {
            verdict = "CONGRUENT_REJECT";
        }
        rows.push({
            ...base,
            door: "easing",
            liveOk: L.ok,
            c14Ok: C.ok,
            verdict,
            note,
            liveCore,
            c14Core,
        });
        continue;
    }

    if (hint === "stylesheet") {
        const lv = safe(() => liveSheet(s));
        const cv = safe(() => c14Sheet(s));
        if (!lv.ok || !cv.ok) {
            rows.push(excRow(base, "stylesheet", lv, cv));
            continue;
        }
        const L = lv.val as any,
            C = cv.val as any;
        let verdict: Verdict,
            note: string | undefined,
            liveCore,
            c14Core;
        if (L.ok && C.ok) {
            liveCore = liveSheetCore(L.value);
            c14Core = c14SheetCore(C.value);
            const cmp = sheetCoresEq(liveCore, c14Core);
            verdict = cmp.eq ? "STRUCT_CONGRUENT" : "DIVERGENT_VALUE";
            note = cmp.why;
        } else if (L.ok && !C.ok) {
            const atRule = hasTopLevelAtRule(s);
            verdict = "COVERAGE_NARROWING";
            note = atRule
                ? "C14 refuses at-rules (declared W0 boundary)"
                : "C14 narrows qualified sheet (non-oklch/non-cb decl, or grammar edge) — inspect";
        } else if (!L.ok && C.ok) {
            // C14 accepted, live rejected. If the input is structurally well-formed CSS
            // (balanced braces, real selector), C14 is CORRECT — it captures a valid
            // qualified rule with an opaque declaration value; live merely validates
            // known declarations (animation/animation-delay/custom-prop color) more
            // deeply and rejects. That is a LIVE-side strictness/limitation, NOT a
            // C14 mirror-defect. Only a malformed input C14 accepts is a true MIS_ACCEPT.
            if (braceBalanced(s)) {
                verdict = "LIVE_STRICTER";
                note =
                    "well-formed qualified rule; live over-validates a non-color/non-atf declaration — C14 opaque-passthrough is correct";
            } else {
                verdict = "MIS_ACCEPT";
                note = "C14 accepted a MALFORMED stylesheet the live parser rejects";
            }
        } else {
            verdict = "CONGRUENT_REJECT";
        }
        rows.push({
            ...base,
            door: "stylesheet",
            liveOk: L.ok,
            c14Ok: C.ok,
            verdict,
            note,
            liveCore,
            c14Core,
        });
        continue;
    }

    // value / keyframe-selector → OUT-OF-MIRROR-SCOPE. Gate check: C14 doors MUST
    // NOT mis-accept these as a color/easing.
    const lvVal = safe(() => parseCssValue(s));
    const cColor = safe(() => c14Color(s));
    const cEasing = safe(() => c14Easing(s));
    const misColor = cColor.ok && (cColor.val as any).ok;
    const misEasing = cEasing.ok && (cEasing.val as any).ok;
    let verdict: Verdict = "OUT_OF_SCOPE";
    let note = "no C14 door for this construct";
    if (misColor || misEasing) {
        verdict = "MIS_ACCEPT";
        note = `C14 ${misColor ? "parseColor" : "parseEasing"} accepted a ${hint}`;
        misAcceptGuardFailures.push({ id: it.id, source: s, hint, misColor, misEasing });
    }
    rows.push({
        ...base,
        door: hint,
        liveOk: lvVal.ok && (lvVal.val as any)?.ok,
        c14Ok: misColor || misEasing,
        verdict,
        note,
    });
}

// ── kf-seam SHAPE probe (carried over) ──────────────────────────────────────
// The keyframes consume seams in keyframes-v-exec use, against @mkbabb/value.js/css:
//   parseKeyframeSelector(start)                     — live grammar entry
//   parseStylesheet(css) + collectKeyframes(ast)     — live stylesheet entry
// C14 has NO public parseKeyframeSelector (only a non-exported percentage-only
// completeKeyframeSelector edge witness) and its parseStylesheet REFUSES @rules
// (so @keyframes cannot be seen) and it has NO collectKeyframes. We test each
// shape against whatever the assay does expose.
const kfSelectors = [
    "from",
    "to",
    "0%",
    "50%",
    "100%",
    "entry 10%",
    "exit 90%",
    "cover",
    "150%",
    "-10%",
];
const kfSeam: any[] = [];
for (const sel of kfSelectors) {
    const live = safe(() => liveKfSel(sel));
    const liveOk = live.ok && (live.val as any)?.ok;
    // C14: percentage-only edge witness (parseState), not on the public api door
    const c14 = safe(() => {
        const st = (c14KfSel as any).parseState(sel);
        return !st.isError && st.offset === sel.length;
    });
    kfSeam.push({
        selector: sel,
        liveParseKeyframeSelector: liveOk ? "accept" : "reject",
        liveValue: liveOk ? (live.val as any).value : null,
        c14CompletePercentSelector: c14.ok ? (c14.val ? "accept" : "reject") : "exception",
        c14OnPublicApi: false,
    });
}
// @keyframes stylesheet seam
const kfSheetSrc = "@keyframes pulse { from { opacity: 0; } to { opacity: 1; } }";
const liveKfSheet = safe(() => liveSheet(kfSheetSrc));
const liveKfNames =
    liveKfSheet.ok && (liveKfSheet.val as any).ok
        ? safe(() =>
              collectKeyframes((liveKfSheet.val as any).value).map((k: any) => k.rule.name),
          )
        : { ok: true, val: [] };
const c14KfSheet = safe(() => c14Sheet(kfSheetSrc));
const kfSheetSeam = {
    source: kfSheetSrc,
    liveParseStylesheet: liveKfSheet.ok && (liveKfSheet.val as any).ok ? "accept" : "reject",
    liveCollectKeyframesNames: liveKfNames.ok ? liveKfNames.val : "n/a",
    c14ParseStylesheet: c14KfSheet.ok
        ? (c14KfSheet.val as any).ok
            ? "accept"
            : "reject (refuses @rules)"
        : "exception",
    c14HasCollectKeyframes: false,
    seamServiceable:
        "NO — C14 refuses @keyframes and exposes no collectKeyframes/parseKeyframeSelector public door",
};

// ── tallies + gate ──────────────────────────────────────────────────────────
const tally: Record<string, number> = {};
for (const r of rows) tally[r.verdict] = (tally[r.verdict] ?? 0) + 1;

/** The defect predicate, carried over VERBATIM from the ported original. Note
 *  that it is STRICTER than A/B/C alone: a C14-side (or two-sided) thrown
 *  exception counts too, because an engine that dies is not an engine that
 *  agreed. A port may tighten nothing and may loosen nothing; this is the rule
 *  under which the prior GREEN was measured, so it is the rule the reproduction
 *  must run under. */
const defects = rows.filter(
    (r) =>
        r.verdict === "DIVERGENT_VALUE" ||
        r.verdict === "MIS_ACCEPT" ||
        r.verdict === "FALSE_REJECT_IN_SHAPE" ||
        (r.verdict === "ENGINE_EXCEPTION" && (r.thrower === "C14" || r.thrower === "BOTH")),
);
const exceptions = rows.filter((r) => r.verdict === "ENGINE_EXCEPTION");
const liveThrew = rows.filter((r) => r.verdict === "ENGINE_EXCEPTION" && r.thrower === "LIVE");
const liveStricter = rows.filter((r) => r.verdict === "LIVE_STRICTER");

const classCounts = {
    A: tally["DIVERGENT_VALUE"] ?? 0,
    B: tally["MIS_ACCEPT"] ?? 0,
    C: tally["FALSE_REJECT_IN_SHAPE"] ?? 0,
};
const abcClean = classCounts.A === 0 && classCounts.B === 0 && classCounts.C === 0;
const gate = preflightFailures.length === 0 && abcClean && defects.length === 0 ? "GREEN" : "RED";

const out = {
    servedModel: "claude-opus-5[1m]",
    unit: "X.P.W1.b",
    gateOfRecord: "W1.md §6 G-2",
    generatedAt: new Date().toISOString(),
    machine: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        v8: process.versions.v8,
    },
    corpus: {
        path: CORPUS_PATH,
        sha256: corpusSha,
        size: corpus.items.length,
        headerSize: corpus.size,
        generatedAt: corpus.generatedAt,
        idRange: [
            Math.min(...corpus.items.map((i) => i.id)),
            Math.max(...corpus.items.map((i) => i.id)),
        ],
        provenanceRaw,
        provenanceSummary,
        hintCounts,
        c14LedgerNote: corpus.c14LedgerNote,
        maxNestingDepth: maxDepthRow.depth,
        maxNestingDepthItemId: maxDepthRow.id,
    },
    engines: {
        live: {
            role: "LIVE — the published @mkbabb/value.js@4.0.0 tarball, vendored byte-for-byte",
            path: LIVE_ENGINE_PATH,
            sha256: liveEngineSha,
            pinned: LIVE_ENGINE_SHA256,
            note: "NOT the working-tree dist: the repository's own dist/subpaths/css.js differs from what 4.0.0 ships (parser-band G6; dist-drift is a separately ledgered finding)",
        },
        c14: {
            role: "C14 (mirror) — c14-css assay over @mkbabb/parse-that@1.0.0",
            path: C14_ENGINE_PATH,
            doors: ["parseColor (oklch-only)", "parseEasing (cubic-bezier-only)", "parseStylesheet (qualified-rules-only)"],
        },
        witness:
            "deposed pre-v4 parse-that tree — NOT RUNNABLE (equivalence.md §5): needs the retired src/units, src/utils, src/easing trees",
    },
    taxonomy: {
        authorityPath: taxonomy.authorityPath,
        verbatimBytes: Buffer.byteLength(TAXONOMY_VERBATIM, "utf8"),
        sha256: taxonomy.extractedSha256,
        unmoved: taxonomy.ok,
        mirrorDefectClasses: MIRROR_DEFECT_CLASSES,
        declaredNonDefects: DECLARED_NON_DEFECTS,
        verbatim: TAXONOMY_VERBATIM,
    },
    declaredDivergences: {
        adjudicationPath: divergences.adjudicationPath,
        adjudicationSha256: divergences.adjudicationSha256,
        ruledRows: DECLARED_DIVERGENCE_ROWS,
        preservedDissents: PRESERVED_DISSENTS,
        note: "ruled divergences and preserved dissents; NEVER summed into the defect count",
    },
    tally,
    classCounts,
    gate,
    gateDefinition:
        "GREEN iff zero DIVERGENT_VALUE + zero MIS_ACCEPT + zero FALSE_REJECT_IN_SHAPE on the frozen-surface subset (and no C14/BOTH engine exception), with the taxonomy, the engine bytes and the corpus maps all unmoved.",
    preflightFailures,
    defects: defects.map((d) => ({
        id: d.id,
        source: d.source,
        door: d.door,
        verdict: d.verdict,
        note: d.note,
        liveCore: d.liveCore,
        c14Core: d.c14Core,
    })),
    liveStricterFindings: liveStricter.map((d) => ({ id: d.id, source: d.source, note: d.note })),
    liveThrewFindings: liveThrew.map((e) => ({ id: e.id, source: e.source, note: e.note })),
    exceptions: exceptions.map((e) => ({
        id: e.id,
        source: e.source,
        thrower: e.thrower,
        note: e.note,
    })),
    misAcceptGuardFailures,
    kfSeam,
    kfSheetSeam,
    rows,
};
writeFileSync(RESULTS_PATH, `${JSON.stringify(out, null, 2)}\n`);

// ── the printed gate reading ─────────────────────────────────────────────────
console.log("=== X.P.W1.b — P-1 DIFFERENTIAL, RE-RUN IN THE FRESH ROOT ===");
console.log(`node ${process.version} · ${process.platform} ${process.arch} · pid ${process.pid}`);
console.log("");
console.log("--- corpus ---");
console.log("size", corpus.items.length);
console.log("provenance", JSON.stringify(provenanceSummary));
console.log("provenance-raw", JSON.stringify(provenanceRaw));
console.log("hints", JSON.stringify(hintCounts));
console.log("corpus sha256", corpusSha);
console.log(
    `ids 0..${Math.max(...corpus.items.map((i) => i.id))} · unique ${new Set(corpus.items.map((i) => i.id)).size} · raw provenance tags ${Object.keys(provenanceRaw).length} · multi-tag items ${corpus.items.filter((i) => i.provenance.length > 1).length}`,
);
console.log(
    `corpus max bracket-nesting depth ${maxDepthRow.depth} (item ${maxDepthRow.id}) — recorded as an INPUT to G-9, which unit .d owns; no margin is declared here`,
);
console.log("");
console.log("--- engines ---");
console.log("LIVE", LIVE_ENGINE_PATH);
console.log("     sha256", liveEngineSha, liveEngineSha === LIVE_ENGINE_SHA256 ? "== pinned" : "!= PINNED");
console.log("C14 ", C14_ENGINE_PATH);
console.log("");
console.log("--- taxonomy (equivalence.md §1, byte-for-byte) ---");
console.log("authority", taxonomy.authorityPath);
console.log(
    `extracted ${taxonomy.extractedBytes} B · sha256 ${taxonomy.extractedSha256} · ${taxonomy.ok ? "UNMOVED" : "MOVED"}`,
);
for (const cls of MIRROR_DEFECT_CLASSES) {
    console.log(`  (${cls.letter}) ${cls.name} — ${cls.definition}`);
}
for (const nd of DECLARED_NON_DEFECTS) {
    console.log(`  NON-DEFECT ${nd.name} — ${nd.why}`);
}
console.log("");
console.log("--- tally ---");
console.log(JSON.stringify(tally, null, 2));
console.log("");
console.log("--- DECLARED DIVERGENCES (ruled; NOT defects) ---");
console.log(
    `adjudication ${divergences.adjudicationPath} · sha256 ${divergences.adjudicationSha256}`,
);
console.log(
    `${DECLARED_DIVERGENCE_ROWS.length} ruled divergence rows · ${PRESERVED_DISSENTS.length} preserved DISSENTs`,
);
for (const row of DECLARED_DIVERGENCE_ROWS) {
    console.log(
        `  ${row.id}  ${row.subject}  |  published ${row.published}  |  cand-F ${row.candF}  |  cand-O ${row.candO}  ::  ${row.ruling}`,
    );
}
for (const d of PRESERVED_DISSENTS) {
    console.log(`  ${d.id}  DISSENT ${d.title} — ${d.status}`);
}
console.log("");
console.log("--- LIVE_STRICTER (live-side, declared NON-defect) ---");
for (const d of liveStricter) console.log("  ", JSON.stringify(d.source.slice(0, 80)));
console.log("--- ENGINE_EXCEPTION ---");
for (const e of exceptions) console.log("  ", e.thrower, JSON.stringify(e.source.slice(0, 80)), "::", e.note);
console.log("");
console.log("--- DEFECTS ---");
console.log("misAcceptGuardFailures:", misAcceptGuardFailures.length);
for (const d of defects)
    console.log("  DEFECT", d.verdict, d.door, JSON.stringify(d.source.slice(0, 80)), "::", d.note);
if (preflightFailures.length) {
    console.log("--- PREFLIGHT FAILURES ---");
    for (const f of preflightFailures) console.log("  ", f);
}
console.log("");
console.log(`A/B/C = ${classCounts.A}/${classCounts.B}/${classCounts.C}`);
console.log(`defects (A+B+C + C14/BOTH engine exceptions) = ${defects.length}`);
console.log("results", RESULTS_PATH);
console.log("GATE:", gate);

process.exitCode = gate === "GREEN" ? 0 : 1;
