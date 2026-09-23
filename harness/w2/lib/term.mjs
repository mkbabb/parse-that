// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — TERMS ARE DATA, AND THE WALK IS THE TEST.
//
// `ALGEBRA.md` §4.0/§4.6 and the folded A-1/CL-1 closure test: a term is a serializable datum, a
// host function anywhere in a term walk is RED, and the structural properties (R-LAW-5's
// `recover-final-only`, `CUT`'s scope, INV-OWN's span ownership) are things a WALK can check rather
// than things a reviewer must read. This module is that walk.
//
// THE TERM ENCODING (the one every candidate's `grammar()` returns):
//
//   Term   = { op: "<NAME>", args: Arg[] }            // NAME is one of the ratified 22
//   Arg    = Term | { lit: <json> } | { ref: "<production>" } | { reg: "<registry>.<row>" }
//                 | { label: "<label>" } | { code: "<code>" } | { kind: "<K_C kind>" }
//   Grammar = { entries: { "<prod>": "<term name>" }, terms: { "<name>": Term } }
//
// Everything in a term is JSON. A function, a class instance, a symbol or a getter anywhere under
// `terms` fails CL-1 — that is the closure test, and it is what keeps "one algebra" from becoming
// "one algebra plus whatever the host closure does".

const SPAN_OPS = new Set(["SCAN", "LIT"]); //        yield Op<Span> — must be owned (INV-OWN)
const SCOPE_BREAKERS = new Set(["TRY", "REP", "RECOVER", "REF"]); // §5.2: a CUT does not cross these
const CUT_TRANSPARENT = new Set(["SEQ", "CTOR", "EXPECT", "DROP"]); // §5.2: a CUT does cross these

export function isTerm(x) {
    return Boolean(x) && typeof x === "object" && typeof x.op === "string" && Array.isArray(x.args);
}

/** Every term node, depth-first, with its parent and the path that reached it. */
export function walk(term, visit, parent = null, path = "") {
    if (!isTerm(term)) return;
    visit(term, parent, path);
    term.args.forEach((a, i) => walk(a, visit, term, `${path}/${term.op}[${i}]`));
}

/** CL-1: any non-JSON value reachable under a term is a closure leak. */
export function closureLeaks(grammar) {
    const bad = [];
    const seen = new Set();
    const scan = (x, at) => {
        if (x === null) return;
        const t = typeof x;
        if (t === "function" || t === "symbol") {
            bad.push({ at, kind: t });
            return;
        }
        if (t !== "object") return;
        if (seen.has(x)) {
            bad.push({ at, kind: "cycle" });
            return;
        }
        seen.add(x);
        if (Object.getPrototypeOf(x) !== Object.prototype && !Array.isArray(x)) {
            bad.push({ at, kind: `class instance (${Object.getPrototypeOf(x)?.constructor?.name ?? "unknown"})` });
        }
        for (const [k, v] of Object.entries(x)) {
            const d = Object.getOwnPropertyDescriptor(x, k);
            if (d && typeof d.get === "function") bad.push({ at: `${at}.${k}`, kind: "getter" });
            scan(v, `${at}.${k}`);
        }
    };
    scan(grammar.terms ?? {}, "terms");
    return bad;
}

/** R-LAW-5 (`recover-final-only`): a RECOVER anywhere under a NON-FINAL ALT arm is a violation. */
export function recoverInNonFinalAlt(grammar) {
    const hits = [];
    for (const [name, term] of Object.entries(grammar.terms ?? {})) {
        walk(term, (node, _parent, path) => {
            if (node.op !== "ALT") return;
            node.args.forEach((arm, i) => {
                if (i === node.args.length - 1) return; //       the final arm may recover
                let found = false;
                walk(arm, (n) => {
                    if (n.op === "RECOVER") found = true;
                });
                if (found) hits.push({ production: name, path: `${path}/ALT[${i}]`, arm: i, arms: node.args.length });
            });
        });
    }
    return hits;
}

/** §5.2: a CUT outside an ALT arm's scope is a walk error. */
export function cutOutsideAlt(grammar) {
    const hits = [];
    const visit = (term, name, inArm, path) => {
        if (!isTerm(term)) return;
        if (term.op === "CUT" && !inArm) hits.push({ production: name, path });
        if (term.op === "ALT") {
            term.args.forEach((arm, i) => visit(arm, name, true, `${path}/ALT[${i}]`));
            return;
        }
        const next = SCOPE_BREAKERS.has(term.op) ? false : CUT_TRANSPARENT.has(term.op) ? inArm : inArm;
        term.args.forEach((a, i) => visit(a, name, next, `${path}/${term.op}[${i}]`));
    };
    for (const [name, term] of Object.entries(grammar.terms ?? {})) visit(term, name, false, name);
    return hits;
}

/** INV-OWN (§2.4): a Span-yielding term that is not the argument of DROP is unowned. */
export function unownedSpans(grammar) {
    const hits = [];
    for (const [name, term] of Object.entries(grammar.terms ?? {})) {
        walk(term, (node, parent, path) => {
            if (!SPAN_OPS.has(node.op)) return;
            if (!parent || parent.op !== "DROP") hits.push({ production: name, op: node.op, path, parent: parent?.op ?? "<root>" });
        });
    }
    return hits;
}

/** OP-22: every REF resolves in the finite grammar map; unresolved names are a broken back-edge. */
export function refs(grammar) {
    const sites = [];
    const unresolved = [];
    for (const [name, term] of Object.entries(grammar.terms ?? {})) {
        walk(term, (node) => {
            if (node.op !== "REF") return;
            const target = node.args?.[0]?.ref ?? node.args?.[0];
            sites.push({ production: name, target });
            if (!(typeof target === "string" && grammar.terms?.[target])) unresolved.push({ production: name, target });
        });
    }
    return { sites, unresolved };
}

/** Which of the 22 the grammar actually exercises — a registry row nothing exercises is a decoration. */
export function opsUsed(grammar) {
    const counts = new Map();
    for (const term of Object.values(grammar.terms ?? {})) {
        walk(term, (node) => counts.set(node.op, (counts.get(node.op) ?? 0) + 1));
    }
    return counts;
}

/** The whole structural verdict for one grammar, as data. */
export function structuralReport(grammar, contractOps) {
    const allowed = new Set(contractOps.map((o) => o.name));
    const used = opsUsed(grammar);
    const outside = [...used.keys()].filter((op) => !allowed.has(op));
    return {
        terms: Object.keys(grammar.terms ?? {}).length,
        entries: Object.keys(grammar.entries ?? {}).length,
        opsUsed: used,
        opsOutsideContract: outside,
        opsUnexercised: contractOps.map((o) => o.name).filter((n) => !used.has(n)),
        recoverInNonFinalAlt: recoverInNonFinalAlt(grammar),
        cutOutsideAlt: cutOutsideAlt(grammar),
        unownedSpans: unownedSpans(grammar),
        refs: refs(grammar),
        closureLeaks: closureLeaks(grammar),
    };
}

/**
 * THE NEGATIVE CONTROL (§7 R-LAW-5's own words: "the negative-control grammar `ALT[RECOVER(a), b]`
 * prints `1` and exits non-zero"). It lives here so every probe can prove its checker fires.
 */
export const NEGATIVE_CONTROL_GRAMMAR = {
    entries: { "P:control": "control" },
    terms: {
        control: {
            op: "ALT",
            args: [
                { op: "RECOVER", args: [{ code: "css_syntax" }, { op: "LIT", args: [{ lit: "a" }] }, { op: "LIT", args: [{ lit: ";" }] }] },
                { op: "LIT", args: [{ lit: "b" }] },
            ],
        },
    },
};
