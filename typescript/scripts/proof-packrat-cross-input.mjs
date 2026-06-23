// PT-B1 gate — proof:packrat-cross-input (the correctness BLOCKER).
//
// The packrat MEMO is module-global, keyed strictly on (id, offset) with NO
// source component. Before the src-epoch guard, a memoized parser re-run against
// a DIFFERENT source mis-restored the previous input's cells:
//   memoize(p).parse('hello')  then  the SAME parser .parse('world')  →  'hello'
// — a silent wrong answer in any hot re-parse session (value.js's parse LRU,
// kf's memoized timing-function parses) with zero caller fault.
//
// OBSERVABLE-TRUTH: this gate exercises the REAL built barrel (dist/parse.js) —
// the public `memoize`/`regex`/`all`/`string` — and asserts the cross-input
// result WITHOUT any resetPackrat() between parses. It is born-RED: on the
// pre-fix tree the second parse returns the first input's stale value.
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distEntry = resolve(root, "dist/parse.js");

if (!existsSync(distEntry)) {
    console.error("FAIL: dist/parse.js missing — build before running this gate.");
    process.exit(1);
}

const { memoize, regex, all, string } = await import(distEntry);

const fails = [];

// (1) The scalar BLOCKER: same memoized parser, two different inputs, no reset.
{
    const word = memoize(regex(/[a-z]+/));
    const a = word.parse("hello");
    const b = word.parse("world"); // NO resetPackrat() between
    const c = word.parse("hello"); // and back
    if (a !== "hello") fails.push(`scalar: first parse expected 'hello', got ${JSON.stringify(a)}`);
    if (b !== "world")
        fails.push(
            `scalar CROSS-INPUT POLLUTION: second parse expected 'world', got ${JSON.stringify(b)} (stale cache from the first input)`,
        );
    if (c !== "hello") fails.push(`scalar: third parse expected 'hello', got ${JSON.stringify(c)}`);
}

// (2) A composite memoized parser (more memo cells) re-memoizes across inputs.
{
    const num = regex(/[0-9]+/);
    const w = regex(/[a-z]+/);
    const pair = memoize(all(w, string("-"), num));
    const a = JSON.stringify(pair.parse("abc-123"));
    const b = JSON.stringify(pair.parse("xyz-789")); // NO reset between
    if (a !== JSON.stringify(["abc", "-", "123"]))
        fails.push(`composite: first parse expected ["abc","-","123"], got ${a}`);
    if (b !== JSON.stringify(["xyz", "-", "789"]))
        fails.push(`composite CROSS-INPUT POLLUTION: second parse expected ["xyz","-","789"], got ${b}`);
}

if (fails.length > 0) {
    console.error("FAIL: proof:packrat-cross-input — packrat cross-input pollution:");
    for (const f of fails) console.error("  • " + f);
    process.exit(1);
}

console.log("PASS: proof:packrat-cross-input — memoized parsers are input-safe with zero caller discipline (src-epoch auto-reset + float64-safe memo key).");
