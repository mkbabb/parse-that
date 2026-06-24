// PT-Q2 gate — proof:packrat-large-offset (the SHIPPED DEFECT, born-RED).
//
// `getCijKey` masked the offset with `& (2^20 − 1)` — 20 bits — so a source ≥ 2^20
// (1,048,576) chars silently aliased memo cells:
//   getCijKey(1, 2^20 + 3) === getCijKey(1, 3)
// because both offsets mask to 3. A memoized parse of a >1MB source then
// mis-restored cells from offsets exactly 1MB apart — a silent-wrong-answer
// residual. The cure (PT-Q2) widens the budget to a 2^32 span (offset added
// WHOLE, no mask) so any addressable source's offsets stay distinct, with a
// fail-loud guard at the float64-safe ceiling.
//
// OBSERVABLE-TRUTH: exercises the REAL built barrel (dist/parse.js) via the PUBLIC
// surface only — `memoize`/`regex`/`ParserState`. `getCijKey` is module-internal
// (not on the barrel), so the gate asserts the defect BEHAVIOURALLY: a memoized
// parse over a >1MB source must restore the high-offset token's OWN cell, not the
// offset-0 alias. Born-RED on the 20-bit-mask tree (the >1MB cell mis-restores the
// offset-0 cell). GREEN once the budget is widened.
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

const mod = await import(distEntry);
const { memoize, regex, ParserState, resetPackrat } = mod;

const fails = [];

const SPAN = 2 ** 20; // the OLD mask boundary (1,048,576)

// (1) Behavioural: a memoized parse over a >1MB source — the token at offset SPAN
// must restore its own cell, not the offset-0 alias.
{
    resetPackrat();
    const src = "a".repeat(SPAN) + "b" + "a".repeat(8);
    const letter = memoize(regex(/[ab]/));

    const st0 = new ParserState(src);
    st0.offset = 0;
    letter.parser(st0);
    if (st0.value !== "a") {
        fails.push(`BEHAVIOUR: offset-0 token expected 'a', got ${JSON.stringify(st0.value)}`);
    }

    const stB = new ParserState(src);
    stB.offset = SPAN;
    letter.parser(stB);
    if (stB.value !== "b") {
        fails.push(
            `BEHAVIOUR: offset-2^20 token expected 'b', got ${JSON.stringify(stB.value)} — ` +
                `the >1MB cell mis-restored the offset-0 'a' cell (20-bit alias)`,
        );
    }

    // Vacuity guard: a plain in-budget memoized parse still works (proves the gate
    // exercises a live path, not a tautology).
    const small = new ParserState("ba");
    small.offset = 0;
    memoize(regex(/[ab]/)).parser(small);
    if (small.value !== "b") {
        fails.push("VACUITY: a plain in-budget memoized parse must return its value");
    }
}

if (fails.length > 0) {
    console.error("FAIL: proof:packrat-large-offset — the >1MB offset budget aliases memo cells:");
    for (const f of fails) console.error("  • " + f);
    process.exit(1);
}

console.log(
    "PASS: proof:packrat-large-offset — the memo offset budget no longer aliases " +
        "cells 2^20 apart; a >1MB memoized parse restores distinct cells (offset " +
        "added whole, fail-loud at the float64-safe ceiling).",
);
