// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — G-11: DEPTH BY CONSTRUCTION + THE SCAN UNION INSIDE THE LIBRARY.
//
//   node harness/w2/depth-scan.mjs                     # the census and the ceiling, at this clock
//   node harness/w2/depth-scan.mjs --candidate <id>    # the deep-nesting row, both lowerings
//
// THE CEILING IS MEASURED, NEVER INHERITED. `W2.md` §6 G-11 pastes 7,761 (O-15 PT-04); X.P.W1's
// F-1 measured 7,759 in this root and X-P-W2.md carries it as R-8; W1's own census process measured
// 7,773. Four numbers, one substrate: the ceiling is a property of a STACK SHAPE, and the margin —
// not the number — is the assertion (W1's `harness/README.md` §3.3, the rule this file obeys). This
// probe therefore walks the ceiling in ITS OWN process with the same walk W1's census uses, prints
// what it measured beside all four inherited coordinates, and computes every margin against the
// measurement.
//
// The contract's own position (`ALGEBRA.md` §11 DM-5, §8 D-3): the emergent ceiling is NOT a
// contract property. `Θ.depthBound = 64` is, and G-11's row (`var(var(…))` past 10,000) must return
// `ok:false` from a CONSTRUCTED bound in BOTH lowerings — never a `RangeError`.

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { argv, corpus, P2_ROOT } from "./lib/contract.mjs";
import { loadCandidate } from "./lib/candidate.mjs";
import { header, table, kv, verdict, absent } from "./lib/report.mjs";
import { PARSE_THAT_DIST } from "../bench/lib/engines.mjs";

const a = argv();

/** Inherited coordinates, pasted with their shapes — D-3's four, never averaged into one. */
const INHERITED_CEILINGS = [
    ["7,761", "W2.md §6 G-11 / INBOX O-15 PT-04", "Parser.lazy, thrown RangeError at 7,762"],
    ["7,759", "X.P.W1 F-1 (this root, at open) — X-P-W2.md R-8", "the same walk, a different process"],
    ["7,773", "W1's census process (harness/README.md §3.3)", "a different module graph measures different again"],
    ["256", "NESTING_LIMIT, typescript/src/parse/state.ts:51", "a RETURNED failure, not a throw"],
    ["1,048,575", "a linear `lazy` chain (Opus arm A.7)", "a fourth shape entirely"],
];

function gitCount(args) {
    try {
        const out = execFileSync("git", ["-C", P2_ROOT, ...args], { encoding: "utf8" });
        return out.split("\n").filter(Boolean).length;
    } catch {
        return 0;
    }
}

async function measureCeiling() {
    const pt = await import(pathToFileURL(`${PARSE_THAT_DIST}/parse.js`).href);
    const nested = pt.Parser.lazy(() => pt.any(pt.all(pt.string("("), nested, pt.string(")")), pt.string("x")));
    let deepestOk = 0;
    let mode = "n/a";
    for (let d = 1; d <= 20000; d++) {
        try {
            const st = nested.parseState("(".repeat(d) + "x" + ")".repeat(d));
            if (st.isError) {
                mode = `ok:false at depth ${d}`;
                break;
            }
            deepestOk = d;
        } catch (e) {
            mode = `${e.constructor.name} thrown at depth ${d}`;
            break;
        }
    }
    return { deepestOk, mode, lazyArity: pt.Parser.lazy.length };
}

async function census() {
    header("X.P.W2.g — depth-scan (G-11): the ceiling at this clock, and the scan census");

    const c = await measureCeiling();
    kv([
        ["Parser.lazy deepest OK, MEASURED in this process", String(c.deepestOk)],
        ["mode at the ceiling", c.mode],
        ["Parser.lazy arity (a depth-bound parameter would be arity ≥ 2)", String(c.lazyArity)],
    ]);
    console.log();
    table(["inherited coordinate", "provenance", "shape"], INHERITED_CEILINGS);
    console.log(
        "The four coordinates do not contradict each other: each names a different stack shape. " +
            "R-8's rule holds here — every margin below is computed against the MEASURED ceiling, never against 7,761.",
    );

    const slice = corpus("slice.json");
    const deep = slice.rows.filter((r) => r.family === "deep-nesting");
    const rows = deep.map((r) => {
        const depth = (r.src.match(/var\(/g) ?? []).length;
        return [r.id, `${depth} nested var(`, String(c.deepestOk), String(c.deepestOk - depth), depth > c.deepestOk ? "PAST the substrate ceiling — the bound must be the algebra's" : "below the ceiling"];
    });
    console.log();
    table(["row", "declared nesting", "measured ceiling", "margin", "reading"], rows);

    console.log();
    const scanCensus = [
        ["committed Rust scan files", String(gitCount(["ls-tree", "--name-only", "HEAD", "rust/parse_that/src/parsers/scan/"])), "git ls-tree --name-only HEAD rust/parse_that/src/parsers/scan/"],
        ["committed wasm32 kernels", String(gitCount(["grep", "-l", "wasm32", "HEAD", "--", "rust/parse_that/"])), "git grep -l wasm32 HEAD -- rust/parse_that/"],
        ["TypeScript scan/SIMD modules", String(gitCount(["grep", "-il", "simd", "HEAD", "--", "typescript/src"])), "git grep -il simd HEAD -- typescript/src"],
    ];
    table(["scan census (the asymmetry §6 G-11 pastes: 13 : 0 : 0)", "measured", "command"], scanCensus);

    const asymmetryHolds = scanCensus[0][1] === "13" && scanCensus[1][1] === "0" && scanCensus[2][1] === "0";
    return verdict(
        asymmetryHolds,
        asymmetryHolds
            ? `ceiling measured ${c.deepestOk} (${c.mode}); the census asymmetry reproduces to the digit — ${scanCensus.map((r) => r[1]).join(" : ")}`
            : `the census asymmetry does not reproduce: measured ${scanCensus.map((r) => r[1]).join(" : ")}, pasted 13 : 0 : 0`,
    );
}

async function candidate(id) {
    const c = await loadCandidate(id, a.at ?? null);
    header(`X.P.W2.g — depth-scan --candidate ${id} (G-11)`);
    if (!c.present) {
        await census();
        console.log();
        return absent(`candidate ${id}`, c.reason);
    }
    const slice = corpus("slice.json");
    const deep = slice.rows.filter((r) => r.family === "deep-nesting");
    const rows = [];
    const red = [];
    for (const k of ["js", "wasm"]) {
        const L = c.lowerings[k];
        for (const row of deep) {
            let reading;
            try {
                const p = L.parse(row.prod, row.src);
                reading = p.ok ? "ok:true (the bound did not fire)" : `ok:false, ${(p.D ?? []).length} issue(s)`;
                if (p.ok) red.push(`${k}: the deep-nesting row returned ok:true — the constructed bound did not fire`);
            } catch (e) {
                reading = `THREW ${e?.constructor?.name}: ${String(e.message).slice(0, 48)}`;
                red.push(`${k}: the deep-nesting row THREW (${e?.constructor?.name}) — a RangeError here is exactly what the bound exists to prevent (K-7/K-8)`);
            }
            rows.push([k, row.id, reading]);
        }
        // Every scan primitive must be reached as an ALGEBRA LEAF in both lowerings (§3 item 12).
        const g = L.grammar();
        const leafOps = new Set();
        for (const term of Object.values(g.terms ?? {})) {
            const walkT = (t) => {
                if (!t || typeof t !== "object" || !t.op) return;
                if (["SCAN", "TEXT", "KW", "DISPATCH", "LIT", "DIGITS"].includes(t.op)) leafOps.add(t.op);
                (t.args ?? []).forEach(walkT);
            };
            walkT(term);
        }
        rows.push([k, "scan primitives reached as algebra leaves", [...leafOps].sort().join(", ") || "NONE"]);
        if (leafOps.size === 0) red.push(`${k}: no scan primitive is reached as an algebra leaf — an inlined cursor beside the combinators fails even if faster`);
    }
    table(["lowering", "row", "reading"], rows);
    return verdict(red.length === 0, red.length === 0 ? "the constructed bound returns ok:false in both lowerings; every scan primitive is an algebra leaf" : red.join(" | "));
}

const code = a.candidate ? await candidate(a.candidate) : await census();
process.exit(code);
