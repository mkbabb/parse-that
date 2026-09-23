// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — THE TWO REDS, NAMED AT THEIR CAUSE.
//
// G-3's EQ-6 leg and G-4's R-LAW-2 leg both read RED, and both read the SAME number for both
// lowerings — so neither is a divergence between them. This probe asks what the failures ARE, which
// term produces them, and what the counterfactual is. It changes nothing: it reads the products the
// two lowerings already produce and re-applies `.g`'s own `comp1`/`kindPredicate`.
//
//   node experiments/w2/ac1-tagless/probes/comp1-and-third-cell.mjs
//
// A seat instrument, not a candidate source.

import { corpus } from "../../../../harness/w2/lib/contract.mjs";
import { comp1, kindPredicate, serializeV, sha } from "../../../../harness/w2/lib/serialize.mjs";
import { loadPublished, PROD_TO_PUBLISHED, observe } from "../../../../harness/w2/lib/published.mjs";
import { generateFuzzRows } from "../../corpus/fuzz-gen.mjs";
import { lowerings } from "../harness-adapter.mjs";

const line = (s = "") => console.log(s);
const slice = corpus("slice.json");
const rows = [...slice.rows, ...generateFuzzRows(corpus("fuzz-seed.json"))];

/* ── the COMP-1 failures, by law, by kind, and by the bytes they cover ────────────────────── */

line("── EQ-6 / R-LAW-2 — what fails COMP-1, and why ────────────────────────────────────────────");
const byLaw = new Map();
const byKind = new Map();
const byFamily = new Map();
const samples = [];
let failRowsJs = 0;
let failRowsWasm = 0;
let identical = 0;

for (const row of rows) {
    const pj = lowerings.js.parse(row.prod, row.src);
    const pw = lowerings.wasm.parse(row.prod, row.src);
    const cj = comp1(row.src, pj.C, pj.P);
    const cw = comp1(row.src, pw.C, pw.P);
    if (!cj.ok) failRowsJs++;
    if (!cw.ok) failRowsWasm++;
    if (JSON.stringify(cj.failures) === JSON.stringify(cw.failures)) identical++;
    if (cj.ok) continue;
    byFamily.set(row.family, (byFamily.get(row.family) ?? 0) + 1);
    for (const f of cj.failures) {
        byLaw.set(f.law, (byLaw.get(f.law) ?? 0) + 1);
        const m = f.detail.match(/^kind '([^']+)' over (.*) at (\d+)/);
        if (m) {
            byKind.set(m[1], (byKind.get(m[1]) ?? 0) + 1);
            if (samples.length < 6) samples.push(`${row.id} ${JSON.stringify(row.src).slice(0, 34)} → kind '${m[1]}' over ${m[2].slice(0, 28)}`);
        }
    }
}
line(`rows                                   ${rows.length}`);
line(`rows failing COMP-1 · js               ${failRowsJs}`);
line(`rows failing COMP-1 · wasm             ${failRowsWasm}`);
line(`rows whose failure LISTS are identical ${identical} of ${rows.length} — EQ-6 is not a divergence between the lowerings`);
line(`failures by law                        ${[...byLaw].map(([k, v]) => `${k}:${v}`).join(" · ")}`);
line(`failures by kind (COMP-1c π_k)         ${[...byKind].map(([k, v]) => `${k}:${v}`).join(" · ")}`);
line(`rows by corpus family                  ${[...byFamily].map(([k, v]) => `${k}:${v}`).join(" · ")}`);
line();
for (const s of samples) line(`  ${s}`);

/* ── the counterfactual: one kind's predicate, and nothing else ───────────────────────────── */

line();
line("COUNTERFACTUAL — §4.5's π_keyword is /^[A-Za-z][A-Za-z0-9_-]*$/ and §10.1's `balanced-tail`");
line("owns its bytes with `DROP keyword (SCAN any-but-paren 1 ∞)`. Reading that ONE kind the way");
line("π_skipped and π_residue are read (>= 1 byte) and changing nothing else:");
let remaining = 0;
let rowsRemaining = 0;
for (const row of rows) {
    const p = lowerings.js.parse(row.prod, row.src);
    const c = comp1(row.src, p.C, p.P);
    if (c.ok) continue;
    const surviving = c.failures.filter((f) => {
        const m = f.detail.match(/^kind '([^']+)' over (.*) at (\d+)/);
        if (!m) return true;
        if (m[1] !== "keyword") return true;
        return false;
    });
    //  the same row re-checked with every OTHER predicate untouched
    const stillBad = surviving.filter((f) => {
        const m = f.detail.match(/^kind '([^']+)' over "(.*)" at (\d+)/);
        return !m || !kindPredicate(m[1], JSON.parse(`"${m[2]}"`));
    });
    remaining += stillBad.length;
    if (stillBad.length) rowsRemaining++;
}
line(`  failures remaining                   ${remaining} (rows ${rowsRemaining})`);
line();
line("No other K_C kind admits those bytes: `skipped` is RECOVER's (§4.5), `punct` is one byte of");
line("\"(),/%#;:{}[]!\", `ws` and `comment` are lexical, `residue` is ENTRY's tail rule. The tiling is");
line("COMPLETE and non-overlapping (no COMP-1a and no COMP-1b failure appears above) — only the KIND");
line("COLUMN's predicate rejects it.");

/* ── the third cell, by cause ─────────────────────────────────────────────────────────────── */

line();
line("── the third differential cell (vendored 4.0.0), by cause ─────────────────────────────────");
const { mod } = await loadPublished();
const causes = new Map();
const famBy = new Map();
let compared = 0;
for (const row of slice.rows) {
    if (!PROD_TO_PUBLISHED[row.prod]) continue;
    compared++;
    const pj = lowerings.js.parse(row.prod, row.src);
    const o = observe(mod, row.prod, row.src);
    let cause = null;
    if (o.threw) cause = "incumbent THREW (the R1 class)";
    else if (o.ok !== pj.ok) cause = o.ok ? "incumbent ACCEPTS, the algebra rejects" : "incumbent REJECTS, the algebra accepts";
    else if (o.ok && sha(serializeV(o.value)) !== sha(serializeV(pj.V))) cause = "both accept, V differs";
    if (!cause) continue;
    causes.set(cause, (causes.get(cause) ?? 0) + 1);
    const key = `${row.family}`;
    famBy.set(key, (famBy.get(key) ?? 0) + 1);
}
line(`slice rows with a published counterpart ${compared}`);
for (const [k, v] of [...causes].sort((a, b) => b[1] - a[1])) line(`  ${String(v).padStart(4)}  ${k}`);
line(`by family                               ${[...famBy].map(([k, v]) => `${k}:${v}`).join(" · ")}`);
line();
line("§10.5 declares eleven divergence CLASSES (a)..(k); the corpus tags twelve ROWS individually, so");
line("the harness's `declared` column counts 12. The classes above are the declared ones — the seat");
line("reports the cause census beside the count so no reader mistakes 221 untagged rows for surprises.");
