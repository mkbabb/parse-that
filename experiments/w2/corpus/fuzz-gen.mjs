// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — THE REPLAYABLE SEED-PINNED FUZZ CORPUS (cand-O's mulberry32 shape, 30,000 rows).
//
// `ALGEBRA.md` §1 C-CORP admits "cand-O's replayable mulberry32 corpus (30,000 rows, seed pinned
// by `.g`)". The seed is pinned in FUZZ_PIN below and the rows are NOT stored: a corpus that is
// regenerated from a seed is replayable by construction, and `corpus/fuzz-seed.json` banks the
// sha256 of the generated row list so a replay that drifts is caught rather than trusted.
//
// The generator emits over the SLICE's own productions (§10) and nothing else — C-CORP forbids a
// corpus that is not a declared subset of the universe plus the adjudicated fixtures. Roughly half
// the rows are malformed by construction: EQ-6 (the malformed inverse) and D-1 (named expectations)
// are the products with the most surface to disagree on, and a fuzz corpus of only well-formed
// inputs would exercise neither.
//
// NO EXPECTED VALUES. Each row is `{ id, prod, family, src }`.

export const FUZZ_PIN = {
    generator: "mulberry32",
    seed: 0x5eed_c0de,
    rows: 30000,
    mix: { "P:color": 0.6, "P:timing-function": 0.2, "P:stylesheet": 0.2 },
    malformedShare: "~1/2 by construction (the mutation arm)",
    contract: "ALGEBRA.md §1 C-CORP · §10 the shared slice",
};

/** mulberry32 — 32-bit, one multiply-xorshift round; the canonical replayable JS PRNG. */
export function mulberry32(a) {
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const HEX = "0123456789abcdefABCDEF";
const HUE_UNITS = ["", "deg", "grad", "rad", "turn"];
const COLOR_HEADS = ["rgb", "rgba", "hsl", "hsla", "oklch", "var"];
const TIMING_KEYWORDS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end"];
const JUMPS = ["jump-start", "jump-end", "jump-none", "jump-both", "start", "end"];
const NAMED = ["red", "blue", "rebeccapurple", "transparent", "currentcolor", "aliceblue", "chocolate"];
/** The mutation alphabet: every byte class the six complement kinds and the slice's terminals see. */
const MUTATE = ["", " ", "  ", ",", "/", "%", "(", ")", ".", "-", "+", "e", "none", "\t", ";", "{", "}", "!"];

export function generateFuzzRows(pin = FUZZ_PIN) {
    const rnd = mulberry32(pin.seed);
    const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
    const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

    /** A number token from the whole <number-token> space, including the edges the contract names. */
    const num = () => {
        const shape = int(0, 9);
        if (shape === 0) return String(int(-400, 400));
        if (shape === 1) return `${int(0, 100)}.${int(0, 999)}`;
        if (shape === 2) return `.${int(0, 999)}`;
        if (shape === 3) return `${int(0, 9)}.`; //             not a <number> (band L94)
        if (shape === 4) return `${int(0, 9)}e${int(-500, 500)}`; // 1e400 reaches ±Infinity
        if (shape === 5) return `-0`;
        if (shape === 6) return `+${int(0, 100)}`;
        if (shape === 7) return `${int(0, 100)}%`;
        if (shape === 8) return "none";
        return String(rnd() * 300 - 100);
    };

    const color = () => {
        const shape = int(0, 6);
        if (shape === 0) return `#${Array.from({ length: pick([3, 4, 6, 8]) }, () => pick(HEX.split(""))).join("")}`;
        if (shape === 1) return pick(NAMED);
        if (shape === 2) return `rgb(${num()} ${num()} ${num()}${rnd() < 0.4 ? ` / ${num()}` : ""})`;
        if (shape === 3) return `rgb(${num()}, ${num()}, ${num()}${rnd() < 0.4 ? `, ${num()}` : ""})`;
        if (shape === 4) return `hsl(${num()}${pick(HUE_UNITS)} ${num()} ${num()}${rnd() < 0.4 ? ` / ${num()}` : ""})`;
        if (shape === 5) return `oklch(${num()} ${num()} ${num()}${pick(HUE_UNITS)}${rnd() < 0.4 ? ` / ${num()}` : ""})`;
        return `var(--${pick(["a", "brand", "x-y", "z"])}${rnd() < 0.3 ? `, ${pick(NAMED)}` : ""})`;
    };

    const timing = () => {
        const shape = int(0, 3);
        if (shape === 0) return pick(TIMING_KEYWORDS);
        if (shape === 1) return `cubic-bezier(${num()}, ${num()}, ${num()}, ${num()})`;
        if (shape === 2) return `steps(${num()}${rnd() < 0.6 ? `, ${pick(JUMPS)}` : ""})`;
        const stops = Array.from({ length: int(1, 4) }, () => `${num()}${rnd() < 0.4 ? ` ${num()}%` : ""}`);
        return `linear(${stops.join(", ")})`;
    };

    const sheet = () => {
        const rules = Array.from(
            { length: int(1, 3) },
            () => `${pick(["a", "b", ".c", "#d", "a, b"])} { ${pick(["color", "background-color", "border-color"])}: ${color()}${rnd() < 0.2 ? " !important" : ""} }`,
        );
        const garbage = rnd() < 0.5 ? ` ${pick(["GARBAGE ) ;", "@@ ;", "} ;", "!!! ;"])} ` : " ";
        return rules.join(garbage);
    };

    /** The mutation arm — one byte-level edit, the class every malformed row in the slice lives in. */
    const mutate = (s) => {
        const at = int(0, Math.max(0, s.length - 1));
        const op = int(0, 3);
        if (op === 0) return s.slice(0, at) + pick(MUTATE) + s.slice(at);
        if (op === 1) return s.slice(0, at) + s.slice(at + 1);
        if (op === 2) return s.slice(0, at) + pick(MUTATE) + s.slice(at + 1);
        return s.slice(0, at);
    };

    const rows = [];
    const prods = ["P:color", "P:timing-function", "P:stylesheet"];
    const cuts = [pin.mix["P:color"], pin.mix["P:color"] + pin.mix["P:timing-function"], 1];
    while (rows.length < pin.rows) {
        const u = rnd();
        const prod = prods[cuts.findIndex((c) => u < c)] ?? "P:color";
        let src = prod === "P:color" ? color() : prod === "P:timing-function" ? timing() : sheet();
        const malformed = rnd() < 0.5;
        if (malformed) src = mutate(src);
        // The slice's declared restriction: an '@' prelude is outside P:stylesheet's corpus (§10.3).
        if (prod === "P:stylesheet" && /(^|\s)@/.test(src)) continue;
        rows.push({
            id: `f${String(rows.length).padStart(5, "0")}`,
            prod,
            family: malformed ? "fuzz-malformed" : "fuzz-wellformed",
            src,
        });
    }
    return rows;
}
