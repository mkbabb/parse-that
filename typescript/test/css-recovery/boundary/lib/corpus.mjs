// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.c — the boundary suite's corpus reader. It DERIVES; it never authors.
//
// `W3.md` §3's prohibition on self-authored answer keys binds a totality suite hardest of all: a
// corpus this seat typed would be a corpus whose author can delete the row that reddens his own
// gate. Every source below comes from a file another unit generated:
//
//   * `test/css-totality/corpus.json` — `.a`'s generated union (26,604 rows over six folded arms:
//     GROUND-A's 21×10 empty-argument cross-product, cand-F's 4,000-case mutation fuzz, cand-O's
//     replayable mulberry32 30,000-input corpus, the 148 named colours, the 403-string P-1 corpus
//     and the 172-input R1 corpus).
//   * `test/css-recovery/corpus.json` — `.b`'s derived malformed-inverse corpus (685 rows).
//
// ONE DEFECT IS NORMALIZED HERE, AND NAMED RATHER THAN SILENTLY REPAIRED. 172 rows of `.a`'s union
// — the whole `r1` band — carry `s` as the OBJECT `{id, src}` instead of the string, so the R1 arm
// was folded without unwrapping its rows. Measured by this seat:
//
//     ⟨cmd⟩ node -e "…corpus.rows.filter(r => typeof r.s !== 'string').length"   → 172
//     ⟨cmd⟩ …rows[26432]  → {"i":26432,"s":{"id":"r1-0","src":""},"bands":["r1"],"prods":[]}
//
// Feeding one of those straight to the raw path throws `TypeError: sg.src.slice is not a function`
// — which is how this seat found it. `test/css-totality/**` is `.a`'s create row and in no row of
// this seat's writable set, so the rows are unwrapped HERE, the count is published on every read,
// and the defect is returned as a finding (`X-P-W3.md`, X.P.W3.c, F-c3) rather than cured across a
// bound.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEST_ROOT = path.resolve(HERE, "../../..");

const readJson = (rel) => JSON.parse(readFileSync(path.join(TEST_ROOT, rel), "utf8"));

/**
 * The union of both corpora, de-duplicated, with the normalization accounted for on the record it
 * returns. Nothing is filtered: a row that cannot be read is an error, not a skip.
 */
export function loadCorpusUnion() {
    const totality = readJson("css-totality/corpus.json");
    const recovery = readJson("css-recovery/corpus.json");

    const sources = new Set();
    let unwrapped = 0;
    const unreadable = [];

    for (const row of totality.rows) {
        if (typeof row.s === "string") {
            sources.add(row.s);
        } else if (row.s !== null && typeof row.s === "object" && typeof row.s.src === "string") {
            unwrapped++;
            sources.add(row.s.src);
        } else {
            unreadable.push(row.i);
        }
    }
    for (const row of recovery.rows) {
        if (typeof row.src !== "string") unreadable.push(row.id);
        else sources.add(row.src);
    }

    if (unreadable.length > 0) {
        throw new Error(`HALT: ${unreadable.length} corpus rows carry no readable source: [${unreadable.slice(0, 8).join(", ")}…]`);
    }

    return Object.freeze({
        sources: [...sources],
        counts: Object.freeze({
            totalityRows: totality.rows.length,
            recoveryRows: recovery.rows.length,
            unwrapped,
            distinct: sources.size,
        }),
    });
}

/**
 * GROUND-A's empty-argument cross-product, read off `.a`'s band rather than re-typed. It is R1's
 * own class — `W3.md` §6 G-3's ten heads are a subset of it — and `parser-band.md` establishes that
 * the class is unbounded rather than an enumeration of eight strings.
 */
export function loadGroundA() {
    const totality = readJson("css-totality/corpus.json");
    const rows = totality.rows
        .filter((row) => Array.isArray(row.bands) && row.bands.includes("ground-a"))
        .map((row) => (typeof row.s === "string" ? row.s : row.s.src));
    if (rows.length === 0) throw new Error("HALT: the ground-a band is empty — the corpus this suite reads is not the one it names.");
    return rows;
}

/**
 * `.a`'s own DECLARED non-string boundary rows (`corpus.json` `boundary`), used to cross-check that
 * this suite's ten kinds are a superset of the seven the universe generator declares. The values
 * themselves are constructed here rather than `eval`'d from `.a`'s `js` field — a suite that
 * evaluates its fixture's source text is a suite that can be handed anything.
 */
export function declaredBoundaryRows() {
    const totality = readJson("css-totality/corpus.json");
    return totality.boundary ?? [];
}
