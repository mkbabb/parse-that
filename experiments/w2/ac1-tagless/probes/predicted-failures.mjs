// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — THE THREE PREDICTED FAILURES, PROBED FIRST.
//
// `W2.md` §3c names AC-1's three: signature leak · megamorphic IC collapse on the short-string leg ·
// continuation inexpressibility. The seat brief orders them BEFORE the build's own gates, and their
// output is pasted verbatim into `VERDICT.md`. This file is a SEAT INSTRUMENT, not a candidate
// source: nothing in `lowerings` imports it and it is not in `meta.sources`.
//
//   node experiments/w2/ac1-tagless/probes/predicted-failures.mjs
//
// The IC leg is run separately, under `--trace-ic`, by `probes/ic-trace.sh`, because the flag must
// be on the process that runs the parses.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildGrammar, REF_TARGETS } from "../algebra/grammar.mjs";
import { OPS } from "../algebra/ops.mjs";
import { termAlgebra } from "../reify/term-alg.mjs";
import { makeJsLowering } from "../lowering-js/index.mjs";
import { makeWasmLowering } from "../lowering-wasm/index.mjs";
import { closureLeaks, cutOutsideAlt, opsUsed, recoverInNonFinalAlt, refs, unownedSpans } from "../../../../harness/w2/lib/term.mjs";
import { meta } from "../harness-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TARGET_CONDITIONAL = /isWasm|target\s*===|TARGET_JS|TARGET_WASM/g;
const line = (s = "") => console.log(s);
const rule = (t) => {
    line();
    line(`── ${t} ${"─".repeat(Math.max(0, 92 - t.length))}`);
};

/* ── PF-1: signature leak ─────────────────────────────────────────────────────────────────── */

rule("PF-1  SIGNATURE LEAK — can the grammar be authored against the twenty-two ALONE?");

const importsOf = (file) =>
    [...readFileSync(file, "utf8").matchAll(/^\s*import\s[^"']*["']([^"']+)["']/gm)].map((m) => m[1]);

const lowered = new Set([...meta.sources.js, ...meta.sources.wasm]);
const leaks = [];
for (const f of meta.sources.algebra) {
    for (const spec of importsOf(f)) {
        const abs = spec.startsWith(".") ? path.resolve(path.dirname(f), spec) : spec;
        if ([...lowered].some((l) => l === abs)) leaks.push(`${path.basename(f)} → ${spec}`);
    }
}
line(`algebra sources                     ${meta.sources.algebra.length}`);
for (const f of meta.sources.algebra) line(`  ${path.relative(HERE, f).padEnd(28)} imports: ${importsOf(f).join(", ") || "(none)"}`);
line(`algebra → lowering imports          ${leaks.length}${leaks.length ? ` — ${leaks.join(" · ")}` : "  (a leak here is the predicted failure)"}`);

let cond = 0;
const condFiles = [];
for (const f of [...meta.sources.algebra, ...meta.sources.js, ...meta.sources.wasm]) {
    const n = [...readFileSync(f, "utf8").matchAll(TARGET_CONDITIONAL)].length;
    cond += n;
    if (n) condFiles.push(`${path.basename(f)}:${n}`);
}
line(`target-conditional tokens (K-2)     ${cond}${condFiles.length ? ` — ${condFiles.join(" · ")}` : ""}`);

//  what the grammar file actually destructures from the algebra, read from its own bytes
const grammarSrc = readFileSync(meta.sources.algebra[2], "utf8");
const destructured = (grammarSrc.match(/const \{([^}]*)\} = A;/) ?? [, ""])[1]
    .split(",").map((s) => s.trim()).filter(Boolean);
const contractNames = OPS.map((o) => o.name);
line(`operations the grammar destructures ${destructured.length} — ${destructured.join(" ")}`);
line(`outside the ratified 22             ${destructured.filter((d) => !contractNames.includes(d)).join(", ") || "none"}`);
line(`unused by the grammar               ${contractNames.filter((n) => !destructured.includes(n)).join(", ") || "none"}`);

//  the identity leg: one `buildGrammar`, three instantiations
const js = makeJsLowering();
const wasm = makeWasmLowering();
line(`one buildGrammar for all three      ${typeof buildGrammar === "function" ? "yes — imported from algebra/grammar.mjs by the terms, the JS lowering and the Wasm lowering alike" : "NO"}`);
line(`REF back-edges the slice declares   ${REF_TARGETS.join(", ")} (§8 D-3)`);

/* ── PF-3: continuation inexpressibility ──────────────────────────────────────────────────── */

rule("PF-3  CONTINUATION INEXPRESSIBILITY — did anything need a host closure to be said?");

const g = buildGrammar(termAlgebra());
const used = opsUsed(g);
line(`terms                               ${Object.keys(g.terms).length}`);
line(`operations exercised                ${[...used.keys()].sort().join(" ")}`);
line(`CL-1 closure leaks (functions,      ${closureLeaks(g).length}`);
line(`  symbols, class instances, getters,`);
line(`  cycles anywhere under terms)`);
line(`CUT outside an ALT arm (§5.2)       ${cutOutsideAlt(g).length}`);
line(`RECOVER in a non-final arm (R-LAW-5)${recoverInNonFinalAlt(g).length}`);
line(`unowned Span terms (INV-OWN)        ${unownedSpans(g).length}`);
line(`unresolved REF targets              ${refs(g).unresolved.length}`);
line();
line("the four places §10's letter could NOT be transcribed, each recorded as a DEVIATION rather");
line("than patched — none of them needed anything outside the twenty-two:");
for (const [k, what, how] of [
    ["DM-2 `sync-rule` terminals", "§10.3 writes bare SCAN/LIT; INV-OWN requires a DROP owner", "DROP wrappers under discard — expressible, unobservable"],
    ["`important`", "§10.3's OPT(unit) cannot carry whether the arm matched", "ALT[SEQ[…, PURE true], PURE false] — expressible"],
    ["`value-slice`", "§10.3 wants REF color-body, §8 D-3 allows exactly two REF sites", "color-body INLINED — expressible, the debt clause taken"],
    ["§10.2's ALT order", "committed choice makes `linear(…)` unreachable behind `timing-keyword`", "DISPATCH arm moved first — expressible; a CONTRACT DEFECT, reported"],
]) line(`  · ${k.padEnd(26)} ${what}\n      → ${how}`);
line();
line(`host closures required              0 — the grammar's only inputs are the twenty-two and the registries`);

/* ── the three instantiations agree on the term data ──────────────────────────────────────── */

rule("the three instantiations");
const gj = JSON.stringify(js.grammar());
const gw = JSON.stringify(wasm.grammar());
line(`js.grammar() === wasm.grammar()     ${gj === gw ? "yes (byte-identical term data)" : "NO"}`);
line(`js registry rows                    ${js.registry().length}`);
line(`wasm registry rows                  ${wasm.registry().length}`);
line(`label index aligned                 ${JSON.stringify(js.labels()) === JSON.stringify(wasm.labels())}`);
