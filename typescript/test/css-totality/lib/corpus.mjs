// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.a — THE CORPUS, FOLDED AS A UNION.
//
// `W3.md` §5 `.a`: "The accept/reject corpora fold, as a union: the GROUND-A empty-arg
// cross-product (**21 heads × 10 fillings**), cand-F's 4,000-case mutation fuzz, cand-O's
// replayable mulberry32 30,000-input corpus, the 148 named colours, the 403-string P-1 corpus, and
// the 172-input R1 corpus."
//
// UNION MEANS SET UNION. An input that appears in three sources is ONE row carrying three
// provenances, not three rows: a corpus that double-counts its overlaps inflates every denominator
// downstream, and G-1's falsifier is about counts nobody can round up.
//
// NOTHING IS TRANSCRIBED. Each arm reads its own source:
//   ground-a     the `heads` and `fillings` arrays are EXTRACTED from cand-F's own fixture text,
//                so a change there moves this corpus instead of silently disagreeing with it.
//   fuzz-f       the alphabet, the seed strings and the two numeric constants are likewise
//                extracted; only the eight-line mutation ALGORITHM is restated, over the SAME
//                `mulberry32` the fresh root already owns (imported, not re-typed).
//   fuzz-o       `generateFuzzRows` is IMPORTED from `experiments/w2/corpus/fuzz-gen.mjs` and its
//                output is checked against the banked `rowsSha256` — a replay that drifts is caught
//                rather than trusted (X.P.W2.g's own idiom, kept).
//   named        the 148 names are read from the css-color-4 fixture JSON.
//   p1           the 403 strings are read from `harness/equivalence/corpus.json`.
//   r1           the 172 inputs and the 7 non-string boundary cases are read from
//                `experiments/w2/corpus/r1.json`.
//
// An arm whose extraction comes back empty or off its declared count THROWS. A corpus that
// silently shrinks is the one failure mode that would let a TOTAL row be bought cheaply.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { P2_ROOT, VALUE_JS_ROOT, sha256 } from "./pin.mjs";
import { FUZZ_PIN, generateFuzzRows, mulberry32 } from "../../../../experiments/w2/corpus/fuzz-gen.mjs";

const CAND_F_TOTALITY = path.join(
    VALUE_JS_ROOT,
    "docs/tranches/V/megatranche/prototypes/css-parser/cand-f/totality.test.ts",
);
const NAMED_COLORS_JSON = path.join(
    VALUE_JS_ROOT,
    "docs/tranches/V/megatranche/prototypes/css-parser/fixtures/css-color-4-named-colors.json",
);
const P1_CORPUS_JSON = path.join(P2_ROOT, "harness/equivalence/corpus.json");
const R1_CORPUS_JSON = path.join(P2_ROOT, "experiments/w2/corpus/r1.json");
const FUZZ_SEED_JSON = path.join(P2_ROOT, "experiments/w2/corpus/fuzz-seed.json");

const read = (file) => readFileSync(file, "utf8");
const json = (file) => JSON.parse(read(file));

const must = (value, what) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`corpus: ${what} came back empty — the source moved; fix the extraction, never the count`);
    }
    return value;
};

const expect = (actual, wanted, what) => {
    if (actual !== wanted) {
        throw new Error(`corpus: ${what} read ${actual}, the declared count is ${wanted}`);
    }
    return actual;
};

// ── extraction out of cand-F's fixture (read-only; `W3.md` §4 "cand-f/** read, no write") ────────

/**
 * Unescape one JavaScript string-literal body. NOT `JSON.parse`: the fixture's alphabet carries
 * `\u{1f3a8}` and `\'`, neither of which is JSON, and reading it through a JSON parser would either
 * throw or — worse — quietly lose a code point the fuzz corpus depends on.
 */
const unescapeJs = (body) => {
    let out = "";
    for (let i = 0; i < body.length; i += 1) {
        if (body[i] !== "\\") {
            out += body[i];
            continue;
        }
        const c = body[(i += 1)];
        if (c === "n") out += "\n";
        else if (c === "t") out += "\t";
        else if (c === "r") out += "\r";
        else if (c === "b") out += "\b";
        else if (c === "f") out += "\f";
        else if (c === "v") out += "\v";
        else if (c === "0" && !/[0-9]/.test(body[i + 1] ?? "")) out += "\0";
        else if (c === "x") {
            out += String.fromCodePoint(Number.parseInt(body.slice(i + 1, i + 3), 16));
            i += 2;
        } else if (c === "u" && body[i + 1] === "{") {
            const close = body.indexOf("}", i);
            out += String.fromCodePoint(Number.parseInt(body.slice(i + 2, close), 16));
            i = close;
        } else if (c === "u") {
            out += String.fromCharCode(Number.parseInt(body.slice(i + 1, i + 5), 16));
            i += 4;
        } else out += c;
    }
    return out;
};

/** A `const <name> = [ … ];` array of double-quoted strings, read out of a source text. */
const stringArrayLiteral = (text, name) => {
    const head = new RegExp(`const\\s+${name}\\s*(?::[^=]*)?=\\s*\\[`).exec(text);
    if (!head) return null;
    const open = head.index + head[0].length - 1;
    let depth = 0;
    for (let i = open; i < text.length; i += 1) {
        if (text[i] === "[") depth += 1;
        else if (text[i] === "]") {
            depth -= 1;
            if (depth === 0) {
                const body = text.slice(open + 1, i);
                return [...body.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => unescapeJs(m[1]));
            }
        }
    }
    return null;
};

/** The right-hand side of `const <name> = "…";`, including a `+`-continued literal. */
const stringLiteral = (text, name) => {
    const head = new RegExp(`const\\s+${name}\\s*(?::[^=]*)?=\\s*`).exec(text);
    if (!head) return null;
    const rest = text.slice(head.index + head[0].length);
    const parts = [];
    const re = /^\s*"((?:[^"\\]|\\.)*)"\s*(\+)?/;
    let cursor = rest;
    for (;;) {
        const m = re.exec(cursor);
        if (!m) break;
        parts.push(unescapeJs(m[1]));
        if (!m[2]) break;
        cursor = cursor.slice(m[0].length);
    }
    return parts.length === 0 ? null : parts.join("");
};

/** GROUND-A: the empty-argument cross-product, 21 heads × 10 fillings. */
const groundA = () => {
    const text = read(CAND_F_TOTALITY);
    const heads = must(stringArrayLiteral(text, "heads"), "GROUND-A heads");
    const fillings = must(stringArrayLiteral(text, "fillings"), "GROUND-A fillings");
    expect(heads.length, 21, "GROUND-A heads");
    expect(fillings.length, 10, "GROUND-A fillings");
    const inputs = [];
    for (const head of heads) for (const fill of fillings) inputs.push(`${head}(${fill})`);
    return {
        id: "ground-a",
        provenance: `${CAND_F_TOTALITY}:60-71 — the 21×10 empty-argument cross-product, heads and fillings extracted from the fixture`,
        declared: 210,
        inputs,
    };
};

/**
 * cand-F's 4,000-case mutation fuzz. The DATA (alphabet, seed strings, PRNG seed, case count) is
 * read out of the fixture; the ALGORITHM — truncate at a random cut, or substitute one character
 * at it — is restated here over the fresh root's own `mulberry32`. `CHARS` is a CODE-POINT split,
 * exactly as the fixture splits it, so the astral character stays whole.
 */
const fuzzF = () => {
    const text = read(CAND_F_TOTALITY);
    const alphabet = must(stringLiteral(text, "ALPHABET"), "cand-F fuzz ALPHABET");
    const seeds = must(stringArrayLiteral(text, "seeds"), "cand-F mutation seeds");
    const seedMatch = must(
        /const rand = mulberry32\((0x[0-9a-fA-F_]+)\);\s*\n\s*const seeds/.exec(text),
        "cand-F mutation PRNG seed",
    );
    const countMatch = must(
        /for \(let i = 0; i < ([0-9_]+); i\+\+\) \{\s*\n\s*const base = seeds/.exec(text),
        "cand-F mutation case count",
    );
    const prngSeed = Number(seedMatch[1].replace(/_/g, ""));
    const cases = Number(countMatch[1].replace(/_/g, ""));
    expect(cases, 4000, "cand-F mutation case count");

    const CHARS = [...alphabet];
    const rand = mulberry32(prngSeed);
    const inputs = [];
    for (let i = 0; i < cases; i += 1) {
        const base = seeds[i % seeds.length] ?? "";
        const cut = Math.floor(rand() * (base.length + 1));
        inputs.push(
            rand() < 0.5
                ? base.slice(0, cut)
                : base.slice(0, cut) + (CHARS[Math.floor(rand() * CHARS.length)] ?? "") + base.slice(cut + 1),
        );
    }
    return {
        id: "fuzz-f",
        provenance: `${CAND_F_TOTALITY}:206-240 — mutation fuzz, mulberry32(0x${prngSeed.toString(16)}), ${seeds.length} seed strings, ${CHARS.length} code points, ${cases} cases`,
        declared: 4000,
        inputs,
    };
};

/** cand-O's replayable 30,000-row corpus — regenerated from its pin and checked against it. */
const fuzzO = () => {
    const pin = json(FUZZ_SEED_JSON);
    const rows = generateFuzzRows(FUZZ_PIN);
    expect(rows.length, FUZZ_PIN.rows, "cand-O fuzz row count");
    // THE BANKED SERIALIZATION, recovered and now written down. `fuzz-seed.json` banks
    // `rowsSha256` but no script in the tree produces it, so the digest was un-replayable from the
    // repository's own bytes until here: it is sha256 over the row SOURCES joined by NUL. Recorded
    // as finding F-a.1 rather than left as folklore — a pin nobody can recompute is not a pin.
    const digest = createHash("sha256").update(rows.map((r) => r.src).join("\0")).digest("hex");
    if (pin.rowsSha256 && digest !== pin.rowsSha256) {
        throw new Error(
            `corpus: the cand-O fuzz replay drifted — banked ${pin.rowsSha256}, replayed ${digest}`,
        );
    }
    return {
        id: "fuzz-o",
        provenance: `${path.join(P2_ROOT, "experiments/w2/corpus/fuzz-gen.mjs")} — mulberry32 seed 0x${FUZZ_PIN.seed.toString(16)}, ${FUZZ_PIN.rows} rows, replay sha256 ${digest.slice(0, 16)} matches the banked pin`,
        declared: FUZZ_PIN.rows,
        inputs: rows.map((r) => r.src),
        hints: rows.map((r) => ({ src: r.src, prod: r.prod, family: r.family })),
    };
};

/** The 148 named colours of css-color-4, read from the fetched fixture. */
const namedColors = () => {
    const fixture = json(NAMED_COLORS_JSON);
    const names = must(fixture.names, "named colours");
    expect(names.length, fixture.count, "named colour count against the fixture's own count");
    expect(names.length, 148, "named colours");
    return {
        id: "named",
        provenance: `${NAMED_COLORS_JSON} — ${fixture.count} names, ${fixture.source}, fetched ${fixture.fetched}`,
        declared: 148,
        inputs: names,
    };
};

/** The 403-string P-1 corpus — the equivalence arm's own pilot corpus. */
const p1 = () => {
    const corpus = json(P1_CORPUS_JSON);
    const items = must(corpus.items, "P-1 corpus items");
    expect(items.length, corpus.size, "P-1 size against the corpus's own count");
    expect(items.length, 403, "P-1 corpus");
    return {
        id: "p1",
        provenance: `${P1_CORPUS_JSON} — ${corpus.size} strings, generated ${corpus.generatedAt}`,
        declared: 403,
        inputs: items.map((i) => i.source),
        hints: items.map((i) => ({ src: i.source, prod: i.hint })),
    };
};

/** The 172-input R1 corpus, plus the 7 declared non-string boundary cases beside it. */
const r1 = () => {
    const corpus = json(R1_CORPUS_JSON);
    const inputs = must(corpus.inputs, "R1 inputs");
    expect(inputs.length, corpus.counts.inputs, "R1 count against the corpus's own count");
    expect(inputs.length, 172, "R1 corpus");
    return {
        id: "r1",
        provenance: `${R1_CORPUS_JSON} — ${corpus.counts.inputs} inputs + ${corpus.counts.boundary} declared non-string boundary cases, derived from audit/probes/r1-published-totality.mjs:38-43`,
        declared: 172,
        inputs,
        boundary: corpus.boundary,
    };
};

/** Every arm, in the order `W3.md` §5 `.a` names them. */
export const ARMS = [groundA, fuzzF, fuzzO, namedColors, p1, r1];

/**
 * Fold the six arms into one set. Row shape: `{ i, s, bands, prods }` — `i` is the row's index in
 * this corpus, `s` the input string, `bands` every arm it came from, `prods` every production hint
 * any arm attached to it.
 */
export const buildUnion = () => {
    const arms = ARMS.map((arm) => arm());
    const byInput = new Map();
    const hintFor = new Map();
    for (const arm of arms) {
        for (const hint of arm.hints ?? []) {
            if (!hint.prod) continue;
            const set = hintFor.get(hint.src) ?? new Set();
            set.add(hint.prod);
            hintFor.set(hint.src, set);
        }
    }
    for (const arm of arms) {
        for (const input of arm.inputs) {
            const row = byInput.get(input);
            if (row) row.bands.add(arm.id);
            else byInput.set(input, { s: input, bands: new Set([arm.id]) });
        }
    }
    const rows = [...byInput.values()].map((row, i) => ({
        i,
        s: row.s,
        bands: [...row.bands].sort(),
        prods: [...(hintFor.get(row.s) ?? [])].sort(),
    }));

    const boundary = arms.find((a) => a.id === "r1")?.boundary ?? [];

    return {
        schema: "x-p-w3.a.corpus/1",
        note:
            "THE UNION of the six folded arms (W3.md §5 .a), de-duplicated by input string. Every row " +
            "carries every arm it came from. Generated by scripts/css-universe.mjs; never hand-edited — " +
            "`--check` re-derives it and fails on any disagreement.",
        generatedBy: "typescript/scripts/css-universe.mjs",
        arms: arms.map((a) => ({
            id: a.id,
            declared: a.declared,
            read: a.inputs.length,
            provenance: a.provenance,
        })),
        counts: {
            armTotal: arms.reduce((n, a) => n + a.inputs.length, 0),
            union: rows.length,
            overlap: arms.reduce((n, a) => n + a.inputs.length, 0) - rows.length,
            boundary: boundary.length,
        },
        /** The declared non-string boundary cases. Not strings, so not union rows — `.c`'s G-3 leg. */
        boundary,
        rows,
        rowsSha256: sha256(JSON.stringify(rows)),
    };
};
