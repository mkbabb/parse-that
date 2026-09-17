// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.b — THE DEFECT TAXONOMY, IMPORTED VERBATIM.
//
// The three MIRROR-DEFECT classes are the ONLY RED triggers of the equivalence
// gate. COVERAGE_NARROWING and LIVE_STRICTER are DECLARED NON-DEFECTS. This file
// does not paraphrase that rule: it carries the authority's own bytes, and
// `assertTaxonomyUnmoved()` re-reads the authority at run time and compares
// byte-for-byte.
//
// Why byte-for-byte and not "the count is zero": W1.md §6 G-2's own falsifier —
//   "widen the taxonomy (reclassify a MIS_ACCEPT as COVERAGE_NARROWING) and the
//    count goes to zero for the wrong reason — so that same command asserts the
//    class definitions byte-for-byte against `equivalence.md §1` in addition to
//    the count, and exits non-zero if either moves."
// A harness that only counts cannot tell a cured engine from a widened rule.
//
// AUTHORITY (read-only; a sealed gate record — read, re-measure, never fold in
// place, per W1.md §4's do-not-touch list).

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const AUTHORITY_PATH =
    "/Users/mkbabb/Programming/value.js/docs/tranches/V/apotheosis/parser-proof/equivalence.md";

/** The anchors that address the §1 block inside the authority. Anchored by TEXT,
 *  never by line number: `equivalence.md` is a dated record whose lines may be
 *  re-flowed by a later transcription, while these sentences are its identity. */
export const AUTHORITY_START = "A **MIRROR-DEFECT** (the only RED trigger) is one of:";
export const AUTHORITY_END = "never a mirror-defect.";

/** `equivalence.md` §1, verbatim — 9 lines, one array entry per source line. */
export const TAXONOMY_VERBATIM = [
    "A **MIRROR-DEFECT** (the only RED trigger) is one of:",
    "- **(A) DIVERGENT_VALUE** — both engines accept an in-shape input but the numeric semantic cores disagree;",
    "- **(B) MIS_ACCEPT** — C14 accepts an input the live parser **and spec** reject;",
    "- **(C) FALSE_REJECT_IN_SHAPE** — C14 rejects an input unambiguously valid within C14's *own* declared W0 shape.",
    "",
    "**COVERAGE_NARROWING** (C14 declines an input *outside* its declared shape that the",
    "live superset accepts) is **not** a defect — `status.json` declares it. Likewise a",
    "case where C14 accepts valid CSS the live regex parser over-validates and rejects",
    "is a **live-side** finding (**LIVE_STRICTER**), never a mirror-defect.",
].join("\n");

/** sha256 of TAXONOMY_VERBATIM, measured from the authority's settled bytes on
 *  2026-09-17. A second, independent handle on the same assertion: if the string
 *  literal above is edited, this digest catches it even where the authority moved
 *  in the same direction. */
export const TAXONOMY_SHA256 =
    "554c2993cebd3ed386e023e043ded9538bd99fd488de0598ada40b845dd963a7";

/** The block's size, measured from the authority's settled bytes on 2026-09-17
 *  and stated in the unit the assertion uses. UTF-8 BYTES, not UTF-16 units:
 *  the block carries four em-dashes, so `String.length` reads 675 where
 *  `Buffer.byteLength` reads 683, and a check that mixes the two fails a correct
 *  port for the wrong reason. Both are pinned so neither reading can drift. */
export const TAXONOMY_BYTES = 683;
export const TAXONOMY_CHARS = 675;
export const TAXONOMY_LINES = 9;

/** The only RED triggers. Order is the authority's: A, B, C. */
export const MIRROR_DEFECT_CLASSES = [
    {
        letter: "A",
        name: "DIVERGENT_VALUE",
        definition:
            "both engines accept an in-shape input but the numeric semantic cores disagree",
    },
    {
        letter: "B",
        name: "MIS_ACCEPT",
        definition: "C14 accepts an input the live parser and spec reject",
    },
    {
        letter: "C",
        name: "FALSE_REJECT_IN_SHAPE",
        definition:
            "C14 rejects an input unambiguously valid within C14's own declared W0 shape",
    },
] as const;

/** DECLARED NON-DEFECTS. Named here so that a reader cannot mistake their
 *  presence in the tally for a weakened gate: they are counted, printed, and
 *  never summed into A/B/C. */
export const DECLARED_NON_DEFECTS = [
    {
        name: "COVERAGE_NARROWING",
        why: "C14 declines an input outside its declared shape that the live superset accepts; status.json declares it",
    },
    {
        name: "LIVE_STRICTER",
        why: "C14 accepts valid CSS the live regex parser over-validates and rejects; a live-side finding, never a mirror-defect",
    },
] as const;

export type MirrorDefectClass = (typeof MIRROR_DEFECT_CLASSES)[number]["name"];

export interface TaxonomyCheck {
    readonly ok: boolean;
    readonly authorityPath: string;
    readonly authorityBytes: number;
    readonly extractedBytes: number;
    readonly extractedSha256: string;
    readonly expectedSha256: string;
    readonly failures: readonly string[];
}

/**
 * Re-read the authority and prove the taxonomy has not moved — in EITHER
 * direction. Three independent failures are distinguished, because "the
 * taxonomy moved" and "the port was edited" are different research questions:
 *   1. the authority no longer contains the anchored block at all;
 *   2. the anchored block differs from this file's verbatim copy;
 *   3. the verbatim copy differs from its pinned digest.
 */
export function checkTaxonomyUnmoved(): TaxonomyCheck {
    const failures: string[] = [];
    let extracted = "";
    let authorityBytes = -1;

    try {
        const md = readFileSync(AUTHORITY_PATH, "utf8");
        authorityBytes = Buffer.byteLength(md, "utf8");
        const start = md.indexOf(AUTHORITY_START);
        const end = md.indexOf(AUTHORITY_END);
        if (start < 0) {
            failures.push(`authority does not contain the §1 start anchor`);
        } else if (end < 0 || end < start) {
            failures.push(`authority does not contain the §1 end anchor after the start`);
        } else {
            extracted = md.slice(start, end + AUTHORITY_END.length);
            if (extracted !== TAXONOMY_VERBATIM) {
                failures.push(
                    `§1 block differs from the ported verbatim copy (authority ${Buffer.byteLength(extracted, "utf8")} B vs ported ${Buffer.byteLength(TAXONOMY_VERBATIM, "utf8")} B)`,
                );
            }
        }
    } catch (error) {
        failures.push(
            `authority unreadable: ${error instanceof Error ? error.message : String(error)}`,
        );
    }

    const portedSha = createHash("sha256").update(TAXONOMY_VERBATIM, "utf8").digest("hex");
    if (portedSha !== TAXONOMY_SHA256) {
        failures.push(`ported verbatim copy digest ${portedSha} != pinned ${TAXONOMY_SHA256}`);
    }
    const portedBytes = Buffer.byteLength(TAXONOMY_VERBATIM, "utf8");
    if (portedBytes !== TAXONOMY_BYTES) {
        failures.push(`ported verbatim copy is ${portedBytes} UTF-8 B, pinned at ${TAXONOMY_BYTES}`);
    }
    if (TAXONOMY_VERBATIM.length !== TAXONOMY_CHARS) {
        failures.push(
            `ported verbatim copy is ${TAXONOMY_VERBATIM.length} UTF-16 units, pinned at ${TAXONOMY_CHARS}`,
        );
    }
    if (TAXONOMY_VERBATIM.split("\n").length !== TAXONOMY_LINES) {
        failures.push(
            `ported verbatim copy is ${TAXONOMY_VERBATIM.split("\n").length} lines, pinned at ${TAXONOMY_LINES}`,
        );
    }

    return {
        ok: failures.length === 0,
        authorityPath: AUTHORITY_PATH,
        authorityBytes,
        extractedBytes: Buffer.byteLength(extracted, "utf8"),
        extractedSha256: extracted
            ? createHash("sha256").update(extracted, "utf8").digest("hex")
            : "",
        expectedSha256: TAXONOMY_SHA256,
        failures,
    };
}
