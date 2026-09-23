// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.b — G-8's suite: LABELLED DIAGNOSTICS, UNARMED, SILENT.
//
//   npx vitest run --config typescript/test/css-recovery/vitest.config.ts test/css-recovery/labels.test.ts
//
// `W3.md` §6 G-8: "every corpus rejection's `expected[0]` is a named production, asserted with the
// diagnostics module NEVER ARMED". The arming is the point — O-15 PT-01 measured that parse-that's
// `label` is a no-op unless diagnostics are armed and that arming couples an unconditional
// `console.error`, so a suite that armed them to read a label would be testing the defect. Nothing
// here arms anything, and the arm-state is asserted false on both sides of every run.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { L } from "../../src/css/algebra/tables.mjs";
import {
    PRODUCTION_LABELS,
    assertLabelSurfaceClosed,
    boundaryIssue,
    isNamedProduction,
    promoteExpected,
    promoteLabel,
} from "../../src/css/diagnostics.mjs";
import { loadRecoveryLowerings } from "../../src/css/lower.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const corpus: { rows: { id: string; src: string }[] } = JSON.parse(
    readFileSync(path.join(HERE, "corpus.json"), "utf8"),
);

const { isDiagnosticsEnabled } = (await import("tsx/esm/api").then((tsx) =>
    tsx.tsImport("../../src/parse/utils.ts", import.meta.url),
)) as { isDiagnosticsEnabled: () => boolean };

const recoveries = await loadRecoveryLowerings();

describe("the label surface is closed over L", () => {
    it("is total: every label the algebra can raise has a named production", () => {
        const rows = Object.keys(PRODUCTION_LABELS);
        expect(L.filter((label: string) => !rows.includes(label))).toEqual([]);
        expect(rows.filter((row) => !L.includes(row))).toEqual([]);
    });

    it("is injective: two labels never collapse onto one production", () => {
        const values = Object.values(PRODUCTION_LABELS);
        expect(new Set(values).size).toBe(values.length);
    });

    it("promotes every label to a NAMED PRODUCTION in cand-F's idiom", () => {
        for (const label of L) expect(isNamedProduction(promoteLabel(label))).toBe(true);
        expect(assertLabelSurfaceClosed().labels).toBe(L.length);
    });

    it("preserves σ's order, because a diagnostic's expectation order is part of its meaning", () => {
        expect(promoteExpected(["<number>", "'%'", "'none'"])).toEqual([
            "<number>",
            "<percent-sign>",
            "<none-keyword> ('none')",
        ]);
    });

    it("names an unknown label rather than guessing one", () => {
        expect(promoteLabel("a label no production names")).toBeUndefined();
        expect(isNamedProduction(undefined)).toBe(false);
    });
});

describe("every rejection carries a named production FIRST, with diagnostics never armed", () => {
    it("is unarmed before the corpus runs", () => {
        expect(isDiagnosticsEnabled()).toBe(false);
    });

    for (const kind of ["js", "wasm"] as const) {
        it(`${kind}: expected[0] is a named production on every corpus rejection`, () => {
            const recovery = recoveries[kind];
            const unnamed: { prod: string; src: string; expected: unknown }[] = [];
            let rejections = 0;
            for (const prod of recovery.entries()) {
                const entry = recovery.entry(prod);
                for (const row of corpus.rows) {
                    const r = entry(row.src);
                    if (r.ok) continue;
                    rejections++;
                    for (const d of r.diagnostics) {
                        expect(d.expected.length).toBeGreaterThanOrEqual(1);
                        if (!isNamedProduction(d.expected[0])) unnamed.push({ prod, src: row.src, expected: d.expected[0] });
                    }
                }
            }
            expect(rejections).toBeGreaterThan(0);
            expect(unnamed).toEqual([]);
        });
    }

    it("is still unarmed after the corpus has run", () => {
        expect(isDiagnosticsEnabled()).toBe(false);
    });

    it("names a production at the JS boundary too (BND-1's one label)", () => {
        expect(boundaryIssue().expected[0]).toBe("<string source>");
        expect(isNamedProduction(boundaryIssue().expected[0])).toBe(true);
        for (const kind of ["js", "wasm"] as const) {
            const r = recoveries[kind].entry("P:color")(null as unknown as string);
            expect(r.ok).toBe(false);
            expect(isNamedProduction(r.diagnostics[0].expected[0])).toBe(true);
        }
    });
});

describe("the parse path is silent", () => {
    it("writes nothing to any console channel while the corpus runs", () => {
        const saved = { error: console.error, warn: console.warn, log: console.log, info: console.info, debug: console.debug };
        const writes: string[] = [];
        const sink = (chan: string) => (...args: unknown[]) => {
            writes.push(`${chan}: ${String(args[0]).slice(0, 80)}`);
        };
        console.error = sink("console.error");
        console.warn = sink("console.warn");
        console.log = sink("console.log");
        console.info = sink("console.info");
        console.debug = sink("console.debug");
        try {
            for (const kind of ["js", "wasm"] as const) {
                for (const prod of recoveries[kind].entries()) {
                    const entry = recoveries[kind].entry(prod);
                    for (const row of corpus.rows) entry(row.src);
                }
            }
            // the instrument's own positive control — a probe that cannot fire is decorative
            console.error("control");
        } finally {
            Object.assign(console, saved);
        }
        expect(writes).toEqual(["console.error: control"]);
    });
});
