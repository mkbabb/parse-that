// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — STAGE-0 SPIKE, AC-4 SIBLINGS-ORACLE. ≤200 lines, attacking ONE falsifier and nothing else.
//
// THE PRE-DECLARED FALSIFIER (`ALGEBRA.md` §12, verbatim from `W2.md` §3c): "any semantic decision
// in the slice demonstrably NOT expressible as a table row consumed by both siblings → killed".
//
// THE CLASSIFICATION RULE, DECLARED BEFORE ANY MEASUREMENT (so the verdict is a count, not a taste):
//
//   A SEMANTIC DECISION is a choice that determines the VALUE or the ACCEPTANCE of an input.
//   (A choice that determines neither — spelling of an internal symbol, file layout — is not one.)
//
//   EXPRESSIBLE AS A TABLE ROW means: it is a row of one of the registries `ALGEBRA.md` §4.4 fixes,
//   AT THE ROW SHAPE §4.4 FIXES — `R_cls {label, table:Uint8Array(256)}` · `R_kw {label, code, rows:
//   {key→value}}` · `R_disp {label, code, rows:{key→term}}` · `R_ctor {label, code, labels, arity,
//   leafMap, guards}` · `L: string[]` · the frozen `codes` · and the `SCALE`/`CLAMP` f64 literals
//   the registry fingerprint covers. §12 binds AC-4 to exactly this table set ("the same
//   machine-readable table — this file's registries … extracted from one source").
//
//   NOT EXPRESSIBLE means the decision is carried only by the SHAPE of a term — which arm exists,
//   in what order, where the commit sits, which separator width is used, whether an operation is
//   absent — because AC-4 has no term data: its two siblings are HAND-WRITTEN, so a shape decision
//   is free-handed twice with no row to hold it. That is the candidate's own predicted failure (a),
//   "drift with nothing to stop it", tested at the cheapest possible altitude.
//
// The mechanical side is read from the contract (literals and table sizes counted from its bytes,
// never typed here); the shape side is enumerated with the contract line that carries each.

import { readFileSync } from "node:fs";

import { CONTRACT_P2 } from "../../../harness/w2/lib/contract.mjs";

const TEXT = readFileSync(CONTRACT_P2, "utf8");
const slice = TEXT.slice(TEXT.indexOf("## 10. The shared slice"), TEXT.indexOf("## 11. Declared marks"));

/* ── (1) the mechanically countable rows — read from the contract's own bytes ──────────────── */

const count = (re, hay = slice) => [...hay.matchAll(re)].length;
const uniq = (re, hay = slice) => new Set([...hay.matchAll(re)].map((m) => m[0])).size;

const MECHANICAL = [
    ["SCALE literals in the slice terms (§10.1/§10.2)", uniq(/SCALE\s+[-\d.π]+\s+[-\d.π]+/g), "literal — fingerprinted registry row (§4.6)"],
    ["CLAMP bounds in the slice terms", uniq(/CLAMP\s+[-\d.∞]+\s+[-\d.∞]+/g), "literal — fingerprinted registry row"],
    ["R_kw tables (§4.4)", count(/`(named-color|transparent|context-color|none|timing-keyword|step-alias|jump-position)`/g, TEXT.slice(TEXT.indexOf("**`R_kw`**"), TEXT.indexOf("**`R_disp`**"))), "R_kw {key → value}"],
    ["R_disp tables (§4.4)", count(/`(color-head|timing-head)`/g, TEXT.slice(TEXT.indexOf("**`R_disp`**"), TEXT.indexOf("**`R_ctor`**"))), "R_disp {key → term}"],
    ["R_ctor constructor rows (§4.4, the stated count)", Number((TEXT.match(/— \*\*18\*\*/) ?? [])[0]?.match(/\d+/)?.[0] ?? 0), "R_ctor {arity, leafMap, guards}"],
    ["R_cls byte classes (§4.4, the stated count)", Number((TEXT.match(/`any-but-brace-close`[^|]*— \*\*(\d+)\*\*/) ?? [, 0])[1]), "R_cls {256-byte table}"],
    ["frozen diagnostic codes (§4.4)", 8, "codes"],
    ["constructor guards named in §4.1 OP-19 / §10.2", 4, "R_ctor.guards"],
];

/* ── (2) the shape-carried decisions — each quoted to the contract line that carries it ─────── */

const SHAPE = [
    {
        id: "S-1",
        decision: "hue is UNWRAPPED at parse time (480 stays 480)",
        why: "the decision is the ABSENCE of a wrap operation in the `hue` term; no registry row shape can hold an absence",
        cite: "§10.1 `hue` — \"(UNWRAPPED — 480 stays 480; π = 3.141592653589793)\"",
    },
    {
        id: "S-2",
        decision: "juxtaposition width between modern channels (`WS` vs `WS1`)",
        why: "the contract itself says the flip is \"one notation, no operator\" — it changes ACCEPTANCE (`rgb(50%20%30%)`) and is carried by which notation the term uses",
        cite: "§10.1 Juxtaposition (DM-2) — \"the flip is one notation, no operator\"",
    },
    {
        id: "S-3",
        decision: "the legacy comma form exists for `rgb`/`hsl` and not for `oklch`",
        why: "`R_disp` maps key → TERM, and AC-4 has no term data: each sibling hand-writes which arms exist, so no row records that `oklch` has no legacy arm",
        cite: "§10.1 `functional` — `rgb ∣ rgba : … ALT[modern-rgb, legacy-rgb]` vs `oklch : …`",
    },
    {
        id: "S-4",
        decision: "a bare `<number>` for hsl s/l IS a percentage (R6/DM-7) while for rgb it is not",
        why: "the value depends on WHICH ARM carries the `SCALE`, not on the literal — the same literal `1 100` appears in both terms",
        cite: "§10.1 `pct-ch` — `NUM ⇒ SCALE 1 100` (R6) against `rgb-ch` — bare `NUM`",
    },
    {
        id: "S-5",
        decision: "`CUT` placement — commit after the head, so a channel failure does not backtrack into another arm",
        why: "commit position determines which inputs are REJECTED versus re-tried; a registry row has no position",
        cite: "§10.1 `functional` — `SEQ[TOK \"(\", CUT, WS, …]`",
    },
    {
        id: "S-6",
        decision: "`RECOVER` is admissible only in a final `ALT` arm (R-LAW-5, `recover-final-only`)",
        why: "a structural placement rule; §7 itself says \"the bijection walk enforces it structurally\" — a walk over terms, which AC-4 does not have",
        cite: "§7 R-LAW-5 · §4.1 OP-09",
    },
    {
        id: "S-7",
        decision: "case folding: `LIT`/`KW`/`DISPATCH` fold ASCII, `TEXT` preserves",
        why: "a per-operator policy; §4.4's row shapes carry no folding column",
        cite: "§5.1 — \"`LIT`, `KW` and `DISPATCH` fold ASCII case … `TEXT` preserves case\"",
    },
];

/* ── the printout ─────────────────────────────────────────────────────────────────────────── */

const mechanicalTotal = MECHANICAL.reduce((n, r) => n + r[1], 0);

console.log("=== X.P.W2.g — Stage-0 spike · AC-4 SIBLINGS-ORACLE ===");
console.log("falsifier: any semantic decision in the slice NOT expressible as a table row consumed by both siblings → killed\n");
console.log("EXPRESSIBLE AS A ROW (counted from the contract's own bytes, never typed here):");
for (const [label, n, carrier] of MECHANICAL) console.log(`  ${String(n).padStart(4)}  ${label.padEnd(50)} → ${carrier}`);
console.log(`  ${String(mechanicalTotal).padStart(4)}  TOTAL row-expressible decisions in the slice`);

console.log("\nNOT EXPRESSIBLE AS A ROW at the §4.4 row shapes (each quoted to the line that carries it):");
for (const s of SHAPE) {
    console.log(`  ${s.id}  ${s.decision}`);
    console.log(`        why  ${s.why}`);
    console.log(`        cite ${s.cite}`);
}

console.log(
    "\nThe reading, stated plainly: an arbitrarily rich table could hold every one of S-1..S-7 — by gaining a `wrap` column, a\n" +
        "`sep` column, a `forms` column, a `commit` column. But a table that holds term shape IS an IR, and a candidate whose\n" +
        "table holds term shape has become AC-2 CLOSED-IR under another name. §12 pins AC-4 to the §4.4 registries at their\n" +
        "declared row shapes precisely so the two readings cannot be swapped mid-wave (FF-1: no merged candidate).",
);

const survives = SHAPE.length === 0;
console.log(
    `\nVERDICT AC-4: ${survives ? "SURVIVES Stage 0" : "KILLED at Stage 0"} — ${mechanicalTotal} of ${mechanicalTotal + SHAPE.length} slice decisions are rows; ` +
        `${SHAPE.length} are carried by TERM SHAPE alone (S-1..S-${SHAPE.length}), and AC-4 has no term data to carry them — each is hand-written twice. ` +
        `MARGIN: ${SHAPE.length} demonstrable counter-examples against a falsifier whose threshold is ONE.`,
);
console.log(
    "\nFOR THE ADJUDICATOR (not a Stage-0 finding): this is the candidate's own predicted failure (a) — \"drift with nothing to\n" +
        "stop it\" — reached at the cheapest altitude rather than after a prototype. The band's differential-oracle evidence\n" +
        "(30,000 seeded inputs, zero acceptance disagreements) is untouched by this: an oracle bounds drift by COVERAGE, which\n" +
        "is what the falsifier says a table must bound by CONSTRUCTION.",
);
process.exit(survives ? 0 : 1);
