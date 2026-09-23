// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.c — G-3's BOUNDARY LEG: TYPED RECOVERY AT THE BOUNDARY.
//
//   npx vitest run --config typescript/test/css-recovery/boundary/vitest.config.ts test/css-recovery/boundary/boundary.test.ts
//
// `W3.md` §6 G-3: "every degenerate function head and every non-string argument returns `ok:false`
// with a frozen code; zero throws; zero `undefined` returns", and its falsifier names the exact
// cheat this file must not pass: "returning `ok:false` with an EMPTY diagnostics array passes a
// naive 'didn't throw' check and fails this gate, because the frozen type demands a non-empty
// tuple". So the predicate below asserts the TYPE, not the absence of an exception — and a negative
// control feeds that predicate the very shape the falsifier describes, to prove it rejects it.
//
// The incumbent readings this gate is measured against, both re-pasted from `W3.md` §6:
//   * the ten degenerate heads `rgb() … color()` against value.js 4.0.0 — **empty-body throws 10/10**;
//   * O-15 PT-07 — **5/5 non-string inputs throw a raw `TypeError`** in parse-that, and `.parse()`
//     returns `undefined` on failure, indistinguishable from a successful `undefined`.

import { describe, expect, it } from "vitest";

import { FROZEN_CODES } from "../../../src/css/codes.mjs";
import { isNamedProduction } from "../../../src/css/diagnostics.mjs";
import { loadPublicSurfaces, PUBLIC_ENTRIES, SHIELD, UNREALIZED_ENTRIES } from "../../../src/css/entry.mjs";
import { declaredBoundaryRows, loadGroundA } from "./lib/corpus.mjs";

const surfaces = await loadPublicSurfaces();
const KINDS = ["js", "wasm"] as const;
const NAMES = PUBLIC_ENTRIES.map((row: { name: string }) => row.name);

// The shield ledger this file inherits. Asserted as a DELTA below, never as an absolute: an
// absolute reading of a module-global would be an assertion about which sibling file vitest ran
// first, which is not a property of these bytes. (`no-throw.test.ts` fires the shield once, on
// purpose, as its NC-3 control.)
const LEDGER_AT_LOAD = SHIELD.caught;

/* ── the ten non-string kinds ───────────────────────────────────────────────────────────────── */
//
// `W3.md` §5 `.c` item 2 names five — "null, undefined, numbers, objects, symbols". The other five
// are the ones a shipping caller actually smuggles in from untyped JavaScript: an array (an object
// whose `typeof` lies about its shape), a boolean, `NaN` (a number that is not a number), a bigint
// (a primitive `String()` refuses to coerce), and a function.

const NON_STRINGS: readonly [string, unknown][] = [
    ["null", null],
    ["undefined", undefined],
    ["number", 42],
    ["object", {}],
    ["symbol", Symbol("x-p-w3.c")],
    ["array", []],
    ["boolean", true],
    ["NaN", Number.NaN],
    ["bigint", 10n],
    ["function", () => "rgb(1 2 3)"],
];

/* ── the predicate G-3 actually states, written once ────────────────────────────────────────── */

type Issue = { code: string; start: number; end: number; expected: readonly string[]; actual: string | null };
type Result = { ok: boolean; value?: unknown; diagnostics: readonly Issue[] };

/** Every way a result can fail G-3, collected rather than short-circuited, so a failure names all. */
function faults(result: unknown): string[] {
    const out: string[] = [];
    if (result === undefined) return ["returned `undefined` — the O-15 PT-07 half of the defect"];
    if (result === null || typeof result !== "object") return [`returned a ${typeof result}, not a ParseResult`];
    const r = result as Result;
    if (r.ok !== false) out.push(`ok is ${String(r.ok)}, not false`);
    if (!Array.isArray(r.diagnostics)) out.push("diagnostics is not an array");
    else if (r.diagnostics.length === 0) out.push("diagnostics is EMPTY — the frozen type demands [ParseIssue, ...ParseIssue[]]");
    if ("value" in r) out.push("an ok:false result carries a `value`");
    for (const issue of r.diagnostics ?? []) {
        if (!FROZEN_CODES.includes(issue.code)) out.push(`code '${issue.code}' is outside the frozen eight`);
        if (!Array.isArray(issue.expected) || issue.expected.length === 0) out.push("expected is empty");
        else if (!isNamedProduction(issue.expected[0])) out.push(`expected[0] '${issue.expected[0]}' is not a named production`);
    }
    return out;
}

describe("the predicate itself can fail for its intended reason (negative controls)", () => {
    it("rejects the falsifier's own shape: ok:false with an EMPTY diagnostics tuple", () => {
        expect(faults({ ok: false, diagnostics: [] })).toContain(
            "diagnostics is EMPTY — the frozen type demands [ParseIssue, ...ParseIssue[]]",
        );
    });

    it("rejects `undefined` — the second half of PT-07", () => {
        expect(faults(undefined)).toEqual(["returned `undefined` — the O-15 PT-07 half of the defect"]);
    });

    it("rejects a ninth code and an unnamed expectation", () => {
        const bad = { ok: false, diagnostics: [{ code: "invalid_input", start: 0, end: 0, expected: ["string"], actual: null }] };
        expect(faults(bad)).toEqual([
            "code 'invalid_input' is outside the frozen eight",
            "expected[0] 'string' is not a named production",
        ]);
    });

    it("accepts a well-formed rejection", () => {
        const good = { ok: false, diagnostics: [{ code: "css_syntax", start: 0, end: 0, expected: ["<string source>"], actual: null }] };
        expect(faults(good)).toEqual([]);
    });
});

/* ── PT-07: the JS boundary ─────────────────────────────────────────────────────────────────── */

describe("PT-07 — a non-string argument is a typed rejection, never a raw TypeError", () => {
    for (const kind of KINDS) {
        for (const name of NAMES) {
            for (const [label, value] of NON_STRINGS) {
                it(`${kind}/${name}(${label})`, () => {
                    const result = (surfaces[kind] as Record<string, (s: unknown) => unknown>)[name](value);
                    expect(faults(result)).toEqual([]);
                    const r = result as Result;
                    expect(r.diagnostics).toHaveLength(1);
                    expect(r.diagnostics[0].code).toBe("css_syntax");
                    expect(r.diagnostics[0].actual).toBeNull();
                    expect(r.diagnostics[0].expected).toEqual(["<string source>"]);
                });
            }
        }
    }

    it("the boundary result is frozen — one caller cannot mutate the next caller's rejection", () => {
        const r = surfaces.js.parseCssColor(null) as Result;
        expect(Object.isFrozen(r)).toBe(true);
        expect(Object.isFrozen(r.diagnostics)).toBe(true);
        expect(Object.isFrozen(r.diagnostics[0])).toBe(true);
    });

    it("covers `.a`'s own declared boundary rows, and is a strict superset of them", () => {
        const declared = declaredBoundaryRows() as { id: string; js: string; typeofIs: string }[];
        expect(declared.length).toBeGreaterThan(0);

        // `.a` declares its seven rows as JS SOURCE TEXT (`"42"`, `"{}"`, …). This suite constructs
        // values, never `eval`s a fixture's text, so the two are reconciled by a declared table —
        // and a row `.a` adds without a translation fails HERE rather than passing silently.
        const TRANSLATION: Readonly<Record<string, string>> = {
            undefined: "undefined",
            null: "null",
            "42": "number",
            "{}": "object",
            "[]": "array",
            true: "boolean",
            NaN: "NaN",
        };
        const untranslated = declared.map((row) => row.js).filter((js) => TRANSLATION[js] === undefined);
        expect(untranslated).toEqual([]);

        const covered = new Set(NON_STRINGS.map(([label]) => label));
        const missing = declared.map((row) => TRANSLATION[row.js]).filter((label) => !covered.has(label));
        expect(missing).toEqual([]);
        expect(NON_STRINGS.length).toBeGreaterThan(declared.length);

        // and `typeof` really is the discriminator the guard uses
        for (const [label, value] of NON_STRINGS) {
            const row = declared.find((d) => TRANSLATION[d.js] === label);
            if (row !== undefined) expect(typeof value).toBe(row.typeofIs);
        }
    });
});

/* ── the degenerate-head class ──────────────────────────────────────────────────────────────── */

describe("the R1 class — every degenerate function head is a typed rejection", () => {
    const groundA = loadGroundA();

    it(`the GROUND-A cross-product is read, not typed: ${groundA.length} inputs`, () => {
        expect(groundA.length).toBe(210);
        for (const head of ["rgb", "rgba", "hsl", "hsla", "lab", "lch", "oklab", "oklch", "hwb", "color"]) {
            expect(groundA).toContain(`${head}()`);
        }
    });

    for (const kind of KINDS) {
        for (const name of NAMES) {
            it(`${kind}/${name} over all ${groundA.length} — 0 throws, 0 undefined, 0 accepts`, () => {
                const entry = (surfaces[kind] as Record<string, (s: unknown) => unknown>)[name];
                const bad: string[] = [];
                let accepted = 0;
                for (const src of groundA) {
                    let result: unknown;
                    try {
                        result = entry(src);
                    } catch (error) {
                        bad.push(`${src} THREW ${(error as Error).constructor.name}: ${(error as Error).message}`);
                        continue;
                    }
                    if ((result as Result)?.ok === true) accepted++;
                    else for (const fault of faults(result)) bad.push(`${src}: ${fault}`);
                }
                expect(bad).toEqual([]);
                expect(accepted).toBe(0);
            });
        }
    }

    it("the ten heads `W3.md` §6 G-3 pastes, which threw 10/10 against the incumbent", () => {
        const threw: string[] = [];
        for (const head of ["rgb", "rgba", "hsl", "hsla", "lab", "lch", "oklab", "oklch", "hwb", "color"]) {
            try {
                const r = surfaces.js.parseCssColor(`${head}()`) as Result;
                expect(faults(r)).toEqual([]);
            } catch (error) {
                threw.push(`${head}() ${(error as Error).constructor.name}`);
            }
        }
        expect(threw).toEqual([]);
    });

    it("R1 itself — `parseCssColor(\"oklch()\")`, the named enemy — is a typed rejection", () => {
        const r = surfaces.js.parseCssColor("oklch()") as Result;
        expect(r.ok).toBe(false);
        expect(r.diagnostics[0].code).toBe("css_syntax");
        expect(r.diagnostics[0].expected.length).toBeGreaterThan(0);
        expect(faults(r)).toEqual([]);
    });
});

/* ── the surface declares what it does not carry ────────────────────────────────────────────── */

describe("the unrealized entries are NAMED, never stubbed", () => {
    it("the six the grammar does not carry are declared and absent from the surface", () => {
        expect(UNREALIZED_ENTRIES).toEqual([
            "parseCssScalar",
            "parseCssValue",
            "parseCssValues",
            "parseKeyframeSelector",
            "parseAnimationTimeline",
            "parseAnimationRange",
        ]);
        for (const name of UNREALIZED_ENTRIES) {
            expect(surfaces.js).not.toHaveProperty(name);
            expect(surfaces.wasm).not.toHaveProperty(name);
        }
    });
});

describe("the shield did not fire anywhere in this file", () => {
    it("SHIELD.caught did not move across every assertion above", () => {
        expect(SHIELD.caught - LEDGER_AT_LOAD).toBe(0);
        expect(SHIELD.faults().slice(LEDGER_AT_LOAD)).toEqual([]);
    });
});
