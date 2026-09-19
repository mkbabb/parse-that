// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W4.b — G-4: THE WASM ZERO-FUNCTION-IMPORT ADMISSION.
//
//   node scripts/wasm-admission.mjs <artifact>.wasm [<artifact>.wasm ...] [--out <path.json>]
//
// The gate, verbatim from `docs/tranches/X/parse-that/waves/W4.md` §6 G-4 (L399-428):
//
//   "The Wasm artifact declares ZERO function-kind imports, instantiates against an EMPTY import
//    object, and its complete import list is printed and accounted (the 'closed memory/reification
//    accounting' clause)."
//
//   Falsifier: "a single function-kind import fails, AND SO DOES a passing static count paired with
//   an instantiation that needs a non-empty import object — the two legs exist because static
//   inspection alone can be satisfied by a module whose glue smuggles the dependency in at
//   instantiation. Memory, table, or global imports do not fail the gate but MUST APPEAR IN THE
//   PRINTED LIST; an unaccounted import of any kind fails, because the KEEP clause is closed
//   accounting, not merely zero functions."
//
// THE INSPECTION IS THE SPEC'S OWN, UNCHANGED. §6 G-4 prints the exact node command it wants run
// (L405-416) and calls for "no toolchain beyond node ... therefore runnable by anyone auditing the
// claim later". This file runs that command's four acts in that order and nothing else:
//
//   1. readFileSync(artifact)
//   2. new WebAssembly.Module(bytes) ; WebAssembly.Module.imports(mod)
//   3. print {total, functionKind, imports}
//   4. new WebAssembly.Instance(mod, {})            // must not throw
//      exit(functionKind === 0 ? 0 : 1)
//
// It adds exactly two things the gate's prose requires and its one-liner cannot carry: the ACCOUNTING
// of every printed import (leg 3's "and accounted"), and the artifact's IDENTITY — name, byte length
// and sha256 — because X.P.W3's F-o1 measured the on-disk `build/ac1.wasm` STALE against what
// `build.mjs` emits (emit 662,339 B vs on-disk 636,753 B). A gate that says "the Wasm module is
// admitted" without naming and hashing the bytes it read has admitted a file name, not a module.
// Every reading below is produced by a call in this process; nothing is quoted from a prior run.
//
// ACCOUNTING, stated so the verdict is not a matter of opinion:
//   - a `function`-kind import is NEVER accounted; it is the gate's primary falsifier.
//   - a `memory` / `table` / `global` import is accounted only because the empty-import-object
//     instantiation leg independently proves the module links with nothing supplied. Any import at
//     all makes that leg throw, so `accounted` and `emptyImportInstantiation.ok` are measured
//     separately and BOTH are required; neither is inferred from the other.
//   - an import of any other kind is UNACCOUNTED and fails, per the KEEP clause.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ACCOUNTABLE_KINDS = new Set(["memory", "table", "global"]);

const argv = process.argv.slice(2);
const artifacts = [];
let out = null;

for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") {
        out = argv[index + 1];
        index += 1;
        continue;
    }
    if (arg === "--") continue;
    if (arg.startsWith("--")) {
        throw new Error(`unknown flag: ${arg}`);
    }
    artifacts.push(arg);
}

if (artifacts.length === 0) {
    throw new Error("usage: wasm-admission.mjs <artifact>.wasm [...] [--out <path.json>]");
}

/** One artifact, inspected by the §6 G-4 command's own four acts, in order. */
const admit = (file) => {
    const resolved = path.resolve(file);
    const bytes = readFileSync(resolved);

    // (1) IDENTITY — named and hashed, so the admission is of these bytes and no others (F-o1).
    const identity = {
        path: resolved,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
    };

    // (2) STATIC INSPECTION — the spec's `WebAssembly.Module.imports`, unfiltered.
    const mod = new WebAssembly.Module(bytes);
    const imports = WebAssembly.Module.imports(mod);
    const functionKind = imports.filter((i) => i.kind === "function");

    // (3) ACCOUNTING — every printed import gets a verdict; none may be silent.
    const accounted = [];
    const unaccounted = [];
    for (const entry of imports) {
        const row = { module: entry.module, name: entry.name, kind: entry.kind };
        if (ACCOUNTABLE_KINDS.has(entry.kind)) accounted.push(row);
        else unaccounted.push(row);
    }

    // (4) THE SECOND LEG — instantiation against an EMPTY import object. A module whose glue
    //     smuggles a dependency in at instantiation fails HERE even with a clean static count.
    let instantiation = { ok: false, error: null };
    try {
        new WebAssembly.Instance(mod, {});
        instantiation = { ok: true, error: null };
    } catch (error) {
        instantiation = { ok: false, error: String(error?.message ?? error) };
    }

    // Also recorded, because "closed memory/reification accounting" is a claim about what the module
    // OWNS as well as what it asks for: a module that defines its own memory needs no import of one.
    const exports = WebAssembly.Module.exports(mod);

    const verdict = {
        functionKindZero: functionKind.length === 0,
        emptyImportInstantiation: instantiation.ok,
        everyImportAccounted: unaccounted.length === 0,
    };
    verdict.admitted =
        verdict.functionKindZero &&
        verdict.emptyImportInstantiation &&
        verdict.everyImportAccounted;

    return {
        artifact: identity,
        imports: {
            total: imports.length,
            functionKind: functionKind.length,
            list: imports.map((i) => ({ module: i.module, name: i.name, kind: i.kind })),
            accounted,
            unaccounted,
        },
        exports: {
            total: exports.length,
            byKind: exports.reduce((tally, entry) => {
                tally[entry.kind] = (tally[entry.kind] ?? 0) + 1;
                return tally;
            }, {}),
            memoryExported: exports.some((entry) => entry.kind === "memory"),
            names: exports.map((entry) => `${entry.kind}:${entry.name}`),
        },
        instantiation,
        verdict,
    };
};

const results = artifacts.map(admit);

// The printed evidence. §6 G-4's own command prints `{total, functionKind, imports}`; that object is
// reproduced verbatim per artifact, before the fuller record, so an auditor comparing this run to the
// spec's one-liner compares like with like.
for (const result of results) {
    process.stdout.write(
        `${JSON.stringify(
            {
                total: result.imports.total,
                functionKind: result.imports.functionKind,
                imports: result.imports.list,
            },
            null,
            1,
        )}\n`,
    );
}

const report = {
    servedModel: "claude-opus-5[1m]",
    gate: "G-4",
    wave: "X.P.W4",
    unit: "X.P.W4.b",
    generatedAt: new Date().toISOString(),
    node: process.version,
    command: "node scripts/wasm-admission.mjs <artifact>.wasm [...]",
    artifacts: results,
    tally: {
        artifacts: results.length,
        admitted: results.filter((r) => r.verdict.admitted).length,
        functionKindImportsTotal: results.reduce((sum, r) => sum + r.imports.functionKind, 0),
        unaccountedImportsTotal: results.reduce((sum, r) => sum + r.imports.unaccounted.length, 0),
    },
};
report.verdict = report.tally.admitted === report.tally.artifacts ? "GREEN" : "RED";

process.stdout.write(`${JSON.stringify(report, null, 4)}\n`);

if (out) {
    writeFileSync(path.resolve(out), `${JSON.stringify(report, null, 4)}\n`);
}

// The spec's exit discipline, widened by exactly the two legs its own falsifier names.
process.exit(report.verdict === "GREEN" ? 0 : 1);
