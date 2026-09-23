// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — THE THREE CORPORA, DERIVED BY SCRIPT AND REPLAYABLE.
//
// `node experiments/w2/corpus/build-corpus.mjs`          writes slice.json · r1.json · fuzz-seed.json
// `node experiments/w2/corpus/build-corpus.mjs --check`   re-derives in memory and compares; writes nothing
//
// Three laws this file obeys, each from a named clause:
//
//   1. NO EXPECTED VALUES. A corpus row carries an input and its declared classification only.
//      Per-candidate expectations are self-authored answer keys and are PRUNED (`W2.md` §5 `.g`).
//      The third cell's known disagreements ride as DECLARED rows (`ALGEBRA.md` §10.5), never as
//      silent expectations.
//   2. GENERATED, NEVER HAND-LISTED, where the evidence says generated: the GROUND-A cross-product
//      (debt 5, `ALGEBRA.md` §8 D-5: 21 heads x 10 fillings = 210) and the R1 cross-product
//      (18 x 9 + 10 = 172) are derived here from the SAME data the two probes of record derive them
//      from, transcribed as data with its coordinate cited — so a count here is comparable to a
//      count there instead of merely similar.
//   3. C-CORP (`ALGEBRA.md` §1): every row is a declared subset of the frozen 52-export universe
//      plus the adjudicated fixtures. Each row carries `provenance` naming which.
//
// The slice's two DECLARED RESTRICTIONS (`ALGEBRA.md` §10.3, carried to this seat as X.P.W2.c's
// R-c5) bound the stylesheet family: a prelude beginning `@` and a declaration value that is not a
// colour are OUTSIDE the W2 slice corpus. W1's D-F2 row `@@@ { }` is therefore DECLARED here and
// not compared — the row exists in the ledger as a fact about the third cell, not as a test.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FUZZ_PIN, generateFuzzRows } from "./fuzz-gen.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VALUE_JS_ROOT = process.env.VALUE_JS_ROOT || "/Users/mkbabb/Programming/value.js";
const NAMED_COLORS_TS = path.join(VALUE_JS_ROOT, "src/css/named-colors.ts");

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/* ── the adjudicated fixture data, transcribed with its coordinate ─────────────────────────── */

/** `audit/probes/r1-published-totality.mjs:38-43` — the R1 degenerate cross-product's own data. */
const R1_NAMES = [
    "rgb", "rgba", "hsl", "hsla", "lab", "lch", "oklab", "oklch", "color", "hwb",
    "scroll", "view", "cubic-bezier", "steps", "linear", "var", "calc", "translate",
];
const R1_BODIES = ["()", "( )", "(/)", "(,)", "(/ )", "( / )", "(,,)", "(/ / )", "( ,)"];
const R1_BASE = ["", "  ", "/", ",", "()", "(", ")", "null", "undefined", "NaN"];

/**
 * THE SEVEN NON-STRING SHAPES (`W2.md` §6 G-5: "172 inputs + 7 non-string"; `parser-band.md` L23-31
 * reads the published cell "7/7 non-string throws").
 *
 * MEASURED CORRECTION, recorded rather than silently inherited. The nearest array in the evidence
 * tree is `audit/probes/library-band-gates.mjs:68`'s `HOSTILE = [undefined, null, 42, {}, [], "",
 * NaN]` — a **7-value JS-boundary** corpus, not seven non-strings: `""` is a string. Measured at
 * the vendored 4.0.0 this seat's clock: `parseCssColor("")` **returns** `ok:false` with
 * `css_syntax` (it does not throw), while every non-string shape throws
 * `TypeError: … reading 'trim'` / `e.trim is not a function` — a failure mode DISTINCT from R1's
 * `reading 'replace'`. Against HOSTILE the published cell therefore reads **6/7**, not the pasted
 * 7/7, for a reason that is about the corpus and not about the parser.
 *
 * The cure is the corpus, not the number: `""` is already row `r1-0` of the 172 (it is the first
 * member of the probe of record's own base set), so nothing is lost by removing it from the
 * boundary corpus, and `true` completes the seven non-string shapes. The published cell then
 * reproduces **7/7** as pasted, and the two corpora stop overlapping.
 */
const BOUNDARY_7 = [
    { id: "b7-0", js: "undefined", typeofIs: "undefined" },
    { id: "b7-1", js: "null", typeofIs: "object" },
    { id: "b7-2", js: "42", typeofIs: "number" },
    { id: "b7-3", js: "{}", typeofIs: "object" },
    { id: "b7-4", js: "[]", typeofIs: "object" },
    { id: "b7-5", js: "true", typeofIs: "boolean" },
    { id: "b7-6", js: "NaN", typeofIs: "number" },
];

/** `prototypes/css-parser/denominator/denominator.test.ts:141-151` — GROUND-A's own data. */
const GA_GUARDED = ["var", "env", "hsv", "kelvin", "ictcp", "jzazbz"];
const GA_IDENTS = [
    "rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color",
    "xyz", "calc", "url", "attr", "steps", "linear", "scroll", "view", "foo", "a", "a-b",
    ...GA_GUARDED,
];
const GA_BODIES = ["", " ", "  ", "\t", "\n", " \t\n ", "/", " / ", "//", " / / "];

/* ── the 148 named colours, read from the frozen surface, never typed here ─────────────────── */

function namedColors() {
    const src = readFileSync(NAMED_COLORS_TS, "utf8");
    const names = [...src.matchAll(/^\s{4}([a-z]+):\s*"#[0-9a-f]{6}",?$/gm)].map((m) => m[1]);
    const uniq = [...new Set(names)];
    if (uniq.length !== names.length) throw new Error("HALT: duplicate key in named-colors.ts");
    return uniq;
}

/* ── row helpers ──────────────────────────────────────────────────────────────────────────── */

let seq = 0;
const row = (prod, family, src, extra = {}) => ({
    id: `s${String(seq++).padStart(4, "0")}`,
    prod,
    family,
    src,
    ...extra,
});

/* ── the slice corpus (`ALGEBRA.md` §10, the shared slice of `W2.md` §3d) ──────────────────── */

function sliceRows() {
    seq = 0;
    const rows = [];
    const P = "P:color";
    const cite = (s) => ({ provenance: s });

    // §10.1 hex — 3/4/6/8, upper and lower spelling (ASCII folding is a stated property).
    for (const s of ["#abc", "#ABC", "#abcd", "#0a1b2c", "#0A1B2C", "#0a1b2c80", "#fff0"])
        rows.push(row(P, "hex", s, cite("§10.1 hex")));

    // §10.1 named — all 148 rows of the frozen table, plus the two context postures.
    for (const n of namedColors()) rows.push(row(P, "named", n, cite("§10.1 named-color (148)")));
    rows.push(row(P, "transparent", "transparent", cite("§10.1 transparent · grammar.ts:264")));
    for (const s of ["currentcolor", "currentColor", "canvastext"])
        rows.push(row(P, "context", s, cite("§10.1 context-color (20 spellings) → color_context_required")));

    // §10.1 rgb/hsl, both forms; oklch, the R1 crash family's representative.
    for (const s of [
        "rgb(1 2 3)", "rgb(1 2 3 / 0.5)", "rgb(50% 20% 30%)", "rgb(none 2 3)",
        "rgb(1, 2, 3)", "rgba(1, 2, 3, 0.5)", "rgba(1 2 3 / 50%)",
        "hsl(120 50% 50%)", "hsl(120deg 50% 50% / 0.25)", "hsl(120, 50%, 50%)",
        "hsla(120, 50%, 50%, 0.5)", "hsl(0.5turn 50% 50%)", "hsl(400grad 50% 50%)",
        "hsl(1rad 50% 50%)", "hsl(480 50% 50%)", "hsl(none none none)",
        "oklch(50% 0.1 120)", "oklch(0.5 0.1 120deg / 50%)", "oklch(50% 50% 1rad)",
        "oklch(none none none)", "oklch(0.5 0.1 120 / none)",
    ])
        rows.push(row(P, "functional", s, cite("§10.1 modern/legacy channel forms")));

    // §10.1 the ONE context node: var(), with the balanced tail (the slice's first REF site).
    for (const s of ["var(--brand)", "var(--brand, red)", "var(--a(--b))", "var(--x, rgb(1 2 3))"])
        rows.push(row(P, "var-context", s, cite("§10.1 var ⇒ CTOR context (the value IS the failure)")));

    // §10.1 numeric edges the contract names (`1.` is not a number; non-finite is DM-3).
    for (const s of ["rgb(1. 2 3)", "rgb(1e400 0 0)", "lab(50 1e400 0)", "rgb(-0 0 0)", "rgb(+1 2 3)"])
        rows.push(row(P, "numeric-edge", s, cite("§4.1 OP-03 NUM · DM-3")));

    // §10.1 DM-2 juxtaposition — the three adjudicated rows, DECLARED both ways.
    for (const s of ["rgb(50%20%30%)", "rgb(1.5.5 3)", "hsl(120 50%50%)"])
        rows.push(row(P, "juxtaposition", s, {
            ...cite("§11 DM-2 (band token-stream reading; dissent preserved)"),
            declaredMark: "DM-2",
        }));

    // §10.1 DM-7 / R6 bare-number s,l.
    for (const s of ["hsl(120 50 50)", "hsl(120, 50, 50)"])
        rows.push(row(P, "r6-bare-number", s, { ...cite("§11 DM-7 (R6)"), declaredMark: "DM-7" }));

    // §10.1 clamp rows (§4.2 / §8.1 per spec.ts).
    for (const s of ["rgb(300 -20 3)", "oklch(1.5 -1 30)", "rgb(0 0 0 / 200%)", "rgb(0 0 0 / 1.5)"])
        rows.push(row(P, "clamp", s, cite("§8 band row · §10.5 (c)")));

    // §10.1 the seven unsound accepts the incumbent admits and the algebra rejects (band L86-95).
    for (const s of [
        "rgb(1,2,3,)", "rgb(1 2 3 / )", "rgb(1, 2 3)", "hsl(120%, 50%, 50%)",
        "lch(50% 50% 50%)", "rgb(1. 2 3)", "hwb(120, 30%, 40%)",
    ])
        rows.push(row(P, "unsound-accept", s, {
            ...cite("§10.5 (d) — the band's seven"),
            thirdCellDivergence: "d",
        }));

    // §10.1 malformed / rejection rows, for EQ-6 and the D-1 named-expectation clause.
    for (const s of ["red x", "rgb(1 2)", "rgb(1 2 3 4)", "#ab", "#abcde", "nosuchcolor", "color-mix(in srgb, red, blue)"])
        rows.push(row(P, "malformed", s, cite("§10.5 (a)/(h)/(i) · EQ-6")));

    // §10.1 GROUND-A — GENERATED (debt 5), 21 unguarded heads x 10 fillings = 210, plus the six
    // guarded heads as the fixture's own negative control (60 rows, counted separately).
    const unguarded = GA_IDENTS.filter((i) => !GA_GUARDED.includes(i));
    for (const head of unguarded)
        for (const body of GA_BODIES)
            rows.push(row(P, "ground-a", `${head}(${body})`, cite("§8 D-5 · denominator.test.ts:141-151")));
    for (const head of GA_GUARDED)
        for (const body of GA_BODIES)
            rows.push(row(P, "ground-a-guarded", `${head}(${body})`, cite("denominator.test.ts — the guarded control")));

    // §10.2 P:timing-function, whole — all four CssTimingFunction kinds.
    const T = "P:timing-function";
    for (const s of ["linear", "ease", "ease-in", "ease-out", "ease-in-out"])
        rows.push(row(T, "timing-keyword", s, cite("§10.2 R_kw timing-keyword (5)")));
    for (const s of ["step-start", "step-end"])
        rows.push(row(T, "step-alias", s, cite("§10.2 R_kw step-alias (2)")));
    for (const s of ["cubic-bezier(0.1, 0.7, 1, 0.1)", "cubic-bezier(0,0,1,1)", "cubic-bezier(1.5, 0, 1, 1)"])
        rows.push(row(T, "cubic-bezier", s, cite("§10.2 guard x1,x2 ∈ [0,1]")));
    for (const s of [
        "steps(4)", "steps(4, jump-start)", "steps(4, jump-end)", "steps(4, jump-none)",
        "steps(4, jump-both)", "steps(4, start)", "steps(4, end)", "steps(1, jump-none)", "steps(0)",
        "steps(1.5)",
    ])
        rows.push(row(T, "steps", s, cite("§10.2 guards: integer ≥ 1; jump-none ⇒ ≥ 2; 6 spellings → 4 values")));
    for (const s of [
        "linear(0, 1)", "linear(0, 0.5 50%, 1)", "linear(0, 0.5 25% 75%, 1)", "linear(0)",
    ])
        rows.push(row(T, "linear-function", s, cite("§10.2 REP linear-stop 2 ∞")));
    for (const s of ["", "nosuch", "steps()", "cubic-bezier()", "linear()"])
        rows.push(row(T, "malformed", s, cite("§10.2 rejection rows · EQ-6")));

    // §10.3 P:stylesheet — the malformed qualified rule, the recovery scenario.
    const S = "P:stylesheet";
    rows.push(row(S, "positive-control", "a{color:red}", cite("§10.3 positive control (ok:true)")));
    rows.push(row(S, "positive-control", "A { Color : RED !important }", cite("§10.3 name folded, selectors preserved")));
    rows.push(row(S, "positive-control", "a, b { color: #abc }", cite("§10.3 selectors split on top-level comma")));
    rows.push(row(S, "recovery", "a { color: red } GARBAGE ) ; b { color: blue }", {
        ...cite("§10.3 the scenario, verbatim"),
        plantedSites: 1,
    }));
    // R-LAW-4 non-amplification: N planted sites ⇒ exactly N issues, N ∈ {1,2,3,5,8}.
    for (const n of [1, 2, 3, 5, 8]) {
        const garbage = Array.from({ length: n }, (_, k) => `GARBAGE${k} ) ;`).join(" ");
        rows.push(row(S, "recovery-n", `a { color: red } ${garbage} b { color: blue }`, {
            ...cite("§7 R-LAW-4 — N sites ⇒ N issues"),
            plantedSites: n,
        }));
    }
    // R-LAW-4 progress: a sync that matches zero bytes at the failure offset.
    rows.push(row(S, "recovery-zero-sync", "a { color: red } ; b { color: blue }", {
        ...cite("§7 R-LAW-4 — a sync matching at offset 0 must not re-enter"),
        plantedSites: 0,
    }));
    for (const s of ["", "   ", "a{}", "a{color:red;}", "a{color:red;;}"])
        rows.push(row(S, "edge", s, cite("§10.3 REP/OPT edges")));

    // G-11's deep-nesting row: `var(var(...))` past 10,000 — the depth bound by construction.
    rows.push(row(P, "deep-nesting", `var(${"var(".repeat(10000)}--x${")".repeat(10000)})`, {
        ...cite("§6 G-11 · §11 DM-5 (Θ.depthBound = 64)"),
        generated: "var( x 10000",
    }));

    return rows;
}

/* ── DECLARED third-cell divergence rows (`ALGEBRA.md` §10.5 (a)..(k)) ─────────────────────── */

const THIRD_CELL_DECLARED = [
    { key: "a", what: "issue spans — Π [far.f, len(S)) and RECOVER [m, m+skip) vs the incumbent's [0, len(S))", cite: "DM-6 · grammar.ts:50-51" },
    { key: "b", what: "legacy 4-arg rgba(1, 2, 3, 0.5) / hsla(…) — the incumbent REJECTS", cite: "band GAP P-012/P-015" },
    { key: "c", what: "clamps — the incumbent is unclamped and rejects alpha > 1 where §4.2 clamps", cite: "§10.5 (c)" },
    { key: "d", what: "the seven unsound accepts the incumbent admits and the algebra rejects", cite: "band L86-95" },
    { key: "e", what: "juxtaposition — the incumbent rejects all three rows; the band's reading accepts", cite: "DM-2" },
    { key: "f", what: "1e400 — the incumbent rejects outright; the algebra clamps where a clamp exists", cite: "DM-3" },
    { key: "g", what: "R6 bare-number hsl s/l — the incumbent reads [120, 50, 50]", cite: "DM-7" },
    { key: "h", what: "named expectations where the incumbent has expected: [] (6 of 25) or a ColorIssue code in the label slot", cite: "D-1" },
    { key: "i", what: "W1 R-9: A-F2 color-mix() (incumbent rejects; slice rejects with <color>) · D-F2 @@@ { } (incumbent accepts as unknown; @-preludes are OUTSIDE the slice corpus, so the row is DECLARED, never compared)", cite: "X-P-W1.md R-9 · §10.3 restriction" },
    { key: "j", what: "recovery — N sites give the incumbent 1 issue and the algebra N", cite: "§10.3" },
    { key: "k", what: "trailing_input where the incumbent reports css_syntax (`red x`)", cite: "OP-07" },
];

/* ── the R1 corpus (172 + the 7-value JS boundary) ─────────────────────────────────────────── */

function r1Rows() {
    const set = new Set(R1_BASE);
    for (const n of R1_NAMES) for (const b of R1_BODIES) set.add(n + b);
    const inputs = [...set].map((src, i) => ({ id: `r1-${i}`, src }));
    if (inputs.length !== 172) throw new Error(`HALT: R1 corpus is ${inputs.length}, not 172`);
    return inputs;
}

/* ── assembly ─────────────────────────────────────────────────────────────────────────────── */

function build() {
    const rows = sliceRows();
    const byFamily = {};
    for (const r of rows) byFamily[r.family] = (byFamily[r.family] ?? 0) + 1;
    const byProd = {};
    for (const r of rows) byProd[r.prod] = (byProd[r.prod] ?? 0) + 1;

    const slice = {
        schema: "x-p-w2.g.slice/1",
        note: "DERIVED BY SCRIPT (build-corpus.mjs). Never hand-edit: `--check` re-derives and exits non-zero on any disagreement. Rows carry inputs and declarations ONLY — no expected values anywhere (self-authored answer keys are PRUNED, W2.md §5 .g).",
        contract: "experiments/w2/contract/ALGEBRA.md §10 (the shared slice) · §10.5 (the declared third-cell rows)",
        restrictions: [
            "rule := qualified-rule — an input whose stylesheet prelude begins with '@' is OUTSIDE this corpus (§10.3)",
            "value-slice := colour — a declaration whose value is not a colour is OUTSIDE this corpus (§10.3)",
        ],
        counts: { rows: rows.length, byProd, byFamily, groundA: byFamily["ground-a"] ?? 0 },
        thirdCellDeclared: THIRD_CELL_DECLARED,
        rows,
    };

    const inputs = r1Rows();
    const r1 = {
        schema: "x-p-w2.g.r1/1",
        note: "DERIVED BY SCRIPT from the same NAMES/BODIES/base data as audit/probes/r1-published-totality.mjs:38-43, transcribed as data so the count is comparable to the probe's, not merely similar.",
        counts: { inputs: inputs.length, boundary: BOUNDARY_7.length, calls: inputs.length + BOUNDARY_7.length },
        publishedBaseline: {
            source: "parser-band.md L23-31 (re-confirmed 2026-07-27) · X-P-W2.md §B.1 at value.js HEAD",
            parseCssColorThrows: "102/172",
            boundaryThrows: "7/7",
            probeHeader: "324 throws / 1548 calls across the nine public parsers",
            boundaryFailureMode:
                "distinct from R1's: `TypeError: … reading 'trim'` / `e.trim is not a function` (measured at the vendored 4.0.0). The 324/1548 header counts the 172 string rows only, where the single mode is `reading 'replace'`.",
        },
        inputs,
        boundary: BOUNDARY_7,
    };

    const fuzz = {
        schema: "x-p-w2.g.fuzz-seed/1",
        note: "THE PIN, not the rows: 30,000 rows are regenerated deterministically by fuzz-gen.mjs from this seed. rowsSha256 is the assertion that a replay produced the same corpus.",
        ...FUZZ_PIN,
        rowsSha256: sha256(generateFuzzRows().map((r) => r.src).join(" ")),
    };

    return { slice, r1, fuzz };
}

const files = build();
const out = (name, obj) => [path.join(HERE, name), JSON.stringify(obj, null, 4) + "\n"];
const targets = [out("slice.json", files.slice), out("r1.json", files.r1), out("fuzz-seed.json", files.fuzz)];

if (process.argv.includes("--check")) {
    let bad = 0;
    for (const [p, body] of targets) {
        const disk = readFileSync(p, "utf8");
        const same = disk === body;
        if (!same) bad++;
        console.log(`${same ? "ok  " : "RED "} ${path.basename(p).padEnd(16)} ${same ? "matches a fresh derivation" : "DIFFERS from a fresh derivation"}  sha256(derived)=${sha256(body).slice(0, 16)}…`);
    }
    console.log(
        `\nslice rows ${files.slice.counts.rows} · GROUND-A ${files.slice.counts.groundA} (21 x 10) · ` +
            `R1 inputs ${files.r1.counts.inputs} + boundary ${files.r1.counts.boundary} · ` +
            `fuzz ${files.fuzz.rows} rows @ seed ${files.fuzz.seed}`,
    );
    process.exit(bad === 0 ? 0 : 1);
}

for (const [p, body] of targets) {
    writeFileSync(p, body);
    console.log(`wrote ${path.basename(p).padEnd(16)} ${body.length} B  sha256 ${sha256(body)}`);
}
console.log(
    `slice rows ${files.slice.counts.rows} · GROUND-A ${files.slice.counts.groundA} · ` +
        `R1 ${files.r1.counts.inputs} + ${files.r1.counts.boundary} · fuzz ${files.fuzz.rows} @ seed ${files.fuzz.seed}`,
);
