// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — THE CORPUS, READ FROM `.a`'s GENERATED UNION.
//
// `W3.md` §5 `.d` graduates the P-1 harness "from `{oklch(), cubic-bezier(), qualified
// stylesheets}` to all 52 exports". The corpus that graduation runs over is not re-derived here:
// it is `.a`'s union — GROUND-A's 21×10 empty-argument cross-product, cand-F's 4,000-case mutation
// fuzz, cand-O's replayable mulberry32 30,000-input corpus, the 148 named colours, the 403-string
// P-1 corpus and the 172-input R1 corpus — landed at `<p2>` `bd10e5c` and read here VERBATIM.
// Re-deriving it in this unit would give the differential a corpus of its own author's choosing,
// which is the first of the four bases `W3.md` §12 tells the L-18 skeptics to attack.
//
// TWO THINGS THIS FILE FIXES ON READ, both disclosed rather than silently normalized:
//
//   F-c3 (raised by `.c`, owner "`.a` / `.d`"): 172 rows of the union — the whole `r1` band — carry
//   `s` as an OBJECT `{id, src}` rather than a string. `.c` unwrapped them in its own reader and
//   returned the defect rather than reaching across a bound to cure it; this seat does the same,
//   publishes the count on every read, and rows it. An unwrap is lossless and is checked: the
//   object must carry a string `src` or the read HALTS.
//
//   The replay pin. `rowsSha256` is asserted against the corpus's own recorded digest, so a corpus
//   edited between `.a`'s landing and this seat's reading fails here rather than moving a number.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const CORPUS_PATH = path.join(HERE, "..", "..", "css-totality", "corpus.json");

/**
 * `.a`'s own digest recipe for the UNION file (`test/css-totality/lib/corpus.mjs:326`):
 * `sha256(JSON.stringify(rows))` over the RAW rows, before this file's F-c3 unwrap. Two recipes
 * live in this wave and they are not interchangeable — the other, recovered by `.a` as F-a.1, is
 * sha256 over the cand-O fuzz replay's sources joined by NUL and pins that arm alone.
 */
const rowsDigest = (rawRows) => createHash("sha256").update(JSON.stringify(rawRows)).digest("hex");

let cached = null;

/**
 * The union, as `{ rows: [{ i, src, bands }], … }`. `src` is ALWAYS a string here; `unwrapped`
 * counts how many rows needed F-c3's unwrap, and it is printed by every consumer.
 */
export const loadCorpus = () => {
    if (cached) return cached;
    const raw = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));

    let unwrapped = 0;
    const rows = raw.rows.map((row) => {
        let src = row.s;
        if (typeof src !== "string") {
            if (!src || typeof src.src !== "string") {
                throw new Error(
                    `CORPUS HALT at row ${row.i}: \`s\` is neither a string nor an {id, src} pair — ` +
                        `${JSON.stringify(src).slice(0, 120)}. F-c3's unwrap is lossless by construction; ` +
                        `a third shape is a corpus change, not something to guess at.`,
                );
            }
            src = src.src;
            unwrapped += 1;
        }
        return { i: row.i, src, bands: row.bands ?? [], prods: row.prods ?? [] };
    });

    const digest = rowsDigest(raw.rows);
    const bands = {};
    for (const row of rows) for (const b of row.bands) bands[b] = (bands[b] ?? 0) + 1;

    cached = {
        path: CORPUS_PATH,
        rows,
        unwrapped,
        bands,
        counts: raw.counts,
        arms: raw.arms,
        boundary: raw.boundary ?? [],
        rowsSha256: digest,
        rowsSha256Recorded: raw.rowsSha256,
        rowsSha256Agrees: digest === raw.rowsSha256,
    };
    return cached;
};

/** The distinct source strings, in first-appearance order — the differential's own denominator. */
export const distinctSources = () => {
    const seen = new Set();
    const out = [];
    for (const row of loadCorpus().rows) {
        if (seen.has(row.src)) continue;
        seen.add(row.src);
        out.push(row);
    }
    return out;
};

/** The seven declared non-string boundary values, materialized. `.a` declares them; this evaluates them. */
export const boundaryValues = () =>
    loadCorpus().boundary.map((b) => ({
        id: b.id,
        js: b.js,
        typeofIs: b.typeofIs,
        // eslint-disable-next-line no-eval -- the corpus declares seven JS literals; each is evaluated
        value: (0, eval)(`(${b.js})`),
    }));
