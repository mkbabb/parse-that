// PT-B4 gate — proof:span-parser-killed (born-RED until the KILL lands).
//
// Verifies three invariants that together confirm the SpanParser introspection
// tier (A.W3 artifact, P-inv-28 resolved to KILL at Tranche B.W0) has been
// fully removed:
//
//   (1) No SpanParser tagged-union symbols remain in span.ts source:
//       SpanParserKind, SpanParser (the type), callSpan, spanParserToParser,
//       stringSpanNode, regexSpanNode, manySpanNode, etc.
//   (2) The span-dispatch.bench.ts A.W3 bench artifact is gone.
//   (3) The A.W3 falsification paragraph is present in future-research.md §7.
//
// The closure-based *Span builders (altSpan, manySpan, regexSpan, …) are NOT
// checked for absence — they are the canonical, published public API and must
// remain on the surface. This gate targets only the module-internal no-consumer
// introspection tier.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

let failed = false;

function fail(msg) {
    console.error(`FAIL: ${msg}`);
    failed = true;
}

// ── (1) SpanParser introspection symbols must not appear in span.ts ─────────

const spanSrc = readFileSync(resolve(root, "src/parse/span.ts"), "utf8");

const killedSymbols = [
    "SpanParserKind",
    "callSpan",
    "spanParserToParser",
    "stringSpanNode",
    "regexSpanNode",
    "manySpanNode",
    "sepBySpanNode",
    "wrapSpanNode",
    "optSpanNode",
    "skipSpanNode",
    "nextSpanNode",
    "altSpanNode",
    "takeUntilAnyNode",
];

for (const sym of killedSymbols) {
    // Match as a word boundary: the symbol appears as a standalone identifier.
    if (new RegExp(`\\b${sym}\\b`).test(spanSrc)) {
        fail(`SpanParser introspection symbol still present in span.ts: ${sym}`);
    }
}

// SpanParser as a type/export (but not as a substring of "spanParserToParser"
// which is already caught above). Check for the standalone type declaration.
if (/\bSpanParser\b/.test(spanSrc)) {
    fail("SpanParser type/tagged-union still present in span.ts");
}

// ── (2) span-dispatch.bench.ts must be gone ──────────────────────────────────

const benchPath = resolve(root, "test/benchmarks/span-dispatch.bench.ts");
if (existsSync(benchPath)) {
    fail("span-dispatch.bench.ts A.W3 bench artifact still exists — must be deleted");
}

// ── (3) A.W3 falsification paragraph must be in future-research.md §7 ────────

const futureResearch = readFileSync(
    resolve(root, "../docs/future-research.md"),
    "utf8",
);

// The paragraph must contain the key measured result and the KILLED record.
const checks = [
    { pattern: /10.14%\s*SLOWER/i, label: "A.W3 ~10-14% SLOWER measurement" },
    { pattern: /KILLED|KILL/i, label: "KILLED disposition record in §7" },
    { pattern: /P-inv-28/i, label: "P-inv-28 reference in §7" },
    { pattern: /callSpan/, label: "callSpan reference in §7 (falsification record)" },
];

for (const { pattern, label } of checks) {
    if (!pattern.test(futureResearch)) {
        fail(`future-research.md §7 is missing: ${label}`);
    }
}

// ── Result ───────────────────────────────────────────────────────────────────

if (failed) {
    process.exit(1);
}

console.log(
    "proof:span-parser-killed GREEN — SpanParser tagged-union + callSpan deleted from span.ts; " +
    "span-dispatch.bench.ts artifact gone; A.W3 falsification paragraph present in future-research.md §7.",
);
