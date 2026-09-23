// SERVED MODEL: claude-opus-5-5
//
// X.P.W5.g — R-b-2 (F-W5b-1; COHESION §0bx; value.js DIVERGENCE-LEDGER §14): `var()` inside the
// animation family is valid at parse time, css-variables-1 §3 — "If a property contains one or more
// var() functions, and those functions are syntactically valid, the entire property's grammar must
// be assumed to be valid at parse time. It is only syntax-checked at computed-value time."
//
// The cases are the spec's own rule applied to each checked property, the WPT css-variables pattern
// (a longhand and its shorthand each holding a `var()` in any slot, with and without a fallback,
// nested in `calc()`), and the corpus cells that surfaced F-W5b-1 (value.js's own stylesheets).
// A value WITHOUT a `var()` is still checked (the control), and a malformed `var(` is still refused.

import { describe, expect, it } from "vitest";

import { collectAnimationOptions, loadPublicSurfaces, parseStylesheet } from "../src/css/entry.mjs";
import { deleteVarDeclarations } from "./css-equivalence/lib/ruled.mjs";

type Result = { ok: boolean; value?: unknown; diagnostics: { code: string }[] };
const sheet = parseStylesheet as (s: string) => Result;

const ACCEPTED = [
    "a { animation: var(--a) 1s }",
    "a { animation: fade 1s var(--e) }",
    "a { animation: fade var(--d, 200ms) var(--ease, ease-in) both }",
    "a { animation-name: var(--name) }",
    "a { animation-duration: var(--d) }",
    "a { animation-delay: calc(var(--base, 0ms) + 40ms) }",
    "a { animation-iteration-count: var(--n) }",
    "a { animation-direction: var(--dir) }",
    "a { animation-fill-mode: var(--fill) }",
    "a { animation-timing-function: var(--ease) }",
    "a { animation-composition: var(--c) }",
    "a { animation: fade 1s, var(--second) }",
    "a { ANIMATION: fade 1s VAR(--e) }",
    //  the corpus cells (F-W5b-1)
    ".stagger-children > * { animation: stagger-child-in var(--duration-normal) var(--ease-standard) both; }",
    ".hero-blob-anchor { /* backwards per the one-shot release law above (`to` ≡ natural). */\n        animation: blob-emerge 500ms var(--ease-decelerate) backwards; }",
];

const REFUSED = [
    ["a { animation: fade 1s bogus bogus2 }", "animation_option_invalid"], //   no var(): still checked
    ["a { animation-duration: -1s }", "animation_option_invalid"],
    ["a { animation-direction: sideways }", "animation_option_invalid"],
] as const;

describe("R-b-2 — css-variables-1 §3: a var() in the animation family is valid at parse time", () => {
    it("every var()-holding animation-family declaration parses, in both lowerings, byte-identically", async () => {
        const { js, wasm } = (await loadPublicSurfaces()) as unknown as Record<"js" | "wasm", { parseStylesheet: (s: string) => Result }>;
        for (const s of ACCEPTED) {
            const a = js.parseStylesheet(s);
            expect(a.ok, s).toBe(true);
            expect(JSON.stringify(wasm.parseStylesheet(s)), s).toBe(JSON.stringify(a));
        }
    });

    it("a value with no var() is still checked per property (the control)", () => {
        for (const [s, code] of REFUSED) expect(sheet(s), s).toMatchObject({ ok: false, diagnostics: [{ code }] });
    });

    it("the var() value is carried as its parsed CALL, and the collector reads no parse-time option from it", () => {
        const r = sheet("a { animation-duration: var(--d); animation-name: fade }") as { ok: true; value: { declarations: unknown[] }[] };
        expect(r.ok).toBe(true);
        const decls = r.value[0].declarations as { name: string; value: { kind: string; name?: string } }[];
        expect(decls[0].value).toMatchObject({ kind: "call", name: "var" });
        expect(collectAnimationOptions(decls)).toEqual([{ name: "fade" }]);
    });

    it("the harness's R-b-2 mechanism deletes exactly the var() animation declarations, leading trivia with them", () => {
        expect(deleteVarDeclarations("a { color: var(--c) }")).toBeNull();
        expect(deleteVarDeclarations("a { animation: x 1s; animation-delay: var(--d); color: red }")?.repaired).toBe("a { animation: x 1s; color: red }");
        expect(deleteVarDeclarations("a { /* c */ animation: x var(--e) }")?.repaired).toBe("a {}");
    });
});
