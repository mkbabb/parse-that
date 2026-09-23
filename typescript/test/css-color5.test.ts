// SERVED MODEL: claude-opus-5-5
//
// X.P.W5.c — css-color-5 `color-mix()` / `light-dark()` and the KFA-14 legacy comma forms in the
// seam grammar, tested against web-platform-tests (`test/css-color5/wpt/`, pinned at WPT commit
// 5a5b2b591b39c59d5bca77819db305474dcfd18a — `wpt-cases.mjs` reads every case out of the files):
//
//   css/css-color/parsing/color-computed-color-mix-function.html   the resolved colour, fuzzy 0.01
//   css/css-color/parsing/color-valid-color-mix-function.html      every in-scope form parses
//   css/css-color/parsing/color-invalid-color-mix-function.html    every form is refused
//   css/css-color/parsing/color-{valid,invalid}{,-rgb,-hsl}.html   the legacy comma forms (KFA-14)
//
// SCOPE is decided by the INPUT's own bytes, one named reason each, and every out-of-scope count is
// asserted so a drift in either direction is loud:
//   calc          `calc()` in a channel or a percentage — the seam's colour grammar has no math
//                 function (the incumbent neither); css-values-4 §10 is its own unit of work
//   p3-linear     `color(display-p3-linear …)` — not a member of the frozen `CssColorSpace`, so
//                 `color()` does not admit it (`in display-p3-linear` IS admitted: its result is
//                 written as the exact `xyz` it names — `color-mix.mjs`)
//   xyz-d50-none  `color(xyz-d50 …none…)` — the ruled "concrete xyz-d50" guard (`tables.mjs`)
//   context       `currentcolor` / `light-dark()` / `var()` — not absolute colours (css-color-5 §2),
//                 so the answer is `color_context_required`, asserted
//   relative      `from` — relative colour syntax is not a production of this grammar

import { describe, expect, it } from "vitest";

import { loadPublicSurfaces, parseCssColor } from "../src/css/entry.mjs";
import { normalizeMixPercentages, resolveColorMix } from "../src/css/color-mix.mjs";
import { loadWptCases } from "./css-color5/wpt-cases.mjs";

type Color = { space: string; channels: (number | "none")[]; alpha: number | "none" };
type Result = { ok: boolean; value?: Color; diagnostics: { code: string }[] };
const parse = parseCssColor as (source: string) => Result;

const scopeOf = (s: string) =>
    /calc\(/i.test(s) ? "calc"
        : /\bfrom\b/i.test(s) ? "relative"
            : /color\(\s*display-p3-linear/i.test(s) ? "p3-linear"
                : /color\(\s*xyz-d50[^)]*none/i.test(s) ? "xyz-d50-none"
                    : /currentcolor|light-dark\(|var\(/i.test(s) ? "context"
                        : "in";

const tally = (keys: string[]) => keys.reduce<Record<string, number>>((t, k) => ({ ...t, [k]: (t[k] ?? 0) + 1 }), {});

/** The numbers WPT's `getNumbers` reads off a serialization: sRGB 0..1, hsl/hwb percentages 0..100. */
const wptNumbers = (c: Color) => {
    const k = c.space === "rgb" ? [1 / 255, 1 / 255, 1 / 255] : c.space === "hsl" || c.space === "hwb" ? [1, 100, 100] : [1, 1, 1];
    return [...c.channels.map((x, i) => (x === "none" ? x : x * k[i])), c.alpha];
};
const HUE_INDEX: Record<string, number> = { hsl: 0, hwb: 0, lch: 2, oklch: 2 };
const interpolationName = (space: string) => (space === "rgb" ? "srgb" : space === "xyz" ? "xyz-d65" : space);

/** Ours, read in the expectation's own space (a one-item mix converts, css-color-5 §3.3). */
function sameColor(ours: Color, expected: Color): string | null {
    const got = ours.space === expected.space
        ? ours
        : (resolveColorMix({ kind: "color-mix", method: { space: interpolationName(expected.space) }, items: [{ color: ours }] }) as Color);
    const a = wptNumbers(got);
    const b = wptNumbers(expected);
    for (let i = 0; i < 4; i++) {
        if (a[i] === "none" || b[i] === "none") {
            if (a[i] !== b[i]) return `component ${i}: ${String(a[i])} vs ${String(b[i])}`;
            continue;
        }
        let d = Math.abs((a[i] as number) - (b[i] as number));
        if (HUE_INDEX[expected.space] === i) d = Math.min(d, 360 - d);
        if (!(d <= 0.01)) return `component ${i}: ${String(a[i])} vs ${String(b[i])}`; // color-testcommon.js epsilon
    }
    return null;
}

describe("color-mix() — WPT color-computed-color-mix-function.html (the resolved colour)", () => {
    const cases = loadWptCases("color-computed-color-mix-function.html");

    it("reads 958 cases; the out-of-scope ones are exactly the named classes", () => {
        expect(cases.length).toBe(958);
        expect(tally(cases.map((c) => scopeOf(c.input)))).toEqual({ in: 887, "p3-linear": 45, "xyz-d50-none": 16, calc: 10 });
    });

    it("every in-scope case computes to the WPT expectation within its 0.01 epsilon", () => {
        const misses: string[] = [];
        for (const c of cases.filter((x) => scopeOf(x.input) === "in")) {
            const r = parse(c.input);
            const e = parse(c.expected);
            if (!r.ok || !e.ok) {
                misses.push(`${c.input}: ${r.ok ? "expected unparseable" : r.diagnostics[0].code}`);
                continue;
            }
            const why = sameColor(r.value as Color, e.value as Color);
            if (why !== null) misses.push(`${c.input} → ${c.expected}: ${why}`);
        }
        expect(misses).toEqual([]);
    });
});

describe("color-mix() — WPT color-valid / color-invalid-color-mix-function.html (the grammar)", () => {
    it("every in-scope valid form parses; the context forms answer color_context_required", () => {
        const cases = loadWptCases("color-valid-color-mix-function.html");
        expect(cases.length).toBe(677);
        const verdicts = cases.map((c) => {
            const r = parse(c.input);
            return `${scopeOf(c.input)}:${r.ok ? "ok" : r.diagnostics[0].code}`;
        });
        expect(tally(verdicts)).toEqual({
            "in:ok": 627,
            "context:color_context_required": 2,
            "calc:css_syntax": 8,
            "p3-linear:css_syntax": 31,
            "xyz-d50-none:css_syntax": 6,
            "xyz-d50-none:ok": 3,
        });
    });

    it("every invalid form is refused", () => {
        const cases = loadWptCases("color-invalid-color-mix-function.html");
        expect(cases.length).toBe(141);
        expect(cases.filter((c) => parse(c.input).ok).map((c) => c.input)).toEqual([]);
    });

    it("both lowerings give byte-identical answers over every WPT color-mix input", async () => {
        const surfaces = (await loadPublicSurfaces()) as unknown as Record<"js" | "wasm", { parseCssColor: (s: string) => unknown }>;
        const inputs = ["color-computed-color-mix-function.html", "color-valid-color-mix-function.html", "color-invalid-color-mix-function.html"]
            .flatMap((f) => loadWptCases(f).map((c) => c.input));
        const differ = inputs.filter((s) => JSON.stringify(surfaces.js.parseCssColor(s)) !== JSON.stringify(surfaces.wasm.parseCssColor(s)));
        expect(differ).toEqual([]);
    });
});

describe("color-mix() — css-values-5 §6.1 'normalize mix percentages' (forced), its own note's cases", () => {
    it("scales above 100%, distributes to the omitted, and reports the leftover", () => {
        expect(normalizeMixPercentages([undefined, undefined])).toEqual({ weights: [50, 50], leftover: 0 });
        expect(normalizeMixPercentages([80, 80])).toEqual({ weights: [50, 50], leftover: 0 });
        expect(normalizeMixPercentages([30, 40])).toEqual({ weights: [(30 * 100) / 70, (40 * 100) / 70], leftover: 30 });
        expect(normalizeMixPercentages([0, 0, 0])).toEqual({ weights: [0, 0, 0], leftover: 100 });
        expect(normalizeMixPercentages([50])).toEqual({ weights: [100], leftover: 50 });
    });
});

describe("color-mix() — every interpolation space and hue method is accepted, and the linear-light ones agree", () => {
    const SPACES = ["srgb", "srgb-linear", "display-p3", "display-p3-linear", "a98-rgb", "prophoto-rgb", "rec2020",
        "lab", "oklab", "xyz", "xyz-d50", "xyz-d65", "hsl", "hwb", "lch", "oklch"];
    const POLAR = ["hsl", "hwb", "lch", "oklch"];

    it("each of css-color-4 §13.1's sixteen spaces, and each polar space with each §13.5 method", () => {
        for (const s of SPACES) expect(parse(`color-mix(in ${s}, red, blue)`).ok, s).toBe(true);
        for (const s of POLAR) {
            for (const m of ["shorter", "longer", "increasing", "decreasing"]) expect(parse(`color-mix(in ${s} ${m} hue, red, blue)`).ok, `${s} ${m}`).toBe(true);
        }
        for (const s of SPACES.filter((x) => !POLAR.includes(x))) expect(parse(`color-mix(in ${s} longer hue, red, blue)`).ok, s).toBe(false);
    });

    it("a mix of opaque colours in any linear-light space is one XYZ point (a linear map commutes with the weighted mean)", () => {
        const xyz = (s: string) => parse(`color-mix(in ${s}, rgb(10% 60% 30%) 30%, color(display-p3 0.9 0.2 0.1))`).value as Color;
        const ref = xyz("xyz-d65");
        for (const s of ["srgb-linear", "display-p3-linear", "xyz", "xyz-d50"]) {
            const got = xyz(s);
            const inXyz = got.space === "xyz" ? got : (resolveColorMix({ kind: "color-mix", method: { space: "xyz" }, items: [{ color: got }] }) as Color);
            inXyz.channels.forEach((c, i) => expect(Math.abs((c as number) - (ref.channels[i] as number)), `${s}[${i}]`).toBeLessThan(1e-12));
        }
    });
});

describe("light-dark() — css-color-5 §2: parsed, and not an absolute colour", () => {
    it("reads both arms as colours and answers color_context_required, the contract currentcolor carries", () => {
        expect(parse("light-dark(white, black)").diagnostics.map((d) => d.code)).toEqual(["color_context_required"]);
        expect(parse("light-dark(#fff, color-mix(in oklab, red, blue))").diagnostics.map((d) => d.code)).toEqual(["color_context_required"]);
        expect(parse("currentcolor").diagnostics.map((d) => d.code)).toEqual(["color_context_required"]);
    });

    it("refuses a malformed arm as syntax, and is refused inside color-mix() as a context colour (§2: not in <color-mix()>)", () => {
        for (const bad of ["light-dark(white)", "light-dark(white, bogus)", "light-dark(white black)", "light-dark(white, black, red)"]) {
            expect(parse(bad).diagnostics.map((d) => d.code), bad).toEqual(["css_syntax"]);
        }
        expect(parse("color-mix(in srgb, light-dark(white, black), red)").diagnostics.map((d) => d.code)).toEqual(["color_context_required"]);
    });

    it("relative colour keeps its contract: no `from` production, the same refusal as before this unit", () => {
        const r = parse("rgb(from red r g b)");
        expect(r.ok).toBe(false);
        expect(r.diagnostics[0]).toMatchObject({ code: "css_syntax", start: 4 });
        expect(parse("color-mix(in srgb, rgb(from red r g b), blue)").ok).toBe(false);
    });
});

// COHESION §0bn names "CSS Color 4 §5.1/§6.1"; in the current Editor's Draft `<legacy-rgb-syntax>` is
// §5.1 and `<legacy-hsl-syntax>` is §7 (§6.1 is Named Colors) — the INTENT, cited at the true bytes.
describe("KFA-14 — the legacy comma forms, css-color-4 §5.1 (rgb/rgba) and §7 (hsl/hsla), COHESION §0bn's required seam case", () => {
    const legacy = (s: unknown): s is string => typeof s === "string" && /^\s*(rgba?|hsla?)\(/i.test(s) && s.includes(",");
    const VALID = ["color-valid.html", "color-valid-rgb.html", "color-valid-hsl.html"];
    const INVALID = ["color-invalid.html", "color-invalid-rgb.html", "color-invalid-hsl.html"];

    it("KFA-14's own input, the keyframes timeline colour, parses", () => {
        expect(parse("rgba(255, 0, 0, 0.5)")).toMatchObject({ ok: true, value: { space: "rgb", channels: [255, 0, 0], alpha: 0.5 } });
        expect(parse("hsla(120, 100%, 50%, 0.25)")).toMatchObject({ ok: true, value: { space: "hsl", channels: [120, 1, 0.5], alpha: 0.25 } });
    });

    it("every in-scope WPT valid legacy form parses to the colour its WPT serialization names", () => {
        const cases = VALID.flatMap((f) => loadWptCases(f)).filter((c) => legacy(c.input));
        expect(tally(cases.map((c) => scopeOf(c.input)))).toEqual({ in: 12, calc: 34 });
        const misses: string[] = [];
        for (const c of cases.filter((x) => scopeOf(x.input) === "in")) {
            const r = parse(c.input);
            const e = parse(c.expected ?? c.input);
            const why = r.ok && e.ok ? sameColor(r.value as Color, e.value as Color) : "refused";
            if (why !== null) misses.push(`${c.input}: ${why}`);
        }
        expect(misses).toEqual([]);
    });

    // F-W5c-1 — RE-RULED TO THE SPEC (COHESION §0bx, X.P.W5.g; DIVERGENCE-LEDGER §14). css-color-4
    // §4.2 (ED) reads `<alpha-value> = <number> | <percentage>` and its changelog "Made explicit that
    // legacy forms do not support none"; WPT refuses both inputs below. Until X.P.W5.g the seam
    // accepted them under PB-01/02 and this test asserted the pair AS RULED; the ruling moved, so the
    // pair moved with it: each legacy arm's alpha is `legacyAlpha()` (`algebra/grammar.mjs`) and the
    // two cells are refused like every other in-scope invalid legacy form, in both lowerings.
    const F_W5C_1 = ["rgb(255, 255, 255, none)", "hsla(120, 100%, 50%, none)"];

    it("every in-scope WPT invalid legacy form is refused, the two F-W5c-1 `none`-alpha cells included", () => {
        const cases = INVALID.flatMap((f) => loadWptCases(f)).filter((c) => legacy(c.input));
        expect(tally(cases.map((c) => scopeOf(c.input)))).toEqual({ in: 48, calc: 1 });
        const accepted = cases.filter((c) => scopeOf(c.input) === "in" && parse(c.input).ok).map((c) => c.input);
        expect(accepted).toEqual([]);
        expect(F_W5C_1.every((s) => cases.some((c) => c.input === s))).toBe(true);
    });

    it("F-W5c-1 in both lowerings: a `none` legacy alpha is css_syntax, the modern `/ none` still parses", async () => {
        const { js, wasm } = (await loadPublicSurfaces()) as unknown as Record<"js" | "wasm", { parseCssColor: (s: string) => Result }>;
        for (const s of F_W5C_1) {
            const a = js.parseCssColor(s);
            expect(a.ok, s).toBe(false);
            expect(JSON.stringify(wasm.parseCssColor(s)), s).toBe(JSON.stringify(a));
        }
        expect(parse("rgb(255 255 255 / none)")).toMatchObject({ ok: true, value: { alpha: "none" } });
        expect(parse("hsl(120 100% 50% / none)")).toMatchObject({ ok: true, value: { alpha: "none" } });
    });
});
