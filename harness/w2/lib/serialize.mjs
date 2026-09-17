// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — THE CANONICAL STRUCTURAL SERIALIZATION, ONE FUNCTION PER PRODUCT, NEVER PER CANDIDATE
// (`ALGEBRA.md` §6: "The serializer is one function in the harness (`.g`'s), never per candidate").
//
// Two falsifiers the comparison itself must survive, both named at §6 and both wired here:
//
//   EQ-1 under `===` passes a candidate that disagrees on `-0`, and a payload-sensitive f64 form
//   KILLS a correct pair on Wasm's nondeterministic NaN payloads. So: every f64 is its 8 bytes
//   big-endian, EVERY NaN canonicalized to 7FF8000000000000, and `-0` preserved — which is exactly
//   `Object.is` per channel, expressed as bytes (F-R2's ruling).
//
//   EQ-4 by rendered string differs by number formatting alone and EQ-4 by label SET hides ordering
//   drift. So: `(code, start, end, n, labelIdx × n, actualTag)` in journal order, labels as indices
//   into the lowering's own L (the string form is kept beside it for the third cell, which has no L).
//
// DECLARED DIVERGENCE FROM THE CONTRACT'S LETTER, recorded rather than silent: §6 EQ-1 says the walk
// is "frozen-type-directed, field order = the frozen type's declaration order (`types.ts`)". The
// harness is not given the frozen declaration order at run time, and re-deriving `types.ts` here
// would put a second copy of the frozen surface in the harness. Keys are therefore emitted in
// lexicographic order. The equality relation is unchanged: for two values with the same field set,
// any fixed total order on field names induces the same equality, and a field-set difference is
// caught by the emitted key list either way. The key INSERTION order is not thrown away — it is
// digested separately and printed as a NOTE (it is EQ-3's subject, not EQ-1's).

import { createHash } from "node:crypto";

const enc = new TextEncoder();
const NAN_CANON = "7ff8000000000000";

function f64Hex(n) {
    if (Number.isNaN(n)) return NAN_CANON;
    const buf = Buffer.allocUnsafe(8);
    buf.writeDoubleBE(n, 0);
    return buf.toString("hex");
}

/** Length-prefixed UTF-8, so "a","bc" and "ab","c" cannot serialize alike. */
function str(s) {
    const b = enc.encode(s);
    return `s${b.length}:${Buffer.from(b).toString("hex")}`;
}

/* ── EQ-1 — the semantic value V ──────────────────────────────────────────────────────────── */

export function serializeV(v) {
    if (v === undefined) return "⊥"; //                         the failure carrier, one tag
    if (v === null) return "null";
    if (typeof v === "number") return `f${f64Hex(v)}`;
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "string") return v === "none" ? "none#tag" : str(v);
    if (typeof v === "bigint") return `i${v.toString(16)}`;
    if (Array.isArray(v)) return `[${v.map(serializeV).join(",")}]`;
    if (typeof v === "object") {
        const keys = Object.keys(v).sort();
        return `{${keys.map((k) => `${str(k)}=${serializeV(v[k])}`).join(",")}}`;
    }
    return `?${typeof v}`; //                                    a carrier kind 𝒦 does not admit
}

/** The key insertion order, digested — EQ-3's subject, printed as a NOTE beside EQ-1. */
export function keyOrderDigest(v, acc = []) {
    if (Array.isArray(v)) v.forEach((x) => keyOrderDigest(x, acc));
    else if (v && typeof v === "object") {
        acc.push(Object.keys(v).join("|"));
        for (const k of Object.keys(v)) keyOrderDigest(v[k], acc);
    }
    return sha(acc.join("/"));
}

/* ── EQ-2 — the byte complement C ─────────────────────────────────────────────────────────── */

export const K_C = ["ws", "comment", "punct", "keyword", "skipped", "residue"]; // §4.5, in order

export function serializeC(C = []) {
    return C.map(([offset, length, kind]) => {
        const k = K_C.indexOf(kind);
        return `${u32(offset)}${u32(length)}${u8(k < 0 ? 255 : k)}`;
    }).join("");
}

/* ── EQ-3 — provenance P ──────────────────────────────────────────────────────────────────── */

export function serializeP(P = []) {
    return P.map(([start, end]) => `${u32(start)}${u32(end)}`).join("");
}

/* ── EQ-4 — the diagnostic journal D ──────────────────────────────────────────────────────── */

/** The frozen 8 codes, in `types.ts:12-19` order — a ninth code is a value.js change, not a W2 act. */
export const CODES = [
    "css_syntax", "trailing_input", "keyframe_selector_invalid", "color_context_required",
    "syntax_descriptor_invalid", "syntax_mismatch", "animation_option_invalid", "timeline_option_invalid",
];

export function serializeD(D = [], labels = null) {
    return D.map((d) => {
        const code = CODES.indexOf(d.code);
        const exp = d.expected ?? [];
        const idx = exp.map((l) => (labels ? labels.indexOf(l) : -1));
        const actualTag = d.actual === null || d.actual === undefined ? 0 : 1;
        return `${u8(code < 0 ? 255 : code)}${u32(d.start)}${u32(d.end)}${u16(exp.length)}${idx
            .map((i) => u16(i < 0 ? 65535 : i))
            .join("")}${u8(actualTag)}`;
    }).join("");
}

/** The same journal as strings — for the third cell, which ships no label index. */
export function serializeDStrings(D = []) {
    return D.map((d) => `${d.code}@${d.start}:${d.end}[${(d.expected ?? []).join("|")}]${d.actual === null || d.actual === undefined ? "-" : "+"}`).join(";");
}

/* ── EQ-5 — rollback ──────────────────────────────────────────────────────────────────────── */

export function serializeMarks(marks = []) {
    return marks
        .map((m) => `${m.site}@${m.at}:${(m.mark ?? []).join(",")}->${(m.restored ?? []).join(",")}`)
        .join(";");
}

/** Per-site exactness: the restored tuple must equal the mark, coordinate by coordinate. */
export function rollbackMismatches(marks = []) {
    const bad = [];
    for (const m of marks) {
        const a = m.mark ?? [];
        const b = m.restored ?? [];
        const coords = ["i", "lenC", "lenP", "lenD", "depth", "arena"];
        for (let k = 0; k < coords.length; k++) {
            if (a[k] !== b[k]) bad.push({ site: m.site, at: m.at, coord: coords[k], mark: a[k], restored: b[k] });
        }
    }
    return bad;
}

/* ── EQ-6 / COMP-1 — the tiling, decomposed so a violation names its sub-condition ─────────── */

export function comp1(source, C = [], P = []) {
    const spans = [
        ...C.map(([o, l, k]) => ({ start: o, end: o + l, owner: `C:${k}` })),
        ...P.map(([s, e]) => ({ start: s, end: e, owner: "P" })),
    ].sort((x, y) => x.start - y.start || x.end - y.end);

    const failures = [];
    let cursor = 0;
    for (const s of spans) {
        if (!(s.end > s.start)) failures.push({ law: "COMP-1c", detail: `empty or inverted span [${s.start}, ${s.end}) owned by ${s.owner}` });
        if (s.start < cursor) failures.push({ law: "COMP-1b", detail: `overlap at byte ${s.start} (owner ${s.owner} re-covers a byte already owned)` });
        else if (s.start > cursor) failures.push({ law: "COMP-1a", detail: `uncovered bytes [${cursor}, ${s.start}) — first at ${cursor}` });
        cursor = Math.max(cursor, s.end);
    }
    if (cursor < source.length) failures.push({ law: "COMP-1a", detail: `uncovered tail [${cursor}, ${source.length})` });
    if (cursor > source.length) failures.push({ law: "COMP-1c", detail: `a span runs past the input (${cursor} > ${source.length})` });

    // COMP-1c's kind fidelity: every C entry's bytes must satisfy its kind's predicate π_k (§4.5).
    for (const [o, l, k] of C) {
        const bytes = source.slice(o, o + l);
        if (!kindPredicate(k, bytes)) {
            failures.push({ law: "COMP-1c", detail: `kind '${k}' over ${JSON.stringify(bytes)} at ${o} fails π_${k}` });
        }
    }
    return { ok: failures.length === 0, failures, tiling: spans, covered: cursor };
}

/** §4.5's six predicates, the ruler the kind column is measured with. */
export function kindPredicate(kind, bytes) {
    switch (kind) {
        case "ws":
            return /^[ \t\n\r\f]+$/.test(bytes);
        case "comment":
            return /^\/\*[\s\S]*?\*\/$/.test(bytes) && !bytes.slice(2, -2).includes("/*");
        case "punct":
            return bytes.length === 1 && "(),/%#;:{}[]!".includes(bytes);
        case "keyword":
            return /^[A-Za-z][A-Za-z0-9_-]*$/.test(bytes);
        case "skipped":
        case "residue":
            return bytes.length >= 1;
        default:
            return false; //                                     a seventh kind is a finding (§4.5)
    }
}

/* ── the product digest a probe compares cell to cell ──────────────────────────────────────── */

export function productDigest(product, labels = null) {
    return {
        "EQ-1": sha(serializeV(product.V)),
        "EQ-2": sha(serializeC(product.C)),
        "EQ-3": sha(serializeP(product.P)),
        "EQ-4": sha(serializeD(product.D, labels)),
        "EQ-5": sha(serializeMarks(product.marks)),
        keyOrder: keyOrderDigest(product.V),
        dStrings: serializeDStrings(product.D),
    };
}

/* ── primitives ───────────────────────────────────────────────────────────────────────────── */

function u8(n) {
    return (n & 0xff).toString(16).padStart(2, "0");
}
function u16(n) {
    return (n & 0xffff).toString(16).padStart(4, "0");
}
function u32(n) {
    return (n >>> 0).toString(16).padStart(8, "0");
}
export function sha(s) {
    return createHash("sha256").update(String(s)).digest("hex");
}
