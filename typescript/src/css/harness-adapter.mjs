// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.d — AC-1 TAGLESS-TWIN · THE ADAPTER. One harness, all candidates (`harness/w2/README.md`):
// this file is the ONLY thing the probes know about the candidate, and it adds no behaviour — it
// names three source lists, three artifacts, the declared postures and the two lowerings.
//
// THE POSTURES ARE DECLARED HERE, BEFORE A NUMBER IS TAKEN (FF-4). A posture written after the
// measurement is a description of the result; these were written against the design and are left
// standing whatever the gates say.

import path from "node:path";
import { fileURLToPath } from "node:url";

import { makeJsLowering } from "./lowering-js/index.mjs";
import { makeWasmLowering } from "./lowering-wasm/index.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const at = (...p) => path.join(HERE, ...p);

export const meta = {
    id: "ac1",
    name: "TAGLESS-TWIN",
    postures: {
        lowering: "FULL — the whole §10 slice is compiled to Wasm; no JS combinator runs inside a Wasm parse (not leaf-wasm)",
        boundary: "ONE crossing per parse: the source is written in as bytes, `run` is one call, `V` is materialized out of the arena on the way out",
        spans: "code-unit indices in BOTH lowerings; a code unit >= 128 is written as 0xFF (the `any-but-*` marker) and a span's TEXT is read back from the original string, never re-encoded",
        simd: "scalar only — no `v128`, no feature detection, one module for every host",
        memory: "a fixed 12 MB linear memory; no `memory.grow` anywhere, and every journal append is bounds-checked against its region",
        arenaCoordinate: "marks report `arena = 0` in BOTH lowerings (ALGEBRA.md line 238 and §6 EQ-5: 'the JS lowering reports arena = 0'); the Wasm arena IS truncated exactly on every restore and its watermark rides `arenaHighWater()`",
        numbers: "the decimal→f64 conversion is correctly rounded in Wasm (192-bit table, round-half-even, exact-dyadic path) and FLAGS the case it cannot decide rather than guessing",
        freeze: "DM-1: `ENTRY` deep-freezes `V` on success in both lowerings; no constructor freezes",
        grammar: "`grammar()` is the TERM instantiation of the same authored grammar in both lowerings — one grammar file, three instantiations (terms, JS, Wasm)",
    },
    sources: {
        algebra: [at("algebra/ops.mjs"), at("algebra/tables.mjs"), at("algebra/grammar.mjs"), at("reify/term-alg.mjs")],
        js: [at("lowering-js/js-alg.mjs"), at("lowering-js/values.mjs"), at("lowering-js/index.mjs")],
        wasm: [
            at("lowering-wasm/asm.mjs"), at("lowering-wasm/layout.mjs"), at("lowering-wasm/runtime.mjs"),
            at("lowering-wasm/wasm-alg.mjs"), at("lowering-wasm/index.mjs"),
        ],
    },
    artifacts: {
        jsEntry: at("build/ac1.js"),
        dts: at("build/ac1.d.ts"),
        wasm: at("build/ac1.wasm"),
    },
    build: {
        // R-i1 (X.P.W2 K.8, INFO; owner "W3's open seat"), re-pointed here. `.i` carried the
        // candidate-location command UNALTERED on purpose — §11.2 permitted relative-*import*
        // adjustments only, and a declared build command is not an import — and it stayed true at
        // the candidate directory. At W3 the graduated tree is the tree of record, and the command a
        // reader must run to reproduce THESE bytes is this one: X.P.W3.0 measured it regenerating
        // `ac1.wasm`/`ac1.js`/`ac1.d.ts` at `<p2>` and re-running it byte-identically (K-9's
        // reproduction leg; `wasm-audit.mjs` prints this string verbatim). Still `node` and nothing
        // else — no non-JS toolchain is named or reached.
        jsArtifactReproduction: ["node typescript/src/css/build.mjs"],
    },
};

export const lowerings = {
    js: makeJsLowering(),
    wasm: makeWasmLowering(),
};
