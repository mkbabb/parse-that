// proof:packrat-armed — the retained-heap born-RED clause (S.H1, p11; fold row 49).
//
// ── WHAT IT ASSERTS (one clause) ─────────────────────────────────────────────
// After the PACKRAT_ARMED latch lands, N non-memoized default-path parses
// allocate ZERO packrat Maps: the epoch machinery (packratEnter / packratExit)
// is a TRUE NO-OP until a memoize()/mergeMemos() constructs the first memoized
// parser and arms the latch. On today's pre-arming tree packratEnter constructs
// THREE Maps (MEMO / HEADS / GROWING) on EVERY top-level parse, so N parses
// allocate 3N Maps → the flat-heap clause is BORN-RED. After arming, the same N
// non-memoized parses allocate flat (latch unarmed → enter/exit no-op) → GREEN.
//
// ── ISOLATION REQUIREMENT (sh-#3, BINDING) ───────────────────────────────────
// The flat-heap probe MUST run in a MEMOIZE-FREE process. Arming is a
// process-global latch that NEVER disarms: a single stray memoize() construction
// ANYWHERE in the process arms the latch, and every subsequent packratEnter then
// allocates its three Maps again — which would false-RED the flat probe. This
// script therefore constructs NO memoize() in its default (measuring) mode. The
// POISON self-check below spawns a SEPARATE child process that DOES construct a
// memoize() first, and asserts the machinery reallocates there — proving both
// that the isolation requirement genuinely bites AND that the Map counter is
// live (non-vacuity), without poisoning the main measurement.
//
// ── MEASUREMENT (runtime-tier, device-independent — T1) ──────────────────────
// The clause counts REAL Map constructions during the parse loop by subclassing
// the global Map before importing the built dist. The default non-memoized parse
// path constructs ZERO Maps outside packratEnter (the only per-parse `new Map`
// in the source is packratEnter's three), so the count over the loop is EXACTLY
// the packrat allocation: 3N on the pre-arming tree, 0 armed-unarmed. This is a
// flat-vs-growing assertion over actual allocation behavior — NOT an absolute
// ns/op or throughput-% threshold. The deliberate ABSENCE of a throughput-% gate
// is recorded in S §8-13 (probe-confirmed flake trap: workload-dependent, <2% on
// long strings). The heap clause reds honestly on any runner.

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distEntry = resolve(root, "dist/parse.js");

if (!existsSync(distEntry)) {
    console.error("FAIL: dist/parse.js missing — build before running proof:packrat-armed.");
    process.exit(1);
}

// The number of non-memoized default-path parses in the measuring window. Large
// enough that a 3-Map-per-parse allocation is unmistakable, small enough to be
// instant. The assertion is on the COUNT (exact), not on timing.
const N = 5000;
const POISON = process.env.PACKRAT_POISON === "1";

// ── Install the counting Map BEFORE importing the dist ───────────────────────
// A subclass of the real Map: identical semantics (every method inherited), plus
// a construction counter. The bundled dist resolves bare `new Map()` to the
// global binding, so this observes packratEnter's allocations exactly.
const RealMap = globalThis.Map;
let mapConstructions = 0;
class CountingMap extends RealMap {
    constructor(...args) {
        super(...args);
        mapConstructions++;
    }
}
globalThis.Map = CountingMap;

const { regex, string } = await import(distEntry);

// A representative short-value parse: a compound, multi-node default-path parse
// (the "short CSS value" workload shape). NON-memoized — no memoize() anywhere.
const value = regex(/[a-z]+/)
    .then(string(":").trim())
    .then(regex(/[0-9]+/))
    .then(string(";"));
const SRC = "width:42;";

// POISON mode (isolation self-check): construct a single memoize() BEFORE the
// measuring loop. This arms the process-global latch, so packratEnter must
// reallocate — the flat probe MUST see growth here. If it does NOT, either the
// latch is broken or the Map counter is dead; both are gate failures.
let memoizeUnavailable = false;
if (POISON) {
    try {
        const { memoize } = await import(distEntry);
        // Constructing the memoized wrapper is what arms the latch (construction,
        // not invocation) — we never even parse with it.
        memoize(regex(/[a-z]+/));
    } catch (e) {
        // Pre-arming trees have no arming to trigger, but memoize() still exists;
        // this only guards a hypothetical future where memoize is gone.
        memoizeUnavailable = true;
        void e;
    }
}

// Warm one parse OUTSIDE the window so any one-time lazy init (parser context,
// JIT) is excluded from the count. On the pre-arming tree this itself allocates
// three Maps — before the counting window opens.
value.parse(SRC);

// ── The measuring window ─────────────────────────────────────────────────────
const before = mapConstructions;
for (let i = 0; i < N; i++) {
    value.parse(SRC);
}
const during = mapConstructions - before;
const perParse = during / N;

if (POISON) {
    // The isolation self-check: with the latch ARMED by the stray memoize(), the
    // machinery MUST allocate (the flat probe would red). Passing here proves the
    // isolation requirement is real and the counter is live.
    if (memoizeUnavailable) {
        console.error(
            "FAIL(poison): memoize() could not be imported — cannot arm the latch to " +
                "prove the isolation self-check.",
        );
        process.exit(1);
    }
    if (during <= 0) {
        console.error(
            `FAIL(poison): with a memoize() armed, ${N} parses allocated ${during} Maps ` +
                `(expected > 0). Either the latch failed to arm on memoize() construction, ` +
                `or the Map counter is dead — the flat probe would be VACUOUS.`,
        );
        process.exit(1);
    }
    console.log(
        `PASS(poison): a stray memoize() arms the latch → ${N} parses allocate ${during} ` +
            `Maps (${perParse.toFixed(1)}/parse). The isolation requirement bites; the counter is live.`,
    );
    process.exit(0);
}

// ── Default (measuring) mode: the flat-heap clause ──────────────────────────
// (1) The born-RED / GREEN assertion: N non-memoized parses allocate flat.
if (during !== 0) {
    console.error(
        `FAIL: proof:packrat-armed — ${N} non-memoized parses allocated ${during} packrat ` +
            `Maps (${perParse.toFixed(1)}/parse; expected 0). The default parse path is NOT ` +
            `flat: packratEnter constructs MEMO/HEADS/GROWING on every parse even though ` +
            `nothing memoizes. Arm the epoch behind the PACKRAT_ARMED latch (S.H1).`,
    );
    process.exit(1);
}

// (2) Non-vacuity: spawn a memoize-armed child and confirm the machinery DOES
// allocate when armed. This proves the GREEN above is a genuine no-op, not a
// broken counter, AND that the memoize-free isolation is load-bearing.
const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    env: { ...process.env, PACKRAT_POISON: "1" },
    encoding: "utf8",
});
if (child.status !== 0) {
    console.error(
        "FAIL: proof:packrat-armed — the memoize-armed poison self-check did not observe " +
            "allocation, so the flat clause above is not trustworthy (counter dead or latch " +
            "not arming). Child output:\n" +
            (child.stdout || "") +
            (child.stderr || ""),
    );
    process.exit(1);
}

console.log(
    `PASS: proof:packrat-armed — ${N} non-memoized parses allocate FLAT (0 packrat Maps); ` +
        `packratEnter/packratExit are true no-ops until a memoize() arms the latch. ` +
        `Isolation self-check GREEN (an armed child DOES reallocate). ` +
        child.stdout.trim(),
);
