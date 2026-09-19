// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.k — A CSS TOKEN READER FOR THE ADJUDICATION CLASSES (COHESION §0s **E-h2**).
//
// E-h2's finding, at the bytes: "G-1's oracle override matches LITERAL inputs (`matrix.mjs:120`)
// while the rulings it encodes are CLASSES (PB-03 hsl-100× · PB-04/05 clamp · PB-08 rewrite ·
// PB-12 trailing-dot · ADJ-2 juxtaposition …)". A class needs a reading of the input that is
// INDEPENDENT OF BOTH ENGINES — asking either parser what an input "is" would make the
// classification circular, which is the same law `lib/shape.mjs` states for the declared shape.
//
// So this file reads the input the way css-syntax-3 §4 does, and it reads NOTHING ELSE: it answers
// "which tokens are here, what units do they carry, and where does each one start and end". It
// knows no colour, no function semantics and no verdict. The classes in `adjudications.mjs` are
// built out of these answers plus the ORACLE's own measured reading; the candidate is never asked.
//
// THREE RULES OF THE SPECIFICATION ARE LOAD-BEARING HERE, and each is named where it is used:
//   §4.3.9  an ident starts with a letter, `_`, a non-ASCII code point, an escape, or a `-` that is
//           ITSELF followed by one of those. `-0` therefore does NOT start an ident, which is why
//           `rgb(255-0 …)` is two numeric tokens (ADJ-2's class) and not one dimension token.
//   §4.3.3  a numeric token followed with no whitespace by an ident-start consumes that ident as
//           its UNIT — one <dimension-token>. `120deg50` is ONE (invalid) token, not `120deg`
//           beside `50`, which is exactly X.P.W3.g's cure and is why the juxtaposition class does
//           not reach it.
//   §4.3.12 a number's decimal point must be followed by at least one digit. `1.` is not a
//           <number-token>; the reader records `trailingDot` and PB-12's class is that flag.

const WS = new Set([" ", "\t", "\n", "\r", "\f"]);
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const LETTER = /[A-Za-z_\u0080-￿]/;
const IDENT_CHAR = /[A-Za-z0-9_\u0080-￿-]/;

/** css-syntax-3 §4.3.9 — "would start an ident sequence", at one position. */
const identStartsAt = (s, i) => {
    const c = s[i];
    if (c === undefined) return false;
    if (LETTER.test(c)) return true;
    if (c === "\\") return true;
    if (c === "-") {
        const n = s[i + 1];
        return n !== undefined && (LETTER.test(n) || n === "-" || n === "\\");
    }
    return false;
};

/**
 * ONE READING PER SOURCE. The ten class predicates are asked about the same input one after another
 * and the differential asks again per lowering; re-tokenizing 26,604 rows ten times over is the
 * difference between a gate that runs and a gate that exhausts the heap (measured: it did). The
 * cache is the LAST source only — the callers walk the corpus in order — so it holds one array.
 */
let cachedSource = null;
let cachedTokens = null;
export const tokenize = (src) => {
    if (src === cachedSource) return cachedTokens;
    const tokens = tokenizeUncached(src);
    cachedSource = src;
    cachedTokens = tokens;
    return tokens;
};

/**
 * The token stream. `kind` is one of `ws` · `numeric` · `ident` · `function` · `string` · `punct`;
 * a `function` token's `end` is PAST its `(`, so an argument that follows it is not adjacent to it.
 */
const tokenizeUncached = (src) => {
    const out = [];
    if (typeof src !== "string") return out;
    let i = 0;
    while (i < src.length) {
        const c = src[i];
        if (WS.has(c)) {
            let j = i;
            while (j < src.length && WS.has(src[j])) j++;
            out.push({ kind: "ws", text: src.slice(i, j), start: i, end: j });
            i = j;
            continue;
        }
        const m = NUMBER.exec(src.slice(i, i + 48));
        if (m && /\d/.test(m[0])) {
            let j = i + m[0].length;
            let unit = "";
            if (src[j] === "%") {
                unit = "%";
                j += 1;
            } else if (identStartsAt(src, j)) {
                // §4.3.3: the ident run is the token's unit, however malformed — `deg50` included.
                let k = j;
                while (k < src.length && IDENT_CHAR.test(src[k])) k++;
                unit = src.slice(j, k);
                j = k;
            }
            out.push({
                kind: "numeric",
                text: src.slice(i, j),
                number: m[0],
                value: Number(m[0]),
                unit,
                // §4.3.12: `1.` and `1.e3` are not <number-token>s.
                trailingDot: /\.$/.test(m[0]) || /\.[^0-9]/.test(m[0]),
                start: i,
                end: j,
            });
            i = j;
            continue;
        }
        if (identStartsAt(src, i)) {
            let j = i;
            while (j < src.length && IDENT_CHAR.test(src[j])) j++;
            // An ESCAPE opens an ident sequence (§4.3.9) but `\` is not an ident code point, so the
            // run above can be EMPTY. Consuming nothing here would not terminate: the reader must
            // always advance, and a lone `\` is read as the delimiter it is. (Measured: without this
            // the reader loops on `\` and exhausts the heap — the first gate run did.)
            if (j === i) {
                out.push({ kind: "punct", text: c, start: i, end: i + 1 });
                i += 1;
                continue;
            }
            const fn = src[j] === "(";
            out.push({ kind: fn ? "function" : "ident", text: src.slice(i, j), start: i, end: fn ? j + 1 : j });
            i = fn ? j + 1 : j;
            continue;
        }
        if (c === '"' || c === "'") {
            let j = i + 1;
            while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
            const e = Math.min(j + 1, src.length);
            out.push({ kind: "string", text: src.slice(i, e), start: i, end: e });
            i = e;
            continue;
        }
        out.push({ kind: "punct", text: c, start: i, end: i + 1 });
        i += 1;
    }
    return out;
};

/**
 * EVERY call in the source whose head is one of `heads`, at any depth — a colour inside a value,
 * inside a declaration, inside a stylesheet, is still the colour the ruling is about.
 *
 * Each call carries its `args` (token lists) and the `seps` BETWEEN them, in source order: `","`,
 * `"/"` or `" "`. Whitespace is a separator only when another operand follows it, so
 * `rgb( 1 2 3 )`'s outer padding is not counted as a separator and `rgb(1 2 3 / )`'s dangling
 * solidus still leaves an EMPTY final argument — which is what makes it malformed.
 */
let cachedCallKey = null;
let cachedCalls = null;
export const callsOf = (src, heads) => {
    const key = `${heads.join(",")}\u0000${src}`;
    if (key === cachedCallKey) return cachedCalls;
    const calls = callsOfUncached(src, heads);
    cachedCallKey = key;
    cachedCalls = calls;
    return calls;
};

const callsOfUncached = (src, heads) => {
    const tokens = tokenize(src);
    const wanted = new Set(heads.map((h) => h.toLowerCase()));
    const out = [];
    for (let start = 0; start < tokens.length; start++) {
        const head = tokens[start];
        if (head.kind !== "function" || !wanted.has(head.text.toLowerCase())) continue;
        let depth = 1;
        const args = [];
        const seps = [];
        let cur = [];
        let closed = false;
        let i = start + 1;
        for (; i < tokens.length; i++) {
            const t = tokens[i];
            if (t.kind === "function" || (t.kind === "punct" && t.text === "(")) depth += 1;
            if (t.kind === "punct" && t.text === ")") {
                depth -= 1;
                if (depth === 0) {
                    args.push(cur);
                    closed = true;
                    break;
                }
            }
            if (depth === 1 && t.kind === "punct" && (t.text === "," || t.text === "/")) {
                args.push(cur);
                cur = [];
                seps.push(t.text);
                continue;
            }
            if (depth === 1 && t.kind === "ws") {
                if (cur.length > 0) {
                    let n = i + 1;
                    while (n < tokens.length && tokens[n].kind === "ws") n += 1;
                    const next = n < tokens.length ? tokens[n] : undefined;
                    if (next && !(next.kind === "punct" && (next.text === "," || next.text === "/" || next.text === ")"))) {
                        args.push(cur);
                        cur = [];
                        seps.push(" ");
                    }
                }
                continue;
            }
            cur.push(t);
        }
        if (!closed) args.push(cur);
        out.push({ head: head.text.toLowerCase(), args, seps, closed, start: head.start });
    }
    return out;
};

/** The one numeric token an argument consists of — or null when it is anything else. */
export const soleNumeric = (arg) => {
    if (!arg) return null;
    const numeric = arg.filter((t) => t.kind === "numeric");
    return numeric.length === 1 && arg.every((t) => t.kind === "numeric" || t.kind === "ws") ? numeric[0] : null;
};

/** The one ident an argument consists of (`none`, `transparent`, …), or null. */
export const soleIdent = (arg) => {
    if (!arg) return null;
    const ident = arg.filter((t) => t.kind === "ident");
    return ident.length === 1 && arg.every((t) => t.kind === "ident" || t.kind === "ws") ? ident[0] : null;
};

/** css-syntax-3 §4.3.12 — a number spelled with a decimal point and no digit after it. */
export const hasTrailingDotNumber = (src) => tokenize(src).some((t) => t.kind === "numeric" && t.trailingDot);

/**
 * ADJ-2's class: two OPERAND tokens run together with nothing between them — `50%20%`, `255-0`,
 * `1.5.5`, `59%none`. A `function` token is not an operand here (its `end` is past its own `(`),
 * and a number followed by an ident-start is already ONE dimension token by §4.3.3, so this
 * predicate cannot reach `.g`'s subject.
 */
const OPERAND = new Set(["numeric", "ident", "string"]);
export const hasJuxtaposedOperands = (src) => {
    const t = tokenize(src);
    for (let i = 1; i < t.length; i++) {
        if (OPERAND.has(t[i].kind) && OPERAND.has(t[i - 1].kind) && t[i - 1].end === t[i].start) return true;
    }
    return false;
};

/** The offsets at which two operand tokens run together — ADJ-2's repair points. */
export const juxtapositionBoundaries = (src) => {
    const t = tokenize(src);
    const out = [];
    for (let i = 1; i < t.length; i++) {
        if (OPERAND.has(t[i].kind) && OPERAND.has(t[i - 1].kind) && t[i - 1].end === t[i].start) out.push(t[i].start);
    }
    return out;
};

/**
 * Apply non-overlapping `{start, end, text}` edits to a source, right to left so earlier offsets
 * stay valid. This is how an ACCEPT class asks the ORACLE its own question: "with the ruled defect
 * REPAIRED — and nothing else touched — do you still reject?"
 */
export const spliceAll = (src, edits) => {
    let out = src;
    for (const edit of [...edits].sort((a, b) => b.start - a.start)) out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
    return out;
};

/** Every numeric token whose value is not finite — `1e400`, `7e422%`. */
export const nonFiniteNumerics = (src) => tokenize(src).filter((t) => t.kind === "numeric" && !Number.isFinite(t.value));
