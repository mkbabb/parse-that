// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.g — THE DIMENSION-TOKEN BOUNDARY (css-syntax-3 §4.3.3), at juxtaposition.
//
//   npx vitest run --config typescript/test/css-recovery/vitest.config.ts test/css-recovery/dimension-token.test.ts
//
// COHESION §0p F-e1 / F-e2: `hsl(120deg50%50%)` and `rgb(255none none)` were ACCEPTED by both
// lowerings, where css-syntax-3 tokenizes `120deg50` / `255none` as single invalid
// <dimension-token>s. "A candidate that accepts invalid CSS fails R1 totality in the accept
// direction." This suite is that gate's falsifier, and it is GENERATED: every input below is built
// from a part table by the spec's own rule, so the two witnesses §0p names are MEMBERS of a family
// rather than two strings a seat typed (§6 asserts exactly that membership).
//
// ── THE SPEC, QUOTED ─────────────────────────────────────────────────────────────────────────
//
// css-syntax-3 §4.3.3 "Consume a numeric token":
//
//     "Consume a number and let number be the result.
//      If the next 3 input code points would start an ident sequence, then:
//        1. Create a <dimension-token> with the same value and type flag as number, and a unit set
//           initially to the empty string.
//        2. Consume an ident sequence. Set the <dimension-token>'s unit to the returned value.
//        3. Return the <dimension-token>.
//      Otherwise, if the next input code point is U+0025 PERCENTAGE SIGN (%), consume it. Create a
//      <percentage-token> with the same value as number, and return it.
//      Otherwise, create a <number-token> with the same value and type flag as number, and return
//      it."
//
// css-syntax-3 §4.3.9 "Check if three code points would start an ident sequence":
//
//     "Look at the first code point:
//      U+002D HYPHEN-MINUS: If the second code point is an ident-start code point or a U+002D
//        HYPHEN-MINUS, or the third code point is a valid escape, return true. Otherwise, return
//        false.
//      ident-start code point: Return true.
//      U+005C REVERSE SOLIDUS (\): If the first and second code points are a valid escape, return
//        true. Otherwise, return false.
//      anything else: Return false."
//
// TWO CONSEQUENCES, and they are what the algebra now realises:
//
//   (1) a numeric token followed with NO whitespace by something that would start an ident
//       sequence is ONE <dimension-token> — never a number and a second value. `255none` is a
//       dimension whose unit is `none`, so `rgb(255none none)` carries TWO components, not three.
//   (2) the unit is the MAXIMAL ident sequence (step 2 consumes an ident sequence, and §4.3.11
//       consumes ident code points until one is not). `deg50` is not `deg`, so `hsl(120deg50%50%)`
//       carries an invalid unit and no <hue> at all.
//
// The `-` clause of §4.3.9 is the reason the algebra reads the START of a unit with the
// `ident-start` class and its CONTINUATION with `ident`: `rgb(1-2 3)` is two numbers (the second
// code point is a digit, so §4.3.9 returns false) while `rgb(1-x 3)` is not. §7 measures both.
//
// The U+005C clause has no realization anywhere in this slice — no production consumes an escape —
// and the suite says so rather than pretending to cover it.

import { describe, expect, it } from "vitest";

import { SHIELD, loadPublicSurfaces } from "../../src/css/entry.mjs";

const surfaces = await loadPublicSurfaces();
const LOWERINGS = Object.keys(surfaces) as ("js" | "wasm")[];

/* ── the two spec predicates, implemented from the quoted text and from nothing else ────────── */

/** §4.3.9's "ident-start code point": a letter, U+005F, or a non-ASCII code point. */
const isIdentStartCP = (c: string) => /[A-Za-z_]/.test(c) || c.charCodeAt(0) >= 0x80;
/** §4.3.11's ident code points: an ident-start code point, a digit, or U+002D. */
const isIdentCP = (c: string) => isIdentStartCP(c) || /[0-9-]/.test(c);
/** §4.3.9, the three clauses that HAVE a realization here (the escape clause is named, not coded). */
const wouldStartIdent = (s: string) => {
    if (s === "") return false;
    if (s[0] === "-") return s.length > 1 && (isIdentStartCP(s[1]) || s[1] === "-");
    return isIdentStartCP(s[0]);
};

/* ── the part table: what a component of a colour function may be, and how it ENDS and BEGINS ── */

type Tail = "number" | "dimension" | "other";
type Part = { text: string; tail: Tail };

const part = (text: string, tail: Tail): Part => ({ text, tail });

/** The four angle units the grammar names, and nothing else — a fifth would be an invalid unit. */
const ANGLE_UNITS = ["deg", "grad", "rad", "turn"] as const;
/** Ident CONTINUATION runs, appended to a valid unit to make it maximal and therefore wrong. */
const CONTINUATIONS = ["50", "0", "s", "x", "-2", "_a"] as const;

const HUES: Part[] = [
    part("120", "number"),
    part("0.5", "number"),
    ...ANGLE_UNITS.map((u) => part(`120${u}`, "dimension")),
    part("none", "other"),
];
const PCTS: Part[] = [part("50%", "other"), part("none", "other")];
const RGB_CH: Part[] = [part("255", "number"), part("0.5", "number"), part("50%", "other"), part("none", "other")];
const OK_L: Part[] = [part("0.5", "number"), part("50%", "other"), part("none", "other")];
const OK_C: Part[] = [part("0.1", "number"), part("50%", "other"), part("none", "other")];

/**
 * A template is a function head and an ordered list of component slots, joined by ONE space. The
 * generator keeps each joint's two facts, so the §4.3.3 merge is DERIVED per joint rather than
 * decided by hand.
 */
type Template = { entry: "parseCssColor" | "parseTimingFunction" | "parseStylesheet"; wrap: (body: string) => string; slots: Part[][] };

const TEMPLATES: Template[] = [
    { entry: "parseCssColor", wrap: (b) => `hsl(${b})`, slots: [HUES, PCTS, PCTS] },
    { entry: "parseCssColor", wrap: (b) => `rgb(${b})`, slots: [RGB_CH, RGB_CH, RGB_CH] },
    { entry: "parseCssColor", wrap: (b) => `oklch(${b})`, slots: [OK_L, OK_C, HUES] },
    { entry: "parseStylesheet", wrap: (b) => `a{color:rgb(${b})}`, slots: [RGB_CH, RGB_CH, RGB_CH] },
];

const cartesian = <T,>(lists: T[][]): T[][] =>
    lists.reduce<T[][]>((acc, list) => acc.flatMap((row) => list.map((v) => [...row, v])), [[]]);

/**
 * A joint MERGES under §4.3.3 exactly when deleting its whitespace makes the two components one
 * numeric token: a bare number swallows anything that would START an ident sequence, and a
 * dimension's unit swallows any further ident code point (it is maximal).
 */
const mergesAt = (left: Part, right: Part) =>
    left.tail === "number"
        ? wouldStartIdent(right.text)
        : left.tail === "dimension" && isIdentCP(right.text[0]);

type Case = { entry: Template["entry"]; src: string; control: string; joint: number; why: string };

const CONTROLS: { entry: Template["entry"]; src: string }[] = [];
const MERGED: Case[] = [];
const UNMERGED: Case[] = [];

for (const t of TEMPLATES) {
    for (const row of cartesian(t.slots)) {
        const control = t.wrap(row.map((p) => p.text).join(" "));
        CONTROLS.push({ entry: t.entry, src: control });
        for (let j = 0; j + 1 < row.length; j++) {
            const body = row.map((p) => p.text);
            const joined = [...body.slice(0, j), `${body[j]}${body[j + 1]}`, ...body.slice(j + 2)].join(" ");
            const c: Case = {
                entry: t.entry,
                src: t.wrap(joined),
                control,
                joint: j,
                why: `${row[j].tail} + ${JSON.stringify(row[j + 1].text)}`,
            };
            (mergesAt(row[j], row[j + 1]) ? MERGED : UNMERGED).push(c);
        }
    }
}

/** Consequence (2): a valid unit plus any ident continuation is a DIFFERENT, invalid unit. */
const UNIT_EXTENDED = ANGLE_UNITS.flatMap((u) =>
    CONTINUATIONS.map((run) => ({ entry: "parseCssColor" as const, src: `hsl(120${u}${run} 50% 50%)`, unit: `${u}${run}` })),
);

/**
 * §10.2's numbers carry no `NUMT` guard: every one of them is followed by a MANDATORY terminal no
 * ident code point can satisfy, so the token cannot be split there. That is a claim about the
 * grammar, and §5 MEASURES it rather than trusting it.
 */
const PINNED_EDGE = [
    ...["none", "px", "e", "deg"].map((i) => ({ entry: "parseTimingFunction" as const, src: `cubic-bezier(0, 0, 1${i}, 1)` })),
    ...["jump-start", "none", "x"].map((i) => ({ entry: "parseTimingFunction" as const, src: `steps(2${i})` })),
    ...["none", "px", "x"].map((i) => ({ entry: "parseTimingFunction" as const, src: `linear(0${i}, 1)` })),
];

/* ── the readings, taken once, off BOTH lowerings ───────────────────────────────────────────── */

const shieldBefore = SHIELD.caught;
const read = (entry: Template["entry"], src: string) =>
    LOWERINGS.map((l) => {
        const r = (surfaces[l] as Record<string, (s: string) => { ok: boolean; diagnostics?: { code: string }[] }>)[entry](src);
        return { lowering: l, ok: r.ok, code: r.ok ? null : (r.diagnostics?.[0]?.code ?? null) };
    });
const agree = (rs: ReturnType<typeof read>) => rs.every((r) => r.ok === rs[0].ok && r.code === rs[0].code);

describe("§1 the generated families are non-empty and self-counted", () => {
    it("reports the census the assertions below consume", () => {
        expect(LOWERINGS).toEqual(["js", "wasm"]);
        //  SELF-COUNT: the census is the product of the part tables, taken from the tables
        //  themselves, so a shrunken family cannot pass by generating nothing. The tables are
        //  HUES 7 · PCTS 2 · RGB_CH 4 · OK_L 3 · OK_C 3, so the four templates give
        //  7·2·2 + 4³ + 3·3·7 + 4³ = 28 + 64 + 63 + 64 = 219.
        expect(TEMPLATES.map((t) => t.slots.reduce((n, s) => n * s.length, 1))).toEqual([28, 64, 63, 64]);
        expect(CONTROLS).toHaveLength(219);
        expect(MERGED.length + UNMERGED.length).toBe(CONTROLS.length * 2); //  every template has 3 slots = 2 joints
        expect(MERGED.length).toBeGreaterThan(0);
        expect(UNMERGED.length).toBeGreaterThan(0);
        expect(UNIT_EXTENDED).toHaveLength(ANGLE_UNITS.length * CONTINUATIONS.length);
        expect(PINNED_EDGE).toHaveLength(10);
    });
});

describe("§2 the controls — every generated well-formed input is ACCEPTED by both lowerings", () => {
    it("accepts all of them, identically", () => {
        const bad = CONTROLS.filter(({ entry, src }) => {
            const rs = read(entry, src);
            return !agree(rs) || !rs[0].ok;
        }).map(({ src }) => src);
        expect(bad, `controls that did not accept identically: ${bad.slice(0, 8).join(" · ")}`).toEqual([]);
    });
});

describe("§3 consequence (1) — a merged joint is ONE <dimension-token> and is REJECTED", () => {
    it("rejects every merged variant with css_syntax, identically in both lowerings", () => {
        const bad = MERGED.filter(({ entry, src }) => {
            const rs = read(entry, src);
            return !agree(rs) || rs[0].ok || rs[0].code !== "css_syntax";
        }).map((c) => `${c.src} (${c.why})`);
        expect(bad, `merged joints that did not reject: ${bad.slice(0, 8).join(" · ")}`).toEqual([]);
    });

    it("leaves every UNMERGED joint's verdict to the grammar, and both lowerings still agree", () => {
        const bad = UNMERGED.filter(({ entry, src }) => !agree(read(entry, src))).map((c) => c.src);
        expect(bad, `unmerged joints where the lowerings disagreed: ${bad.slice(0, 8).join(" · ")}`).toEqual([]);
    });
});

describe("§4 consequence (2) — the unit is MAXIMAL, so a valid unit plus any ident run is invalid", () => {
    it("rejects every extended unit with css_syntax, identically", () => {
        const bad = UNIT_EXTENDED.filter(({ entry, src }) => {
            const rs = read(entry, src);
            return !agree(rs) || rs[0].ok || rs[0].code !== "css_syntax";
        }).map((c) => `${c.src} (unit ${c.unit})`);
        expect(bad, `extended units that did not reject: ${bad.slice(0, 8).join(" · ")}`).toEqual([]);
    });

    it("keeps the four bare units ACCEPTED — the cure narrows the invalid, never the valid", () => {
        for (const u of ANGLE_UNITS) {
            const rs = read("parseCssColor", `hsl(120${u} 50% 50%)`);
            expect(agree(rs), `lowerings disagreed on 120${u}`).toBe(true);
            expect(rs[0].ok, `hsl(120${u} 50% 50%) was rejected`).toBe(true);
        }
    });
});

describe("§5 the pinned edges — §10.2's numbers reject a juxtaposed ident WITHOUT a guard", () => {
    it("rejects every timing juxtaposition, identically, by the mandatory terminal alone", () => {
        const bad = PINNED_EDGE.filter(({ entry, src }) => {
            const rs = read(entry, src);
            return !agree(rs) || rs[0].ok || rs[0].code !== "css_syntax";
        }).map((c) => c.src);
        expect(bad, `timing juxtapositions that did not reject: ${bad.slice(0, 8).join(" · ")}`).toEqual([]);
    });

    it("keeps the timing controls ACCEPTED", () => {
        for (const src of ["cubic-bezier(0, 0, 1, 1)", "steps(2, jump-start)", "linear(0, 1)"]) {
            const rs = read("parseTimingFunction", src);
            expect(agree(rs) && rs[0].ok, `${src} was rejected`).toBe(true);
        }
    });
});

describe("§6 COHESION §0p's two witnesses are MEMBERS of the generated family, not pinned strings", () => {
    it("F-e2 — `rgb(255none none)` is generated by the rgb template's first joint", () => {
        const row = MERGED.find((c) => c.src === "rgb(255none none)");
        expect(row, "rgb(255none none) is not in the generated merged family").toBeDefined();
        expect(row!.control).toBe("rgb(255 none none)");
        expect(read("parseCssColor", row!.src)).toEqual([
            { lowering: "js", ok: false, code: "css_syntax" },
            { lowering: "wasm", ok: false, code: "css_syntax" },
        ]);
    });

    it("F-e1 — `hsl(120deg50%50%)` is the deg control with BOTH joints merged", () => {
        //  the first joint merges `deg` with `50` into the unit `deg50` (consequence 2); the second
        //  is a legal token boundary (`%` ends a <percentage-token>) and changes only the arity.
        const control = "hsl(120deg 50% 50%)";
        expect(CONTROLS.some((c) => c.src === control)).toBe(true);
        expect(MERGED.some((c) => c.src === "hsl(120deg50% 50%)" && c.control === control)).toBe(true);
        expect(read("parseCssColor", "hsl(120deg50%50%)")).toEqual([
            { lowering: "js", ok: false, code: "css_syntax" },
            { lowering: "wasm", ok: false, code: "css_syntax" },
        ]);
    });
});

describe("§7 §4.3.9's `-` clause and the <percentage-token> branch — the cure does NOT over-reject", () => {
    it("`rgb(1-2 3)` stays ACCEPTED: the second code point is a digit, so no ident sequence starts", () => {
        expect(wouldStartIdent("-2")).toBe(false);
        expect(wouldStartIdent("-x")).toBe(true);
        expect(wouldStartIdent("none")).toBe(true);
        expect(wouldStartIdent("50%")).toBe(false);
        const rs = read("parseCssColor", "rgb(1-2 3)");
        expect(agree(rs) && rs[0].ok).toBe(true);
    });

    it("the S-1 juxtaposition dissent is PRESERVED: `%`-terminated tokens still juxtapose legally", () => {
        for (const src of ["rgb(50%20%30%)", "rgb(1.5.5 3)", "hsl(120 50%50%)"]) {
            const rs = read("parseCssColor", src);
            expect(agree(rs) && rs[0].ok, `${src} lost its S-1 acceptance`).toBe(true);
        }
    });
});

describe("§8 the shield never fired across this file", () => {
    it("SHIELD.caught is unmoved — every rejection above is an ordinary ok:false", () => {
        expect(SHIELD.caught).toBe(shieldBefore);
    });
});
