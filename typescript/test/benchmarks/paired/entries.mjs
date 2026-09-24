// Parser-core paired entries (X.P.W7 .p, gate P-5).
//
// Each entry is a factory over a parse-that library object, so the SAME
// grammar text is built once per arm (candidate 2.x vs the published 0.8.2)
// inside one process. `inputs` are deterministic; `run(g, inputs)` is one
// pass unit. `span` is the only entry whose API differs between arms: 2.x's
// `mapSpan` against 0.8.2's `mapState`, computing the identical product.

function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function jsonDoc(r, depth) {
    const k = Math.floor(r() * 6);
    if (depth > 3 || k < 2) return Math.floor(r() * 1e6) / 100;
    if (k === 2) return `s${Math.floor(r() * 1e4)}`;
    if (k === 3) return r() < 0.5;
    if (k === 4) return Array.from({ length: 1 + Math.floor(r() * 5) }, () => jsonDoc(r, depth + 1));
    const o = {};
    for (let i = 0; i < 1 + Math.floor(r() * 5); i++) o[`k${i}`] = jsonDoc(r, depth + 1);
    return o;
}

function words(r, n, alphabet) {
    return Array.from({ length: n }, () => {
        let w = "";
        const len = 2 + Math.floor(r() * 6);
        for (let i = 0; i < len; i++) w += alphabet[Math.floor(r() * alphabet.length)];
        return w;
    });
}

export const ENTRIES = {
    json: {
        build({ Parser, regex, string, dispatch }) {
            const comma = string(",").trim();
            const colon = string(":").trim();
            const jsonNull = string("null").map(() => null);
            const jsonBool = string("true").or(string("false")).map((v) => v === "true");
            const jsonNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/).map(Number);
            const jsonString = regex(/"(?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/).map(
                (s) => (s.indexOf("\\") === -1 ? s.slice(1, -1) : JSON.parse(s)),
            );
            const jsonArray = Parser.lazy(() => jsonValue.sepBy(comma).trim().wrap(string("["), string("]")));
            const jsonObject = Parser.lazy(() =>
                jsonString.skip(colon).then(jsonValue.trim()).sepBy(comma).trim()
                    .wrap(string("{"), string("}")).map((pairs) => Object.fromEntries(pairs)),
            );
            const jsonValue = dispatch({
                "{": jsonObject, "[": jsonArray, '"': jsonString, "-": jsonNumber,
                "0-9": jsonNumber, t: jsonBool, f: jsonBool, n: jsonNull,
            });
            return jsonValue.trim();
        },
        inputs() {
            const r = rng(7);
            return Array.from({ length: 64 }, () => JSON.stringify(jsonDoc(r, 0), null, 1));
        },
    },
    sequence: {
        build({ all, regex, string }) {
            return all(regex(/[a-z]+/), string("="), regex(/[0-9]+/), string(";")).many(1);
        },
        inputs() {
            const r = rng(11);
            return Array.from({ length: 64 }, () =>
                words(r, 24, "abcdefgh").map((w, i) => `${w}=${i * 7};`).join(""));
        },
    },
    choice: {
        // Ordered choice whose early arms fail on most tokens: the per-arm
        // failure path (error bookkeeping) dominates.
        build({ any, regex, string }) {
            const word = any(string("alpha"), string("beta"), string("gamma"), string("delta"), regex(/[a-z]+/));
            return word.sepBy(string(" "), 1);
        },
        inputs() {
            const r = rng(13);
            return Array.from({ length: 64 }, () => words(r, 32, "abcdefghijklmnop").join(" "));
        },
    },
    reject: {
        // Whole parses that FAIL: the top-level failure path.
        build({ all, regex, string }) {
            return all(string("("), regex(/[0-9]+/).sepBy(string(","), 1), string(")"));
        },
        inputs() {
            const r = rng(17);
            return Array.from({ length: 256 }, () => `(${words(r, 3, "0123456789").join(",")}x)`);
        },
    },
    recursion: {
        // Lazy-recursive arithmetic: the lazy trampoline on every level.
        build({ Parser, regex, string, any }) {
            const num = regex(/[0-9]+/).map(Number);
            const atom = Parser.lazy(() => any(num, sum.wrap(string("("), string(")"))));
            const product = Parser.lazy(() => atom.sepBy(string("*"), 1)
                .map((xs) => xs.reduce((a, b) => (a * b) % 1000003, 1)));
            const sum = Parser.lazy(() => product.sepBy(string("+"), 1)
                .map((xs) => xs.reduce((a, b) => (a + b) % 1000003, 0)));
            return sum;
        },
        inputs() {
            const r = rng(19);
            const expr = (d) => {
                const n = 1 + Math.floor(r() * 3);
                return Array.from({ length: n }, () => {
                    const m = 1 + Math.floor(r() * 3);
                    return Array.from({ length: m }, () =>
                        d < 5 && r() < 0.35 ? `(${expr(d + 1)})` : String(Math.floor(r() * 100))).join("*");
                }).join("+");
            };
            return Array.from({ length: 64 }, () => expr(0));
        },
    },
    recovery: {
        // 90/10 recovery: one statement in ten is malformed and recovered by
        // syncing past its terminator (the checkpoint/rollback path).
        build({ all, regex, string }) {
            const stmt = all(regex(/[a-z]+/), string("="), regex(/[0-9]+/), string(";"))
                .map((xs) => xs[0])
                .recover(regex(/[^;]*;/), "?");
            return stmt.many(1);
        },
        inputs() {
            const r = rng(29);
            return Array.from({ length: 64 }, () =>
                words(r, 24, "abcdefgh").map((w, i) => (i % 10 === 7 ? `${w}=x${i};` : `${w}=${i};`)).join(""));
        },
    },
    span: {
        build(lib) {
            const { regex, string } = lib;
            const tok = regex(/[a-z]+/);
            const spanned = typeof tok.mapSpan === "function"
                ? tok.mapSpan((value, start, end) => ({ value, start, end }))
                : tok.mapState((next, prev) => next.ok({ value: next.value, start: prev.offset, end: next.offset }));
            return spanned.sepBy(string(" "), 1);
        },
        inputs() {
            const r = rng(23);
            return Array.from({ length: 64 }, () => words(r, 32, "abcdefghij").join(" "));
        },
    },
};

export function run(parser, inputs) {
    let sink = 0;
    for (let i = 0; i < inputs.length; i++) {
        const v = parser.parse(inputs[i]);
        sink += v === undefined ? 1 : 2;
    }
    return sink;
}
