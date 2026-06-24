// PT-Q1 gate — proof:packrat-reentrant (the SHIPPED DEFECT, born-RED).
//
// 0.12.0's cross-input fix moved the src-epoch reset INSIDE memoizeFn, firing
// per-node whenever `state.src !== CURRENT_SRC`. A memoized left-recursive parser
// whose `.map` runs a NESTED top-level `.parse(differentSrc)` mid-grow then wiped
// the OUTER grow's module-global state (`resetPackrat()` clears MEMO/HEADS/
// GROWING/LR_STACK) → `growLR`'s `MEMO.get(key)!.ans` non-null assertion read
// `undefined` → a `TypeError` thrown out of the PUBLIC `.parse()` API. This is a
// throw, not a stale answer — a real re-entrancy correctness regression.
//
// The cure (PT-Q1): open a fresh packrat epoch at the parseState ENTRY boundary
// (packratEnter/packratExit) with a try/finally unwind. The nested parse runs with
// its OWN clean tables and restores the parent's snapshot on return, so the outer
// grow resumes against its own un-wiped MEMO — re-entrancy SOUND.
//
// OBSERVABLE-TRUTH: exercises the REAL built barrel (dist/parse.js) — the public
// `memoize`/`regex`/`Parser`. Born-RED: on the per-node-reset tree the nested
// clause throws `TypeError`. GREEN: the outer parse returns its own result AND the
// nested parse returns its own result, neither throwing nor cross-polluting.
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

const { memoize, regex, Parser, resetPackrat } = await import(distEntry);

const fails = [];

// (1) The re-entrancy BLOCKER: a nested memoize().parse(differentSrc) inside a
// left-recursive grow must NOT throw and must return the correct OUTER result.
{
    resetPackrat();
    const innerDigits = regex(/[0-9]+/);
    const inner = memoize(Parser.lazy(() => inner.or(innerDigits)));

    let nestedResult;
    const letter = regex(/[a-z]/).map((c) => {
        // Reentrant nested top-level parse of a DIFFERENT src, mid grow.
        nestedResult = inner.parse("98765");
        return c;
    });
    // A genuinely-left-recursive memoized grammar that GROWS over the letters:
    // `outer = outer letter | letter`, concatenating each — the grow re-evaluates
    // the head, the exact mid-grow window the per-node reset wiped.
    const outer = memoize(
        Parser.lazy(() =>
            outer
                .then(letter)
                .map(([acc, c]) => acc + c)
                .or(letter),
        ),
    );

    let outerResult;
    let threw = null;
    try {
        outerResult = outer.parse("abcde");
    } catch (e) {
        threw = e;
    }

    if (threw !== null) {
        fails.push(
            `RE-ENTRANCY THROW: a nested memoize().parse('98765') inside the outer ` +
                `grow threw ${threw && threw.constructor ? threw.constructor.name : threw} ` +
                `(${threw && threw.message}) — the per-node packrat reset wiped the ` +
                `outer grow's in-progress cells`,
        );
    }
    if (threw === null && outerResult !== "abcde") {
        fails.push(
            `RE-ENTRANCY WRONG-ANSWER: outer parse expected 'abcde', got ${JSON.stringify(outerResult)}`,
        );
    }
    if (threw === null && nestedResult !== "98765") {
        fails.push(
            `RE-ENTRANCY NESTED WRONG-ANSWER: nested parse expected '98765', got ${JSON.stringify(nestedResult)}`,
        );
    }
}

// (2) The outer parse resumes correctly after the nested parse returns — no
// cross-input pollution in EITHER direction.
{
    resetPackrat();
    const innerWord = memoize(regex(/[a-z]+/));
    let innerOk = true;
    const numbers = regex(/[0-9]+/).map((n) => {
        if (innerWord.parse("hello") !== "hello") innerOk = false;
        return n;
    });
    const outerNum = memoize(Parser.lazy(() => outerNum.or(numbers)));

    let r, threw = null;
    try {
        r = outerNum.parse("4242");
    } catch (e) {
        threw = e;
    }
    if (threw !== null) {
        fails.push(`RESUME THROW: outer digit parse with a nested word parse threw ${threw && threw.message}`);
    }
    if (threw === null && r !== "4242") {
        fails.push(`RESUME WRONG-ANSWER: outer parse expected '4242', got ${JSON.stringify(r)}`);
    }
    if (!innerOk) {
        fails.push("RESUME: the nested innerWord.parse('hello') did not return 'hello'");
    }
    // The inner parser, run standalone afterwards, must be unpolluted.
    if (innerWord.parse("world") !== "world") {
        fails.push("RESUME: innerWord.parse('world') after the outer epoch returned a stale value");
    }
}

// (3) Vacuity guard — a plain non-re-entrant memoized parse still works (proves
// the gate exercises a LIVE path, not a tautology).
{
    resetPackrat();
    const w = memoize(regex(/[a-z]+/));
    if (w.parse("plain") !== "plain") {
        fails.push("VACUITY: a plain memoized parse must still return its value");
    }
}

if (fails.length > 0) {
    console.error("FAIL: proof:packrat-reentrant — the packrat re-entrancy regression bit:");
    for (const f of fails) console.error("  • " + f);
    process.exit(1);
}

console.log(
    "PASS: proof:packrat-reentrant — a nested .parse(differentSrc) mid-grow is " +
        "re-entrancy SOUND (parseState-entry epoch + try/finally unwind); no throw, " +
        "correct outer + nested results, zero cross-input pollution.",
);
