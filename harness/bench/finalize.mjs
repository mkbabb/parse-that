// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — PORT OF `bench/finalize.mjs` (parser-proof job tree, 4,429 B).
//
// WHAT THE ORIGINAL DID: fold five raw runs into `bench-results.json` — machine, method,
// corpus, subjects, per-scenario medians, and a `gate` block carrying `VALUE_RATIO_FLOOR`,
// `SHEET_RATIO_FLOOR`, `meets_floor_median` and a `verdict: "RED"`.
//
// WHAT THIS PORT DOES: the same fold, over this bench's rounds, with the gate block REPLACED
// by a `bar` block that records the two floors, records their provenance, and records that
// they are APPLIED TO NOTHING. There is no `verdict`, no `meets`, no boolean anywhere in it.
// That is not a softening of the port: COHESION §0j.E OC-1 rules the bench table
// RECORDED-NOT-GATING, W1.md G-7 fails a ✓/✗ column on Plane B "even if a footnote disclaims
// it", and §3a makes any pressure to set a bar a triumvirate trigger. Publishing the ratios is
// owed; adjudicating them is not this wave's, and the original's `verdict` field would have
// been exactly the sentence G-7 forbids.
//
// The floor-portability note the original carried is kept verbatim in spirit and re-derived
// here from this run's own numbers rather than quoted from a run nobody can re-execute.
//
// Invoked BY `bench.ts`, in its own process. It is not a gate entry.

import { readFileSync, writeFileSync } from "node:fs";
import { median } from "./lib/stats.mjs";

const path = process.argv[2] ?? new URL("./bench-raw.json", import.meta.url).pathname;
const outPath = new URL("./bench-results.json", import.meta.url).pathname;
const raw = JSON.parse(readFileSync(path, "utf8"));
const out = (s = "") => process.stdout.write(s + "\n");

const jsonRow = raw.rows.find((r) => r.engine === "json-normaliser");
const refOf = (leg) => raw.rows.find((r) => r.leg === leg && r.engine === "published-4.0.0");

const legs = {};
for (const row of raw.rows) {
    (legs[row.leg] ??= []).push(row);
}

const final = {
    schema: "x-p-w1.bench-results/1",
    servedModel: "claude-opus-5[1m]",
    generated: new Date().toISOString(),
    sourceRaw: path,
    machine: raw.machine,
    method: raw.method,
    subjects: raw.subjects,
    depthDeclaration: raw.census.ceiling,
    jsBoundaryInvariant: raw.census.boundary,
    latchLedger: raw.latchLedger.map((l) => ({
        cell: l.cell,
        pid: l.pid,
        entryArmed: l.entry.some((r) => r.armed),
        exitArmed: l.exit.some((r) => r.armed),
        modules: l.exit.map((r) => ({
            path: r.path,
            declLine: r.declLine,
            armSites: r.armSites,
            armLines: r.armLines,
            sha256: r.originalSha256,
        })),
    })),
    legs: Object.fromEntries(
        Object.entries(legs).map(([leg, rows]) => {
            const ref = refOf(leg);
            return [
                leg,
                rows.map((r) => ({
                    engine: r.engine,
                    pid: r.pid,
                    doors: r.doors,
                    disposition: r.disposition,
                    passesPerRound: r.passes,
                    callsPerPass: r.callsPerPass,
                    bytesPerPass: r.bytesPerPass,
                    roundsScored: r.roundsScored,
                    ns_per_call: r.ns_per_call,
                    mbps: r.mbps,
                    ratio_vs_published:
                        ref && ref.ns_per_call.median
                            ? ref.ns_per_call.median / r.ns_per_call.median
                            : null,
                    ratio_mbps_vs_jsonParser:
                        jsonRow && jsonRow.mbps.median ? r.mbps.median / jsonRow.mbps.median : null,
                    dispositionMatchesReference:
                        !ref ||
                        (r.disposition.accept === ref.disposition.accept &&
                            r.disposition.reject === ref.disposition.reject &&
                            r.disposition.throw === ref.disposition.throw),
                    sink: r.sink,
                })),
            ];
        }),
    ),
    bar: {
        applied: "NONE",
        ruling: "COHESION §0j.E OC-1 — the bench table is RECORDED-NOT-GATING; admission is decided on correctness.",
        planeB: "OWNER-GATED-PENDING-RATIFICATION — ≥10× RETIRED AS LAW; strict-3× / strict-2× / break-even each 0/5 OPEN and UNRATIFIED (handoff §3.1).",
        planeA: "CC-095's interleaved three-leg bar (accepted ≥0.9× · reject ≥0.6× · R1 zero throws) is attributed to CC-095, whose ruled home is X-W9. Its applicability to X·P is an OWNER CONFIRMATION, not an assumption of this harness.",
        historicalFloorsRecordedNotApplied: {
            VALUE_RATIO_FLOOR: 0.05,
            SHEET_RATIO_FLOOR: 0.1,
            provenance:
                "U-F14 re-anchor constants from the pre-v4 gate. Recorded for lineage only. The gate's own calibration subject failed them on 3 of 5 scenarios — a bar the calibration subject cannot meet is a broken ruler, not a standard.",
            appliedTo: "nothing in this file",
        },
        note: "No verdict field exists in this schema, by construction. A ✓/✗ column on Plane B is the claim, and this wave does not make it.",
    },
    honestBounds: [
        "N=1 machine; one build; one clock.",
        "Within a cell, a same-process hot loop — the classic microbenchmark caveat applies.",
        "Across cells, one live process set with cells interleaved per round.",
        "Absolute ns/parse is not portable across runs or boxes (this wave's open measured 56.4 then 58.0 ns/parse for the same unarmed subject; the spec's own baseline read 55.6 and O-15 read 93.9). Read the ratios.",
        "No speed claim exists outside the printed table.",
    ],
};

writeFileSync(outPath, JSON.stringify(final, null, 2) + "\n");
out(`── FINALIZE · wrote ${outPath}`);
out(
    `   legs ${Object.keys(legs).length} · rows ${raw.rows.length} · latch ledger ${final.latchLedger.length} cells · ` +
        `bar applied: ${final.bar.applied}`,
);
const armedAnywhere = final.latchLedger.some((l) => l.entryArmed || l.exitArmed);
out(`   PACKRAT_ARMED observed true in any cell, at any phase: ${armedAnywhere}`);
if (armedAnywhere) process.exit(1);

// A cross-check the original could not make: this bench's own reading of the r1 throw class
// against the published totality probe's. The probe reports parseCssColor at 102/172.
const r1 = (legs["r1-throw-class"] ?? []).find((r) => r.engine === "published-4.0.0");
if (r1) {
    const items = r1.disposition.accept + r1.disposition.reject + r1.disposition.throw;
    out(
        `   R1 cross-check: published-4.0.0 parseCssColor throws ${r1.disposition.throw}/${items} ` +
            `on the degenerate cross-product — r1-published-totality.mjs reports 102/172.`,
    );
}
