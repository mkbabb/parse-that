// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.b — THE MALFORMED-INVERSE CORPUS, DERIVED (`W3.md` §4 `test/css-recovery/**`).
//
//   node test/css-recovery/build-corpus.mjs --write     # re-derive and write corpus.json
//   node test/css-recovery/build-corpus.mjs --check      # re-derive and diff; non-zero on any drift
//
// The corpus is DERIVED, never hand-typed — `experiments/w2/corpus/build-corpus.mjs`'s precedent,
// and for its reason: a hand-edited corpus is a corpus whose author can quietly delete the row that
// reddens a gate. Two folded sources plus one authored band, each row carrying its provenance:
//
//   * `experiments/w2/corpus/r1.json`    — the 172-input R1 corpus (GATE-VERDICT F-2 / O-15 PT-07),
//     the degenerate cross-product of function heads against empty-ish bodies;
//   * `experiments/w2/corpus/slice.json` — the 527-row §10 slice corpus (X.P.W2.g), well-formed and
//     malformed alike, so the closure gate reads accept paths as well as reject paths;
//   * the authored RECOVERY BAND below — inputs aimed at the recovery machinery itself (the
//     `RECOVER` arm of `stylesheet`, the `REF` depth bound, `END`'s trailing input, the context
//     colour guard, the constructor guards), because the two folded corpora were built for other
//     questions and a closure proof over inputs nobody chose for it is a proof of nothing.
//
// INPUTS AND PROVENANCE ONLY. No expected value appears anywhere in this file or its output:
// `W3.md` §3's closing prohibitions refuse self-authored answer keys, and the closure gate asserts
// STRUCTURAL laws (which codes, which spans, which expectations) that need no key.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../.."); //             <p2>
const OUT = path.join(HERE, "corpus.json");

/**
 * The authored recovery band: one row per recovery site the §10 slice actually carries, plus the
 * degenerate shapes a recovery algebra has to answer for. Depth rows are GENERATED at the bound and
 * one past it, so the row survives a change to Θ.depthBound rather than encoding today's 64.
 */
const DEPTH_BOUND = 64;
const nest = (n) => `var(${"(".repeat(n)}${")".repeat(n)})`;
/** Built rather than written: a raw NUL in the source makes git and `file(1)` read it as binary. */
const NUL = String.fromCharCode(0);

const AUTHORED = [
    ["stylesheet RECOVER — the malformed qualified rule the sync-rule skips", [
        "a{", "a{;}", "a{color}", "a{color:}", "a{color:;}", "a{:red}", "}", "a{}b{}", "a{color:red}}",
        "a{color:red;;}", "a{color:red", "a{color:#gg}", "a b{color:red}", "a{color:red}@media{}",
    ]],
    ["END — trailing input after a complete production", [
        "#abc ", "#abcx", "red red", "rgb(1 2 3) 4", "linear ease", "a{color:red} ;",
    ]],
    ["the context-colour guard — the one production whose only result is a failure", [
        "currentcolor", "CurrentColor", "canvas", "highlighttext", "a{color:currentcolor}",
    ]],
    ["constructor guards — a shape that parses and a value that cannot be built", [
        "cubic-bezier(2,0,0,0)", "cubic-bezier(0,0,2,0)", "steps(0)", "steps(1,jump-none)", "steps(1.5)",
        "linear(0)", "rgb(1e400 0 0)", "hsl(1e400 0% 0%)",
    ]],
    ["the balanced tail — the REF back-edge, and the bytes a DROP skipped opaque", [
        "var(--brand)", "var(--a,var(--b))", "var(", "var()", "var(--a))", "var((((",
    ]],
    [`the REF depth bound — at ${DEPTH_BOUND} and one past it`, [
        nest(DEPTH_BOUND - 2), nest(DEPTH_BOUND - 1), nest(DEPTH_BOUND), nest(DEPTH_BOUND + 1), nest(DEPTH_BOUND + 8),
    ]],
    ["degenerate heads the R1 corpus does not carry", [
        "rgb(", "rgb(1", "rgb(1,", "rgb(1 2", "rgb(1 2 3 /", "#", "##", "#a", "#ab", "#abcde", "#abcdefghi",
        "oklch(0.7 0.1)", "oklch(0.7 0.1 30 / )", "hsl(120deg 50% 50% / 0.5 0.5)",
    ]],
    ["the empty and the whitespace-only input, per production", ["", " ", "\t", "\n", "   \r\n  "]],
    ["non-ASCII and control bytes — the 0xFF marker's own band", ["café", NUL, "rgb(1 2 3)", "«red»"]],
];

const sources = [];
const rows = [];
const seen = new Map();

const add = (src, provenance) => {
    if (typeof src !== "string") return;
    const already = seen.get(src);
    if (already !== undefined) {
        if (!rows[already].provenance.includes(provenance)) rows[already].provenance.push(provenance);
        return;
    }
    seen.set(src, rows.length);
    rows.push({ id: `c${String(rows.length).padStart(4, "0")}`, src, provenance: [provenance] });
};

const fold = (rel, pick, provenance) => {
    const file = path.join(ROOT, rel);
    const before = rows.length;
    const json = JSON.parse(readFileSync(file, "utf8"));
    const picked = pick(json);
    for (const src of picked) add(src, provenance);
    sources.push({ file: rel, read: picked.length, new: rows.length - before, provenance });
};

fold("experiments/w2/corpus/r1.json", (j) => j.inputs.map((r) => r.src), "r1.json — the 172-input R1 corpus (GATE-VERDICT F-2)");
fold("experiments/w2/corpus/slice.json", (j) => j.rows.map((r) => r.src), "slice.json — the §10 slice corpus (X.P.W2.g)");

const authoredBefore = rows.length;
for (const [band, inputs] of AUTHORED) for (const src of inputs) add(src, `authored recovery band — ${band}`);
sources.push({
    file: "test/css-recovery/build-corpus.mjs",
    read: AUTHORED.reduce((n, [, i]) => n + i.length, 0),
    new: rows.length - authoredBefore,
    provenance: "the authored recovery band (X.P.W3.b)",
});

const corpus = {
    servedModel: "claude-opus-5[1m]",
    schema: "x-p-w3.b.recovery-corpus/1",
    note:
        "DERIVED BY SCRIPT (test/css-recovery/build-corpus.mjs). Never hand-edit: `--check` re-derives and " +
        "exits non-zero on any disagreement. Rows carry inputs and provenance ONLY — no expected values " +
        "anywhere (W3.md §3: no self-authored answer keys).",
    contract: "W3.md §5 `.b` · §6 G-4 · §6 G-8 — the malformed-inverse suite's corpus",
    sources,
    counts: { rows: rows.length, duplicatesFolded: sources.reduce((n, s) => n + s.read, 0) - rows.length },
    rows,
};

const text = `${JSON.stringify(corpus, null, 4)}\n`;

if (process.argv.includes("--write")) {
    writeFileSync(OUT, text);
    console.log(`WROTE ${path.relative(ROOT, OUT)} — ${rows.length} rows from ${sources.length} sources`);
    process.exit(0);
}
if (process.argv.includes("--check")) {
    const on = readFileSync(OUT, "utf8");
    if (on === text) {
        console.log(`GREEN — ${path.relative(ROOT, OUT)} re-derives byte-identically (${rows.length} rows)`);
        process.exit(0);
    }
    console.log(`RED — ${path.relative(ROOT, OUT)} differs from its derivation (${on.length} B on disk, ${text.length} B derived)`);
    process.exit(1);
}
console.log("usage: node test/css-recovery/build-corpus.mjs --write | --check");
process.exit(2);
