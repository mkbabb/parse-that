// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.i — the animation family's own fixture: `P:keyframe-selector` / `P:animation-timeline` /
// `P:animation-range` / `P:animation-option` in the 22-op algebra, the CTOR family closed across
// its four realizations, and the three structured compositions on `entry.mjs`
// (`collectAnimationOptions`, `collectTimelineOptions`, `serializeTimelineOptions`).
//
//   npx vitest run --config typescript/test/css-recovery/vitest.config.ts test/css-recovery/animation-grammar.test.ts
//
// Every parser row runs through BOTH lowerings and is asserted byte-identical (G-5's law at the
// fixture's scale), with the shield's ledger read before and after (G-3: `SHIELD.caught` moves by
// zero — no row here is answered by the shield). The constructor family is asserted BEHAVIOURALLY:
// every `R_ctor` row this unit added is exercised by a witness input on both lowerings, which is
// the only closure the grant allows a test to state (the node table and the emitter HALT at load on
// a missing row; the JS `CTORS` map answers only when it is asked).
//
// The ORACLE's own readings are quoted where a row asserts a verdict the incumbent also reaches —
// the twenty `parseKeyframeSelector` accepts, the four `parseAnimationTimeline` accepts and the
// forty-one `parseAnimationRange` accepts of the union corpus are the universe row's accept band,
// and G-1 reads all three rows TOTAL at the same bytes.

import { describe, expect, it } from "vitest";

import { L, R_ctor } from "../../src/css/algebra/tables.mjs";
import { PRODUCTION_LABELS } from "../../src/css/diagnostics.mjs";
import { SHIELD, UNREALIZED_ENTRIES, collectAnimationOptions, loadPublicSurfaces, serializeTimelineOptions } from "../../src/css/entry.mjs";

type Result = { ok: boolean; value?: unknown; diagnostics?: { code: string; start: number; end: number; expected: string[]; actual: string | null }[] };
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
const keyword = (value: string) => ({ kind: "scalar", payload: { type: "keyword", value } });
const number = (value: number, unit = "") => ({ kind: "scalar", payload: { type: "number", value, unit } });

/* ── 1. `parseKeyframeSelector` — `grammar.ts` parseKeyframeSelector, arm for arm ────────────── */

describe("P:keyframe-selector", () => {
    it("the two keywords carry their own percent, ASCII-folded", () => {
        expect(both("parseKeyframeSelector", "from").value).toEqual({ kind: "percent", value: 0 });
        expect(both("parseKeyframeSelector", "to").value).toEqual({ kind: "percent", value: 1 });
        expect(both("parseKeyframeSelector", "TO").value).toEqual({ kind: "percent", value: 1 });
        expect(both("parseKeyframeSelector", "From").value).toEqual({ kind: "percent", value: 0 });
    });

    it("a percent is the number divided by 100, guarded on [0,100] with its own frozen code", () => {
        expect(both("parseKeyframeSelector", "0%").value).toEqual({ kind: "percent", value: 0 });
        expect(both("parseKeyframeSelector", "25.5%").value).toEqual({ kind: "percent", value: 0.255 });
        expect(both("parseKeyframeSelector", "100%").value).toEqual({ kind: "percent", value: 1 });
        const over = both("parseKeyframeSelector", "101%");
        expect(over.ok).toBe(false);
        expect(over.diagnostics?.[0].code).toBe("keyframe_selector_invalid");
        expect(over.diagnostics?.[0].expected[0]).toBe(PRODUCTION_LABELS["0%..100%"]);
        expect(both("parseKeyframeSelector", "-1%").ok).toBe(false);
    });

    it("the four named phases, with and without an offset, and the offset's own [0,1] guard", () => {
        expect(both("parseKeyframeSelector", "entry").value).toEqual({ kind: "named", name: "entry" });
        expect(both("parseKeyframeSelector", "CONTAIN").value).toEqual({ kind: "named", name: "contain" });
        expect(both("parseKeyframeSelector", "entry 50%").value).toEqual({ kind: "named", name: "entry", offset: 0.5 });
        expect(both("parseKeyframeSelector", "exit 100%").value).toEqual({ kind: "named", name: "exit", offset: 1 });
        expect(both("parseKeyframeSelector", "exit 101%").ok).toBe(false);
        expect(both("parseKeyframeSelector", "entry 50").ok).toBe(false); //   the `%` is mandatory
        expect(both("parseKeyframeSelector", "entryx").ok).toBe(false); //     the ident run is maximal
    });

    it("nothing else is a selector, and the refusal carries the unit's own code at the first byte", () => {
        const none = both("parseKeyframeSelector", "zzz");
        expect(none.ok).toBe(false);
        expect(none.diagnostics?.[0]).toMatchObject({ code: "keyframe_selector_invalid", start: 0, end: 3, actual: "zzz" });
        expect(none.diagnostics?.[0].expected[0]).toBe(PRODUCTION_LABELS["<keyframe-selector>"]);
        expect(both("parseKeyframeSelector", "from to").ok).toBe(false);
        expect(both("parseKeyframeSelector", "").ok).toBe(false);
    });
});

/* ── 2. `parseAnimationTimeline` — `timeline.ts` parseAnimationTimeline ──────────────────────── */

describe("P:animation-timeline", () => {
    it("the two keyword kinds and the dashed name", () => {
        expect(both("parseAnimationTimeline", "auto").value).toEqual({ kind: "auto" });
        expect(both("parseAnimationTimeline", "NONE").value).toEqual({ kind: "none" });
        expect(both("parseAnimationTimeline", "--x").value).toEqual({ kind: "name", name: "--x" });
        expect(both("parseAnimationTimeline", "--My-Name_2").value).toEqual({ kind: "name", name: "--My-Name_2" });
        expect(both("parseAnimationTimeline", "--").ok).toBe(false); //        `[-\w]+` needs one
        expect(both("parseAnimationTimeline", "-x").ok).toBe(false); //        both dashes are required
    });

    it("scroll(): an empty body, either vocabulary, either separator, and the duplicate guard", () => {
        expect(both("parseAnimationTimeline", "scroll()").value).toEqual({ kind: "scroll" });
        expect(both("parseAnimationTimeline", "scroll(block root)").value).toEqual({ kind: "scroll", scroller: "root", axis: "block" });
        expect(both("parseAnimationTimeline", "scroll(root,block)").value).toEqual({ kind: "scroll", scroller: "root", axis: "block" });
        expect(both("parseAnimationTimeline", "SCROLL( , self , )").value).toEqual({ kind: "scroll", scroller: "self" });
        const twice = both("parseAnimationTimeline", "scroll(root root)");
        expect(twice.ok).toBe(false);
        expect(twice.diagnostics?.[0].code).toBe("timeline_option_invalid");
        expect(twice.diagnostics?.[0].expected[0]).toBe(PRODUCTION_LABELS["<scroll-timeline>"]);
        expect(both("parseAnimationTimeline", "scroll(bogus)").ok).toBe(false);
        expect(both("parseAnimationTimeline", "scrolls()").ok).toBe(false); //  the ident run is maximal
    });

    //  KO-1, the one declared divergence this family carries, pinned so it cannot drift silently.
    //  The record's keys are written in a FIXED sequence (G-5 makes record layout part of the gate);
    //  the incumbent assigns them as it consumes arguments. The VALUES are equal — `toEqual` above
    //  passes either way — so this row asserts the key ORDER itself, which is the whole difference.
    it("KO-1: the record's key order is fixed, and both lowerings write the same one", () => {
        const js = surfaces.js.parseAnimationTimeline("scroll(block root)");
        const wasm = surfaces.wasm.parseAnimationTimeline("scroll(block root)");
        expect(Object.keys(js.value as object)).toEqual(["kind", "scroller", "axis"]);
        expect(Object.keys(wasm.value as object)).toEqual(["kind", "scroller", "axis"]);
        expect(js.value).toEqual({ kind: "scroll", scroller: "root", axis: "block" });
    });

    it("view(): the axis, up to two inset tokens kept as their own TEXT, and the guards", () => {
        expect(both("parseAnimationTimeline", "view()").value).toEqual({ kind: "view" });
        expect(both("parseAnimationTimeline", "view(inline 10% 20%)").value).toEqual({ kind: "view", axis: "inline", inset: { start: "10%", end: "20%" } });
        expect(both("parseAnimationTimeline", "view(12.5rem)").value).toEqual({ kind: "view", inset: { start: "12.5rem" } });
        //  the incumbent keeps the AUTHORED text of a length-percentage, never a number
        expect(both("parseAnimationTimeline", "view(841fEd)").value).toEqual({ kind: "view", inset: { start: "841fEd" } });
        expect(both("parseAnimationTimeline", "view(AUTO)").value).toEqual({ kind: "view", inset: { start: "AUTO" } });
        expect(both("parseAnimationTimeline", "view(10% 20% 30%)").ok).toBe(false);
        expect(both("parseAnimationTimeline", "view(x y)").ok).toBe(false);
    });
});

/* ── 3. `parseAnimationRange` — `timeline.ts` parseAnimationRange + rangeBoundary ────────────── */

describe("P:animation-range", () => {
    it("the LENGTH_PERCENTAGE token is its own source text, never a number", () => {
        for (const [source, offset] of [["25De", "25De"], ["841fEd", "841fEd"], ["11e", "11e"], ["+1438", "+1438"], ["0.5turn", "0.5turn"], ["1.", "1."], [".5%", ".5%"], ["auto", "auto"]] as const) {
            expect(both("parseAnimationRange", source).value, source).toEqual({ start: { offset } });
        }
        //  `1e3` is ONE number to OP-03 and NOTHING to the incumbent's regex — the regex wins here
        expect(both("parseAnimationRange", "1e3").ok).toBe(false);
        expect(both("parseAnimationRange", "5px2").ok).toBe(false);
        expect(both("parseAnimationRange", "auto5").ok).toBe(false);
    });

    it("`rangeBoundary`'s three shapes, and the phase's canonical lower-case spelling", () => {
        expect(both("parseAnimationRange", "cover").value).toEqual({ start: { phase: "cover" } });
        expect(both("parseAnimationRange", "ENTRY-CROSSING").value).toEqual({ start: { phase: "entry-crossing" } });
        expect(both("parseAnimationRange", "entry 50%").value).toEqual({ start: { phase: "entry", offset: "50%" } });
        expect(both("parseAnimationRange", "exit 101%").value).toEqual({ start: { phase: "exit", offset: "101%" } });
    });

    it("the comma form takes exactly two non-empty parts, however many commas stand around them", () => {
        expect(both("parseAnimationRange", "entry,exit").value).toEqual({ start: { phase: "entry" }, end: { phase: "exit" } });
        expect(both("parseAnimationRange", ",,entry 10% , , exit 90%,,").value).toEqual({ start: { phase: "entry", offset: "10%" }, end: { phase: "exit", offset: "90%" } });
        expect(both("parseAnimationRange", "a,b,c").ok).toBe(false); //        three parts is `n.length > 2`
        expect(both("parseAnimationRange", "entry,").ok).toBe(false);
    });

    it("the space form is the incumbent's `single`, then `split = 2`, then `split = 1`, in order", () => {
        expect(both("parseAnimationRange", "entry 50% exit").value).toEqual({ start: { phase: "entry", offset: "50%" }, end: { phase: "exit" } });
        expect(both("parseAnimationRange", "entry exit").value).toEqual({ start: { phase: "entry" }, end: { phase: "exit" } });
        expect(both("parseAnimationRange", "50% entry 25%").value).toEqual({ start: { offset: "50%" }, end: { phase: "entry", offset: "25%" } });
        expect(both("parseAnimationRange", "entry 50% exit 100%").value).toEqual({ start: { phase: "entry", offset: "50%" }, end: { phase: "exit", offset: "100%" } });
        expect(both("parseAnimationRange", "entry 50% 25%").value).toEqual({ start: { phase: "entry", offset: "50%" }, end: { offset: "25%" } });
        expect(both("parseAnimationRange", "entry exit cover").ok).toBe(false); //   five slots, no arm
        expect(both("parseAnimationRange", "a b c d e").ok).toBe(false);
    });

    it("nothing at all is refused with the unit's own frozen code", () => {
        const none = both("parseAnimationRange", "");
        expect(none.ok).toBe(false);
        expect(none.diagnostics?.[0]).toMatchObject({ code: "timeline_option_invalid", start: 0, end: 0 });
        expect(none.diagnostics?.[0].expected[0]).toBe(PRODUCTION_LABELS["<animation-range>"]);
    });
});

/* ── 4. `P:animation-option` — `rules.ts` emptyComma, the declaration-level law ──────────────── */

describe("P:animation-option — the eighth frozen code's own production", () => {
    const option = (source: string) => {
        const js = surfaces.js.raw as unknown as (prod: string, src: string) => { result: Result };
        const wasm = surfaces.wasm.raw as unknown as (prod: string, src: string) => { result: Result };
        const a = js("P:animation-option", source).result;
        const b = wasm("P:animation-option", source).result;
        expect(JSON.stringify(b), `P:animation-option(${JSON.stringify(source)}) differs across lowerings`).toBe(JSON.stringify(a));
        return a;
    };

    it("a comma list of non-blank parts, each one a run of value tokens", () => {
        expect(option("1s linear").ok).toBe(true);
        expect(option("3s ease-in, 2s").value).toEqual([[number(3, "s"), keyword("ease-in")], [number(2, "s")]]);
        expect(option("rgb(1 2 3)").ok).toBe(true);
    });

    it("a blank part is `animation_option_invalid`, named, at the byte where it stands", () => {
        for (const source of ["", ",", "a,", ",a", "a,,b", " , "]) {
            const r = option(source);
            expect(r.ok, source).toBe(false);
            expect(r.diagnostics?.[0].code, source).toBe("animation_option_invalid");
            expect(r.diagnostics?.[0].expected[0], source).toBe(PRODUCTION_LABELS["nonempty animation list item"]);
        }
    });

    it("a part that is not a value is refused, so the production is not a totalizing accept-all", () => {
        expect(option("\u0000not a production\u0000").ok).toBe(false);
        expect(option("1px5").ok).toBe(false);
    });
});

/* ── 5. the CTOR family: every row this unit added has a witness on BOTH lowerings ───────────── */

describe("the CTOR family, closed across its four realizations", () => {
    const WITNESSES: Record<string, [string, string]> = {
        "lp-text": ["parseAnimationRange", "12.5rem"],
        "lp-auto": ["parseAnimationRange", "auto"],
        "range-phase": ["parseAnimationRange", "cover"],
        "range-phase-offset": ["parseAnimationRange", "entry 50%"],
        "range-offset": ["parseAnimationRange", "50%"],
        "range-single": ["parseAnimationRange", "entry"],
        "range-pair": ["parseAnimationRange", "entry,exit"],
        "keyframe-word": ["parseKeyframeSelector", "from"],
        "keyframe-percent": ["parseKeyframeSelector", "50%"],
        "keyframe-named": ["parseKeyframeSelector", "entry 50%"],
        "timeline-mode": ["parseAnimationTimeline", "auto"],
        "timeline-name": ["parseAnimationTimeline", "--x"],
        "timeline-scroll": ["parseAnimationTimeline", "scroll(root)"],
        "timeline-view": ["parseAnimationTimeline", "view(inline 10%)"],
    };

    it("every X.P.W3.i row is exercised by a witness that BOTH lowerings accept identically", () => {
        const rows = Object.entries(R_ctor).filter(([, row]) => (row as { since?: string }).since === "X.P.W3.i").map(([name]) => name);
        //  `animation-option` and `animation-option-list` are the raw entry's, witnessed in §4 above
        expect(rows.filter((name) => !name.startsWith("animation-option")).sort()).toEqual(Object.keys(WITNESSES).sort());
        for (const [row, [entry, source]] of Object.entries(WITNESSES)) {
            const r = both(entry, source);
            expect(r.ok, `${row}: ${entry}(${source})`).toBe(true);
        }
    });
});

/* ── 6. the three structured compositions on `entry.mjs` ─────────────────────────────────────── */

describe("collectAnimationOptions · collectTimelineOptions · serializeTimelineOptions", () => {
    const declaration = (name: string, value: unknown, important = false) => ({ name, value, important });

    it("collectAnimationOptions reads the cascade and repeats every component modulo its length", () => {
        expect(collectAnimationOptions([declaration("color", keyword("red"))])).toEqual([]);
        expect(
            collectAnimationOptions([
                declaration("animation-name", { kind: "list", separator: "comma", items: [keyword("a"), keyword("b")] }),
                declaration("animation-duration", number(2, "s")),
                declaration("animation-iteration-count", keyword("infinite")),
            ]),
        ).toEqual([
            { name: "a", duration: 2, iterationCount: Infinity },
            { name: "b", duration: 2, iterationCount: Infinity },
        ]);
    });

    it("collectAnimationOptions expands the `animation` shorthand, component by component", () => {
        const rows = collectAnimationOptions([
            declaration("animation", { kind: "list", separator: "space", items: [number(3, "s"), keyword("ease-in"), number(1, "s"), keyword("infinite"), keyword("slidein")] }),
        ]);
        expect(rows).toEqual([{
            name: "slidein",
            duration: 3,
            delay: 1,
            iterationCount: Infinity,
            direction: "normal",
            fillMode: "none",
            timingFunction: { kind: "keyword", name: "ease-in" },
            composition: "replace",
        }]);
    });

    it("collectTimelineOptions re-parses through THIS lowering, and both lowerings agree", () => {
        const declarations = [
            declaration("animation-timeline", keyword("--tl")),
            declaration("animation-range", { kind: "list", separator: "space", items: [keyword("entry"), number(50, "%")] }),
            declaration("timeline-scope", keyword("--tl")),
        ];
        const js = surfaces.js.collectTimelineOptions(declarations);
        const wasm = surfaces.wasm.collectTimelineOptions(declarations);
        expect(JSON.stringify(wasm)).toBe(JSON.stringify(js));
        expect(js).toEqual({
            timeline: { kind: "name", name: "--tl" },
            range: { start: { phase: "entry", offset: "50%" } },
            timelineScope: { kind: "names", names: ["--tl"] },
        });
    });

    it("serializeTimelineOptions is the inverse of the four properties it came from", () => {
        expect(serializeTimelineOptions({
            timeline: { kind: "view", axis: "block", inset: { start: "10%", end: "20%" } },
            range: { start: { phase: "entry", offset: "50%" }, end: { phase: "exit" } },
            timelineScope: { kind: "names", names: ["--a", "--b"] },
            trigger: { type: "once", timeline: { kind: "auto" } },
        })).toEqual({
            "animation-timeline": "view(block 10% 20%)",
            "animation-range": "entry 50% exit",
            "timeline-scope": "--a, --b",
            "animation-trigger": "once auto",
        });
        expect(serializeTimelineOptions({})).toEqual({});
    });

    it("TOTALITY OF SHAPE: the seven declared degenerate values are answered, never thrown on", () => {
        const degenerate: unknown[] = [undefined, null, 42, {}, [], true, NaN];
        for (const value of degenerate) {
            expect(collectAnimationOptions(value as never), String(value)).toEqual([]);
            expect(serializeTimelineOptions(value as never), String(value)).toEqual({});
            for (const kind of ["js", "wasm"] as const) {
                expect(surfaces[kind].collectTimelineOptions(value as never), `${kind} ${String(value)}`).toEqual({});
            }
        }
    });
});

/* ── 7. the surface, the label tail, and the shield ──────────────────────────────────────────── */

describe("the surface this unit closes", () => {
    it("all nine frozen parsers are published, and nothing is declared unrealized any more", () => {
        expect(UNREALIZED_ENTRIES).toEqual([]);
        for (const name of ["parseKeyframeSelector", "parseAnimationTimeline", "parseAnimationRange", "collectAnimationOptions", "collectTimelineOptions", "serializeTimelineOptions"]) {
            expect(typeof surfaces.js[name], name).toBe("function");
            expect(typeof surfaces.wasm[name], name).toBe("function");
        }
    });

    //  K-10 is "APPEND, and move nothing" — so this reads a SLICE OF ITS OWN LENGTH at this unit's
    //  own offset, never `L`'s tail and never a literal `L.length`. A tail-shaped assertion states
    //  "nothing follows me", which is a claim no unit is entitled to make and which the NEXT unit
    //  falsifies by obeying K-10 (X.P.W3.h's own row is RED for exactly that reason — see E-i1).
    it("this unit's labels are APPENDED after X.P.W3.h's, in registry order, none moved", () => {
        const mine = [
            "<sign>", "<decimal-point>", "<percent-unit>", "<unit-letters>", "<comma-or-whitespace>",
            "<animation-item-text>", "<keyframe-keyword>", "<keyframe-phase>", "<range-phase>",
            "<timeline-keyword>", "<scroll-argument>", "<timeline-axis>", "<timeline-function>",
            "<length-percentage>", "'auto'", "<animation-range>", "<keyframe-selector>", "0%..100%",
            "<dashed-ident>", "<scroll-timeline>", "<view-timeline>", "<animation-option-list>",
            "<animation-timeline>", "nonempty animation list item",
        ];
        const at = L.indexOf(mine[0]);
        expect(L.indexOf("'''"), "X.P.W3.h's last label stands immediately before this unit's first").toBe(at - 1);
        expect(L.slice(at, at + mine.length)).toEqual(mine);
        expect(L.length).toBeGreaterThanOrEqual(at + mine.length);
        for (const label of mine) expect(PRODUCTION_LABELS[label], label).toBeDefined();
        expect(new Set(L).size, "the label index is injective").toBe(L.length);
    });

    it("G-3: the shield's ledger does not move — no row above is answered by a caught throw", () => {
        expect(SHIELD.caught).toBe(LEDGER_AT_LOAD);
        expect(SHIELD.faults()).toEqual([]);
    });
});
