// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — THE BENCH SUBJECTS, ADDRESSED BY ABSOLUTE PATH AND PINNED BY DIGEST.
//
// Three engines and one normaliser. Every path is absolute (the fresh root has no
// node_modules and no package.json — X-P-W1.md §Open Q-1; nothing here is resolved by a
// bare specifier, so nothing here depends on this file's cwd).
//
//   published-4.0.0  the incumbent regex engine as NPM SHIPS IT — the vendored sha-pinned
//                    tarball `cand-o/vendor/value-js-4.0.0/`, never a working-tree dist.
//                    This is the parser band's G6 rule, which unit .b applied to the
//                    equivalence oracle and which applies here for the same reason: timing
//                    bytes nobody ships measures nothing anybody runs. It is also the
//                    subject of CC-095's Plane-A comparison and the source of the R1 throw.
//   c14              the cand-O combinator assay, `c14-bundle.mjs`, from the TRACKED rescued
//                    tree (unit .c), not from the job scratchpad it used to live in.
//   deposed          the pre-v4 parse-that engine, `deposed-full/deposed-bundle.mjs`, same
//                    tracked tree — the historical U-F14 calibration subject.
//   parse-that dist  the INSTALLED dist of `@mkbabb/parse-that@1.0.0` in the prototype
//                    workspace. It is the module O-15 PT-03's `:678`/`:722` coordinates
//                    name, it is the latch witness every cell loads, and its `jsonParser`
//                    is the co-scaling normaliser the ported bench used.
//
// DECLARED PORT DIVERGENCE (recorded, not silent). The ported `bench/bench.ts` timed a
// fourth subject, `live-bundle.mjs` — an esbuild bundle of value.js's WORKING TREE taken on
// 2026-07-20. It is not timed here: it is a two-month-old snapshot of bytes that were never
// published, so a ratio against it is a ratio against nothing anyone can install. The
// published 4.0.0 tarball replaces it as the incumbent of record, and that swap is the only
// subject-set change this port makes.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** This root, derived from this file's own location — `<p2>/harness/bench/lib/engines.mjs`. */
const P2_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const WORKSPACE =
    "/Users/mkbabb/Programming/value.js/docs/tranches/V/megatranche/prototypes/css-parser";
const RESCUED =
    "/Users/mkbabb/Programming/value.js/docs/tranches/X/parse-that/evidence/W1/rescued";

export const PUBLISHED_CSS = `${WORKSPACE}/cand-o/vendor/value-js-4.0.0/dist/subpaths/css.js`;
export const C14_BUNDLE = `${RESCUED}/c14-bundle.mjs`;
export const DEPOSED_BUNDLE = `${RESCUED}/deposed-full/deposed-bundle.mjs`;
export const PARSE_THAT_DIST = `${WORKSPACE}/node_modules/@mkbabb/parse-that/dist`;

/**
 * The installed dist's packrat chunk, resolved by READING THE DIRECTORY rather than by
 * hard-coding the content hash in its name: a reinstall changes the hash, and a harness
 * that pins the hash would silently stop witnessing the latch it claims to witness.
 */
export function packratChunkPath() {
    const hits = readdirSync(PARSE_THAT_DIST).filter(
        (f) => /^packrat-entry-.*\.js$/.test(f) && !f.endsWith(".map"),
    );
    if (hits.length !== 1) {
        throw new Error(
            `HALT: expected exactly one ESM packrat-entry chunk in ${PARSE_THAT_DIST}, found ${hits.length}: ${hits.join(", ")}`,
        );
    }
    return `${PARSE_THAT_DIST}/${hits[0]}`;
}

export function pin(path) {
    const bytes = statSync(path).size;
    const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
    return { path, bytes, sha256 };
}

export function subjectPins() {
    return {
        "published-4.0.0": pin(PUBLISHED_CSS),
        c14: pin(C14_BUNDLE),
        deposed: pin(DEPOSED_BUNDLE),
        "parse-that-dist": pin(packratChunkPath()),
    };
}

/**
 * Load one engine's doors. A "door" is the engine's entry for a corpus item's kind, so the
 * same corpus item reaches each engine through the entry that engine actually ships for it.
 * No adapter normalises a result: classification happens in `classify()` below, over the
 * raw return value, so an engine that signals failure differently is VISIBLE rather than
 * smoothed.
 */
export async function loadEngine(name) {
    if (name === "published-4.0.0") {
        const m = await import(pathToFileURL(PUBLISHED_CSS).href);
        return {
            name,
            module: m,
            doors: {
                color: m.parseCssColor,
                easing: m.parseTimingFunction,
                sheet: m.parseStylesheet,
            },
            doorNames: {
                color: "parseCssColor",
                easing: "parseTimingFunction",
                sheet: "parseStylesheet",
            },
        };
    }
    if (name === "c14") {
        const m = await import(pathToFileURL(C14_BUNDLE).href);
        return {
            name,
            module: m,
            doors: { color: m.parseColor, easing: m.parseEasing, sheet: m.parseStylesheet },
            doorNames: {
                color: "parseColor",
                easing: "parseEasing",
                sheet: "parseStylesheet",
            },
        };
    }
    if (name === "deposed") {
        const m = await import(pathToFileURL(DEPOSED_BUNDLE).href);
        const value = (s) => m.CSSValues.Value.parse(s);
        return {
            name,
            module: m,
            doors: { color: value, easing: value, sheet: m.parseCSSStylesheet },
            doorNames: {
                color: "CSSValues.Value.parse",
                easing: "CSSValues.Value.parse",
                sheet: "parseCSSStylesheet",
            },
        };
    }
    if (name === "json-normaliser") {
        const m = await import(pathToFileURL(`${PARSE_THAT_DIST}/parse.js`).href);
        return {
            name,
            module: m,
            doors: { json: (s) => m.jsonParser.parse(s) },
            doorNames: { json: "jsonParser.parse" },
        };
    }
    if (name.startsWith(ADAPTER_ENGINE_PREFIX)) return loadAdapterEngine(name);
    throw new Error(`unknown engine ${name}`);
}

/* ── E-6 — THE ONE DECLARED EXTERNAL CELL ────────────────────────────────────────────────────
 *
 * COHESION.md §0n.4, verbatim: `harness/bench/lib/engines.mjs` "may gain an `--engine=<adapter>`
 * registration path (a closed chain becomes a chain plus one declared external cell); landed by
 * X.P.W3 under a dated E-3 addendum to W1's §Bounds, so G-7 has a subject." Landed by X.P.W3.0
 * under `docs/tranches/X/parse-that/waves/W1-ADDENDA-2026-09-18.md` §B-1.
 *
 * WHAT IT IS, AND WHAT IT IS NOT. It is a chain plus ONE arm, and that arm is not a fifth hard-coded
 * subject: it resolves an id the CALLER declares, against the SAME adapter contract every W2 probe
 * already reaches a candidate through (`harness/w2/README.md` §2). A per-candidate bench cell was
 * the thing `W2.md` §3 item 7 forbade; a per-candidate bench cell is still forbidden, and nothing
 * below knows the name of any candidate. The four named engines above are untouched, `loadEngine`
 * still throws on an id it cannot resolve, and no `argv` contract is changed in `bench.ts` (which is
 * execute-no-write for X.P.W3): a caller passes the id, this file resolves it.
 *
 * THE ID: `adapter:<path-to-harness-adapter.mjs>#<js|wasm>`. The path is absolute or `<p2>`-relative;
 * the fragment names which of the adapter's two lowerings is the cell, because §0n.4 requires the
 * table "printed for both lowerings of the graduated seed" and a single id per row is what makes a
 * row's arm-state and provenance unambiguous. The fragment is REQUIRED — defaulting it would let a
 * table print a row whose lowering nobody declared.
 *
 * THE DOORS are the bench's own three, mapped onto the adapter's `entry(prod)` boundary (BND-1,
 * ALGEBRA.md §5.8) — the same door shape the four engines above expose, so `classify()` below reads
 * an adapter cell exactly as it reads the incumbent, throws counted and never swallowed.
 */
export const ADAPTER_ENGINE_PREFIX = "adapter:";

/** The bench's three doors ← the algebra's three slice entries (`ALGEBRA.md` §10). */
const ADAPTER_DOORS = { color: "P:color", easing: "P:timing-function", sheet: "P:stylesheet" };

/**
 * `--engine=<adapter>` read off an argv array, in the file the grant names. Returns the engine ids
 * declared on the command line, in order, with no default and no discovery: a caller that passes
 * nothing gets an empty list and prints no external cell.
 */
export function adapterEngineIds(argv) {
    return argv
        .filter((a) => a.startsWith("--engine="))
        .map((a) => a.slice("--engine=".length))
        .map((v) => (v.startsWith(ADAPTER_ENGINE_PREFIX) ? v : `${ADAPTER_ENGINE_PREFIX}${v}`));
}

function parseAdapterId(id) {
    const body = id.slice(ADAPTER_ENGINE_PREFIX.length);
    const hash = body.lastIndexOf("#");
    if (hash < 0) {
        throw new Error(
            `HALT: engine id '${id}' names no lowering. The form is ${ADAPTER_ENGINE_PREFIX}<path-to-harness-adapter.mjs>#<js|wasm>`,
        );
    }
    const file = body.slice(0, hash);
    const lowering = body.slice(hash + 1);
    if (lowering !== "js" && lowering !== "wasm") {
        throw new Error(`HALT: engine id '${id}' names lowering '${lowering}'; the adapter contract has exactly js and wasm`);
    }
    return { file: isAbsolute(file) ? file : resolve(P2_ROOT, file), lowering };
}

async function loadAdapterEngine(id) {
    const { file, lowering } = parseAdapterId(id);
    if (!statSync(file, { throwIfNoEntry: false })) {
        throw new Error(`HALT: adapter ABSENT at ${file} (engine id '${id}')`);
    }
    const m = await import(pathToFileURL(file).href);
    const L = m.lowerings?.[lowering];
    if (!L || typeof L.entry !== "function") {
        throw new Error(`HALT: ${file} exports no lowerings.${lowering}.entry() — the adapter contract is harness/w2/README.md §2`);
    }
    const doors = {};
    const doorNames = {};
    for (const [door, prod] of Object.entries(ADAPTER_DOORS)) {
        doors[door] = L.entry(prod);
        doorNames[door] = `lowerings.${lowering}.entry("${prod}")`;
    }
    return {
        name: id,
        module: m,
        doors,
        doorNames,
        /** Declared provenance, pinned like every other subject: the adapter and what it names built. */
        pins: {
            adapter: pin(file),
            ...Object.fromEntries(
                Object.entries(m.meta?.artifacts ?? {})
                    .filter(([, p]) => typeof p === "string" && statSync(p, { throwIfNoEntry: false }))
                    .map(([k, p]) => [k, pin(p)]),
            ),
        },
    };
}

/**
 * Classify one call's outcome. THREE outcomes, never two:
 *   accept  — a result-shaped `{ok:true}`, or (for an engine with no result type) any
 *             defined return value.
 *   reject  — `{ok:false}`, or `undefined` from a result-less engine.
 *   throw   — the call crossed the JS boundary as an exception.
 * A throw is COUNTED, never swallowed into "reject": the R1 leg exists precisely because
 * those two are different facts, and collapsing them is the defect this wave measures.
 */
export function classify(fn, input) {
    try {
        const r = fn(input);
        if (r !== null && typeof r === "object" && "ok" in r) {
            return r.ok === true ? "accept" : "reject";
        }
        return r === undefined ? "reject" : "accept";
    } catch {
        return "throw";
    }
}
