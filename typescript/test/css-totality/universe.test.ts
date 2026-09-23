// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — THE 52 RUNNABLE ROW ASSERTIONS.
//
// `W3.md` §5 `.a`: "a machine-generated matrix in which every one of the 52 frozen exports is a row
// with a runnable assertion, so 'coverage' is a count nobody can round up."
//
// WHAT THIS SUITE ASSERTS AND WHAT IT DOES NOT. G-1's PASS/FAIL is `css-universe.mjs --check`'s —
// that is the command `W3.md` §6 G-1 names, and it exits non-zero while any row is not TOTAL. This
// suite asserts the two things that must hold *whatever* the coverage count is, one `it` per row,
// so a regression in either is named by row rather than buried in a tally:
//
//   TOTALITY   the candidate never THREW on any cell of the row. This is `W3.md` §2a's actual
//              criterion — "there is no CSS string … that makes the candidate parser do anything
//              other than return a typed result" — and it is independent of how much of the surface
//              the candidate covers.
//   HONESTY    the row cannot claim TOTAL without an executed assertion over a non-empty corpus,
//              which is G-1's own falsifier ("a row marked TOTAL whose assertion does not execute,
//              or whose accept/reject corpus is empty, fails").
//
// The coverage number itself is REPORTED here, never asserted, because a suite that failed on the
// count would make every seat after `.a` inherit a red file for a condition no seat here can turn.

import { beforeAll, describe, expect, it } from "vitest";

import { assemble } from "./lib/universe.mjs";

/** The pinned value.js commit the universe is read at — `src/css/index.ts`'s own last change. */
const PIN = "6aca86020b6b2605e7d0f04fccb6601746e387f7";

type Row = {
    name: string;
    kind: "runtime" | "type";
    verdict: "TOTAL" | "PARTIAL" | "ABSENT";
    cellsRun: number;
    accept: { count: number };
    reject: { count: number };
    misses: { kind: string; input: string; why: string }[];
    missesTotal: number;
};

let assembled: Awaited<ReturnType<typeof assemble>>;

beforeAll(async () => {
    assembled = await assemble({ commit: PIN, writeCorpus: false });
}, 120_000);

describe("the pinned universe", () => {
    it("reads 19 runtime + 33 types = 52 out of src/css/index.ts at the pin", () => {
        expect(assembled.pin.counts).toEqual({ runtime: 19, types: 33, total: 52 });
    });

    it("the frozen declaration agrees with the pinned type source, ∅ both ways and 0 shape disagreements", () => {
        // This is what licenses the published 4.0.0 declaration to stand in for
        // `src/css/types.ts`, which does not compile alone (it imports four sibling modules).
        expect(assembled.pin.agreement.typeNames.barrelMinusPublished).toEqual([]);
        expect(assembled.pin.agreement.typeNames.publishedMinusBarrel).toEqual([]);
        expect(assembled.pin.agreement.runtimeNames.barrelMinusPublished).toEqual([]);
        expect(assembled.pin.agreement.runtimeNames.publishedMinusBarrel).toEqual([]);
        expect(assembled.pin.agreement.disagreements).toEqual([]);
        expect(assembled.agreementClean).toBe(true);
    });

    it("the corpus folds all six arms at their declared counts", () => {
        expect(
            Object.fromEntries(assembled.corpus.arms.map((arm) => [arm.id, [arm.declared, arm.read]])),
        ).toEqual({
            "ground-a": [210, 210],
            "fuzz-f": [4000, 4000],
            "fuzz-o": [30000, 30000],
            named: [148, 148],
            p1: [403, 403],
            r1: [172, 172],
            //  X.P.W3.l: the seventh arm, the stylesheet band (`lib/stylesheet-band.mjs`, W3.md `.l` L726)
            "stylesheet-band": [470, 470],
        });
        // A union, not a concatenation: the overlap is accounted for rather than double-counted.
        expect(assembled.corpus.counts.armTotal - assembled.corpus.counts.overlap).toBe(
            assembled.corpus.counts.union,
        );
        expect(assembled.corpus.counts.union).toBeGreaterThan(0);
    });

    it("every frozen ParseIssue code comes from the pinned types.ts, and there are eight", () => {
        // The ninth-code tripwire, in the one place that reads the union mechanically.
        expect(assembled.matrix.codes).toHaveLength(8);
        expect(assembled.matrix.codes).toContain("css_syntax");
    });

    it("the assignability compile attributes every diagnostic to a row", () => {
        expect(assembled.assignability).not.toBeNull();
        expect(assembled.assignability!.unattributed).toEqual([]);
    });

    it("reports the coverage count (REPORTED, never asserted — G-1's verdict is the script's)", () => {
        const { runtimeTally, typeTally, aggregate } = assembled.matrix;
        console.log(
            `  G-1 reading: runtime ${runtimeTally.TOTAL}/${runtimeTally.PARTIAL}/${runtimeTally.ABSENT} · ` +
                `types ${typeTally.TOTAL}/${typeTally.PARTIAL}/${typeTally.ABSENT} · ` +
                `${aggregate.TOTAL} of 52 TOTAL (TOTAL/PARTIAL/ABSENT)`,
        );
        expect(aggregate.TOTAL + aggregate.PARTIAL + aggregate.ABSENT).toBe(52);
    });
});

describe("every adjudicated conflict is honoured by the candidate", () => {
    it("no declared divergence is left unhonoured", () => {
        const unhonoured = assembled.matrix.declaredObservations.filter(
            (o: { honoured: boolean | null }) => o.honoured === false,
        );
        expect(unhonoured.map((o: { id: string; input: string }) => `${o.id} ${o.input}`)).toEqual([]);
    });
});

describe("the 52 rows — one runnable assertion each", () => {
    const names = [
        // Filled from the pin at collection time would need top-level await over `assemble`;
        // instead each row is addressed by index against the assembled matrix, and the count is
        // asserted above. Vitest needs the row list synchronously, so the 52 slots are generated
        // from the pinned arithmetic (19 + 33) and each resolves its own row by position.
        ...Array.from({ length: 52 }, (_, i) => i),
    ];

    for (const i of names) {
        it(`row ${i + 1}`, ({ task }) => {
            const row = assembled.matrix.rows[i] as Row;
            task.name = `row ${i + 1} — ${row.kind} \`${row.name}\` [${row.verdict}]`;

            // TOTALITY: a throw is a shape violation, never a skip. This is the assertion that
            // must hold for a PARTIAL and an ABSENT row too.
            const threw = row.misses.filter((m) => m.kind === "THROW");
            expect(
                threw.map((m) => `${m.input} — ${m.why}`),
                `\`${row.name}\` must never throw: ParseResult-returning code that throws has not failed to be fast, it has failed to have the type it declares`,
            ).toEqual([]);

            // HONESTY: the corpus is never empty, and TOTAL implies an executed assertion.
            expect(row.accept.count, `\`${row.name}\` accept corpus`).toBeGreaterThan(0);
            expect(row.reject.count, `\`${row.name}\` reject corpus`).toBeGreaterThan(0);
            expect(["TOTAL", "PARTIAL", "ABSENT"]).toContain(row.verdict);
            if (row.verdict === "TOTAL") {
                expect(row.cellsRun, `\`${row.name}\` is TOTAL, so its assertion must have run`).toBeGreaterThan(0);
                expect(row.missesTotal, `\`${row.name}\` is TOTAL, so it must have no misses`).toBe(0);
            }
        });
    }
});
