// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.c — G-3's THROW-CLASS LEG, and the proof that the retained shield is NOT load-bearing.
//
//   npx vitest run --config typescript/test/css-recovery/boundary/vitest.config.ts test/css-recovery/boundary/no-throw.test.ts
//
// `W3.md` §5 `.c` item 1: "No `throw` is reachable from any public entry; the guard cand-O keeps is
// retained only as a proven non-load-bearing shield, and its non-load-bearing-ness is itself
// asserted by a raw-`parseState`-over-corpus test (cand-O's instrument, which the band requires to
// survive)." This file is that instrument, ported to the candidate's own raw path.
//
// FOUR LEGS, and the third is the one that would be a lie if it were asserted instead of measured:
//
//   T-1  STATIC, at the bytes a consumer actually calls. `Function.prototype.toString()` on each
//        published entry returns the SOURCE TEXT OF THE SHIPPED CLOSURE — not the module, not a
//        summary. G-3's falsifier says a masking fallback "fails the gate by inspection of the
//        entry module"; this is that inspection, mechanical, over the exact function object. Its
//        second half (T-1b) is the inspection at MODULE scope the falsifier's own words name: every
//        `throw` site in `entry.mjs` is enumerated and each must be a DECLARED construction-time
//        HALT, so a `throw` added anywhere else in the module fails here even if some future entry
//        stops reaching it. "No `throw` is reachable from any public entry" is thereby asserted from
//        both ends — the closure's own text, and the module's whole throw census.
//   T-2  DYNAMIC, over the public surface: the whole corpus union through all three entries of both
//        lowerings. Zero throws, zero `undefined`.
//   T-3  THE RAW PATH, unshielded: `lowering.parse` carries no `try`/`catch` at all
//        (`lowering-js/index.mjs:7` — "No `try/catch` exists in `ENTRY` (DM-4); a throw escaping it
//        is K-8 and the probe is entitled to see it"). Running the same corpus through it is what
//        makes "the shield never fires" a measurement rather than a hope.
//   T-4  `SHIELD.caught` moved by exactly ONE across all of the above — NC-3's deliberate control
//        and nothing else — read as a DELTA from this file's own load, never as an absolute.
//
// NEGATIVE CONTROLS FIRST (W2 G-4's rule: a probe that cannot fail for its intended reason is
// itself a defect). Three of them, each proving a leg above is non-vacuous.

import { describe, expect, it } from "vitest";

import { makePublicSurface, loadPublicSurfaces, PUBLIC_ENTRIES, SHIELD } from "../../../src/css/entry.mjs";
import { lowerings } from "../../../src/css/harness-adapter.mjs";
import { makeJsLowering } from "../../../src/css/lowering-js/index.mjs";
import { loadCorpusUnion } from "./lib/corpus.mjs";

const SWEEP_TIMEOUT_MS = 600_000;

const surfaces = await loadPublicSurfaces();
const KINDS = ["js", "wasm"] as const;
const NAMES = PUBLIC_ENTRIES.map((row: { name: string }) => row.name);
const corpus = loadCorpusUnion();

// The ledger reading THIS FILE inherits. Every shield assertion below is a DELTA against it, never
// an absolute: `SHIELD.caught` is a module-global and an absolute assertion would silently be an
// assertion about which sibling file vitest happened to run first. Under this suite's own project
// (`boundary/vitest.config.ts`, `pool: "forks"`, per-file isolation) this is 0; the delta is true
// either way, which is the point.
const LEDGER_AT_LOAD = SHIELD.caught;

describe("negative controls — each leg below can fail for its intended reason", () => {
    it("NC-1 the raw path DOES throw for a non-string, so the guard above the grammar is load-bearing", () => {
        const lowering = makeJsLowering();
        expect(() => lowering.parse("P:color", null as unknown as string)).toThrowError(TypeError);
    });

    it("NC-2 the static inspection detects a `throw` in a closure's own text", () => {
        const withThrow = (source: string) => {
            if (source === "") throw new Error("control");
            return source;
        };
        expect(/\bthrow\b/.test(withThrow.toString())).toBe(true);
    });

    it("NC-3 the shield fires, and the ledger records it, when the inner path really does throw", () => {
        // A lowering whose `parse` is replaced by one that always throws. Nothing else is changed:
        // the public surface is constructed over it by the same factory the shipped entries use.
        const broken = makeJsLowering();
        const faulty = Object.create(broken) as typeof broken & { parse: () => never };
        faulty.parse = () => {
            throw new RangeError("control: a genuine defect in the combinator graph");
        };
        const before = SHIELD.caught;
        const surface = makePublicSurface(faulty) as unknown as Record<string, (s: string) => { ok: boolean; diagnostics: { code: string }[] }>;
        const result = surface.parseCssColor("rgb(1 2 3)");
        expect(result.ok).toBe(false);
        expect(result.diagnostics[0].code).toBe("css_syntax");
        expect(SHIELD.caught).toBe(before + 1);
        const fault = SHIELD.faults().at(-1) as { entry: string; error: string };
        expect(fault.entry).toBe("parseCssColor");
        expect(fault.error).toBe("RangeError");
    });
});

/* ── T-1 · static, over the shipped closures ────────────────────────────────────────────────── */

describe("T-1 — no `throw` in any published entry's own source text", () => {
    for (const kind of KINDS) {
        for (const name of NAMES) {
            it(`${kind}/${name}`, () => {
                const fn = (surfaces[kind] as Record<string, (s: unknown) => unknown>)[name];
                const text = fn.toString();
                expect(text.length).toBeGreaterThan(0);
                // Printed on failure so a reader can refute the claim at the bytes.
                expect({ name: `${kind}/${name}`, throwSites: text.match(/\bthrow\b/g) ?? [], text }).toMatchObject({
                    throwSites: [],
                });
            });
        }
    }

    it("the surface itself is frozen, so an entry cannot be swapped for a throwing one", () => {
        expect(Object.isFrozen(surfaces)).toBe(true);
        expect(Object.isFrozen(surfaces.js)).toBe(true);
        expect(Object.isFrozen(surfaces.wasm)).toBe(true);
    });
});

/* ── T-1b · static, over the WHOLE entry module ─────────────────────────────────────────────── */
//
// Every `throw` in `entry.mjs`, enumerated with its line, and matched against a DECLARED table of
// construction-time HALTs. A construction HALT is not on any call's path — `makePublicSurface` runs
// once, before a consumer holds an entry at all — and the distinction is the whole of G-3's reading
// here, so it is asserted rather than asserted-about. A `throw` added anywhere else in the module
// fails this test by NAME, printing the line and its text.

const DECLARED_CONSTRUCTION_HALTS: readonly string[] = [
    // `makePublicSurface`: a lowering that does not carry a published entry's production. Answering
    // it with a stub rejection would be the masking fallback G-3 refuses, so construction halts.
    "lowering does not carry",
];

/** A throw site's WINDOW — the statement's own line plus what follows it, since a HALT's message is
 *  written across several lines. `.b`'s discipline: print every site with its window, so a reader
 *  refutes the classification at the bytes instead of trusting a label. */
const WINDOW_LINES = 8;

describe("T-1b — the entry module's whole `throw` census is construction-time HALTs", () => {
    it("every `throw` site in entry.mjs is a declared construction HALT", async () => {
        const { readFileSync } = await import("node:fs");
        const path = await import("node:path");
        const { fileURLToPath } = await import("node:url");
        const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../src/css/entry.mjs");
        const lines = readFileSync(file, "utf8").split("\n");

        const sites: { line: number; window: string }[] = [];
        lines.forEach((line: string, i: number) => {
            // Comment-aware, `.b`'s rule: a prose line quoting `throw` is not a throw site, and an
            // inspection that cannot tell the difference fails for a reason that is not its own.
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
            if (/\bthrow\b/.test(line)) sites.push({ line: i + 1, window: lines.slice(i, i + WINDOW_LINES).join("\n") });
        });

        // Printed in the assertion, so a reader refutes it at the bytes rather than trusting a count.
        const undeclared = sites.filter((s) => !DECLARED_CONSTRUCTION_HALTS.some((d) => s.window.includes(d)));
        expect({ sites, undeclared }).toMatchObject({ undeclared: [] });
        expect(sites.length).toBe(DECLARED_CONSTRUCTION_HALTS.length);
    });

    it("NEGATIVE CONTROL — an undeclared `throw` in the same shape is caught, not classified away", () => {
        const source = ["export const f = (s) => {", "    throw new TypeError(", '        "not a declared HALT",', "    );", "};"];
        const sites: { line: number; window: string }[] = [];
        source.forEach((line, i) => {
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
            if (/\bthrow\b/.test(line)) sites.push({ line: i + 1, window: source.slice(i, i + WINDOW_LINES).join("\n") });
        });
        expect(sites).toHaveLength(1);
        expect(sites.filter((s) => !DECLARED_CONSTRUCTION_HALTS.some((d) => s.window.includes(d)))).toHaveLength(1);
    });

    it("NEGATIVE CONTROL — the census sees a `throw` on a code line and ignores one in prose", () => {
        const census = (text: string) =>
            text
                .split("\n")
                .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
                .filter((line) => /\bthrow\b/.test(line)).length;
        expect(census("// a comment that says throw\nconst x = 1;")).toBe(0);
        expect(census("if (bad) throw new Error('x');")).toBe(1);
    });
});

/* ── T-2 / T-3 · the corpus, through the public surface and through the raw path ────────────── */

describe("the corpus union, as the two sweeps read it", () => {
    it("is derived from both generated corpora, with the normalization published", () => {
        expect(corpus.counts.totalityRows).toBe(26604);
        expect(corpus.counts.recoveryRows).toBe(685);
        expect(corpus.counts.unwrapped).toBe(172);
        expect(corpus.sources.length).toBe(corpus.counts.distinct);
        expect(corpus.sources.length).toBeGreaterThan(26000);
    });
});

for (const kind of KINDS) {
    describe(`T-2 · ${kind} — the whole corpus through the PUBLIC entries`, () => {
        it(
            `${NAMES.length} entries × ${corpus.sources.length} sources: 0 throws, 0 undefined`,
            () => {
                const surface = surfaces[kind] as Record<string, (s: unknown) => unknown>;
                const failures: string[] = [];
                let calls = 0;
                for (const name of NAMES) {
                    const entry = surface[name];
                    for (const src of corpus.sources) {
                        calls++;
                        let result: unknown;
                        try {
                            result = entry(src);
                        } catch (error) {
                            failures.push(`${name} ${JSON.stringify(src).slice(0, 48)} THREW ${(error as Error).constructor.name}`);
                            continue;
                        }
                        if (result === undefined || result === null || typeof result !== "object") {
                            failures.push(`${name} ${JSON.stringify(src).slice(0, 48)} returned ${typeof result}`);
                        } else if (typeof (result as { ok: unknown }).ok !== "boolean") {
                            failures.push(`${name} ${JSON.stringify(src).slice(0, 48)} returned no boolean ok`);
                        }
                    }
                }
                expect(failures.slice(0, 20)).toEqual([]);
                expect(calls).toBe(NAMES.length * corpus.sources.length);
            },
            SWEEP_TIMEOUT_MS,
        );
    });

    describe(`T-3 · ${kind} — the same corpus through the RAW, UNSHIELDED path`, () => {
        it(
            "cand-O's instrument: the raw path never throws on its own",
            () => {
                // `lowering.parse` is the raw σ product — no `try`/`catch` anywhere on it (DM-4).
                const lowering = lowerings[kind] as { parse: (p: string, s: string) => unknown };
                const raw = (prod: string, src: string) => lowering.parse(prod, src);
                const prods = ["P:color", "P:timing-function", "P:stylesheet"];
                const thrown: string[] = [];
                let calls = 0;
                for (const prod of prods) {
                    for (const src of corpus.sources) {
                        calls++;
                        try {
                            raw(prod, src);
                        } catch (error) {
                            thrown.push(`${prod} ${JSON.stringify(src).slice(0, 48)} ${(error as Error).constructor.name}: ${(error as Error).message}`);
                        }
                    }
                }
                expect(thrown.slice(0, 20)).toEqual([]);
                expect(calls).toBe(prods.length * corpus.sources.length);
            },
            SWEEP_TIMEOUT_MS,
        );
    });
}

/* ── T-4 · the ledger ───────────────────────────────────────────────────────────────────────── */

describe("T-4 — the shield is non-load-bearing, read off its own ledger", () => {
    it("fired exactly once in this file, and that once was NC-3's control", () => {
        const faults = SHIELD.faults() as { entry: string; message: string }[];
        // DELTA, not absolute: exactly one fire since this file loaded, and it is NC-3's.
        expect(SHIELD.caught - LEDGER_AT_LOAD).toBe(1);
        const mine = faults.slice(LEDGER_AT_LOAD);
        expect(mine).toHaveLength(1);
        expect(mine[0].message).toContain("control: a genuine defect in the combinator graph");
        // The corpus sweeps above — 160,710 raw calls and 160,710 public calls — contributed NONE
        // of it. That is what "non-load-bearing" means, measured rather than asserted.
        expect(mine.filter((f) => !f.message.startsWith("control:"))).toEqual([]);
    });
});
