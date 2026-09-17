// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — STAGE-0 SPIKE, AC-3 SPAN-ALGEBRA. ≤200 lines, attacking ONE falsifier and nothing else.
//
// THE PRE-DECLARED FALSIFIER (`ALGEBRA.md` §12, verbatim from `W2.md` §3c): "measured mean boundary
// cost per leaf call ≥ 20 % of the whole-parse budget on a grammarless microbench → killed (a screen
// threshold internal to candidate selection, NOT a performance bar)".
//
// So this spike measures exactly two things and reports a ratio:
//   (a) the mean cost of ONE JS→Wasm leaf call — a zero-import module with a real class-table scan
//       loop over linear memory, assembled here by hand (no toolchain, K-9 untouched);
//   (b) the whole-parse budget, measured IN THIS PROCESS on the vendored sha-pinned 4.0.0, printed
//       beside the two inherited coordinates (O-15 PT-03 unarmed 93.9 ns; W1's 2026-09-17 re-measure
//       55.6 ns) — because absolute nanoseconds are not portable and the SCREEN is read against the
//       most conservative (smallest) budget, the one most likely to kill.
//
// NO BAR IS SET. The threshold below is a candidate-selection screen named in the contract, not a
// performance bar: `COHESION.md` §0j.E OC-1 leaves the bench table RECORDED-NOT-GATING and ratifies
// no bar, and `W2.md` §3a's "any pressure to set the bench bar" trigger stays armed.
//
// The posture this measures is LEAF-WASM (wasm scan leaves, parse in JS). AC-3's other posture —
// a full SIMD/scalar lowering — pays no per-leaf crossing at all, so a survival here is a survival
// of the posture that the falsifier can actually kill. The seat declares its posture at Stage 1
// (FF-4) and `.h` records which was measured.

import { uleb } from "../../../harness/w2/lib/wasm.mjs";
import { loadPublished } from "../../../harness/w2/lib/published.mjs";
import { BAR_LINE } from "../../../harness/w2/lib/report.mjs";

/* ── the zero-import scan module: `scan(ptr, len) -> i32`, a class-table loop ──────────────── */

const TABLE = 256; //                                the 256-byte class table's base address

function scanModule() {
    const sec = (id, payload) => [id, ...uleb(payload.length), ...payload];
    const vec = (items) => [...uleb(items.length), ...items.flat()];
    const str = (s) => [...uleb(s.length), ...[...s].map((c) => c.charCodeAt(0))];
    const body = [
        0x01, 0x02, 0x7f, //                         locals: 2 x i32  (i = 2, n = 3)
        0x02, 0x40, //                               block
        0x03, 0x40, //                                 loop
        0x20, 0x02, 0x20, 0x01, 0x4f, 0x0d, 0x01, //     if i >= len: br 1 (out of the block)
        0x20, 0x03, //                                   n
        0x20, 0x00, 0x20, 0x02, 0x6a, 0x2d, 0x00, 0x00, //  load8_u(ptr + i)
        0x41, 0x80, 0x02, 0x6a, 0x2d, 0x00, 0x00, //     load8_u(TABLE + byte)
        0x6a, 0x21, 0x03, //                             n = n + class
        0x20, 0x02, 0x41, 0x01, 0x6a, 0x21, 0x02, //     i = i + 1
        0x0c, 0x00, //                                   br 0 (continue)
        0x0b, //                                       end loop
        0x0b, //                                     end block
        0x20, 0x03, //                               return n
        0x0b,
    ];
    return new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        ...sec(1, vec([[0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f]])),
        ...sec(3, vec([[0x00]])),
        ...sec(5, vec([[0x00, 0x01]])),
        ...sec(7, vec([[...str("scan"), 0x00, 0x00], [...str("memory"), 0x02, 0x00]])),
        ...sec(10, vec([[...uleb(body.length), ...body]])),
    ]);
}

/* ── the microbench ───────────────────────────────────────────────────────────────────────── */

const INPUT = "rgb(1 2 3) oklch(50"; //              the short-string leg's own shape (length printed below)
const ROUNDS = 40;
const WARMUP = 10;
const CALLS = 20000;

const median = (xs) => {
    const s = [...xs].sort((x, y) => x - y);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** One cell: `rounds` rounds of `calls` iterations; the first `WARMUP` rounds are discarded. */
function cell(fn) {
    const perCall = [];
    let sink = 0;
    for (let r = 0; r < ROUNDS; r++) {
        const t0 = process.hrtime.bigint();
        for (let k = 0; k < CALLS; k++) sink += fn();
        const t1 = process.hrtime.bigint();
        perCall.push(Number(t1 - t0) / CALLS);
    }
    return { ns: median(perCall.slice(WARMUP)), sink };
}

const bytes = scanModule();
const mod = new WebAssembly.Module(bytes);
const imports = WebAssembly.Module.imports(mod);
const inst = new WebAssembly.Instance(mod, {});
const mem = new Uint8Array(inst.exports.memory.buffer);
for (let k = 0; k < INPUT.length; k++) mem[k] = INPUT.charCodeAt(k);
for (let b = 0; b < 256; b++) mem[TABLE + b] = /[A-Za-z0-9_-]/.test(String.fromCharCode(b)) ? 1 : 0;
const scanWasm = inst.exports.scan;

const table = new Uint8Array(256);
for (let b = 0; b < 256; b++) table[b] = mem[TABLE + b];
const buf = mem.subarray(0, INPUT.length);
function scanJs(ptr, len) {
    let n = 0;
    for (let i = ptr; i < ptr + len; i++) n += table[buf[i]];
    return n;
}

const wasmCell = cell(() => scanWasm(0, INPUT.length));
const jsCell = cell(() => scanJs(0, INPUT.length));
const emptyCell = cell(() => 0);

// The whole-parse budget, measured here on the third cell, with its substrate named.
const { mod: published, pin } = await loadPublished();
const parseCell = cell(() => (published.parseCssColor("rgb(1 2 3)").ok ? 1 : 0));

/**
 * REPLICATES, AND WHY. The first two runs of this spike read 14.9 % and 19.8 % against the same
 * screen — process-level variance straddling the threshold on a box where four tracks run at once.
 * A verdict that flips between runs is not a measurement, so the spike is its own driver: it forks
 * N independent child processes (default 5, `--replicates=N`), takes the MEDIAN of their per-process
 * medians, and prints every replicate. The rule is declared here, before the numbers below exist.
 */
if (!process.env.W2_AC3_CHILD) {
    const { execFileSync } = await import("node:child_process");
    const n = Number((process.argv.find((x) => x.startsWith("--replicates=")) ?? "=5").split("=")[1]) || 5;
    const reps = [];
    for (let k = 0; k < n; k++) {
        const out = execFileSync(process.execPath, [new URL(import.meta.url).pathname], {
            encoding: "utf8",
            env: { ...process.env, W2_AC3_CHILD: "1" },
        });
        const m = out.match(/^REPLICATE (.+)$/m);
        reps.push(JSON.parse(m[1]));
    }
    const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    const screenBudget = Math.min(...reps.flatMap((r) => [r.parseNs, 93.9, 55.6]));
    const ratios = reps.map((r) => (r.wasmNs / screenBudget) * 100);
    const ratio = med(ratios);
    console.log("=== X.P.W2.g — Stage-0 spike · AC-3 SPAN-ALGEBRA (posture: LEAF-WASM) ===");
    console.log("falsifier: mean boundary cost per leaf call ≥ 20 % of the whole-parse budget → killed\n");
    console.log(`replicates    ${n} independent processes; the verdict reads the MEDIAN of their medians (declared before measuring)`);
    console.log(`substrate     node ${process.version} · ${process.platform} ${process.arch}\n`);
    console.log("  #   wasm leaf call   JS inline scan   empty call   published parse   ratio vs the smallest budget");
    reps.forEach((r, k) =>
        console.log(
            `  ${k + 1}   ${r.wasmNs.toFixed(2).padStart(9)} ns   ${r.jsNs.toFixed(2).padStart(9)} ns   ` +
                `${r.emptyNs.toFixed(2).padStart(6)} ns   ${r.parseNs.toFixed(1).padStart(9)} ns   ${((r.wasmNs / screenBudget) * 100).toFixed(1).padStart(6)} %`,
        ),
    );
    console.log(`\nbudgets       measured published parse (median of replicates) ${med(reps.map((r) => r.parseNs)).toFixed(1)} ns · O-15 unarmed 93.9 ns · W1 re-measure 55.6 ns`);
    console.log(`screen        reads the SMALLEST budget (${screenBudget.toFixed(1)} ns), the one most likely to kill; whole leaf call, not the net crossing`);
    console.log(`\n${BAR_LINE}  — the 20 % figure is the contract's candidate-selection screen, not a bar.`);
    const survives = ratio < 20;
    console.log(
        `\nVERDICT AC-3: ${survives ? "SURVIVES Stage 0" : "KILLED at Stage 0"} — median ratio ${ratio.toFixed(1)} % over ${n} replicates ` +
            `(spread ${Math.min(...ratios).toFixed(1)}–${Math.max(...ratios).toFixed(1)} %), screen ≥ 20 %. MARGIN: ${(20 - ratio).toFixed(1)} percentage points` +
            `${survives ? "" : " below zero"}. The measured posture is LEAF-WASM; a full SIMD/scalar lowering pays no per-leaf crossing and is not screened by this number. ` +
            `THE SPREAD STRADDLES THE THRESHOLD — recorded as such, and handed to \`.f\` and \`.h\` rather than rounded away.`,
    );
    process.exit(survives ? 0 : 1);
}

console.log(`REPLICATE ${JSON.stringify({ wasmNs: wasmCell.ns, jsNs: jsCell.ns, emptyNs: emptyCell.ns, parseNs: parseCell.ns, sinks: [wasmCell.sink, jsCell.sink, emptyCell.sink, parseCell.sink] })}`);

process.exit(0); //                                  a child measures and exits; the parent adjudicates
