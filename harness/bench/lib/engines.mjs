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
import { pathToFileURL } from "node:url";

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
    throw new Error(`unknown engine ${name}`);
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
