// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — ONE HARNESS, ALL CANDIDATES: the adapter contract, and the loader that refuses to
// guess. `W2.md` §3 item 7: "One harness, all candidates — a per-candidate harness or any edit to
// W1's instruments is a defect." The consequence is this file: every candidate reaches every probe
// through ONE shape, so a probe cannot be tuned to a candidate and a candidate cannot be tuned to a
// probe.
//
// THE CONTRACT (a candidate seat implements exactly this, at
// `experiments/w2/<id>/harness-adapter.mjs`; the full prose is `harness/w2/README.md`):
//
//   export const meta = {
//       id, name,                       // the §12 id (ac1|ac2|ac3|ac4) and its name
//       postures: { … },                // FF-4's declared postures, recorded BEFORE measurement
//       sources: { algebra: [], js: [], wasm: [] },  // three disjoint file lists, absolute or
//                                       // <p2>-relative. G-1's import check is exactly: no file of
//                                       // `algebra` imports a file of `js` or `wasm`. G-1's
//                                       // target-conditional grep and G-10's textual zeros range
//                                       // over all three.
//       artifacts: { jsEntry, dts, wasm }, // built artifacts, absolute or <p2>-relative
//   };
//   export const lowerings = { js: <Lowering>, wasm: <Lowering> };
//
//   <Lowering> = {
//       kind: "js" | "wasm",
//       registry(): Row[],              // §4.6 rows: { opId, name, arity, argKinds, symbol }
//       labels(): string[],             // the L index; EQ-4 compares indices into it
//       grammar(): { entries: {prod: termName}, terms: {name: Term} },   // TERMS ARE DATA (A-1/CL-1)
//       parse(prod, source, theta?): Product,
//       entry(prod): (source: unknown) => ParseResult,                   // BND-1, above the algebra
//       module?(): WebAssembly.Module,  // wasm only — G-9 reads imports from THIS
//       arenaHighWater?(): number,      // wasm only — EQ-5's sixth coordinate
//       parserGraph?(): unknown[],      // js only — G-10's graph walk roots (parse-that Parsers)
//   };
//
//   Product = {
//       ok: boolean,
//       V: unknown | undefined,                       // ⊥ is `undefined`
//       C: [offset, length, kind][],                  // §2.1
//       P: [start, end][],
//       D: { code, start, end, expected: string[], actual: string|null }[],
//       far: { f, code, labels: string[] },
//       sigma: { i, depth, arena },
//       marks: { site, at, restored: [i, lenC, lenP, lenD, depth, arena],
//                mark: [i, lenC, lenP, lenD, depth, arena] }[],          // every TRY that failed
//       recoveries: { at, skipped: [offset, length], code }[],
//   };
//
// A lowering that cannot answer a probe returns the field absent; the probe reports ABSENT with the
// missing member named. No probe invents a default for a missing member — an absent member is a
// finding, and a harness that fills it in has measured itself.

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { EXPERIMENTS_W2 } from "./contract.mjs";

/** The §12 field, closed: ids and homes are the contract's, never discovered from the filesystem. */
export const CANDIDATE_HOMES = {
    ac1: "ac1-tagless",
    ac2: "ac2-closed-ir",
    ac3: "ac3-span",
    ac4: "ac4-siblings",
};

export const ADAPTER_BASENAME = "harness-adapter.mjs";

export function candidateDir(id, at = null) {
    if (at) return path.isAbsolute(at) ? at : path.join(EXPERIMENTS_W2, "..", "..", at);
    const home = CANDIDATE_HOMES[id];
    if (!home) throw new Error(`HALT: '${id}' is not one of the four ids fixed at ALGEBRA.md §12 (${Object.keys(CANDIDATE_HOMES).join(", ")})`);
    return path.join(EXPERIMENTS_W2, home);
}

const REQUIRED_LOWERING = ["registry", "labels", "grammar", "parse", "entry"];

export async function loadCandidate(id, at = null) {
    let dir;
    try {
        dir = candidateDir(id, at);
    } catch (e) {
        return { present: false, id, reason: String(e.message) };
    }
    const adapterPath = path.join(dir, ADAPTER_BASENAME);
    if (!existsSync(dir)) {
        return { present: false, id, dir, adapterPath, reason: `candidate directory ABSENT (${dir}) — phase 4 has not run` };
    }
    if (!existsSync(adapterPath)) {
        const siblings = readdirSync(dir).slice(0, 12).join(", ");
        return { present: false, id, dir, adapterPath, reason: `${ADAPTER_BASENAME} ABSENT in ${dir} (holds: ${siblings || "nothing"})` };
    }
    let mod;
    try {
        mod = await import(pathToFileURL(adapterPath).href);
    } catch (e) {
        return { present: false, id, dir, adapterPath, reason: `adapter failed to load: ${String(e).split("\n")[0]}` };
    }
    const problems = [];
    if (!mod.meta || typeof mod.meta !== "object") problems.push("meta missing");
    if (!mod.lowerings || typeof mod.lowerings !== "object") problems.push("lowerings missing");
    for (const k of ["js", "wasm"]) {
        const L = mod.lowerings?.[k];
        if (!L) {
            problems.push(`lowerings.${k} missing`);
            continue;
        }
        for (const m of REQUIRED_LOWERING) {
            if (typeof L[m] !== "function") problems.push(`lowerings.${k}.${m}() missing`);
        }
    }
    if (mod.lowerings?.wasm && typeof mod.lowerings.wasm.module !== "function") {
        problems.push("lowerings.wasm.module() missing — G-9 reads the import list from the Module, never from a claim");
    }
    if (problems.length) {
        return { present: false, id, dir, adapterPath, reason: `adapter shape incomplete: ${problems.join(" · ")}`, problems };
    }
    return { present: true, id, dir, adapterPath, meta: mod.meta, lowerings: mod.lowerings };
}

/** Which of the four have landed — reported, never inferred from an admission decision. */
export function candidateSurvey() {
    return Object.entries(CANDIDATE_HOMES).map(([id, home]) => {
        const dir = path.join(EXPERIMENTS_W2, home);
        return {
            id,
            home,
            dirPresent: existsSync(dir),
            adapterPresent: existsSync(path.join(dir, ADAPTER_BASENAME)),
        };
    });
}
