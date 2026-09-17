// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — THE THREE LEGS, AND THE DECLARED DEPTH (W1.md §5.d.3, §3 items 5-7, G-9).
//
// THREE LEGS, KEPT SEPARATE — never summed, never averaged (W1.md §5.d.3):
//
//   shared-accepted     inputs EVERY engine accepts. The only leg on which a cross-engine
//                       ratio is a like-for-like reading.
//   reject-non-throwing inputs an engine refuses by RETURNING a failure. Its own leg because
//                       the adjudication's DEBT-2 makes it one: cand-F fails ~1.3-1.4x faster
//                       than cand-O, and a harness that averages the legs hides the only axis
//                       on which the incumbent regex engine genuinely wins.
//   r1-throw-class      the degenerate cross-product on which published 4.0.0's parseCssColor
//                       CRASHES (R1). Its own leg because a thrown exception is not a parse
//                       failure, and timing them together would price a defect as a feature.
//
// G-9 — DEPTH IS DECLARED, NOT DISCOVERED. `Parser.lazy` has no depth-bound parameter
// (arity 1) and its ceiling failure is a THROWN `RangeError`, not an `ok:false`. So an input
// near the ceiling does not report, it kills the cell. Every corpus here therefore declares
// its maximum nesting depth, computed BY SCRIPT from the corpus bytes (`maxDepth` below), and
// `census.mjs` asserts that depth against the ceiling it MEASURES at its own clock with the
// margin printed. The ceiling is stack-shape dependent and must never be inherited: W1.md
// records 7,761 (O-15 PT-04), this wave's own open measured 7,759 (finding F-1), and a
// process with a different module graph measures different again. The margin is the assertion.

/** The R1 degenerate cross-product — DERIVED exactly as `r1-published-totality.mjs` derives
 *  it (that probe's `NAMES`/`BODIES`/base set, transcribed as data, not as a count), so this
 *  leg's identity is the probe's identity and the throw count is comparable to the probe's. */
const R1_NAMES = [
    "rgb", "rgba", "hsl", "hsla", "lab", "lch", "oklab", "oklch", "color", "hwb",
    "scroll", "view", "cubic-bezier", "steps", "linear", "var", "calc", "translate",
];
const R1_BODIES = ["()", "( )", "(/)", "(,)", "(/ )", "( / )", "(,,)", "(/ / )", "( ,)"];
const R1_BASE = ["", "  ", "/", ",", "()", "(", ")", "null", "undefined", "NaN"];

function r1Corpus() {
    const set = new Set(R1_BASE);
    for (const n of R1_NAMES) for (const b of R1_BODIES) set.add(n + b);
    return [...set].map((src, i) => ({ id: `r1-${i}`, kind: "color", src }));
}

/** Maximum bracket-nesting depth of a string, over the three CSS bracket pairs. */
export function maxDepth(s) {
    const open = { "(": ")", "[": "]", "{": "}" };
    const close = { ")": "(", "]": "[", "}": "{" };
    const stack = [];
    let deepest = 0;
    for (const ch of s) {
        if (open[ch]) {
            stack.push(ch);
            if (stack.length > deepest) deepest = stack.length;
        } else if (close[ch]) {
            if (stack[stack.length - 1] === close[ch]) stack.pop();
        }
    }
    return deepest;
}

export const LEGS = {
    // Every item here is accepted by published-4.0.0, c14 AND deposed. `census.mjs` proves
    // that rather than trusting it, and refuses to time the leg if any engine disagrees —
    // the ported bench's own rule ("refusing to time a failing parse"), kept.
    "shared-accepted": [
        { id: "acc-color-1", kind: "color", src: "oklch(62.8% .257 29.23 / 85%)" },
        { id: "acc-color-2", kind: "color", src: "oklch(80% .1 250)" },
        { id: "acc-easing-1", kind: "easing", src: "cubic-bezier(0.42, 0, 0.58, 1)" },
        { id: "acc-easing-2", kind: "easing", src: "cubic-bezier(.25, .1, .25, 1)" },
        {
            id: "acc-sheet-1",
            kind: "sheet",
            src: ".a { color: oklch(62.8% .257 29.23 / 85%); }",
        },
        {
            id: "acc-sheet-2",
            kind: "sheet",
            src: ".b:hover { animation-timing-function: cubic-bezier(.25, .1, .25, 1); }",
        },
        {
            id: "acc-sheet-3",
            kind: "sheet",
            src: ".c { color: oklch(80% .1 250); animation-timing-function: cubic-bezier(.4, 0, .2, 1); }",
        },
    ],

    // Well-formed-looking but invalid. The leg's contract is per engine and MEASURED:
    // an engine is timed here only if it rejects every item and throws on none.
    "reject-non-throwing": [
        { id: "rej-color-1", kind: "color", src: "oklch(" },
        { id: "rej-color-2", kind: "color", src: "not-a-color-at-all" },
        { id: "rej-color-3", kind: "color", src: "#ggg" },
        { id: "rej-color-4", kind: "color", src: "rgb(1 2" },
        { id: "rej-easing-1", kind: "easing", src: "cubic-bezier(a, b, c, d)" },
        { id: "rej-easing-2", kind: "easing", src: "cubic-bezier(" },
        // NOT `@@@ { }`: published 4.0.0's parseStylesheet ACCEPTS that string (it tolerates
        // an unknown at-rule) while cand-O's rejects it. Measured at this seat's clock, and
        // left to the equivalence oracle, which is where an accept/reject divergence between
        // the two engines belongs — putting it in a REJECT corpus would have made the leg
        // silently un-shared, which is exactly how the census caught it.
        { id: "rej-sheet-1", kind: "sheet", src: "{{{" },
        { id: "rej-sheet-2", kind: "sheet", src: "}{" },
        { id: "rej-sheet-3", kind: "sheet", src: ".a { color: oklch(62.8%" },
    ],

    "r1-throw-class": r1Corpus(),
};

/** The co-scaling normaliser's payload — the ported bench's `jsonPayload`, byte-for-byte. */
export const JSON_PAYLOAD = JSON.stringify({
    a: 1,
    b: [1, 2, 3, 4, 5],
    c: "hello world",
    d: { x: 1.5, y: 2.5, z: [true, false, null] },
    e: "oklch(0.5 0.1 200)",
    f: Array.from({ length: 12 }, (_, i) => i * 1.1),
});

export const NORMALISER_LEG = [{ id: "json-1", kind: "json", src: JSON_PAYLOAD }];

export function legOf(name) {
    if (name === "json-normaliser") return NORMALISER_LEG;
    const leg = LEGS[name];
    if (!leg) throw new Error(`unknown leg ${name}`);
    return leg;
}

/** Every corpus's declared depth, bytes and item count — the G-9 declaration itself. */
export function depthDeclaration() {
    const rows = [];
    for (const [name, items] of [
        ...Object.entries(LEGS),
        ["json-normaliser", NORMALISER_LEG],
    ]) {
        const depths = items.map((i) => maxDepth(i.src));
        rows.push({
            corpus: name,
            items: items.length,
            bytes: items.reduce((s, i) => s + Buffer.byteLength(i.src, "utf8"), 0),
            declaredMaxDepth: Math.max(0, ...depths),
            deepestItem: items[depths.indexOf(Math.max(0, ...depths))]?.id ?? null,
            allStrings: items.every((i) => typeof i.src === "string"),
        });
    }
    return rows;
}
