// SERVED MODEL: claude-fable-5-1
//
// X.P.W3.l — the stylesheet band's own fixture: the seventh corpus arm (`lib/stylesheet-band.mjs`)
// is generated from the ORACLE's accept set, witnesses all ten shapes, matches no adjudication
// class predicate (so the ten pinned populations cannot drift), and is answered identically by
// both lowerings. For every shape, at least one oracle-accepted witness is matched EXACTLY by the
// candidate — the band is a witness set, and a shape with no exact witness is a shape the grammar
// does not realize, which is the gate this fixture exists to fail.
//
//   npx vitest run --config typescript/test/css-totality/vitest.config.ts test/css-totality/stylesheet-band.test.ts

import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { SHIELD, loadPublicSurfaces } from "../../src/css/entry.mjs";
import { CLASSES, remainderId } from "./lib/adjudications.mjs";
import { PUBLISHED_400_JS } from "./lib/pin.mjs";
import { DECLARED, SHAPES, generateStylesheetBand, stylesheetBand } from "./lib/stylesheet-band.mjs";

type Result = { ok: boolean; value?: unknown };
type Parser = (source: string) => Result;

const oracle = (await import(pathToFileURL(PUBLISHED_400_JS).href)) as { parseStylesheet: Parser };
const surfaces = (await loadPublicSurfaces()) as unknown as { js: { parseStylesheet: Parser }; wasm: { parseStylesheet: Parser } };
const LEDGER_AT_LOAD = SHIELD.caught;

/** Key-order-insensitive JSON — G-1's `deepEqual` posture at the fixture's scale. */
const canon = (value: unknown): string =>
    JSON.stringify(value, (_key, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, (x as Record<string, unknown>)[k]])) : x));
const verdict = (r: Result) => (r.ok ? `ACCEPT ${canon(r.value)}` : "REJECT");

const band = generateStylesheetBand();
const arm = stylesheetBand();

describe("the band is generated, not pinned", () => {
    it("is deterministic in its seed and reads its declared count", () => {
        expect(arm.id).toBe("stylesheet-band");
        expect(arm.inputs).toHaveLength(DECLARED);
        expect(new Set(arm.inputs).size).toBe(DECLARED);
        const again = stylesheetBand();
        expect(again.inputs).toEqual(arm.inputs);
    });

    it("every witness is ACCEPTED by the oracle at generation — the accept set is the oracle's", () => {
        for (const row of band.witnesses) expect(oracle.parseStylesheet(row.src).ok, row.src).toBe(true);
    });

    it("every shape has witnesses, and every shape is named in the arm's provenance", () => {
        for (const shape of SHAPES) {
            expect(arm.perShape[shape], shape).toBeGreaterThan(0);
            expect(arm.provenance).toContain(`"${shape}":`);
        }
    });

    it("no row matches any adjudication class predicate — the pinned populations cannot move", () => {
        for (const src of arm.inputs) {
            for (const klass of CLASSES) expect(klass.matches(src), `${klass.id} matches ${JSON.stringify(src)}`).toBe(false);
        }
    });
});

describe("the candidate over the band, both lowerings", () => {
    const answers = arm.inputs.map((src) => ({ src, o: verdict(oracle.parseStylesheet(src)), j: verdict(surfaces.js.parseStylesheet(src)), w: verdict(surfaces.wasm.parseStylesheet(src)) }));

    it("G-5 at the band: the two lowerings answer byte-identical JSON on every row", () => {
        const differing = answers.filter((row) => row.j !== row.w);
        expect(differing.map((row) => row.src)).toEqual([]);
    });

    it("every shape has at least one oracle-accepted witness the candidate matches EXACTLY", () => {
        const matched: Record<string, number> = {};
        for (const row of band.witnesses) {
            const o = verdict(oracle.parseStylesheet(row.src));
            const j = verdict(surfaces.js.parseStylesheet(row.src));
            if (o === j) matched[row.shape] = (matched[row.shape] ?? 0) + 1;
        }
        for (const shape of SHAPES) expect(matched[shape] ?? 0, `${shape}: no exact witness`).toBeGreaterThan(0);
    });

    it("every disagreement is attributed to a declared class or escalation — none unattributed", () => {
        const misses = answers.filter((row) => row.o !== row.j);
        const unattributed = misses.filter((row) => remainderId(row.src) === "unattributed");
        //  SH-1 (a `;`/`{` inside a paren group of an at-rule prelude), SH-4 (a name spanning
        //  braces), RT-1 (a `}` inside a string of a raw body) and DEPTH are the classes the grammar
        //  module declares; `remainderId` names SH-1 and E-j1's regexes cover SH-4's nested shape.
        expect(unattributed.map((row) => row.src)).toEqual([]);
        //  the agreement floor: the band is a witness set, so most of it agrees, and the count is REPORTED
        expect(misses.length).toBeLessThan(answers.length / 10);
    });
});

describe("G-3 at the band's scale", () => {
    it("the shield's ledger did not move across the band", () => {
        expect(SHIELD.caught).toBe(LEDGER_AT_LOAD);
    });
});
