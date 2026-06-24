// PT-Q3 gate — proof:no-dead-combinator (the no-legacy DELETE, born-RED).
//
// parse-that 0.12.0 shipped two zero-consumer speculative fusion seams that
// contradict its OWN substrate-deadcode precept:
//   • `thenMap` (parser.ts) — a `then()+map(f)` fusion Parser method, born 0.12.0
//     with ZERO callers anywhere; value.js writes no `.then().map()` chains.
//   • `fuse` (leaf.ts) — byte-identical to `all()`, NOT in the barrel (unreachable
//     from the package root), ZERO consumers.
//
// A never-importable export is not part of the public contract; an export born
// one prior tranche with zero workspace consumers is dead by the precept. 0.13.0
// DELETES both. This gate greps the parse-that SOURCE surface (the definitions)
// AND the constellation consumer trees (parse-that / value.js / keyframes.js) and
// reds if any banned dead combinator is still defined.
//
// VACUITY GUARD: the gate must also confirm a known-LIVE export (`dispatch`) IS
// still defined — proving the grep machinery works and a false-green (e.g. a typo'd
// path matching nothing) cannot slip through.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const fails = [];

// ── The banned dead combinators: name → the source file that DEFINED it ──────
const banned = [
    { name: "thenMap", file: "src/parse/parser.ts" },
    { name: "fuse", file: "src/parse/leaf.ts" },
];

// A definition site: `function fuse`, `fuse<...>(`, `thenMap<...>(`, `thenMap(`.
function isDefined(src, name) {
    // match `function NAME`, `NAME<` (method/fn with type params), or `NAME(` as a
    // method/function definition — but NOT a bare mention in prose/comment.
    return new RegExp(`\\b(function\\s+${name}\\b|${name}\\s*<[^>]*>\\s*\\(|${name}\\s*\\()`).test(src);
}

for (const { name, file } of banned) {
    const path = resolve(root, file);
    const src = readFileSync(path, "utf8");
    if (isDefined(src, name)) {
        fails.push(`dead combinator still DEFINED: \`${name}\` in ${file} — DELETE it (zero in-realm consumers)`);
    }
}

// ── Vacuity guard: a known-live export must still be defined ─────────────────
{
    const leaf = readFileSync(resolve(root, "src/parse/leaf.ts"), "utf8");
    if (!/\bexport function dispatch\b/.test(leaf)) {
        fails.push(
            "VACUITY: the known-live export `dispatch` is not defined in leaf.ts — the " +
                "gate's grep is broken (a false-green risk); fix the gate before trusting it",
        );
    }
}

// ── Cross-tree consumer sweep: no constellation source may import the banned ──
// names (a downstream that imported them between 0.12.0 and Q would block the
// delete; this confirms zero external consumers in the workspace).
const consumerTrees = [
    resolve(root, "src"),
    resolve(root, "test"),
    resolve(root, "../../value.js/src"),
    resolve(root, "../../keyframes.js/src"),
];
// We only flag IMPORTS / call-sites in OTHER files than the definition — a grep
// over the source dirs for `.thenMap(` or `fuse(` usage.
function walk(dir, acc) {
    if (!existsSync(dir)) return acc;
    for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name === "dist") continue;
        const p = resolve(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc);
        else if (/\.(ts|mjs|js)$/.test(name)) acc.push(p);
    }
    return acc;
}
for (const tree of consumerTrees) {
    for (const f of walk(tree, [])) {
        // Skip the (now-deleted) definition files themselves — already checked.
        const src = readFileSync(f, "utf8");
        if (/\.thenMap\s*\(/.test(src)) {
            fails.push(`consumer USE of deleted \`thenMap\`: ${f}`);
        }
        // `fuse(` as a call (not `fuseAll`, not the word in a comment) — require a
        // preceding import or a call that is not part of an identifier.
        if (/(^|[^A-Za-z0-9_])fuse\s*\(/.test(src) && /import[^;]*\bfuse\b/.test(src)) {
            fails.push(`consumer USE of deleted \`fuse\`: ${f}`);
        }
    }
}

if (fails.length > 0) {
    console.error("FAIL: proof:no-dead-combinator — zero-consumer dead combinators remain:");
    for (const f of fails) console.error("  • " + f);
    process.exit(1);
}

console.log(
    "PASS: proof:no-dead-combinator — `thenMap` + `fuse` are DELETED (zero in-realm " +
        "consumers); the known-live `dispatch` still present (vacuity holds).",
);
