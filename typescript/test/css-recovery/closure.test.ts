// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.b — G-4's suite: THE UNION IS CLOSED, AND THERE IS NO FALLBACK ARM.
//
//   npx vitest run --config typescript/test/css-recovery/vitest.config.ts test/css-recovery/closure.test.ts
//
// The gate of record is `scripts/css-recovery-closure.mjs` — it executes the corpus and inspects the
// built graph, and its output is the evidence. This suite asserts the same laws from the test side so
// a regression reddens in the ordinary run as well as in the gate, and it keeps ONE assertion that is
// BORN RED on purpose: the ⊇ direction. `W3.md` §6 G-4's falsifier names it — "a frozen code no
// corpus input can produce (dead code in the contract is as much a defect as an undeclared one)" —
// and the honest way to carry a red gate is a failing assertion that says why, never `test.skip`.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { OP_NAMES } from "../../src/css/algebra/ops.mjs";
import { FROZEN_CODES, assertFrozenUnion, difference, graphCodeSites, isFrozenCode } from "../../src/css/codes.mjs";
import { assertClosedOperatorSet, loadRecoveryLowerings } from "../../src/css/lower.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const corpus: { rows: { id: string; src: string }[] } = JSON.parse(
    readFileSync(path.join(HERE, "corpus.json"), "utf8"),
);

/** Built rather than written: a raw NUL in the source makes git and `file(1)` read it as binary. */
const NUL = String.fromCharCode(0);

const recoveries = await loadRecoveryLowerings();
const { lowerings } = await import("../../src/css/harness-adapter.mjs");

/** Every issue the corpus produces, once, so the laws below read one execution rather than four. */
const run = (() => {
    const issues: { kind: string; prod: string; src: string; issue: Record<string, unknown> }[] = [];
    let rejections = 0;
    let successes = 0;
    for (const kind of ["js", "wasm"] as const) {
        for (const prod of recoveries[kind].entries()) {
            const entry = recoveries[kind].entry(prod);
            for (const row of corpus.rows) {
                const r = entry(row.src);
                if (r.ok) {
                    successes++;
                    expect(r.diagnostics).toEqual([]);
                    continue;
                }
                rejections++;
                for (const issue of r.diagnostics) issues.push({ kind, prod, src: row.src, issue });
            }
        }
    }
    return { issues, rejections, successes };
})();

describe("the eight are the union, and the union is authenticated", () => {
    it("carries exactly the eight codes of value.js/src/css/types.ts:11-19", () => {
        expect(FROZEN_CODES.length).toBe(8);
        expect(assertFrozenUnion([...FROZEN_CODES], "the suite").missing).toEqual([]);
    });

    it("refuses a ninth and refuses a narrowing — the authentication is not decorative", () => {
        expect(() => assertFrozenUnion([...FROZEN_CODES, "ninth_code"], "control")).toThrow(/HALT/);
        expect(() => assertFrozenUnion(FROZEN_CODES.slice(1), "control")).toThrow(/HALT/);
    });
});

describe("⊆ — nothing outside the eight can be declared or emitted", () => {
    for (const kind of ["js", "wasm"] as const) {
        it(`${kind}: every code the BUILT GRAPH can declare is one of the eight`, () => {
            const sites = graphCodeSites(lowerings[kind]);
            expect(sites.length).toBeGreaterThan(0);
            expect(sites.filter((s: { code: string }) => !isFrozenCode(s.code))).toEqual([]);
        });
    }

    it("every code the EXECUTED corpus emits is one of the eight", () => {
        expect(run.issues.filter((r) => !isFrozenCode(r.issue.code as string))).toEqual([]);
    });
});

describe("⊇ — every frozen code is emitted by at least one corpus input", () => {
    // Re-pinned 2026-09-23 (X.P.W5 Repair 1), measured: X.P.W3.h/.i realized all nine frozen parsers
    // (`entry.mjs` UNREALIZED_ENTRIES = []), and the corpus now emits six of the eight codes through a
    // production. The remaining two — `syntax_descriptor_invalid` and `syntax_mismatch` — belong to
    // `coerceToSyntax`, which COHESION §0s E-h3 rules a SURFACE COMPOSITION with no production (a
    // descriptor is not CSS text; `entry.mjs` §THE TWO COMPOSITIONS). So ⊇ is read over the corpus
    // PLUS one witness per composition code, through both public surfaces.
    it("every frozen code is emitted: six by a production over the corpus, the two composition codes by coerceToSyntax on both surfaces", async () => {
        const { loadPublicSurfaces } = await import("../../src/css/entry.mjs");
        const surfaces = await loadPublicSurfaces();
        const composed: string[] = [];
        for (const kind of ["js", "wasm"] as const) {
            const coerce = (surfaces[kind] as unknown as { coerceToSyntax: (s: string, d: string) => { ok: boolean; diagnostics?: { code: string }[] } }).coerceToSyntax;
            for (const [src, descriptor] of [["red", "<not-a-descriptor"], ["red", "<length>"]]) {
                const r = coerce(src, descriptor);
                expect(r.ok, `${kind} coerceToSyntax(${src}, ${descriptor})`).toBe(false);
                composed.push(...r.diagnostics!.map((d) => d.code));
            }
        }
        expect([...new Set(composed)].sort()).toEqual(["syntax_descriptor_invalid", "syntax_mismatch"]);
        const byProduction = [...new Set(run.issues.map((r) => r.issue.code as string))];
        expect(difference(FROZEN_CODES, byProduction).sort()).toEqual(["syntax_descriptor_invalid", "syntax_mismatch"]);
        const emitted = [...byProduction, ...composed];
        const missing = difference(FROZEN_CODES, emitted);
        expect(
            missing,
            `frozen \\ emitted = [${missing.join(", ")}] — a frozen code neither a production (over the corpus) nor ` +
                `coerceToSyntax emits; the grammar names [${recoveries.js.entries().join(", ")}].`,
        ).toEqual([]);
    });
});

describe("the shape laws the frozen type states", () => {
    it("ok:false always carries a non-empty [ParseIssue, ...ParseIssue[]]", () => {
        expect(run.rejections).toBeGreaterThan(0);
        expect(run.successes).toBeGreaterThan(0);
        for (const kind of ["js", "wasm"] as const) {
            for (const prod of recoveries[kind].entries()) {
                const r = recoveries[kind].entry(prod)(`${NUL}not a production${NUL}`);
                expect(r.ok).toBe(false);
                expect(r.diagnostics.length).toBeGreaterThanOrEqual(1);
            }
        }
    });

    it("every [start,end) indexes real bytes, and `actual` is exactly those bytes", () => {
        const bad = run.issues.filter(({ src, issue }) => {
            const start = issue.start as number;
            const end = issue.end as number;
            if (!Number.isInteger(start) || !Number.isInteger(end)) return true;
            if (start < 0 || end < start || end > src.length) return true;
            const slice = src.slice(start, end);
            return issue.actual !== (slice === "" ? null : slice);
        });
        expect(bad).toEqual([]);
    });

    it("every issue carries at least one expectation", () => {
        expect(run.issues.filter(({ issue }) => (issue.expected as string[]).length < 1)).toEqual([]);
    });
});

describe("the closed operator set is WIRED (COHESION §0n.1), not a comment", () => {
    it("the grammar destructures exactly the twenty-two, both differences ∅", () => {
        const s = assertClosedOperatorSet();
        expect(s.destructured).toBe(OP_NAMES.length);
        expect(s.extra).toEqual([]);
        expect(s.missing).toEqual([]);
    });

    it("a 23rd operation HALTS — the check can fail for its intended reason", () => {
        expect(() =>
            assertClosedOperatorSet((A: Record<string, unknown>) => {
                const {
                    SCAN, LIT, NUM, DIGITS, TEXT, KW, END, SEQ, ALT, CUT, PURE, REP, DROP, DISPATCH,
                    FAIL, EXPECT, CLAMP, SCALE, CTOR, TRY, RECOVER, REF, TWENTY_THIRD,
                } = A;
                return [SCAN, LIT, NUM, DIGITS, TEXT, KW, END, SEQ, ALT, CUT, PURE, REP, DROP, DISPATCH,
                    FAIL, EXPECT, CLAMP, SCALE, CTOR, TRY, RECOVER, REF, TWENTY_THIRD];
            }),
        ).toThrow(/23rd operation/);
    });

    it("a missing operation HALTS too — closure is asserted in both directions", () => {
        expect(() =>
            assertClosedOperatorSet((A: Record<string, unknown>) => {
                const { SCAN, LIT } = A;
                return [SCAN, LIT];
            }),
        ).toThrow(/HALT/);
    });

    it("both lowerings publish exactly the twenty-two", () => {
        for (const kind of ["js", "wasm"] as const) {
            const names = lowerings[kind].registry().map((row: { name: string }) => row.name);
            expect(names.length).toBe(OP_NAMES.length);
            expect(difference(names, OP_NAMES)).toEqual([]);
            expect(difference(OP_NAMES, names)).toEqual([]);
        }
    });
});
