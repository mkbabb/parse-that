// SERVED MODEL: claude-fable-5-1
//
// X.P.W3.l — the at-rule and nesting families' own fixture: the ten shapes `W3.md` `.l` names in
// the 22-op algebra (`algebra/grammar/stylesheet.mjs` L-1 … L-6), completed on the surface
// (`entry.mjs` `completerOver`), the eleven CTOR rows this unit added closed across their four
// realizations (E-h1), the K-10 label law, E-j2, F-k2 and F-k3.
//
//   npx vitest run --config typescript/test/css-recovery/vitest.config.ts test/css-recovery/at-rule-grammar.test.ts
//
// Every parser row runs through BOTH lowerings and is asserted byte-identical (G-5's law at the
// fixture's scale), with the shield's ledger read before and after (G-3: `SHIELD.caught` moves by
// zero). EVERY ROW BELOW QUOTES THE INCUMBENT: the verdicts and values were read off the sha-pinned
// 4.0.0 oracle before they were written down (`evidence/W3/at-rule-family-2026-09-19.txt`); where
// the two part, the row says so and names the declared class (SH-1 · SH-4 · RT-1 · DEPTH).

import { describe, expect, it } from "vitest";

import { AT_DECLARATION_KINDS, L, R_cls, R_ctor, R_kw } from "../../src/css/algebra/tables.mjs";
import { THETA } from "../../src/css/bounds.mjs";
import { PRODUCTION_LABELS } from "../../src/css/diagnostics.mjs";
import { SHIELD, collectKeyframes, collectPropertyDescriptors, loadPublicSurfaces } from "../../src/css/entry.mjs";

type Issue = { code: string; start: number; end: number; expected: string[]; actual: string | null };
type Result = { ok: boolean; value?: unknown; diagnostics?: Issue[] };
type Surface = Record<string, (argument: unknown, extra?: unknown) => Result>;

const surfaces = (await loadPublicSurfaces()) as unknown as { js: Surface; wasm: Surface };
const LEDGER_AT_LOAD = SHIELD.caught;

/** One row on both lowerings, asserted identical, and the JS answer returned for the row's own assertion. */
const both = (entry: string, source: unknown): Result => {
    const js = surfaces.js[entry](source);
    const wasm = surfaces.wasm[entry](source);
    expect(JSON.stringify(wasm), `${entry}(${JSON.stringify(source)}) differs across lowerings`).toBe(JSON.stringify(js));
    return js;
};
const sheet = (source: unknown) => both("parseStylesheet", source);
const items = (source: string) => sheet(source).value as Record<string, unknown>[];
const first = (source: string) => items(source)[0];
const keyword = (value: string) => ({ kind: "scalar", payload: { type: "keyword", value } });
const red = { kind: "scalar", payload: { type: "color", value: { space: "rgb", channels: [255, 0, 0], alpha: 1 } } };
const decl = (name: string, value: unknown, important = false) => ({ name, value, important });

const UNIT_ROWS = [
    "style-rule-mixed", "at-keyframes", "keyframe-rule", "at-declarations", "at-scope", "at-starting-style",
    "at-unknown-block", "at-unknown-stmt", "raw-text", "raw-block", "animation-property",
];

/* ── 1. the keyframes family ─────────────────────────────────────────────────────────────────── */

describe("@keyframes — `startsWith(\"@keyframes \")`, blocks of `parseDeclarations`, timing and composition", () => {
    it("a keyframes rule with two blocks, selectors through parseKeyframeSelector", () => {
        //  the oracle: name `k`, `from` → {kind:"percent", value:0}, `to` → {kind:"percent", value:1}
        expect(first("@keyframes k { from { color: red } to { opacity: 0 } }")).toEqual({
            kind: "keyframes",
            name: "k",
            rules: [
                { selectors: [{ kind: "percent", value: 0 }], declarations: [decl("color", red)] },
                { selectors: [{ kind: "percent", value: 1 }], declarations: [decl("opacity", { kind: "scalar", payload: { type: "number", value: 0, unit: "" } })] },
            ],
        });
    });

    it("the head is case-folded and the name is trimmed; ONE space is the dispatch's own byte", () => {
        expect(first("@KEYFRAMES Foo { FROM { color: red } }").name).toBe("Foo");
        expect(first("@keyframes  x {}")).toEqual({ kind: "keyframes", name: "x", rules: [] });
        //  the oracle: `@keyframes\tx {}` does NOT start with "@keyframes " and is an UNKNOWN at-rule
        expect(first("@keyframes\tx {}").kind).toBe("unknown");
        //  the oracle: `@keyframes {}` has no name and is unknown too (`startsWith` fails after the trim)
        expect(first("@keyframes {}")).toEqual({ kind: "unknown", atName: "keyframes", prelude: "", body: "", children: [] });
    });

    it("an empty keyframe prelude is the empty selector list; a statement inside the body is refused", () => {
        expect(first("@keyframes k { , { } }").rules).toEqual([{ selectors: [], declarations: [] }]);
        expect(sheet("@keyframes k { x; }").ok).toBe(false);
    });

    it("timing and composition come off the block's own cascade through THIS surface's parseTimingFunction", () => {
        const rule = (first("@keyframes k { from { animation-timing-function: ease; animation-composition: add } }").rules as Record<string, unknown>[])[0];
        expect(rule.timingFunction).toEqual({ kind: "keyword", name: "ease" });
        expect(rule.composition).toBe("add");
        //  a timing LIST is not a timing function: the oracle refuses the sheet
        expect(sheet("@keyframes k { from { animation-timing-function: ease, linear } }").ok).toBe(false);
    });

    it("comments are trivia inside the keyframes body, never inside a keyframe block (plain parseDeclarations)", () => {
        expect(first("@keyframes k { from { color: red } /* c */ }").rules).toHaveLength(1);
        expect(sheet("@keyframes k { from { color: red; /* c */ } }").ok).toBe(false);
    });

    it("collectKeyframes walks the tree the parser produced", () => {
        const tree = items("a { color: red } @keyframes k { to { color: red } }");
        expect(collectKeyframes(tree).map((row) => row.path)).toEqual([[1]]);
    });
});

/* ── 2. the descriptor families ─────────────────────────────────────────────────────────────── */

describe("@property / @function / @scroll-timeline / @view-timeline — `parseDeclarations` and the descriptor checks", () => {
    it("@property: syntax + inherits + initial-value, coerced through THIS surface", () => {
        expect(first('@property --x { syntax: "<length>"; inherits: false; initial-value: 1px }')).toEqual({
            kind: "property",
            name: "--x",
            descriptor: { syntax: "<length>", inherits: false, initialValue: { kind: "scalar", payload: { type: "number", value: 1, unit: "px" } } },
        });
        expect(first('@property --x { syntax: "*"; inherits: true }').descriptor).toEqual({ syntax: "*", inherits: true });
        expect(collectPropertyDescriptors(items('@property --x { syntax: "*"; inherits: true }')).map((row) => row.path)).toEqual([[0]]);
    });

    it("@property refusals, each the oracle's: the name, the two required descriptors, the missing initial value", () => {
        expect(sheet("@property x { syntax: \"*\"; inherits: true }").ok).toBe(false);
        expect(sheet("@property --x {}").ok).toBe(false);
        expect(sheet('@property --x { syntax: "<length>"; inherits: true }').ok).toBe(false);
        const bad = sheet('@property --x { syntax: "<bogus>"; inherits: true }');
        expect(bad.ok).toBe(false);
        expect(bad.diagnostics?.[0].code).toBe("syntax_descriptor_invalid");
    });

    it("@function: the signature's parameters, defaults through parseCssValue, `result` off the body", () => {
        expect(first("@function --f(--a, --b <length>: 1px) { result: calc(var(--a)) }")).toEqual({
            kind: "function",
            name: "--f",
            descriptor: {
                parameters: [
                    { name: "--a" },
                    { name: "--b", syntax: "<length>", default: { kind: "scalar", payload: { type: "number", value: 1, unit: "px" } } },
                ],
                result: { kind: "call", name: "calc", args: [{ kind: "call", name: "var", args: [keyword("--a")] }] },
                declarations: [decl("result", { kind: "call", name: "calc", args: [{ kind: "call", name: "var", args: [keyword("--a")] }] })],
            },
        });
        expect(sheet("@function --f {}").ok).toBe(false);
    });

    it("the two timeline families: named descriptors, serialized", () => {
        expect(first("@scroll-timeline --t { source: auto }")).toEqual({ kind: "scroll-timeline", name: "--t", descriptor: { source: "auto" } });
        expect(first("@view-timeline --v { }")).toEqual({ kind: "view-timeline", name: "--v", descriptor: {} });
        expect(sheet("@view-timeline --v { subject: selector(#a) }").ok).toBe(false);
    });

    it("the dispatch is the head's maximal ident run: `@propertyx` and `@property\\t` are unknown at-rules", () => {
        expect(first("@propertyx --x {}").kind).toBe("unknown");
        expect(first("@property\t--x {}").kind).toBe("unknown");
        expect(AT_DECLARATION_KINDS).toEqual(["property", "function", "scroll-timeline", "view-timeline"]);
        expect(Object.keys(R_kw["at-rule-name"].rows)).toEqual(AT_DECLARATION_KINDS);
    });
});

/* ── 3. the nested families ─────────────────────────────────────────────────────────────────── */

describe("@scope / @starting-style — nested bodies of rules", () => {
    it("@scope: `(root)` and `to (limit)`, the prefix dispatch, the empty prelude", () => {
        expect(first("@scope (.a) to (.b) { a { color: red } }")).toEqual({
            kind: "scope",
            root: [".a"],
            limit: [".b"],
            children: [{ kind: "style", selectors: ["a"], declarations: [decl("color", red)] }],
        });
        expect(first("@scope { }")).toEqual({ kind: "scope", children: [] });
        //  `startsWith("@scope")` is a PREFIX: `@scoped {}` is a scope rule whose prelude `d` is refused
        expect(sheet("@scoped {}").ok).toBe(false);
        expect(sheet("@scope { color: red }").ok).toBe(false);
    });

    it("@starting-style: exact head, a body or a named refusal; anything else is unknown", () => {
        expect(first("@Starting-Style { a { opacity: 0 } }").kind).toBe("starting-style");
        expect(sheet("@starting-style;").ok).toBe(false);
        expect(sheet("@starting-style").ok).toBe(false);
        expect(first("@starting-style x {}").kind).toBe("unknown");
    });

    it("a nested body's prelude never reaches the parent's closing brace", () => {
        //  measured before the nested prelude class was split (L-4): the second at-rule was
        //  swallowed as a nested selector and the parent lost its `}`
        expect(items("@starting-style {\n  }\n@keyframes s { from { opacity: 1 } }").map((item) => item.kind)).toEqual(["starting-style", "keyframes"]);
        expect(items("@keyframes p { 50% { margin: 0 } }\n\n@scope (#main, .aside) { }").map((item) => item.kind)).toEqual(["keyframes", "scope"]);
    });
});

/* ── 4. the unknown at-rule and the raw body ────────────────────────────────────────────────── */

describe("the unknown at-rule — `atName` to the first U+0020, the raw brace-balanced body, the re-read children", () => {
    it("a block: body text byte for byte, children when the body re-parses", () => {
        expect(first("@media x { a { color: red } }")).toEqual({
            kind: "unknown",
            atName: "media",
            prelude: "x",
            body: " a { color: red } ",
            children: [{ kind: "style", selectors: ["a"], declarations: [decl("color", red)] }],
        });
        expect(first("@media { }")).toEqual({ kind: "unknown", atName: "media", prelude: "", body: " ", children: [] });
        //  `url("a{b}")` does not re-parse: the body is kept, the children are absent
        expect(first('@font-face { src: url("a{b}") }')).not.toHaveProperty("children");
    });

    it("a statement: `body: null`; an unterminated statement is refused", () => {
        expect(first("@import url(x);")).toEqual({ kind: "unknown", atName: "import", prelude: "url(x)", body: null });
        expect(sheet("@import url(x)").ok).toBe(false);
    });

    it("the name split is the oracle's: the first U+0020 of the trimmed `@…` text, the rest untrimmed on the left", () => {
        expect(first("@x\t {}").atName).toBe("x");
        expect(first("@x  y  {}").prelude).toBe(" y");
        expect(first("@{}").atName).toBe("");
        expect(first("@ media {}")).toMatchObject({ atName: "", prelude: "media" });
    });

    it("nested raw blocks: doubled braces read by the dropped LIT arm, the span recovered (L-3)", () => {
        expect(first("@media x {{}{{}}}").body).toBe("{}{{}}");
        expect(sheet("@media {{}}}").ok).toBe(false);
    });

    it("RT-1, declared: the raw body is not quote-aware, so a `}` inside a string closes it early", () => {
        //  the oracle ACCEPTS this with body ` a { b: "}" } `; the candidate refuses (the SH-1 posture at the body)
        expect(sheet('@media x { a { b: "}" } }').ok).toBe(false);
    });
});

/* ── 5. the nested style body (L-4) ─────────────────────────────────────────────────────────── */

describe("nested style bodies — declarations first, then the mixed reading", () => {
    it("a nested rule is a child; declarations before and after it are declarations", () => {
        expect(first("a { color: red; b { x: y } }")).toEqual({
            kind: "style",
            selectors: ["a"],
            declarations: [decl("color", red)],
            children: [{ kind: "style", selectors: ["b"], declarations: [decl("x", keyword("y"))] }],
        });
        expect(first("{ color: red }").selectors).toEqual([]);
    });

    it("a statement is a declaration only when it ends at `;`, `}` or the end — `b:hover {` is a rule", () => {
        expect((first("a { b:hover { color: red } }").children as Record<string, unknown>[])[0].selectors).toEqual(["b:hover"]);
        expect((first("a { color: red { } }").children as Record<string, unknown>[])[0].selectors).toEqual(["color: red"]);
        expect((first("a { x: {} }").children as Record<string, unknown>[])[0].selectors).toEqual(["x:"]);
    });

    it("F-k3 cured: a comment inside a declaration block is trivia in the mixed reading, a name in the first", () => {
        expect(first("a { color: red; /* c */ }")).toEqual({ kind: "style", selectors: ["a"], declarations: [decl("color", red)] });
        expect(first("a { /* c */ }")).toEqual({ kind: "style", selectors: ["a"], declarations: [] });
        //  the oracle's own reading of a comment BEFORE the first colon: it is part of the name
        expect((first("a { /* c */ color: red }").declarations as { name: string }[])[0].name).toBe("/* c */ color");
    });

    it("SH-4, declared: a name spanning braces is one declaration at the oracle and a rule + a declaration here", () => {
        //  the oracle: ONE declaration named `x { } color` (every byte before the first colon of the
        //  `;`-split part); the candidate's `decl-name` excludes braces (J-2), so the same bytes are a
        //  nested rule `x` and a declaration `color`. The verdict agrees; the value is the class's.
        const rule = first("a { x { } color: red } b { }");
        expect(rule.declarations).toEqual([decl("color", red)]);
        expect((rule.children as { selectors: string[] }[]).map((child) => child.selectors)).toEqual([["x"]]);
    });

    it("nested at-rules are children; a nested rule refused is the sheet refused", () => {
        expect((first("a { @media x { b { y: z } } }").children as Record<string, unknown>[])[0].kind).toBe("unknown");
        expect(sheet("a { x; b {} }").ok).toBe(false);
    });
});

/* ── 6. E-j2 · F-k2 · the animation declaration body ───────────────────────────────────────── */

describe("E-j2 — splitSelectors drops empty parts in BOTH lowerings", () => {
    it("`a, , b` is [a, b] and `, ` is []", () => {
        expect(first("a, , b { }").selectors).toEqual(["a", "b"]);
        expect(first(", { }").selectors).toEqual([]);
        expect(first("a,b, { }").selectors).toEqual(["a", "b"]);
    });
});

describe("F-k2 — MEASURED and RE-CHARACTERIZED (F-l1): the legacy forms are X.P.W3.h's, unchanged", () => {
    it("the ORACLE and the rulings both accept mixed-type and `none` three-argument legacy forms; so does the candidate", () => {
        const c = (source: string) => both("parseCssColor", source).value;
        //  the oracle (measured): rgb(10, 20%, 30) → [10, 51, 30]; rgb(none, 20, 30) → [none, 20, 30]
        expect(c("rgb(10, 20%, 30)")).toEqual({ space: "rgb", channels: [10, 51, 30], alpha: 1 });
        expect(c("rgb(none, 20, 30)")).toEqual({ space: "rgb", channels: ["none", 20, 30], alpha: 1 });
        //  PB-01/02 (ruled): a four-argument form with a well-formed alpha — `none` included — parses
        expect(c("rgb(10, 20, 30, .5)")).toEqual({ space: "rgb", channels: [10, 20, 30], alpha: 0.5 });
        expect(c("rgb(58%, 14%, .816, none)")).toEqual({ space: "rgb", channels: [147.9, 35.7, 0.816], alpha: "none" });
        //  SP-1 (ruled): the legacy hsl form admits no bare number for saturation or lightness
        expect(both("parseCssColor", "hsl(10, 10, 10)").ok).toBe(false);
    });

    it("the nine F-k2 cells are four-argument forms with a NON-FINITE alpha — GROUND-C's per-cell case, not a form rule", () => {
        //  the candidate clamps the alpha (PB-04/05) and accepts; the oracle rejects the four-argument
        //  form; no single ruling repairs the cell (`grammar.mjs`, the F-k2 note). Held, and reported.
        expect(both("parseCssColor", "rgb(.843, -0, +54, 5e498)")).toMatchObject({ ok: true, value: { alpha: 1 } });
        expect(both("parseCssColor", "rgb(none, 6e167, 27%, 6e316)")).toMatchObject({ ok: true, value: { alpha: 1 } });
    });
});

describe("L-6 — an animation declaration's blank comma part is refused by the grammar", () => {
    it("`emptyComma`: blank between, before, after; a non-animation name keeps the list", () => {
        for (const source of ["a { animation-name: a,,b }", "a { animation-name: a, }", "a { animation-name: a, ,b }", "a { animation-name: }", "a { animation: none, }"]) {
            const r = sheet(source);
            expect(r.ok, source).toBe(false);
        }
        expect((first("a { x: a,,b }").declarations as { value: { items: unknown[] } }[])[0].value.items).toHaveLength(2);
        expect(first("a { animation: none, none }").declarations).toHaveLength(1);
        //  the option checks after the value: a negative duration is refused; `view(x)` is a timeline
        //  (`x` is an axis) and the oracle ACCEPTS it, as does the candidate
        expect(sheet("a { animation-duration: -1s }").ok).toBe(false);
        expect(sheet("a { animation-timeline: view(x) }").ok).toBe(true);
    });
});

/* ── 7. the CTOR quartet, the label surface (K-10), the depth bound ────────────────────────── */

describe("the CTOR family — every X.P.W3.l row of R_ctor answers in all four realizations", () => {
    it("the eleven rows are the registry's, and the four name-sets agree (bounds.mjs HALTS the import otherwise)", () => {
        //  E-h1: `bounds.mjs` asserts R_ctor · js-alg CTORS · wasm-alg emitCtors · CTOR_ALLOC /
        //  CTOR_SCRATCH_CELLS carry the SAME names at load (N=N=N=N, a HALT). This suite importing
        //  `entry.mjs` at all is that proof; the witness rows above construct each row on both lowerings.
        for (const row of UNIT_ROWS) expect(R_ctor[row]?.since, row).toBe("X.P.W3.l");
        expect(Object.keys(R_ctor).filter((row) => R_ctor[row].since === "X.P.W3.l")).toEqual(UNIT_ROWS);
        expect(THETA.depthBound).toBe(64);
    });

    it("K-10 — `<string>` and the capacity labels did not move, and every new label has a named production", () => {
        expect(L.indexOf("<string>")).toBe(50);
        expect(L[51]).toMatch(/^input <= \d+$/);
        const mine = Object.values(R_cls).filter((cls) => cls.since === "X.P.W3.l").map((cls) => cls.label);
        expect(mine).toEqual(["<space>", "at-rule body text", "'{'", "'}'", "at-rule end", "animation list item"]);
        for (const label of [...mine, "<at-rule-name>", "'@'", "'keyframes'", "'scope'", "'starting-style'", "<starting-style-body>"]) {
            expect(L, label).toContain(label);
            expect(typeof PRODUCTION_LABELS[label], label).toBe("string");
        }
        expect(L.indexOf("'@'")).toBeGreaterThan(51);
    });

    it("DEPTH, declared — nesting past Θ.depthBound is an ordinary rejection, in both lowerings; under it, a rule", () => {
        //  `nested-rule` and `raw-block` are REF targets: 64 levels is the bound. The rejection's
        //  first expectation is the FARTHEST failure's (§5.6), which for a style body is the
        //  declaration read at the deepest `a {` — the depth label is raised one byte earlier and
        //  is not the farthest; the code is the frozen `css_syntax` either way (DC-1's posture).
        const nest = (n: number) => `${"a {".repeat(n)}${" }".repeat(n)}`;
        expect(sheet(nest(60)).ok).toBe(true);
        const r = sheet(nest(70));
        expect(r.ok).toBe(false);
        expect(r.diagnostics?.[0].code).toBe("css_syntax");
        expect(sheet(`@media x {${"{".repeat(60)}${"}".repeat(60)}}`).ok).toBe(true);
        expect(sheet(`@media x {${"{".repeat(70)}${"}".repeat(70)}}`).ok).toBe(false);
    });
});

describe("G-3 at the fixture's scale", () => {
    it("the shield's ledger did not move across any row above", () => {
        expect(SHIELD.caught).toBe(LEDGER_AT_LOAD);
    });
});
