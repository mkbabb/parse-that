// proof:no-span-surface — the terminal *Span excision gate (S.H2; fold row 48, DQ-2).
//
// The 15 closure-based `*Span` builders (span.ts) were a zero-consumer published
// surface — deprecated with a 1.0.0 removal plan in 0.13.0 (PT-Q4). The 1.0.0 cut
// EXCISES them entirely (T6: an excision deletes the body, its tests, its gates,
// and its doc mentions). This gate is the terminal owner of "everything span is
// dead" — it SUPERSEDES both prior span gates:
//   • proof:span-surface-resolved (the *Span disposition gate) — its disposition
//     was "deprecate then remove in 1.0.0"; removal fulfills it, so it is deleted
//     and replaced here.
//   • proof:span-parser-killed (the A.W3 SpanParser introspection-KILL gate) — its
//     span.ts-scoped symbol scan is subsumed by span.ts no longer existing; its
//     orthogonal bench-absence + future-research.md falsification-record clauses
//     are folded in below so no coverage is lost.
//
// Born-RED against the pre-cut tree by construction: span.ts exists, the built
// dist exports the 15 *Span symbols, and the source barrel names them. GREEN only
// once span.ts is deleted, every *Span export is removed from the barrel, and the
// dist is rebuilt clean. OBSERVABLE-TRUTH: clause (2) reads the BUILT dist (the
// surface a consumer imports), not a source grep — a source stub that leaves a
// `*Span` alias in the barrel is caught by the dist scan.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SPAN_BUILDERS = [
    "stringSpan", "regexSpan", "manySpan", "sepBySpan", "wrapSpan",
    "optSpan", "skipSpan", "nextSpan", "altSpan", "takeUntilAnySpan",
    "negateSpan", "peekSpan", "notSpan", "minusSpan", "lookAheadSpan",
];

const fails = [];

// ── (1) span.ts is deleted from source ──────────────────────────────────────
const spanPath = resolve(root, "src/parse/span.ts");
if (existsSync(spanPath)) {
    fails.push(`(1) src/parse/span.ts still exists — the 1.0.0 cut deletes it wholesale`);
}

// ── (2) the BUILT dist exports ZERO *Span symbols (runtime-tier surface) ─────
const distIndex = resolve(root, "dist/index.d.ts");
const distParse = resolve(root, "dist/parse.js");
if (!existsSync(distIndex) || !existsSync(distParse)) {
    fails.push(
        `(2) dist missing (${distIndex}, ${distParse}) — build before running ` +
            `proof:no-span-surface so the published surface can be scanned`,
    );
} else {
    const distTypes = readFileSync(distIndex, "utf8");
    const distJs = readFileSync(distParse, "utf8");
    const inTypes = SPAN_BUILDERS.filter((n) => new RegExp(`\\b${n}\\b`).test(distTypes));
    const inJs = SPAN_BUILDERS.filter((n) => new RegExp(`\\b${n}\\b`).test(distJs));
    if (inTypes.length > 0) {
        fails.push(`(2) dist/index.d.ts still declares *Span symbols: ${inTypes.join(", ")}`);
    }
    if (inJs.length > 0) {
        fails.push(`(2) dist/parse.js still exports *Span symbols: ${inJs.join(", ")}`);
    }
}

// ── (3) the source barrel names zero *Span symbols (source-side complement) ──
const barrel = readFileSync(resolve(root, "src/parse/index.ts"), "utf8");
const inBarrel = SPAN_BUILDERS.filter((n) => new RegExp(`\\b${n}\\b`).test(barrel));
if (inBarrel.length > 0) {
    fails.push(`(3) src/parse/index.ts still names *Span exports: ${inBarrel.join(", ")}`);
}

// ── (4) no SpanParser introspection symbol survives anywhere in src ─────────
// (subsumes proof:span-parser-killed clause 1 — now a whole-tree scan since the
// file that held them is gone). The A.W3 tagged-union tier stays dead.
const SPANPARSER_SYMBOLS = [
    "SpanParserKind", "callSpan", "spanParserToParser",
    "stringSpanNode", "regexSpanNode", "manySpanNode", "sepBySpanNode",
    "wrapSpanNode", "optSpanNode", "skipSpanNode", "nextSpanNode",
    "altSpanNode", "takeUntilAnyNode",
];
function walk(dir, acc) {
    if (!existsSync(dir)) return acc;
    for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name === "dist") continue;
        const p = resolve(dir, name);
        if (statSync(p).isDirectory()) walk(p, acc);
        else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
    }
    return acc;
}
const srcFiles = walk(resolve(root, "src"), []);
const survivingSymbols = [];
for (const f of srcFiles) {
    const src = readFileSync(f, "utf8");
    for (const sym of SPANPARSER_SYMBOLS) {
        if (new RegExp(`\\b${sym}\\b`).test(src)) {
            survivingSymbols.push(`${sym} (${f})`);
        }
    }
    if (/\bSpanParser\b/.test(src)) survivingSymbols.push(`SpanParser (${f})`);
}
if (survivingSymbols.length > 0) {
    fails.push(`(4) SpanParser introspection symbols survive: ${survivingSymbols.join(", ")}`);
}

// ── (5) the A.W3 falsification record stands (bench gone + docs paragraph) ──
// (subsumes proof:span-parser-killed clauses 2+3.)
const benchPath = resolve(root, "test/benchmarks/span-dispatch.bench.ts");
if (existsSync(benchPath)) {
    fails.push(`(5) test/benchmarks/span-dispatch.bench.ts A.W3 artifact still exists`);
}
const futureResearch = resolve(root, "../docs/future-research.md");
if (!existsSync(futureResearch)) {
    fails.push(`(5) ../docs/future-research.md missing — cannot verify the A.W3 falsification record`);
} else {
    const fr = readFileSync(futureResearch, "utf8");
    const records = [
        { pattern: /10.14%\s*SLOWER/i, label: "A.W3 ~10-14% SLOWER measurement" },
        { pattern: /KILLED|KILL/i, label: "KILLED disposition record" },
        { pattern: /P-inv-28/i, label: "P-inv-28 reference" },
        { pattern: /callSpan/, label: "callSpan falsification record" },
    ];
    for (const { pattern, label } of records) {
        if (!pattern.test(fr)) fails.push(`(5) future-research.md §7 missing: ${label}`);
    }
}

if (fails.length > 0) {
    console.error("FAIL: proof:no-span-surface — the *Span surface is not fully excised:");
    for (const f of fails) console.error("  • " + f);
    process.exit(1);
}

console.log(
    "PASS: proof:no-span-surface — span.ts deleted; the built dist + source barrel " +
        "export ZERO of the 15 *Span symbols; no SpanParser introspection symbol survives; " +
        "the A.W3 falsification record stands (bench gone + future-research.md §7 present).",
);
