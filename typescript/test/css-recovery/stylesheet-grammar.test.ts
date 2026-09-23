// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.j — the stylesheet family's own fixture: `P:stylesheet` in the 22-op algebra after the
// five moves `algebra/grammar/stylesheet.mjs` states (J-1 … J-6), the one CTOR row this unit added
// closed across its four realizations, and the five collectors on `entry.mjs`.
//
//   npx vitest run --config typescript/test/css-recovery/vitest.config.ts test/css-recovery/stylesheet-grammar.test.ts
//
// Every parser row runs through BOTH lowerings and is asserted byte-identical (G-5's law at the
// fixture's scale), with the shield's ledger read before and after (G-3: `SHIELD.caught` moves by
// zero — no row here is answered by the shield). The five collectors are asserted over a tree the
// parser itself produced, and at their degenerate boundary, because their declared return is an
// array or a Map and a throw there is the R1 class under another name (`W3.md` §2a).
//
// EVERY ROW BELOW QUOTES THE INCUMBENT. The verdicts asserted here were read off the sha-pinned
// 4.0.0 oracle before they were written down; where the two part, the row says so and names the
// declared divergence class from the grammar module's header (SH-1 · SH-2 · SH-3).

import { describe, expect, it } from "vitest";

import { L, R_cls, R_ctor } from "../../src/css/algebra/tables.mjs";
import { PRODUCTION_LABELS } from "../../src/css/diagnostics.mjs";
import {
    SHIELD,
    collectCustomFunctions,
    collectDeclarations,
    collectKeyframes,
    collectPropertyDescriptors,
    collectStyleRules,
    loadPublicSurfaces,
} from "../../src/css/entry.mjs";

type Issue = { code: string; start: number; end: number; expected: string[]; actual: string | null };
type Result = { ok: boolean; value?: unknown; diagnostics?: Issue[] };
type Surface = Record<string, (argument: unknown) => Result>;

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
const decls = (result: Result) =>
    (result.value as { declarations: { name: string; value: unknown; important: boolean }[] }[])[0].declarations;
const names = (result: Result) => decls(result).map((d) => d.name);

/* ── 1. J-1 — a declaration's value is the VALUE GRAMMAR, not a colour ───────────────────────── */

describe("J-1 the declaration value is `REF(\"value-body\")`", () => {
    it("a custom-property reference is a value, where the slice demanded a colour", () => {
        //  the oracle: ok, one style rule, `background-color` a `var()` call
        const r = sheet("a { background-color: var(--a) }");
        expect(r.ok).toBe(true);
        expect(decls(r)[0]).toEqual({
            name: "background-color",
            value: { kind: "call", name: "var", args: [{ kind: "scalar", payload: { type: "keyword", value: "--a" } }] },
            important: false,
        });
    });

    it("a space list, a comma list and a bare keyword are all declaration values", () => {
        expect((decls(sheet("a { margin: 1px 2px }"))[0].value as { kind: string }).kind).toBe("list");
        expect((decls(sheet("a { font-family: x, y }"))[0].value as { kind: string }).kind).toBe("list");
        expect(decls(sheet("a { display: block }"))[0].value).toEqual({ kind: "scalar", payload: { type: "keyword", value: "block" } });
    });

    it("a colour value still reads as a colour — the slice's own product, unmoved", () => {
        const payload = (decls(sheet("a { color: red }"))[0].value as { payload: { type: string } }).payload;
        expect(payload.type).toBe("color");
    });

    it("`!important` is carried as a value, not as a match (the slice's PURE true/false)", () => {
        expect(decls(sheet("a { color: red !important }"))[0].important).toBe(true);
        expect(decls(sheet("a { color: red }"))[0].important).toBe(false);
    });
});

/* ── 2. J-2 — the name is every byte before the first colon, trimmed and lowercased ──────────── */

describe("J-2 the declaration name is TEXT, not an ident", () => {
    it("the six shapes the corpus witnesses, each one the incumbent's own name", () => {
        expect(names(sheet("a { backgrou(d-color: red }"))).toEqual(["backgrou(d-color"]);
        expect(names(sheet("a { border-co+or: blue }"))).toEqual(["border-co+or"]);
        expect(names(sheet("a { ,ackground-color: red }"))).toEqual([",ackground-color"]);
        expect(names(sheet("a { !color: red }"))).toEqual(["!color"]);
        expect(names(sheet("a { /olor: red }"))).toEqual(["/olor"]);
        expect(names(sheet("a { backgro und-color: red }"))).toEqual(["backgro und-color"]);
    });

    it("the name is TRIMMED and then LOWERCASED, in that order (`stylesheet.ts:391`)", () => {
        expect(names(sheet("a {   COLOR   : red }"))).toEqual(["color"]);
        expect(names(sheet("a { Background-Color: red }"))).toEqual(["background-color"]);
    });

    it("J-6 — a non-ASCII name is carried as its own characters in BOTH targets", () => {
        //  the two-cell G-5 value divergence this unit measured and cured: a fold inside the
        //  constructor materializes folded bytes out of the Wasm input buffer, where a code unit
        //  >= 128 stands as the 0xFF marker, so `≡` came back as `ÿ` there and as `≡` here. The
        //  name is now a SPAN in both targets and the fold is the surface's `.toLowerCase()`.
        const r = sheet("a { X≡Y: red }");
        expect(r.ok).toBe(true);
        expect(names(r)).toEqual(["x≡y"]);
    });

    it("a nested rule is NOT swallowed as a name — `{` and `}` bound the class", () => {
        //  SH-2, DISCHARGED by X.P.W3.l: the incumbent ACCEPTS this (its `parseStyleBody` falls
        //  through to `blocks()`), and so does the candidate now — the `style-rule-mixed` reading
        //  (L-4) reads `b { … }` as a nested rule, never as a name. The oracle: one style rule `a`
        //  with no declarations and one child `b`.
        const r = sheet("a { b { color: red } }");
        expect(r.ok).toBe(true);
        const rule = (r.value as { selectors: string[]; declarations: unknown[]; children?: { selectors: string[] }[] }[])[0];
        expect(rule.declarations).toEqual([]);
        expect(rule.children?.map((child) => child.selectors)).toEqual([["b"]]);
    });
});

/* ── 3. J-3 — the prelude admits `}` ─────────────────────────────────────────────────────────── */

describe("J-3 the prelude is every byte but `{` and `;`", () => {
    it("a stray closing brace is prelude text, exactly as `blocks()` reads it", () => {
        const r = sheet("a { color: red } b  background-color: t } b { color: blue }");
        expect(r.ok).toBe(true);
        const items = r.value as { selectors: string[] }[];
        expect(items).toHaveLength(2);
        expect(items[1].selectors).toEqual(["b  background-color: t } b"]);
    });

    it("a leading `}` is a selector, not a syntax error", () => {
        expect((sheet("}b { color: red }").value as { selectors: string[] }[])[0].selectors).toEqual(["}b"]);
    });

    it("but a rule with NO opening brace at all is still refused", () => {
        expect(sheet("a color: red }").ok).toBe(false);
    });
});

/* ── 4. J-4 — `;` and comments are trivia between rules ──────────────────────────────────────── */

describe("J-4 the trivia between rules", () => {
    it("a comment before a rule leaves no item and no diagnostic", () => {
        const r = sheet("/* c */ a { color: red }");
        expect(r.ok).toBe(true);
        expect(r.value).toHaveLength(1);
        expect((r.value as { selectors: string[] }[])[0].selectors).toEqual(["a"]);
    });

    it("an interior asterisk is comment text; only `*` then `/` closes it", () => {
        expect(sheet("/*a*b*/x{y:1}").ok).toBe(true);
        expect(sheet("/**/x{y:1}").ok).toBe(true);
        expect(sheet("/***/x{y:1}").ok).toBe(true);
    });

    it("an UNTERMINATED comment refuses the sheet — the `CUT` is why it is not skipped as a rule", () => {
        const r = sheet("/* x");
        expect(r.ok).toBe(false);
        expect(r.diagnostics?.[0].expected).toContain(PRODUCTION_LABELS["'*/'"]);
        //  and the same after a complete rule, where the RECOVER arm would otherwise swallow it
        expect(sheet("a{color:red} /* x").ok).toBe(false);
    });

    it("semicolons between and after rules are trivia, never a recovered hole", () => {
        expect(sheet("a{color:red} ;").ok).toBe(true);
        expect(sheet(";;a{color:red};;").ok).toBe(true);
    });

    it("the empty and the whitespace-only sheet are the empty stylesheet", () => {
        expect(sheet("").value).toEqual([]);
        expect(sheet("   \n\t ").value).toEqual([]);
    });
});

/* ── 5. J-5 — a declaration list drops its empty parts ───────────────────────────────────────── */

describe("J-5 `splitTopLevel(body, \";\")` drops the empty parts", () => {
    it("any run of semicolons, anywhere, is one separator", () => {
        expect(names(sheet("a{color:red;;}"))).toEqual(["color"]);
        expect(names(sheet("a{;color:red}"))).toEqual(["color"]);
        expect(names(sheet("a{ ; ; color:red ; ; }"))).toEqual(["color"]);
        expect(names(sheet("a{color:red;background:blue}"))).toEqual(["color", "background"]);
    });

    it("an empty body and a body of nothing but semicolons are the empty declaration list", () => {
        expect(decls(sheet("a{}"))).toEqual([]);
        expect(decls(sheet("a{;}"))).toEqual([]);
    });

    it("a malformed declaration still refuses the sheet — the RECOVER writes a diagnostic, and `ok` is `D.length === 0`", () => {
        for (const bad of ["a{color}", "a{color:}", "a{:red}", "a{color:red", "a{color:red}}"]) {
            expect(sheet(bad).ok, bad).toBe(false);
        }
    });
});

/* ── 6. the CTOR row this unit added, and the registry's four name-sets ──────────────────────── */

describe("the CTOR family (COHESION §0s E-h1)", () => {
    it("the unit's row is present with its `since` tag and its own label", () => {
        expect(R_ctor["sheet-comment"].since).toBe("X.P.W3.j");
        expect(R_ctor["sheet-comment"].labels).toEqual(["<comment>"]);
    });

    it("the row is exercised behaviourally on BOTH lowerings — a comment yields no item", () => {
        //  the node table and the Wasm emitter HALT at load on a row the other three do not
        //  carry, so the closure `N=N=N=N` is proven before this file runs; what a test can add
        //  is that the row actually ANSWERS, in both targets, which `both()` asserts.
        expect((sheet("/*x*/ /*y*/ a{b:1} /*z*/").value as unknown[])).toHaveLength(1);
    });

    it("the five classes this unit added are tagged, and `slash` re-uses the existing `'/'` label", () => {
        for (const name of ["ws-or-semi", "prelude-char", "decl-name", "any-but-star", "slash"]) {
            expect(R_cls[name].since, name).toBe("X.P.W3.j");
        }
        expect(R_cls.slash.label).toBe("'/'");
    });
});

/* ── 7. K-10 — the labels are APPENDED, and this unit's own block is where it says it is ─────── */

describe("the label surface (K-10)", () => {
    it("this unit's labels stand at the tail, at their own offset, and nothing before them moved", () => {
        //  E-i1's cure, used here so the NEXT unit's lawful append cannot falsify this row: read a
        //  slice of its OWN length at its OWN offset, and make the count a floor, never an equality.
        const mine = [
            "<whitespace-or-semicolon>", "rule-prelude", "declaration-name", "comment-text",
            "<comment>", "'/*'", "'*'", "'*/'",
        ];
        const at = L.indexOf(mine[0]);
        expect(at).toBeGreaterThan(0);
        expect(L.slice(at, at + mine.length)).toEqual(mine);
        expect(L.length).toBeGreaterThanOrEqual(at + mine.length);
        //  the anchors of every earlier unit are still where they were
        expect(L.indexOf("<string>")).toBeLessThan(L.indexOf("input <= 14107"));
        expect(L.indexOf("input <= 14107")).toBeLessThan(at);
        for (const label of mine) expect(PRODUCTION_LABELS[label], label).toBeTruthy();
    });
});

/* ── 8. the five collectors (surface compositions, both surfaces the same function) ──────────── */

describe("the five stylesheet collectors", () => {
    const parsed = () => {
        const r = sheet("a, b { color: red; color: blue !important; color: green } c { margin: 0 }");
        expect(r.ok).toBe(true);
        return r.value as never;
    };

    it("collectStyleRules walks the sheet in pre-order and records `{rule, path}`", () => {
        const rules = collectStyleRules(parsed());
        expect(rules).toHaveLength(2);
        expect(rules[0].path).toEqual([0]);
        expect(rules[1].path).toEqual([1]);
        expect((rules[0].rule as { selectors: string[] }).selectors).toEqual(["a", "b"]);
    });

    it("collectDeclarations is the cascade: the last wins unless an `!important` one stands", () => {
        const rules = collectStyleRules(parsed());
        const map = collectDeclarations((rules[0].rule as { declarations: never[] }).declarations);
        expect(map).toBeInstanceOf(Map);
        expect(map.size).toBe(1);
        expect((map.get("color") as { important: boolean }).important).toBe(true);
        expect(((map.get("color") as { value: { payload: { value: { space: string } } } }).value.payload.value as { space: string }).space).toBe("rgb");
    });

    it("the three at-rule collectors are EMPTY on a sheet of style rules — and that is honest", () => {
        //  SH-2: `@keyframes` / `@property` / `@function` have no production in this unit, so
        //  these three collectors have no item to find. The emptiness is the residual E-j1 names,
        //  measured here rather than asserted away.
        expect(collectKeyframes(parsed())).toEqual([]);
        expect(collectPropertyDescriptors(parsed())).toEqual([]);
        expect(collectCustomFunctions(parsed())).toEqual([]);
    });

    it("BND-1 at the collector boundary: a degenerate argument is the empty result, never a throw", () => {
        for (const bad of [undefined, null, 42, {}, [], true, NaN, "x"]) {
            expect(collectStyleRules(bad as never)).toEqual([]);
            expect(collectKeyframes(bad as never)).toEqual([]);
            expect(collectPropertyDescriptors(bad as never)).toEqual([]);
            expect(collectCustomFunctions(bad as never)).toEqual([]);
            expect(collectDeclarations(bad as never)).toBeInstanceOf(Map);
            expect(collectDeclarations(bad as never).size).toBe(0);
        }
        //  a malformed item inside a well-formed array is skipped, not thrown on
        expect(collectStyleRules([null, 7, { kind: "style" }, { children: null }] as never)).toHaveLength(1);
    });

    it("all five are the SAME function on both surfaces (lowering-independent by construction)", () => {
        for (const name of ["collectDeclarations", "collectStyleRules", "collectKeyframes", "collectPropertyDescriptors", "collectCustomFunctions"]) {
            expect((surfaces.js as never)[name], name).toBe((surfaces.wasm as never)[name]);
        }
    });
});

/* ── 9. the brace edge the widened `token-char` moved, and the entries it must NOT move ──────── */

describe("the `token-char` widening (the two braces)", () => {
    it("a brace after a value token ends the token — that is what the widening is for", () => {
        expect(sheet("a{color:red}").ok).toBe(true);
        expect(names(sheet("a{color:red}"))).toEqual(["color"]);
    });

    it("but a brace left over still meets `P:value`'s own `END`, so no value verdict moved", () => {
        for (const source of ["red}", "a{b}", "}", "1px}", "{red"]) {
            expect(both("parseCssValue", source).ok, source).toBe(false);
            expect(both("parseCssValues", source).ok, source).toBe(false);
            expect(both("parseCssScalar", source).ok, source).toBe(false);
        }
        //  and the values that parsed before still parse, to the same product
        for (const source of ["red", "1px 2px", "var(--a)", "a, b", "calc(1px)"]) {
            expect(both("parseCssValue", source).ok, source).toBe(true);
        }
    });
});

/* ── 10. G-3 — the shield answered nothing in this file ──────────────────────────────────────── */

describe("the shield's ledger (G-3)", () => {
    it("SHIELD.caught moved by zero across every row above", () => {
        expect(SHIELD.caught).toBe(LEDGER_AT_LOAD);
        expect(SHIELD.faults()).toEqual([]);
    });

    it("a non-string argument is `ok:false` with the boundary issue, on both targets", () => {
        for (const bad of [undefined, null, 42, {}, [], true, NaN]) {
            const r = sheet(bad);
            expect(r.ok).toBe(false);
            expect(r.diagnostics?.[0].expected).toEqual([PRODUCTION_LABELS["<string>"]]);
        }
        expect(SHIELD.caught).toBe(LEDGER_AT_LOAD);
    });
});
