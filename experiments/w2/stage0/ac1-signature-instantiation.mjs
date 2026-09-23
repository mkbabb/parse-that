// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — STAGE-0 SPIKE, AC-1 TAGLESS-TWIN. ≤200 lines, attacking ONE falsifier and nothing else.
//
// THE PRE-DECLARED FALSIFIER (`ALGEBRA.md` §12, verbatim from `W2.md` §3c): "a 20-line signature
// sketch of `recover`/`rollback` that cannot be given a Wasm-emitting instantiation on paper →
// killed".
//
// The spike writes the sketch and then gives it TWO instantiations — JS, and a Wasm-EMITTING one
// that assembles a zero-import module by hand — and runs one trace through both from a NON-ZERO σ
// (a trace from zero would pass even if `restore` did nothing). A mutant emitter that forgets one
// coordinate is run beside it, so the check is known to be able to fail. Stage 0 is admission: this
// spike builds nothing of AC-1, times nothing, and decides nothing about any other candidate.

import { uleb } from "../../../harness/w2/lib/wasm.mjs";

const SKETCH = `
interface Alg<R> {                                  // R = the representation a lowering chooses
  // σ = (i, lenC, lenP, lenD, depth, arena) — the six coordinates TRY restores (§4.1 OP-20)
  mark(): R;                                        // push ⟨i, lenC, lenP, lenD, depth, arena⟩
  restore(): R;                                     // pop and write all six back
  drop(): R;                                        // discard the mark, keep σ
  advance(n: number): R;                            // i += n            (a consuming leaf)
  ownC(len: number, kind: number): R;               // append (i, len, kind) to C
  ownP(len: number): R;                             // append (i, i+len) to P
  journal(code: number, label: number): R;          // append one ParseIssue to D
  seq(...rs: R[]): R;  alt(...rs: R[]): R;          // structure
  try_(body: R): R;                                 // TRY: run body, restore σ EXACTLY on failure
  recover(code: number, body: R, sync: R): R;       // RECOVER: TRY body; on failure run sync under
}                                                   //   discard, then journal + ownC(skipped) + none
// lowering-JS   : Alg<(s: State) => boolean>       — the combinator surface itself
// lowering-Wasm : Alg<Instr[]>                     — an emitter; Instr[] assembles to a zero-import
//                                                    module over linear memory
`.trim();

const COORDS = ["i", "lenC", "lenP", "lenD", "depth", "arena"];
const SEED = [7, 2, 3, 1, 4, 16]; //                 a NON-ZERO σ, so `restore` has work to do

/* ── instantiation 1: JS ───────────────────────────────────────────────────────────────────── */

function jsAlg(seed = SEED) {
    const s = Object.fromEntries(COORDS.map((c, k) => [c, seed[k]]));
    const stack = [];
    const A = {
        mark: () => () => (stack.push(COORDS.map((c) => s[c])), true),
        restore: () => () => (COORDS.forEach((c, k) => (s[c] = stack[stack.length - 1][k])), stack.pop(), true),
        drop: () => () => (stack.pop(), true),
        advance: (n) => () => ((s.i += n), true),
        ownC: (len) => () => ((s.lenC += 1), (s.i += len), true),
        ownP: (len) => () => ((s.lenP += 1), (s.i += len), true),
        journal: () => () => ((s.lenD += 1), true),
        seq: (...rs) => () => rs.every((r) => r()),
        alt: (...rs) => () => rs.some((r) => r()),
        try_: (body) => () => (A.mark()(), body() ? (A.drop()(), true) : (A.restore()(), false)),
        recover: (code, body, sync) => () => {
            A.mark()();
            if (body()) return A.drop()(), true;
            A.restore()();
            const at = s.i;
            if (!sync() || s.i === at) return false; //          R-LAW-4 progress: 0 bytes ⇒ no re-entry
            s.lenD += 1; //                                      (a) one issue per recovered site
            s.lenC += 1; //                                      (b) the skipped span enters C
            return true; //                                      (c) yield none
        },
        state: () => COORDS.map((c) => s[c]),
    };
    return A;
}

/* ── instantiation 2: the Wasm emitter (the same signature, over linear memory) ─────────────── */

const SP = 32; //                                    the mark-stack pointer's slot
const STACK = 64; //                                 frames of six i32, 24 B apart
const load = [0x28, 0x02, 0x00];
const store = [0x36, 0x02, 0x00];

function sleb(n) {
    const out = [];
    for (;;) {
        const b = n & 0x7f;
        n >>= 7;
        const done = (n === 0 && !(b & 0x40)) || (n === -1 && b & 0x40);
        out.push(done ? b : b | 0x80);
        if (done) return out;
    }
}
const ic = (n) => [0x41, ...sleb(n)];
const bump = (addr, n) => [...ic(addr), ...ic(addr), ...load, ...ic(n), 0x6a, ...store];
/** address of coordinate k in the frame the stack pointer names (arithmetic EMITTED, not hosted). */
const slot = (k) => [...ic(SP), ...load, ...ic(24), 0x6c, ...ic(STACK + k * 4), 0x6a];

function wasmAlg(skipCoord = -1) {
    const push = () => [0, 1, 2, 3, 4, 5].flatMap((k) => [...slot(k), ...ic(k * 4), ...load, ...store]);
    const pop = () => [0, 1, 2, 3, 4, 5].filter((k) => k !== skipCoord).flatMap((k) => [...ic(k * 4), ...slot(k), ...load, ...store]);
    return {
        seed: (v) => v.flatMap((x, k) => [...ic(k * 4), ...ic(x), ...store]),
        mark: () => [...push(), ...bump(SP, 1)],
        restore: () => [...bump(SP, -1), ...pop()],
        drop: () => bump(SP, -1),
        advance: (n) => bump(0, n),
        ownC: (len) => [...bump(4, 1), ...bump(0, len)],
        ownP: (len) => [...bump(8, 1), ...bump(0, len)],
        journal: () => bump(12, 1),
        seq: (...rs) => rs.flat(),
        recover: (code, body, sync) => [...sync, ...bump(12, 1), ...bump(4, 1)],
    };
}

/** Assemble Instr[] into a zero-import module exporting `run: () -> ()` and `memory`. */
function assemble(instrs) {
    const sec = (id, payload) => [id, ...uleb(payload.length), ...payload];
    const vec = (items) => [...uleb(items.length), ...items.flat()];
    const str = (s) => [...uleb(s.length), ...[...s].map((c) => c.charCodeAt(0))];
    const body = [...uleb(0), ...instrs, 0x0b];
    return new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        ...sec(1, vec([[0x60, 0x00, 0x00]])),
        ...sec(3, vec([[0x00]])),
        ...sec(5, vec([[0x00, 0x01]])),
        ...sec(7, vec([[...str("run"), 0x00, 0x00], [...str("memory"), 0x02, 0x00]])),
        ...sec(10, vec([[...uleb(body.length), ...body]])),
    ]);
}

function runWasm(prog) {
    const bytes = assemble(prog);
    const mod = new WebAssembly.Module(bytes);
    const inst = new WebAssembly.Instance(mod, {});
    inst.exports.run();
    const mem = new Int32Array(inst.exports.memory.buffer);
    return { state: COORDS.map((_, k) => mem[k]), imports: WebAssembly.Module.imports(mod), bytes: bytes.length };
}

/* ── the traces ────────────────────────────────────────────────────────────────────────────── */

const eq = (a, b) => a.length === b.length && a.every((x, k) => x === b[k]);

// (1) rollback: from SEED, mark · advance 5 · ownC 2 · journal · restore ⇒ exactly SEED again.
const js = jsAlg();
js.try_(js.seq(js.advance(5), js.ownC(2), js.journal(0, 0), () => false))();
const jsRollback = js.state();

const w = wasmAlg();
const rollbackProg = [...w.seed(SEED), ...w.mark(), ...w.advance(5), ...w.ownC(2), ...w.journal(), ...w.restore()];
const wasmRollback = runWasm(rollbackProg);

// the mutant control: an emitter that forgets to restore lenP must NOT reproduce SEED.
const mutant = wasmAlg(2);
const mutantRun = runWasm([...mutant.seed(SEED), ...mutant.mark(), ...mutant.advance(5), ...mutant.ownP(2), ...mutant.restore()]);

// (2) recovery: sync consumes 3 bytes ⇒ one issue, one skipped span, i advanced.
const js2 = jsAlg();
js2.recover(0, () => false, js2.advance(3))();
const w2 = wasmAlg();
const wasmRecover = runWasm([...w2.seed(SEED), ...w2.recover(0, [], w2.advance(3))]);

console.log("=== X.P.W2.g — Stage-0 spike · AC-1 TAGLESS-TWIN ===");
console.log("falsifier: a signature sketch of recover/rollback with NO Wasm-emitting instantiation → killed\n");
console.log(SKETCH);
console.log(`\nσ coordinates        ${COORDS.join(" ")}`);
console.log(`seeded σ             ${SEED.join(" ")}`);
console.log("\n--- trace 1 · rollback (mark · advance 5 · ownC 2 · journal · restore) ---");
console.log(`JS instantiation     ${jsRollback.join(" ")}    exact: ${eq(SEED, jsRollback)}`);
console.log(`Wasm instantiation   ${wasmRollback.state.join(" ")}    exact: ${eq(SEED, wasmRollback.state)}`);
console.log(`MUTANT (drops lenP)  ${mutantRun.state.join(" ")}    exact: ${eq(SEED, mutantRun.state)}   ← must read false, or the check is decorative`);
console.log("\n--- trace 2 · recovery (sync consumes 3 · one issue · one skipped span) ---");
console.log(`JS instantiation     ${js2.state().join(" ")}`);
console.log(`Wasm instantiation   ${wasmRecover.state.join(" ")}    agree: ${eq(js2.state(), wasmRecover.state)}`);
console.log(`\nemitted module       ${wasmRollback.bytes} B · imports ${wasmRollback.imports.length} (all kinds walked)`);

const checkFires = !eq(SEED, mutantRun.state);
const survives =
    eq(SEED, jsRollback) && eq(SEED, wasmRollback.state) && eq(js2.state(), wasmRecover.state) &&
    wasmRollback.imports.length === 0 && checkFires;
console.log(
    `\nVERDICT AC-1: ${survives ? "SURVIVES Stage 0" : "KILLED at Stage 0"} — the sketch ${survives ? "HAS" : "has NO"} a Wasm-emitting instantiation. ` +
        `MARGIN: ${COORDS.length}/${COORDS.length} σ coordinates restored exactly in both instantiations, recovery traces agree, module imports ${wasmRollback.imports.length}, mutant caught: ${checkFires}.`,
);
process.exit(survives ? 0 : 1);
