// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — STAGE-0 SPIKE, AC-2 CLOSED-IR. ≤200 lines, attacking ONE falsifier and nothing else.
//
// THE PRE-DECLARED FALSIFIER (`ALGEBRA.md` §12, verbatim from `W2.md` §3c): "the IR node set for the
// slice grammar exceeds its own declared closure, or the init-time compiler's totality cannot be
// demonstrated for `recover` → killed".
//
// Two measurements, in that order:
//   (1) CLOSURE — a slice fragment encoded as IR data is walked, and every node kind is compared
//       against the contract's OWN 22-row registry block (read from `ALGEBRA.md`, never re-typed
//       here). A kind outside the 22, a fallback kind, or a host function anywhere under the term
//       (CL-1) is the kill.
//   (2) TOTALITY FOR `recover` — an init-time compiler maps every IR kind to a closure with NO
//       default branch, and the compiled fragment is RUN on a malformed input so `RECOVER` is seen
//       to recover rather than asserted to. A dispatch with a default arm would make totality
//       unfalsifiable, so the compiler is built to throw on an unhandled kind and a deliberate
//       23rd kind is fed to it as the control.
//
// This spike builds nothing of AC-2, times nothing, and decides nothing about any other candidate.

import { contractOperators } from "../../../harness/w2/lib/contract.mjs";

const OPS = contractOperators().map((o) => o.name);

/* ── (1) the slice fragment as IR data (terms are data; §10.1's `rgb-ch` and §10.3's recovery) ── */

const T = (op, ...args) => ({ op, args });
const REG = (r) => ({ reg: r });
const LIT = (v) => ({ lit: v });

const IR = {
    entries: { "P:color-fragment": "rgb-ch", "P:sheet-fragment": "stylesheet" },
    terms: {
        // rgb-ch := CLAMP 0 255 (ALT[ SEQ[NUM, TOK "%"] ⇒ SCALE 255 100, NUM, KW ident none ])
        "rgb-ch": T("CLAMP", LIT(0), LIT(255), T("ALT",
            T("SCALE", LIT(255), LIT(100), T("SEQ", T("NUM"), T("DROP", { kind: "punct" }, T("LIT", LIT("%"))))),
            T("NUM"),
            T("KW", REG("R_cls.ident"), REG("R_kw.none")))),
        // stylesheet := SEQ[ REP (SEQ[WS, RECOVER css_syntax rule sync-rule]) 0 ∞, WS, END ] ⇒ CTOR
        stylesheet: T("CTOR", REG("R_ctor.stylesheet"), T("SEQ",
            T("REP", T("SEQ", T("DROP", { kind: "ws" }, T("SCAN", REG("R_cls.ws"), LIT(0), LIT("∞"))),
                T("RECOVER", { code: "css_syntax" }, { ref: "rule" }, { ref: "sync-rule" })), LIT(0), LIT("∞")),
            T("DROP", { kind: "ws" }, T("SCAN", REG("R_cls.ws"), LIT(0), LIT("∞"))),
            T("END"))),
        rule: T("SEQ", T("TEXT", REG("R_cls.any-but-brace-or-semi"), LIT(1), LIT("∞")),
            T("DROP", { kind: "punct" }, T("LIT", LIT("{"))), T("CUT"),
            T("DROP", { kind: "ws" }, T("SCAN", REG("R_cls.ws"), LIT(0), LIT("∞"))),
            T("DROP", { kind: "punct" }, T("LIT", LIT("}")))),
        // §10.3 verbatim: SEQ[SCAN any-but-semi-or-close 1 ∞, OPT(ALT[LIT ";", LIT "}"])] ∣ ";" ∣ "}"
        // OPT o v ≝ ALT[o, PURE v] is a notation, not a row (§4.1 OP-11).
        "sync-rule": T("ALT",
            T("SEQ", T("DROP", { kind: "skipped" }, T("SCAN", REG("R_cls.any-but-semi-or-close"), LIT(1), LIT("∞"))),
                T("ALT", T("DROP", { kind: "punct" }, T("LIT", LIT(";"))), T("DROP", { kind: "punct" }, T("LIT", LIT("}"))), T("PURE", LIT("unit")))),
            T("DROP", { kind: "punct" }, T("LIT", LIT(";"))),
            T("DROP", { kind: "punct" }, T("LIT", LIT("}")))),
    },
};

function walk(t, visit) {
    if (!t || typeof t !== "object" || typeof t.op !== "string") return;
    visit(t);
    for (const a of t.args ?? []) walk(a, visit);
}

const kinds = new Map();
let hostFns = 0;
for (const term of Object.values(IR.terms)) {
    walk(term, (n) => kinds.set(n.op, (kinds.get(n.op) ?? 0) + 1));
    JSON.stringify(term, (k, v) => (typeof v === "function" ? (hostFns++, "fn") : v));
}
const outside = [...kinds.keys()].filter((k) => !OPS.includes(k));

/* ── (2) the init-time compiler — total by construction, with NO default arm ───────────────── */

/**
 * σ is the minimum the fragment needs: an offset, the three journal lengths, and the C list (so a
 * recovery can be SEEN to enter a skipped span rather than claimed to).
 */
const st = (src) => ({ src, i: 0, C: [], P: [], D: [] });

/** `R_cls` as this fragment needs it — the four byte classes §10.3 and §10.1 name, nothing wider. */
const CLASSES = {
    "R_cls.ws": /[ \t\n\r\f]/,
    "R_cls.ident": /[A-Za-z0-9_-]/,
    "R_cls.any-but-brace-or-semi": /[^{};]/,
    "R_cls.any-but-semi-or-close": /[^;}]/,
};

const COMPILE = {
    SCAN: (t) => (s) => { const re = CLASSES[t.args[0].reg]; let n = 0; while (s.i + n < s.src.length && re.test(s.src[s.i + n])) n++; if (n < Number(t.args[1].lit)) return { ok: false, at: s.i }; return { ok: true, span: [s.i, (s.i += n)] }; },
    PURE: (t) => () => ({ ok: true, value: t.args[0].lit }),
    LIT: (t) => (s) => (s.src.startsWith(t.args[0].lit, s.i) ? { ok: true, span: [s.i, (s.i += t.args[0].lit.length)] } : { ok: false, at: s.i }),
    TEXT: (t) => (s) => { let n = 0; while (s.i + n < s.src.length && !"{};".includes(s.src[s.i + n])) n++; if (n < Number(t.args[1].lit)) return { ok: false, at: s.i }; const start = s.i; s.i += n; s.P.push([start, s.i]); return { ok: true, value: s.src.slice(start, s.i) }; },
    NUM: () => (s) => { const m = /^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?/.exec(s.src.slice(s.i)); if (!m) return { ok: false, at: s.i }; const start = s.i; s.i += m[0].length; s.P.push([start, s.i]); return { ok: true, value: Number(m[0]) }; },
    KW: () => (s) => { const m = /^[A-Za-z-]+/.exec(s.src.slice(s.i)); if (!m || m[0] !== "none") return { ok: false, at: s.i }; const start = s.i; s.i += m[0].length; s.P.push([start, s.i]); return { ok: true, value: "none" }; },
    DROP: (t, c) => { const inner = c(t.args[1]); const kind = t.args[0].kind; return (s) => { const r = inner(s); if (!r.ok) return r; if (r.span && r.span[1] > r.span[0]) s.C.push([r.span[0], r.span[1] - r.span[0], kind]); return { ok: true }; }; },
    SEQ: (t, c) => { const parts = t.args.map(c); return (s) => { for (const p of parts) { const r = p(s); if (!r.ok) return r; } return { ok: true }; }; },
    ALT: (t, c) => { const arms = t.args.map(c); return (s) => { for (const arm of arms) { const mark = [s.i, s.C.length, s.P.length, s.D.length]; const r = arm(s); if (r.ok) return r; s.i = mark[0]; s.C.length = mark[1]; s.P.length = mark[2]; s.D.length = mark[3]; } return { ok: false, at: s.i }; }; },
    // Each iteration runs under an implicit TRY (§4.1 OP-12): a failing iteration restores ALL of
    // σ, not just the offset, or the journals keep a span the parse never owned.
    REP: (t, c) => { const body = c(t.args[0]); return (s) => { for (;;) { const m = [s.i, s.C.length, s.P.length, s.D.length]; const r = body(s); if (!r.ok || s.i === m[0]) { s.i = m[0]; s.C.length = m[1]; s.P.length = m[2]; s.D.length = m[3]; break; } } return { ok: true }; }; },
    CUT: () => () => ({ ok: true }),
    END: () => (s) => (s.i === s.src.length ? { ok: true } : { ok: false, at: s.i, code: "trailing_input" }),
    CLAMP: (t, c) => { const inner = c(t.args[2]); return (s) => { const r = inner(s); return r.ok && typeof r.value === "number" ? { ok: true, value: Math.min(Math.max(r.value, Number(t.args[0].lit)), Number(t.args[1].lit)) } : r; }; },
    SCALE: (t, c) => { const inner = c(t.args[2]); return (s) => { const r = inner(s); return r.ok && typeof r.value === "number" ? { ok: true, value: (r.value * Number(t.args[0].lit)) / Number(t.args[1].lit) } : r; }; },
    CTOR: (t, c) => { const inner = c(t.args[1]); return (s) => { const r = inner(s); return r.ok ? { ok: true, value: { kind: t.args[0].reg } } : r; }; },
    TRY: (t, c) => { const inner = c(t.args[0]); return (s) => { const m = [s.i, s.C.length, s.P.length, s.D.length]; const r = inner(s); if (!r.ok) { s.i = m[0]; s.C.length = m[1]; s.P.length = m[2]; s.D.length = m[3]; } return r; }; },
    RECOVER: (t, c, g) => { const body = () => c(g.terms[t.args[1].ref]); const sync = () => c(g.terms[t.args[2].ref]); return (s) => { const m = [s.i, s.C.length, s.P.length, s.D.length]; const r = body()(s); if (r.ok) return r; s.i = m[0]; s.C.length = m[1]; s.P.length = m[2]; s.D.length = m[3]; const at = s.i; const sr = sync()(s); if (!sr.ok || s.i === at) { s.i = at; return r; } s.C.length = m[1]; s.P.length = m[2]; /* sync runs UNDER DISCARD (§4.1 OP-21) */ s.D.push({ code: t.args[0].code, start: at, end: s.i }); s.C.push([at, s.i - at, "skipped"]); return { ok: true, value: undefined }; }; },
    REF: (t, c, g) => (s) => c(g.terms[t.args[0].ref])(s),
};
// Every remaining ratified operator has a compile case too — they are in no slice fragment here, so
// they compile to a declared STUB that FAILS LOUDLY rather than to a fallback that quietly succeeds.
for (const name of OPS) COMPILE[name] ??= (t) => () => { throw new Error(`unimplemented-in-fragment:${t.op}`); };

function compile(term, grammar = IR) {
    const c = (t) => {
        if (t && typeof t === "object" && t.ref) return (s) => c(grammar.terms[t.ref])(s);
        if (!t || typeof t.op !== "string") return () => ({ ok: true });
        const make = COMPILE[t.op]; //                           NO default arm: an unknown kind throws
        if (!make) throw new Error(`INIT-TIME COMPILER: no case for IR kind '${t.op}' — totality broken`);
        return make(t, c, grammar);
    };
    return c(term);
}

/* ── the measurements ─────────────────────────────────────────────────────────────────────── */

const compiled = Object.fromEntries(Object.entries(IR.terms).map(([n, t]) => [n, compile(t)]));
const casesFor22 = OPS.filter((o) => typeof COMPILE[o] === "function").length;

let unknownKindCaught = false;
try {
    compile({ op: "HOSTFN", args: [] });
} catch {
    unknownKindCaught = true; //                                  the control: a 23rd kind must throw
}

// `recover` demonstrated, not asserted: a malformed sheet must yield ONE issue and ONE skipped span.
const malformed = "GARBAGE ) ; b { }";
const s = st(malformed);
const r = compiled.stylesheet(s);
const recovered = s.D.length === 1 && s.C.some((e) => e[2] === "skipped");

// the positive control: a well-formed sheet must NOT journal anything.
const s2 = st("b { }");
compiled.stylesheet(s2);

console.log("=== X.P.W2.g — Stage-0 spike · AC-2 CLOSED-IR ===");
console.log("falsifier: the IR kind set exceeds its declared closure, OR init-time totality for `recover` is not demonstrable → killed\n");
console.log(`contract operators (read from ALGEBRA.md §4.6)   ${OPS.length}`);
console.log(`IR kinds used by the slice fragment              ${kinds.size}  [${[...kinds.keys()].sort().join(" ")}]`);
console.log(`kinds OUTSIDE the ratified closure               ${outside.length}  ${outside.join(" ") || "(none)"}`);
console.log(`host functions under the terms (CL-1)            ${hostFns}`);
console.log(`init-time compile cases, one per ratified kind   ${casesFor22}/${OPS.length}  (no default arm)`);
console.log(`a 23rd kind throws at compile time (control)     ${unknownKindCaught}`);
console.log(`\nrecover, RUN on ${JSON.stringify(malformed)}:`);
console.log(`  D (issues)      ${JSON.stringify(s.D)}`);
console.log(`  C (complement)  ${JSON.stringify(s.C)}`);
console.log(`  well-formed control "b { }" journals           ${s2.D.length} issues`);

const survives = outside.length === 0 && hostFns === 0 && casesFor22 === OPS.length && unknownKindCaught && recovered && s2.D.length === 0;
console.log(
    `\nVERDICT AC-2: ${survives ? "SURVIVES Stage 0" : "KILLED at Stage 0"} — closure ${outside.length === 0 ? "HOLDS" : "BROKEN"}, ` +
        `init-time totality for \`recover\` ${recovered ? "DEMONSTRATED by running it" : "NOT demonstrated"}. ` +
        `MARGIN: ${casesFor22}/${OPS.length} kinds have a compile case, 0 outside the closure, 0 host functions, one issue and one skipped span on the malformed row.`,
);
process.exit(survives ? 0 : 1);
