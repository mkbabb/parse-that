// PT-Q4 gate — proof:span-surface-resolved (the *Span decision, born-RED).
//
// The 15 closure-based `*Span` builders (span.ts) are a zero-consumer published
// surface kept only to honor 0.12.0's BC-additive promise — a perpetual "kept for
// BC" punt that contradicts parse-that's own substrate-deadcode precept. PT-Q4
// gives it a TERMINAL disposition via two OR'd clauses:
//
//   (a) ADOPT — ≥1 value.js/keyframes.js source consumes a `*Span` builder (a real
//       hot-leaf consume), OR
//   (b) DEPRECATE — all 15 carry `@deprecated` + a removal-version note (a recorded
//       removal plan, not a forever-keep).
//
// DAG-resolution: parse-that publishes 0.13.0 BEFORE value.js's Q session runs, so
// clause (a) cannot be live at parse-that's own cut — value.js has not consumed
// yet. The self-contained terminal is therefore clause (b) by default: 0.13.0 ships
// the `@deprecated` tags, which GREENs this gate standalone. Clause (a) is the
// optional upgrade when value.js's coordinated consume lands.
//
// Born-RED on the pre-Q tree: neither clause holds (no consume, no @deprecated).
// GREEN on either arm. Plant-a-failure: strip the @deprecated tags (arm b) OR
// revert the consume (arm a) → the gate reds.
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

// ── Clause (a): does any value.js / keyframes.js source CONSUME a *Span builder? ─
function walk(dir, acc) {
    if (!existsSync(dir)) return acc;
    for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name === "dist") continue;
        const p = resolve(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc);
        else if (/\.(ts|tsx|mjs|js)$/.test(name)) acc.push(p);
    }
    return acc;
}

const consumerTrees = [
    resolve(root, "../../value.js/src"),
    resolve(root, "../../keyframes.js/src"),
];

const spanRe = new RegExp(`\\b(${SPAN_BUILDERS.join("|")})\\s*\\(`);
const consumed = [];
for (const tree of consumerTrees) {
    for (const f of walk(tree, [])) {
        const src = readFileSync(f, "utf8");
        const m = src.match(spanRe);
        if (m) consumed.push({ file: f, builder: m[1] });
    }
}
const armA = consumed.length > 0;

// ── Clause (b): do all 15 builders carry @deprecated + a removal-version note? ──
const spanSrc = readFileSync(resolve(root, "src/parse/span.ts"), "utf8");

// For each builder, find its `export function NAME` and confirm the JSDoc block
// immediately preceding it contains an `@deprecated` line WITH a removal-version
// note (a "removal in X.Y.Z" / "X.Y.Z" mention).
const missingDeprecation = [];
for (const name of SPAN_BUILDERS) {
    const defRe = new RegExp(`export function ${name}\\b`);
    const m = defRe.exec(spanSrc);
    if (!m) {
        missingDeprecation.push(`${name} (export not found)`);
        continue;
    }
    // Look back up to ~700 chars for the preceding JSDoc @deprecated tag.
    const before = spanSrc.slice(Math.max(0, m.index - 700), m.index);
    const lastBlockStart = before.lastIndexOf("/**");
    const jsdoc = lastBlockStart === -1 ? "" : before.slice(lastBlockStart);
    const hasDeprecated = /@deprecated/.test(jsdoc);
    const hasRemovalNote = /removal in \d+\.\d+\.\d+|\b\d+\.\d+\.\d+\b/.test(jsdoc);
    if (!hasDeprecated || !hasRemovalNote) {
        missingDeprecation.push(
            `${name} (${!hasDeprecated ? "no @deprecated" : "no removal-version note"})`,
        );
    }
}
const armB = missingDeprecation.length === 0;

// ── Resolution: at least one arm must hold ──────────────────────────────────
if (!armA && !armB) {
    console.error(
        "FAIL: proof:span-surface-resolved — the *Span surface has NO terminal " +
            "disposition (neither consumed nor deprecated-with-plan):",
    );
    console.error(`  • arm (a) ADOPT: 0 value.js/kf consumers of any *Span builder`);
    console.error(
        `  • arm (b) DEPRECATE: ${missingDeprecation.length} builder(s) missing ` +
            `@deprecated+removal-note: ${missingDeprecation.join(", ")}`,
    );
    process.exit(1);
}

if (armA) {
    console.log(
        `PASS: proof:span-surface-resolved — arm (a) ADOPT: ${consumed.length} value.js/kf ` +
            `consume(s) of *Span (${[...new Set(consumed.map((c) => c.builder))].join(", ")}).` +
            (armB ? " (arm b deprecation also recorded for the un-consumed builders.)" : ""),
    );
} else {
    console.log(
        "PASS: proof:span-surface-resolved — arm (b) DEPRECATE: all 15 *Span builders " +
            "carry @deprecated + a removal-version note (recorded removal plan for 1.0.0); " +
            "no value.js/kf consume yet (the DAG default at parse-that's cut).",
    );
}
