// SERVED MODEL: claude-fable-5-1
//
// X.P.W3.h — the value grammar's own fixture: `P:value` / `P:scalar` / `P:values` in the 22-op
// algebra, the CTOR family closed across its four realizations, the two surface compositions on
// `entry.mjs` (`coerceToSyntax`, `serializeCssColor`), and the four types through `build.mjs`.
//
//   npx vitest run --config typescript/test/css-recovery/vitest.config.ts test/css-recovery/value-grammar.test.ts
//
// Every row below runs through BOTH lowerings and is asserted byte-identical (G-5's law at the
// fixture's scale), with the shield's ledger read before and after (G-3: `SHIELD.caught` moves by
// zero — no row here is answered by the shield). The constructor family is asserted BEHAVIOURALLY:
// every `R_ctor` row this unit added is exercised by a witness input on both lowerings, which is
// the only closure the grant allows a test to state (the node table and the emitter HALT at load
// on a missing row; the JS `CTORS` map answers only when it is asked).

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { L, R_ctor } from "../../src/css/algebra/tables.mjs";
import { PRODUCTION_LABELS } from "../../src/css/diagnostics.mjs";
import { SHIELD, SYNTAX_DESCRIPTOR_PRODUCTION, loadPublicSurfaces, serializeCssColor } from "../../src/css/entry.mjs";

type Result = { ok: boolean; value?: unknown; diagnostics?: { code: string; start: number; end: number; expected: string[]; actual: string | null }[] };
type Surface = Record<string, (source: string, syntax?: string) => Result>;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const surfaces = (await loadPublicSurfaces()) as unknown as { js: Surface; wasm: Surface };
const LEDGER_AT_LOAD = SHIELD.caught;

/** One row on both lowerings, asserted identical, and the JS answer returned for the row's own assertion. */
const both = (entry: string, source: string, syntax?: string): Result => {
    const js = surfaces.js[entry](source, syntax);
    const wasm = surfaces.wasm[entry](source, syntax);
    expect(JSON.stringify(wasm), `${entry}(${JSON.stringify(source)}) differs across lowerings`).toBe(JSON.stringify(js));
    return js;
};
const scalar = (type: string, value: unknown, unit?: string) => ({ kind: "scalar", payload: unit === undefined ? { type, value } : { type, value, unit } });
const keyword = (value: string) => scalar("keyword", value);
const number = (value: number, unit = "") => scalar("number", value, unit);
const list = (separator: string, items: unknown[]) => ({ kind: "list", separator, items });

/* ── 1. the families the incumbent's `parseValueInternal` / `parseScalarInternal` spell ───────── */

describe("P:value — one grammar, both lowerings, the incumbent's families", () => {
    it("numbers: the incumbent's numeric regex, a unit run, and the token boundary", () => {
        expect(both("parseCssValue", "1px").value).toEqual(number(1, "px"));
        expect(both("parseCssValue", "-.5").value).toEqual(number(-0.5));
        expect(both("parseCssValue", "1e3%").value).toEqual(number(1000, "%"));
        expect(both("parseCssValue", "1PX").value).toEqual(number(1, "PX"));
        expect(both("parseCssValue", "1px5").ok).toBe(false);
        expect(both("parseCssValue", "1.").ok).toBe(false); //   PB-12: the incumbent's `\d+\.?\d*` accepts `1.`; the algebra's NUM does not (declared)
    });

    it("colours: every colour head is a colour, a bare head is a keyword, a committed head fails committed", () => {
        expect(both("parseCssValue", "red").value).toEqual(scalar("color", { space: "rgb", channels: [255, 0, 0], alpha: 1 }));
        expect(both("parseCssValue", "#fff").ok).toBe(true);
        expect(both("parseCssValue", "rgb(1 2 3)").ok).toBe(true);
        expect(both("parseCssValue", "rgb").value).toEqual(keyword("rgb"));
        expect(both("parseCssValue", "currentcolor").value).toEqual(keyword("currentcolor"));
        const committed = both("parseCssValue", "rgb(1,2,3,)");
        expect(committed.ok).toBe(false);
        expect(committed.diagnostics?.[0]).toMatchObject({ code: "css_syntax", start: 10, end: 11, actual: ")" });
        expect(both("parseCssValue", "a, rgb(1,2,3,)").diagnostics?.[0]).toMatchObject({ start: 13, end: 14, actual: ")" });
        expect(both("parseCssValue", "rgb(1 2 3)red").ok).toBe(false);
    });

    it("calls: the name class, the three name rules, nested arguments, and `var()` as a call", () => {
        expect(both("parseCssValue", "var(--x)").value).toEqual({ kind: "call", name: "var", args: [keyword("--x")] });
        //  the incumbent splits at `/` before whitespace and drops the empty part between the two slashes
        expect(both("parseCssValue", "url(http://x)").value).toEqual({
            kind: "call",
            name: "url",
            args: [list("slash", [list("space", [keyword("http"), keyword(":")]), keyword("x")])],
        });
        expect(both("parseCssValue", "f(a, b c, d/e)").value).toEqual({
            kind: "call",
            name: "f",
            args: [keyword("a"), list("space", [keyword("b"), keyword("c")]), list("slash", [keyword("d"), keyword("e")])],
        });
        expect(both("parseCssValue", "f(g(h(1)))").value).toEqual({ kind: "call", name: "f", args: [{ kind: "call", name: "g", args: [{ kind: "call", name: "h", args: [number(1)] }] }] });
        expect(both("parseCssValue", "f( a , b )").ok).toBe(true);
        for (const empty of ["f()", "sibling-index(1)", "sibling-count(1 2)", "1f()"]) expect(both("parseCssValue", empty).ok, empty).toBe(false);
        for (const okEmpty of ["scroll()", "view()", "--x()", "sibling-index()", "sibling-count()"]) expect(both("parseCssValue", okEmpty).ok, okEmpty).toBe(true);
    });

    it("lists: comma over slash over space, the incumbent's empty-part counts, `:` and `;` as their own tokens", () => {
        expect(both("parseCssValue", "a b").value).toEqual(list("space", [keyword("a"), keyword("b")]));
        expect(both("parseCssValue", "1px 2px / 3px, 4px").value).toEqual(
            list("comma", [list("slash", [list("space", [number(1, "px"), number(2, "px")]), number(3, "px")]), number(4, "px")]),
        );
        expect(both("parseCssValue", "a:b").value).toEqual(list("space", [keyword("a"), keyword(":"), keyword("b")]));
        expect(both("parseCssValue", "a;b").value).toEqual(list("space", [keyword("a"), keyword(";"), keyword("b")]));
        expect(both("parseCssValue", "::").value).toEqual(list("space", [keyword(":"), keyword(":")]));
        for (const accepted of ["a,,b", ",a,b", "a,b,", "a, , b", "/a/b", "  1px  "]) expect(both("parseCssValue", accepted).ok, accepted).toBe(true);
        for (const rejected of [",a", "a,", "a/", "f(a,)", "f(,a)", "f(,)", "a b ,", ""]) expect(both("parseCssValue", rejected).ok, rejected).toBe(false);
        expect(both("parseCssValue", "a,,b").value).toEqual(list("comma", [keyword("a"), keyword("b")]));
    });

    it("operators, idents and strings", () => {
        expect(both("parseCssValue", "<=").value).toEqual(keyword("<="));
        expect(both("parseCssValue", "<=>").ok).toBe(false); //  neither an operator spelling nor an ident
        expect(both("parseCssValue", "-").value).toEqual(keyword("-"));
        expect(both("parseCssValue", "-a").value).toEqual(keyword("-a"));
        expect(both("parseCssValue", '"a b"').value).toEqual(keyword('"a b"'));
        expect(both("parseCssValue", '""').value).toEqual(keyword('""'));
        expect(both("parseCssValue", '"a\\"b"').value).toEqual(keyword('"a\\"b"'));
        expect(both("parseCssValue", '"a\\\\"').value).toEqual(keyword('"a\\\\"'));
        expect(both("parseCssValue", "'it''s'").ok).toBe(false);
        expect(both("parseCssValue", '"a"b').ok).toBe(false);
    });

    it("nesting: a call nested past Θ.depthBound is an ordinary rejection naming the bound", () => {
        const nest = (d: number) => "f(".repeat(d) + "1" + ")".repeat(d);
        expect(both("parseCssValue", nest(62)).ok).toBe(true);
        const deep = both("parseCssValue", nest(63));
        expect(deep.ok).toBe(false);
        expect(deep.diagnostics?.[0].expected).toContain(PRODUCTION_LABELS["nesting <= 64"]);
        expect(both("parseCssValue", "a b").ok).toBe(true); //  no state survives a rejection
    });

    it("P:scalar takes one token and no list; P:values wraps a lone token as a one-item space list", () => {
        expect(both("parseCssScalar", "1px").value).toEqual(number(1, "px"));
        expect(both("parseCssScalar", "a b").ok).toBe(false);
        expect(both("parseCssScalar", "f(1)").ok).toBe(false);
        expect(both("parseCssValues", "a").value).toEqual(list("space", [keyword("a")]));
        expect(both("parseCssValues", "f(1)").value).toEqual(list("space", [{ kind: "call", name: "f", args: [number(1)] }]));
        expect(both("parseCssValues", "a, b").value).toEqual(list("comma", [keyword("a"), keyword("b")]));
    });
});

/* ── 2. the seven colour heads `parseCssColor` was PARTIAL over ────────────────────────────── */

describe("P:color — every ORACLE head realized", () => {
    it("hwb, lab, lch, oklab, and color() over its nine spaces", () => {
        expect(both("parseCssColor", "hwb(120 30% 40%)").ok).toBe(true);
        expect(both("parseCssColor", "lab(50% 20 -30 / 0.5)").value).toEqual({ space: "lab", channels: [50, 20, -30], alpha: 0.5 });
        expect(both("parseCssColor", "lch(50 30 120deg)").value).toEqual({ space: "lch", channels: [50, 30, 120], alpha: 1 });
        expect(both("parseCssColor", "oklab(0.5 0.1 -0.1)").value).toEqual({ space: "oklab", channels: [0.5, 0.1, -0.1], alpha: 1 });
        expect(both("parseCssColor", "color(srgb 1 0 0.5)").value).toEqual({ space: "rgb", channels: [255, 0, 127.5], alpha: 1 });
        expect(both("parseCssColor", "color(display-p3 1 0 0 / 50%)").value).toEqual({ space: "display-p3", channels: [1, 0, 0], alpha: 0.5 });
        for (const space of ["srgb-linear", "a98-rgb", "prophoto-rgb", "rec2020", "xyz", "xyz-d65"]) expect(both("parseCssColor", `color(${space} 0.1 0.2 0.3)`).ok, space).toBe(true);
        expect(both("parseCssColor", "color(xyz-d65 0.1 0.2 0.3)").value).toEqual({ space: "xyz", channels: [0.1, 0.2, 0.3], alpha: 1 });
        expect(both("parseCssColor", "color(xyz-d50 0.3 0.4 0.5)").ok).toBe(true);
        expect(both("parseCssColor", "color(xyz-d50 none 0 0)").ok).toBe(false); //  a concrete xyz-d50 channel, as the incumbent's factory rules
        expect(both("parseCssColor", "color(srgb.5 0 0)").ok).toBe(false);
    });

    it("the null-prototype cure: `constructor` is an ordinary rejection on both lowerings, not a prototype hit", () => {
        expect(both("parseCssColor", "constructor").ok).toBe(false);
        expect(both("parseTimingFunction", "constructor()").ok).toBe(false);
        expect(both("parseCssValue", "constructor").value).toEqual(keyword("constructor"));
    });
});

/* ── 3. the CTOR family, closed behaviourally over every row this unit added ────────────────── */

describe("the CTOR family — every X.P.W3.h row of R_ctor answers on both lowerings", () => {
    const WITNESS: Record<string, [string, string]> = {
        hwb: ["parseCssColor", "hwb(0 0% 0%)"],
        lab: ["parseCssColor", "lab(1 2 3)"],
        lch: ["parseCssColor", "lch(1 2 3)"],
        oklab: ["parseCssColor", "oklab(0.1 0.2 0.3)"],
        xyz: ["parseCssColor", "color(xyz 0.1 0.2 0.3)"],
        "srgb-linear": ["parseCssColor", "color(srgb-linear 0.1 0.2 0.3)"],
        "display-p3": ["parseCssColor", "color(display-p3 0.1 0.2 0.3)"],
        "a98-rgb": ["parseCssColor", "color(a98-rgb 0.1 0.2 0.3)"],
        "prophoto-rgb": ["parseCssColor", "color(prophoto-rgb 0.1 0.2 0.3)"],
        rec2020: ["parseCssColor", "color(rec2020 0.1 0.2 0.3)"],
        "xyz-d50": ["parseCssColor", "color(xyz-d50 0.1 0.2 0.3)"],
        "value-number": ["parseCssValue", "1px"],
        "value-keyword": ["parseCssValue", "a"],
        "value-operator": ["parseCssValue", "+"],
        "value-string": ["parseCssValue", '"s"'],
        "value-call": ["parseCssValue", "f(1)"],
        "value-args": ["parseCssValue", "f(1, 2)"],
        "value-group": ["parseCssValue", "a b, c"],
        "value-wrap": ["parseCssValues", "a"],
    };
    const rows = Object.entries(R_ctor as Record<string, { since?: string }>).filter(([, row]) => row.since === "X.P.W3.h").map(([name]) => name);

    it("names every row once — the witness table and the registry are the same set", () => {
        expect(rows.length).toBe(19);
        expect(rows.sort()).toEqual(Object.keys(WITNESS).sort());
    });

    for (const row of rows) {
        it(`${row}: its witness constructs on both lowerings`, () => {
            const [entry, source] = WITNESS[row];
            expect(both(entry, source).ok, `${row} via ${entry}(${JSON.stringify(source)})`).toBe(true);
        });
    }
});

/* ── 4. the two surface compositions and the label surface ────────────────────────────────── */

describe("coerceToSyntax — a composition on the surface, E-h3's two codes through selectCode", () => {
    it("accepts a matching syntax and returns the parsed value", () => {
        expect(both("coerceToSyntax", "1px", "<length>").value).toEqual(number(1, "px"));
        expect(both("coerceToSyntax", "red", "<color> | <length>").ok).toBe(true);
        expect(both("coerceToSyntax", "anything at all", "*").ok).toBe(true);
    });

    it("names an invalid descriptor over the SOURCE span with the descriptor production", () => {
        const r = both("coerceToSyntax", "1px", "bogus");
        expect(r.ok).toBe(false);
        expect(r.diagnostics?.[0]).toEqual({ code: "syntax_descriptor_invalid", start: 0, end: 3, expected: [SYNTAX_DESCRIPTOR_PRODUCTION], actual: "1px" });
    });

    it("names a mismatch with the descriptor's own alternatives as its expectation", () => {
        const r = both("coerceToSyntax", "1px", "<color> | <angle>");
        expect(r.ok).toBe(false);
        expect(r.diagnostics?.[0]).toEqual({ code: "syntax_mismatch", start: 0, end: 3, expected: ["<color>", "<angle>"], actual: "1px" });
    });

    it("passes a parse failure through unchanged", () => {
        expect(both("coerceToSyntax", "1px5", "<length>").diagnostics?.[0].code).toBe("css_syntax");
    });
});

describe("serializeCssColor — the incumbent's serializer on the surface", () => {
    it("serializes every space and rejects a non-colour with a coded error", () => {
        expect(serializeCssColor({ space: "hsl", channels: [120, 0.5, 0.5], alpha: 0.5 })).toEqual({ ok: true, value: "hsl(120deg 50% 50% / 50%)" });
        expect(serializeCssColor({ space: "rgb", channels: [255, 0, 0], alpha: 1 })).toEqual({ ok: true, value: "rgb(255 0 0)" });
        expect(serializeCssColor({ space: "lab", channels: [50, 1, 2], alpha: 0.25 })).toEqual({ ok: true, value: "lab(50% 1 2 / 25%)" });
        expect(serializeCssColor({ space: "xyz", channels: [0.1, 0.2, 0.3], alpha: 1 })).toEqual({ ok: true, value: "color(xyz 0.1 0.2 0.3)" });
        expect(serializeCssColor(null as never).ok).toBe(false);
        expect(serializeCssColor({ space: "rgb", channels: [1, 2], alpha: 1 } as never).ok).toBe(false);
    });
});

describe("the label surface — sixteen labels appended after the nine capacity labels, none moved", () => {
    it("L's tail is exactly the unit's labels, in registry order, and every one has a named production", () => {
        const tail = L.slice(L.indexOf("expsnap <= 32") + 1);
        expect(tail).toEqual([
            "token boundary", "ident start", "<unit>", "<operator>", "double quote", "single quote", "string text",
            "<color-space>", "concrete xyz-d50", "<function-arguments>", "<value-list>", "<value>", "<scalar>", "'\\'", "'\"'", "'''",
        ]);
        expect(L.length).toBe(76);
        for (const label of tail) expect(PRODUCTION_LABELS[label], label).toBeDefined();
        expect(L.indexOf("<string>")).toBeLessThan(L.indexOf("token boundary"));
    });
});

/* ── 5. the four types through build.mjs, and the shield's ledger ──────────────────────────── */

describe("build.mjs — the runtime and the types", () => {
    it("ac1.d.ts declares the four types beside the five, and ac1.js re-exports the eight runtime names", () => {
        const dts = readFileSync(path.join(HERE, "../../src/css/build/ac1.d.ts"), "utf8");
        const types = /export type \{([^}]*)\}/.exec(dts)?.[1].split(",").map((s) => s.trim()).filter(Boolean) ?? [];
        for (const t of ["CssColorSpace", "CssLinearStop", "ParseIssue", "ParseResult"]) expect(types, t).toContain(t);
        const js = readFileSync(path.join(HERE, "../../src/css/build/ac1.js"), "utf8");
        for (const name of ["parseCssColor", "parseTimingFunction", "parseStylesheet", "parseCssScalar", "parseCssValue", "parseCssValues", "coerceToSyntax", "serializeCssColor"]) expect(js, name).toContain(name);
    });
});

describe("G-3 at the fixture's scale", () => {
    it("the shield's ledger did not move across any row above", () => {
        expect(SHIELD.caught).toBe(LEDGER_AT_LOAD);
    });
});
