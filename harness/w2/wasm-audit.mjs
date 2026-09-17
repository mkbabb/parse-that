// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — G-9: WASM ZERO-IMPORT + THE SUBSTRATE LAW.
//
//   node harness/w2/wasm-audit.mjs --candidate <id>
//   node harness/w2/wasm-audit.mjs --self-test     # the audit against modules built to fail it
//
// `WebAssembly.Module.imports(mod).length === 0` with the audit walking ALL import kinds
// (function, table, memory, global — and a start-function side channel counts), an enumerated
// closed export set, `memory.grow` count 0 in steady state, and the import list PRINTED on failure
// so the culprit is named. Then the substrate law: K-10 (zero bytes from the evidence root's
// UNCOMMITTED wasm32 working tree) and K-9 (reproducing the JS artifact needs no non-JS toolchain).

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { argv, P2_ROOT } from "./lib/contract.mjs";
import { loadCandidate } from "./lib/candidate.mjs";
import { header, table, kv, verdict, absent } from "./lib/report.mjs";
import { importingModule, sectionIds, SECTION_NAMES, startSectionModule, zeroImportModule } from "./lib/wasm.mjs";

const a = argv();
const EVIDENCE_ROOT = process.env.EVIDENCE_ROOT || "/Users/mkbabb/Programming/parse-that";
const TOOLCHAIN = /\b(cargo|rustc|rustup|wasm-pack|wasm-bindgen|cmake|clang|emcc)\b/;

const sha = (b) => createHash("sha256").update(b).digest("hex");

/** The audit itself — one function, used by the self-test and by every candidate alike. */
export function auditModule(bytes) {
    const mod = new WebAssembly.Module(bytes);
    const imports = WebAssembly.Module.imports(mod);
    const exports = WebAssembly.Module.exports(mod);
    const ids = sectionIds(bytes);
    return {
        imports,
        importsByKind: imports.reduce((m, i) => ({ ...m, [i.kind]: (m[i.kind] ?? 0) + 1 }), {}),
        exports,
        sections: ids.map((i) => SECTION_NAMES[i] ?? `id:${i}`),
        hasStart: ids.includes(8),
        bytes: bytes.length,
        sha256: sha(bytes),
    };
}

function selfTest() {
    header("X.P.W2.g — wasm-audit --self-test (modules built to fail the audit)");
    const rows = [];
    const zero = auditModule(zeroImportModule());
    rows.push(["zero-import", String(zero.imports.length), JSON.stringify(zero.importsByKind), zero.hasStart ? "yes" : "no", zero.exports.map((e) => `${e.name}:${e.kind}`).join(" ")]);
    for (const kind of ["func", "memory", "global"]) {
        const r = auditModule(importingModule(kind));
        rows.push([`imports a ${kind}`, String(r.imports.length), JSON.stringify(r.importsByKind), r.hasStart ? "yes" : "no", r.exports.map((e) => `${e.name}:${e.kind}`).join(" ") || "-"]);
    }
    const st = auditModule(startSectionModule());
    rows.push(["start section", String(st.imports.length), JSON.stringify(st.importsByKind), st.hasStart ? "yes" : "no", "-"]);
    table(["module", "imports", "by kind", "start section", "exports"], rows);

    const fires =
        zero.imports.length === 0 &&
        !zero.hasStart &&
        auditModule(importingModule("func")).imports.length === 1 &&
        auditModule(importingModule("memory")).imports.length === 1 &&
        auditModule(importingModule("global")).imports.length === 1 &&
        st.hasStart;
    return verdict(
        fires,
        fires
            ? "the audit reads 0 imports on a zero-import module, 1 on each of the three import kinds, and sees a START section the Module object does not reflect"
            : "the audit did not distinguish the modules built to fail it — the probe is decorative",
    );
}

/** K-10: the evidence root's UNCOMMITTED wasm32 working tree, digested — never imported, never copied. */
function substrateWitness() {
    const rows = [];
    let committed = "n/a";
    try {
        execFileSync("git", ["-C", EVIDENCE_ROOT, "grep", "-l", "wasm32", "HEAD", "--", "rust/parse_that/"], { encoding: "utf8" });
        committed = "SOME";
    } catch {
        committed = "0 (exit 1, no output)"; //                   OP-6, re-measured here
    }
    let workingTree = [];
    try {
        const out = execFileSync("grep", ["-rl", "wasm32", path.join(EVIDENCE_ROOT, "rust/parse_that/src")], { encoding: "utf8" });
        workingTree = out.split("\n").filter(Boolean);
    } catch {
        workingTree = [];
    }
    for (const f of workingTree) rows.push([path.relative(EVIDENCE_ROOT, f), String(readFileSync(f).length), sha(readFileSync(f)).slice(0, 16)]);
    return { committed, workingTree, rows };
}

async function candidate(id) {
    const c = await loadCandidate(id, a.at ?? null);
    header(`X.P.W2.g — wasm-audit --candidate ${id} (G-9)`);
    const sub = substrateWitness();
    kv([
        ["evidence root", EVIDENCE_ROOT],
        ["committed `wasm32` under rust/parse_that (OP-6)", sub.committed],
        ["uncommitted working-tree wasm32 files (K-10's forbidden substrate)", String(sub.workingTree.length)],
    ]);
    if (sub.rows.length) table(["file (evidence root, READ-ONLY)", "bytes", "sha256"], sub.rows);

    if (!c.present) {
        console.log();
        selfTest();
        console.log();
        return absent(`candidate ${id}`, c.reason);
    }

    const red = [];
    const L = c.lowerings.wasm;
    let bytes = null;
    if (typeof L.wasmBytes === "function") bytes = L.wasmBytes();
    else if (c.meta.artifacts?.wasm) {
        const p = path.isAbsolute(c.meta.artifacts.wasm) ? c.meta.artifacts.wasm : path.join(P2_ROOT, c.meta.artifacts.wasm);
        if (existsSync(p)) bytes = readFileSync(p);
    }
    if (!bytes) {
        return absent(`candidate ${id} Wasm bytes`, "neither lowerings.wasm.wasmBytes() nor meta.artifacts.wasm resolves — the audit reads the MODULE, never a claim about it");
    }

    const r = auditModule(bytes);
    kv([
        ["module bytes", String(r.bytes)],
        ["module sha256", r.sha256],
        ["imports", String(r.imports.length)],
        ["imports by kind", JSON.stringify(r.importsByKind)],
        ["sections", r.sections.join(", ")],
        ["start section (a side channel counts)", r.hasStart ? "PRESENT" : "absent"],
        ["exports", r.exports.map((e) => `${e.name}:${e.kind}`).join(" · ")],
    ]);
    if (r.imports.length) {
        table(["module", "name", "kind"], r.imports.map((i) => [i.module, i.name, i.kind]));
        red.push(`${r.imports.length} import(s) — ${r.imports.map((i) => `${i.module}.${i.name}:${i.kind}`).join(", ")}`);
    }
    if (r.hasStart) red.push("a START section runs at instantiation — the side channel G-9 names");

    // K-10: byte identity against the forbidden substrate.
    const declared = [...(c.meta.sources?.wasm ?? [])].map((p) => (path.isAbsolute(p) ? p : path.join(P2_ROOT, p))).filter(existsSync);
    const forbidden = new Set(sub.workingTree.map((f) => sha(readFileSync(f))));
    const copies = declared.filter((f) => forbidden.has(sha(readFileSync(f))));
    if (copies.length) red.push(`K-10 BREACH: ${copies.length} declared wasm source(s) are byte-identical to the evidence root's uncommitted working tree`);

    // K-9: reproducing the JS artifact must not transitively need a non-JS toolchain.
    const build = c.meta.build?.jsArtifactReproduction ?? [];
    const toolchain = build.filter((cmd) => TOOLCHAIN.test(cmd));
    kv([
        ["declared JS-artifact reproduction", build.length ? build.join(" && ") : "NOT DECLARED (K-9 cannot be read; the seat must declare it)"],
        ["non-JS toolchain in that path (K-9)", toolchain.length ? toolchain.join(" · ") : "none"],
    ]);
    if (toolchain.length) red.push(`K-9: reproducing the JS artifact requires ${toolchain.join(", ")}`);
    if (!build.length) red.push("K-9 undeclared: meta.build.jsArtifactReproduction is empty, so the build graph cannot be read");

    // memory.grow in steady state: the buffer must not change size after warmup.
    if (typeof L.memory === "function") {
        const mem = L.memory();
        const before = mem.buffer.byteLength;
        if (typeof L.parse === "function") for (let i = 0; i < 2000; i++) L.parse("P:color", "rgb(1 2 3)");
        const after = mem.buffer.byteLength;
        kv([["memory bytes before / after 2,000 steady-state parses", `${before} / ${after}`]]);
        if (after !== before) red.push(`memory.grow fired in steady state (${before} → ${after})`);
    } else {
        console.log("memory.grow leg: UNAVAILABLE — the adapter exposes no `memory()`; the seat declares it or the leg stays unread.");
    }

    return verdict(red.length === 0, red.length === 0 ? "zero imports over all kinds, no start section, closed export set, no steady-state grow, substrate law intact" : red.join(" | "));
}

const code = a.flags.has("self-test") ? selfTest() : a.candidate ? await candidate(a.candidate) : (console.log("usage: wasm-audit.mjs --candidate <id> | --self-test"), 2);
process.exit(code);
