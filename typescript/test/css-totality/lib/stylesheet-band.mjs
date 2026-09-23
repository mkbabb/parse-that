// SERVED MODEL: claude-fable-5-1
//
// X.P.W3.l — THE STYLESHEET BAND: the seventh corpus arm, GENERATED FROM THE ORACLE'S ACCEPT SET.
//
// `W3.md` `.l` (L726): "Stylesheet corpus band generated from the ORACLE's accept set (never
// hand-pinned), witnessing all ten shapes." The six arms `.a` folded carry 26,604 inputs and, of
// those, 47 that name an at-rule or nest a style body (`.k`'s remainder: 15 E-j1 at-rule · 1 E-j1
// nested) — a population that cannot witness ten families. This arm is the witness set:
//
//   * a seeded generator (the fresh root's own `mulberry32`, the cand-O idiom) composes stylesheets
//     out of a closed vocabulary, one PRIMARY SHAPE per composition, ten shapes;
//   * every composition is run through the sha-pinned 4.0.0 ORACLE at generation, and only the
//     ones it ACCEPTS are witnesses — the accept set is the oracle's, never this seat's;
//   * each witness then yields one seeded single-edit MUTATION, whose verdict G-1 reads off the
//     oracle at check time exactly as it does for every other row (a mutation is a row, not a
//     pinned rejection);
//   * NO input of this arm matches ANY adjudication class predicate (`adjudications.mjs` CLASSES):
//     the ten class POPULATIONS are pinned over the union and a drift is G-1 RED before the tally
//     (E-h2), so every generated string is filtered through the predicates themselves — a class
//     population cannot move by construction, not by the vocabulary's good behaviour.
//
// The arm THROWS if its count drifts from `DECLARED` (the `.a` law: a corpus that silently shrinks
// or grows is the one failure mode that buys a TOTAL row cheaply), and `--check` re-derives it.

import { pathToFileURL } from "node:url";

import { CLASSES } from "./adjudications.mjs";
import { PUBLISHED_400_JS } from "./pin.mjs";
import { mulberry32 } from "../../../../experiments/w2/corpus/fuzz-gen.mjs";

/** The seed, spelled once. Changing it is changing the corpus, which `DECLARED` then refuses. */
export const STYLESHEET_BAND_SEED = 0x3c1b7a5d;
/** Compositions attempted per shape; the accepted ones are the witnesses. */
export const PER_SHAPE = 24;
/** The measured arm size at this seed and this oracle — witnesses + mutations, de-duplicated. */
export const DECLARED = 470;

/** The ten shapes `W3.md` `.l` names, each with its own composer below. */
export const SHAPES = Object.freeze([
    "keyframes",
    "property",
    "function",
    "scope",
    "starting-style",
    "scroll-timeline",
    "view-timeline",
    "unknown-block",
    "unknown-statement",
    "nested-style",
]);

const oracle = await import(pathToFileURL(PUBLISHED_400_JS).href);

/* ── the vocabulary: no colour FUNCTION call, no trailing-dot number, no non-finite numeral ────── */

const SELECTORS = [".a", "#b", "nav", "a:hover", ".card > .title", "ul li", "[data-x]", "h1, h2", "*", ".x .y"];
const NESTED_SELECTORS = [".title", "&:hover", "& > span", "&.open", "img", "> li"];
const DECLARATIONS = [
    ["color", ["red", "blue", "transparent", "currentcolor", "var(--brand)"]],
    ["margin", ["0", "4px", "1em 2em", "auto", "0 auto"]],
    ["padding", ["8px", "2px 4px 6px 8px"]],
    ["opacity", ["0", "1", "0.5"]],
    ["display", ["flex", "none", "grid", "inline-block"]],
    ["width", ["100%", "50vw", "calc(100% - 8px)", "20rem"]],
    ["gap", ["8px", "1rem 2rem"]],
    ["font-weight", ["700", "bold"]],
    ["--brand", ["blue", "10px", "x"]],
    ["animation-name", ["slide", "fade, spin", "none"]],
    ["animation-duration", ["1s", "300ms", "1s, 2s"]],
    ["transition", ["all 1s ease", "opacity 200ms"]],
];
const KEYFRAME_SELECTORS = ["from", "to", "50%", "0%, 100%", "25%", "from, 50%"];
const KEYFRAME_NAMES = ["slide", "fade-in", "spin", "Pulse", "k1"];
const TIMING = ["ease", "linear", "ease-in-out", "cubic-bezier(0.1, 0.7, 1, 0.1)", "steps(4, end)"];
const PROPERTY = [
    ["--gap", '"<length>"', ["0px", "4px", "2rem"]],
    ["--tint", '"<color>"', ["red", "blue"]],
    ["--ratio", '"<number>"', ["1", "0.5"]],
    ["--any", '"*"', [null, "anything"]],
    ["--pct", '"<percentage>"', ["50%"]],
    ["--n", '"<integer>"', ["3"]],
];
const FUNCTIONS = [
    ["--f(--a)", "result: var(--a)"],
    ["--g(--a, --b <length>: 4px)", "result: calc(var(--a) + var(--b))"],
    ["--h()", "result: 1"],
    ["--sum(--x <number>, --y <number>)", "result: calc(var(--x) + var(--y)); --z: 2"],
];
const SCOPES = ["(.card)", "(.card) to (.content)", "", "(#main, .aside)"];
const AT_BLOCK_PRELUDES = [
    "@media (min-width: 600px)",
    "@media screen and (max-width: 600px)",
    "@supports (display: grid)",
    "@layer base",
    "@container (width > 400px)",
    "@font-face",
    "@page :first",
    "@document url(x)",
];
const AT_STATEMENTS = ['@charset "utf-8";', "@import url(x.css);", "@layer base, theme;", "@namespace svg url(http://www.w3.org/2000/svg);", "@import 'y.css' screen;"];
const TRIVIA = ["", " ", "\n", "  ", ";", "\n  ", "/* c */ ", " /* note */"];

/* ── the composer ──────────────────────────────────────────────────────────────────────────── */

const composer = (rng) => {
    const pick = (list) => list[Math.floor(rng() * list.length)];
    const count = (min, max) => min + Math.floor(rng() * (max - min + 1));
    const trivia = () => pick(TRIVIA);

    const declaration = () => {
        const [name, values] = pick(DECLARATIONS);
        const important = rng() < 0.15 ? " !important" : "";
        return `${name}: ${pick(values)}${important}`;
    };
    const declarations = (n) => Array.from({ length: n }, declaration).join(pick(["; ", ";\n  ", "; ", ";"]));
    const styleRule = () => `${pick(SELECTORS)} { ${declarations(count(0, 3))}${rng() < 0.3 ? ";" : ""} }`;
    const nestedRule = (depth) => {
        const items = [];
        const n = count(1, 3);
        for (let k = 0; k < n; k++) {
            const r = rng();
            if (r < 0.45 || depth >= 2) items.push(declaration());
            else if (r < 0.85) items.push(`${pick(NESTED_SELECTORS)} { ${depth < 2 ? nestedRule(depth + 1) : declarations(count(1, 2))} }`);
            else items.push(`${pick(AT_BLOCK_PRELUDES)} { ${styleRule()} }`);
        }
        return items.join(pick(["; ", " ", ";\n  "]));
    };
    const keyframeBlock = () => {
        const decls = [declaration()];
        if (rng() < 0.4) decls.push(`animation-timing-function: ${pick(TIMING)}`);
        if (rng() < 0.2) decls.push(`animation-composition: ${pick(["add", "replace", "accumulate"])}`);
        return `${pick(KEYFRAME_SELECTORS)} { ${decls.join("; ")} }`;
    };

    const byShape = {
        keyframes: () => {
            const blocks = Array.from({ length: count(1, 3) }, keyframeBlock);
            return `@keyframes ${pick(KEYFRAME_NAMES)} {${trivia()}${blocks.join(` ${trivia()}`)}${trivia()}}`;
        },
        property: () => {
            const [name, syntax, initials] = pick(PROPERTY);
            const initial = pick(initials);
            const rows = [`syntax: ${syntax}`, `inherits: ${pick(["true", "false", "TRUE"])}`];
            if (initial !== null) rows.push(`initial-value: ${initial}`);
            return `@property ${name} { ${rows.join("; ")}${rng() < 0.3 ? ";" : ""} }`;
        },
        function: () => {
            const [signature, body] = pick(FUNCTIONS);
            return `@function ${signature} { ${body} }`;
        },
        scope: () => `@scope ${pick(SCOPES)} {${trivia()}${Array.from({ length: count(0, 2) }, styleRule).join(" ")}${trivia()}}`,
        "starting-style": () => `@starting-style {${trivia()}${Array.from({ length: count(0, 2) }, styleRule).join(" ")}${trivia()}}`,
        "scroll-timeline": () => {
            const rows = [];
            if (rng() < 0.7) rows.push(`source: ${pick(["auto", "selector(#a)", "none"])}`.replace("selector(#a)", "auto"));
            if (rng() < 0.7) rows.push(`orientation: ${pick(["block", "inline", "vertical", "horizontal"])}`);
            return `@scroll-timeline ${pick(["--t", "--scroller", "--s1"])} { ${rows.join("; ")} }`;
        },
        "view-timeline": () => {
            const rows = [];
            if (rng() < 0.7) rows.push(`subject: ${pick(["auto", "none"])}`);
            if (rng() < 0.7) rows.push(`axis: ${pick(["block", "inline", "x", "y"])}`);
            if (rng() < 0.5) rows.push(`inset: ${pick(["10px", "auto", "10px 20px"])}`);
            return `@view-timeline ${pick(["--v", "--viewer"])} { ${rows.join("; ")} }`;
        },
        "unknown-block": () => {
            const body = rng() < 0.7 ? Array.from({ length: count(0, 2) }, styleRule).join(" ") : `font-family: x; ${declaration()}`;
            return `${pick(AT_BLOCK_PRELUDES)} {${trivia()}${body}${trivia()}}`;
        },
        "unknown-statement": () => pick(AT_STATEMENTS),
        "nested-style": () => `${pick(SELECTORS)} {${trivia()}${nestedRule(0)}${trivia()}}`,
    };

    /** One composition: the primary shape's item, with up to two neighbours and trivia around it. */
    const compose = (shape) => {
        const items = [byShape[shape]()];
        const extra = count(0, 2);
        for (let k = 0; k < extra; k++) {
            const r = rng();
            const neighbour = r < 0.6 ? styleRule() : byShape[pick(SHAPES)]();
            if (rng() < 0.5) items.push(neighbour);
            else items.unshift(neighbour);
        }
        return `${trivia()}${items.join(pick(["\n", " ", "\n\n", " ; "]))}${trivia()}`;
    };

    /** One single-edit mutation of a witness — a deletion, a duplication, an insertion or a swap. */
    const mutate = (src) => {
        const at = Math.floor(rng() * src.length);
        const op = rng();
        if (op < 0.35) return src.slice(0, at) + src.slice(at + 1);
        if (op < 0.55) return src.slice(0, at) + src[at] + src.slice(at);
        if (op < 0.8) return src.slice(0, at) + pick([";", "{", "}", ",", ":", " ", "@", "/*", "*/"]) + src.slice(at);
        return src.slice(0, at) + (src[at] === "{" ? "}" : src[at] === "}" ? "{" : ";") + src.slice(at + 1);
    };

    return { compose, mutate };
};

/** True iff no adjudication class predicate matches `src` — the E-h2 population guard, by construction. */
export const classFree = (src) => !CLASSES.some((klass) => klass.matches(src));

/**
 * The band: for each shape, `PER_SHAPE` compositions, the oracle-accepted ones kept as witnesses,
 * one class-free mutation per witness. Deterministic in the seed and the pinned oracle.
 */
export function generateStylesheetBand() {
    const rng = mulberry32(STYLESHEET_BAND_SEED);
    const { compose, mutate } = composer(rng);
    const witnesses = [];
    const mutations = [];
    const rejectedAtGeneration = [];
    for (const shape of SHAPES) {
        for (let k = 0; k < PER_SHAPE; k++) {
            const src = compose(shape);
            if (!classFree(src)) continue;
            let verdict;
            try {
                verdict = oracle.parseStylesheet(src);
            } catch (fault) {
                verdict = { ok: false, threw: String(fault?.message ?? fault) };
            }
            if (verdict.ok !== true) {
                rejectedAtGeneration.push({ shape, src });
                continue;
            }
            witnesses.push({ shape, src });
            for (let attempt = 0; attempt < 8; attempt++) {
                const mutant = mutate(src);
                if (mutant !== src && classFree(mutant)) {
                    mutations.push({ shape, src: mutant });
                    break;
                }
            }
        }
    }
    return { witnesses, mutations, rejectedAtGeneration };
}

/** The arm, in the shape `corpus.mjs` folds: `{ id, provenance, declared, inputs }`. */
export const stylesheetBand = () => {
    const band = generateStylesheetBand();
    const inputs = [...new Set([...band.witnesses, ...band.mutations].map((row) => row.src))];
    if (inputs.length !== DECLARED) {
        throw new Error(
            `corpus: the stylesheet band read ${inputs.length} inputs, the declared count is ${DECLARED} ` +
                `(witnesses ${band.witnesses.length}, mutations ${band.mutations.length}) — the seed, the vocabulary ` +
                `or the oracle moved; re-derive the count, never trim the band`,
        );
    }
    const perShape = Object.fromEntries(SHAPES.map((shape) => [shape, band.witnesses.filter((row) => row.shape === shape).length]));
    const missing = SHAPES.filter((shape) => perShape[shape] === 0);
    if (missing.length > 0) throw new Error(`corpus: the stylesheet band has no oracle-accepted witness for [${missing.join(", ")}]`);
    return {
        id: "stylesheet-band",
        provenance:
            `typescript/test/css-totality/lib/stylesheet-band.mjs — mulberry32 seed 0x${STYLESHEET_BAND_SEED.toString(16)}, ` +
            `${SHAPES.length} shapes × ${PER_SHAPE} compositions; ${band.witnesses.length} witnesses ACCEPTED by the sha-pinned 4.0.0 oracle ` +
            `(${band.rejectedAtGeneration.length} compositions it refused are not rows) + ${band.mutations.length} single-edit mutations; ` +
            `every row class-free under adjudications.mjs CLASSES; witnesses per shape ${JSON.stringify(perShape)}`,
        declared: DECLARED,
        inputs,
        perShape,
    };
};
