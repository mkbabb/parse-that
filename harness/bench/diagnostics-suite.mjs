// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — THE QUARANTINE (W1.md §3 item 6, G-5).
//
//   $ node harness/bench/diagnostics-suite.mjs        # run from <p2>, its OWN process
//
// THIS FILE IS NEVER IMPORTED BY `bench.ts`, AND `bench.ts` IS NEVER IMPORTED BY THIS FILE.
// That separation is the gate.
//
// WHY. O-15 PT-01, read in the published dist: `diagnostics-*.js:14` gates `state.expected` on
// `diagnosticsEnabled && label`, and `packrat-entry-*.js:881` fires an UNCONDITIONAL
// `console.error` when diagnostics are enabled. The two are reachable only together, and
// `enableDiagnostics()` is process-global (arity 0) — there is no scoped posture. So a bench
// that arms diagnostics to inspect a failure pays an I/O cost AND a semantic change on the
// same parse path, in every later cell of that process. The cure is not "disable it
// afterwards" — that fails for the same structural reason the packrat latch does: process-
// global state, set once.
//
// It also holds the LATCH POSITIVE CONTROL. Arming the latch is exactly what a bench cell must
// never do, so the proof that the latch reader is a live read rather than a constant `false`
// has to happen somewhere the bench never enters. This is that somewhere.
//
// This suite WRITES TO STDERR ON PURPOSE — that is the coupling being demonstrated. Its stderr
// is evidence here and would be a G-5 failure inside the bench.

import { assertUnarmed, readLatches } from "./lib/latch.mjs";
import { packratChunkPath, PARSE_THAT_DIST } from "./lib/engines.mjs";
import { measureBoundary } from "./lib/boundary.mjs";
import { pathToFileURL } from "node:url";

const out = (s = "") => process.stdout.write(s + "\n");
let failures = 0;
const check = (ok, label, detail) => {
    if (!ok) failures++;
    out(`${ok ? "ok  " : "FAIL"} ${label.padEnd(56)} ${detail}`);
};

await import(pathToFileURL(packratChunkPath()).href);
await assertUnarmed("entry", 1);
const pt = await import(pathToFileURL(`${PARSE_THAT_DIST}/parse.js`).href);
const diag = await import(pathToFileURL(`${PARSE_THAT_DIST}/diagnostics.js`).href);
const readLatch = async () => (await readLatches()).find((r) => r.path === packratChunkPath()).armed;

out("X.P.W1.d — DIAGNOSTICS QUARANTINE + LATCH POSITIVE CONTROL");
out("SERVED MODEL: claude-opus-5[1m]");
out(`pid ${process.pid} · node ${process.version}`);
out();

// ── 1. DEBT-1, diagnostics OFF (the shipping default) ─────────────────────────────────────
// cand-F's reject(), verbatim from cand-f/color.ts:159-164 as the probe transcribes it.
const reject = (label) =>
    new pt.Parser((s) => {
        diag.mergeErrorState(s, label);
        s.isError = true;
        return s;
    });
const armF = pt.any(pt.string("red"), reject("<named-color>"));
const offExpected = armF.parseState("rebeccapurple").expected;
check(
    offExpected === undefined,
    "DEBT-1  labelled failure is a NO-OP with diagnostics off",
    JSON.stringify(offExpected),
);
check(
    !("label" in pt.Parser.prototype),
    "DEBT-1  Parser.prototype.label / .expected combinator",
    "absent",
);
check(
    diag.enableDiagnostics.length === 0,
    "DEBT-1  enableDiagnostics() is process-global (arity 0)",
    `${diag.enableDiagnostics.length} args — no scoped posture exists`,
);
out();

// ── 2. PT-01's coupling, MEASURED: arming the label also arms an I/O write ────────────────
// stderr is counted rather than described. The counter is installed, the parse runs, the
// counter is removed: nothing is suppressed, and the bytes are the evidence.
let stderrBytes = 0;
const realWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, ...rest) => {
    stderrBytes += Buffer.byteLength(typeof chunk === "string" ? chunk : chunk);
    return realWrite(chunk, ...rest);
};
diag.enableDiagnostics();
const onExpected = armF.parseState("rebeccapurple").expected;
process.stderr.write = realWrite;

check(
    onExpected !== undefined,
    "DEBT-1  the label DOES surface once diagnostics are armed",
    JSON.stringify(onExpected),
);
check(
    stderrBytes > 0,
    "PT-01   arming diagnostics couples an unconditional stderr write",
    `${stderrBytes} bytes on ONE labelled parse — inside the bench this is G-5's failure`,
);
diag.disableDiagnostics();
out();

// ── 3. the JS-boundary invariant, asserted above parse-that ───────────────────────────────
const b = measureBoundary((x) => pt.string("a").parseState(x));
check(b.rawThrows === 5, "PT-07   raw parseState(non-string) throws", `${b.rawThrows}/5 ${b.rawModes.join(",")}`);
check(b.holds, "§3.9   the guard makes the boundary total", `${b.guardedThrows}/5 throw; code ${b.guardedCodes.join(",")}`);
check(
    pt.string("a").parse("b") === undefined,
    "PT-07   .parse() failure signal",
    "returns undefined — indistinguishable from .opt()",
);
out();

// ── 4. THE LATCH POSITIVE CONTROL — the reader is a live read, not a constant ─────────────
const bench = () => {
    const g = pt.all(pt.regex(/[a-z]+/), pt.string("("), pt.regex(/[0-9. ]+/), pt.string(")"));
    const r = [];
    for (let i = 0; i < 50; i++) {
        const t = process.hrtime.bigint();
        for (let j = 0; j < 5000; j++) g.parseState("oklch(0.5 0.1 200)");
        r.push(Number(process.hrtime.bigint() - t) / 5000);
    }
    const s = r.slice(15).sort((a, c) => a - c);
    return s[s.length >> 1];
};

const before = await readLatch();
const unarmedNs = bench();
check(before === false, "LATCH   reader returns false before any memoize()", `${unarmedNs.toFixed(1)} ns/parse unarmed`);

pt.memoize(pt.string("some-other-grammar-entirely"));
const armed = await readLatch();
const armedNs = bench();
check(
    armed === true,
    "LATCH   memoize() FLIPS the reader false -> true",
    `${armedNs.toFixed(1)} ns/parse armed — the reader is a live read, not a constant`,
);

pt.resetPackrat();
const afterReset = await readLatch();
const resetNs = bench();
check(
    afterReset === true,
    "LATCH   resetPackrat() does NOT disarm (one-way)",
    `still ${resetNs.toFixed(1)} ns/parse — O-15 PT-03 reproduced in kind`,
);
out(
    `     ratio armed/unarmed ${(armedNs / unarmedNs).toFixed(2)}× (O-15 measured 1.47× on a different box-state; ` +
        `the ratio is the portable reading, never the bare ns).`,
);
out();

out(
    failures === 0
        ? "GREEN — the quarantine holds: the label is a no-op unless diagnostics are armed, arming them writes to stderr, and the latch reader is proved live in a process the bench never enters."
        : `RED — ${failures} expectation(s) failed.`,
);
process.exit(failures ? 1 : 0);
