// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — G-5: R1-ZERO-THROW + THE JS BOUNDARY.
//
//   node harness/w2/r1-candidates.mjs                    # the published baseline, reproduced
//   node harness/w2/r1-candidates.mjs --candidate <id>   # both lowerings of one candidate
//
// THE SUB-GATE THIS RUN EXISTS FOR (`W2.md` §5 `.g`): "the harness runs end-to-end against the
// published 4.0.0 vendored baseline alone (candidates absent) and reproduces the pasted born-RED
// numbers of §6 within printed noise — a harness that cannot reproduce the knowns may not judge the
// unknowns." The knowns, pasted at §6 G-5 and re-measured at X-P-W2.md §B.1:
//
//     published parseCssColor 4.0.0 throws 102/172 + 7/7 non-string
//     the probe's own header: 324 throws / 1,548 calls across the nine public parsers
//
// The baseline here runs the SAME corpus through the VENDORED sha-pinned tarball rather than a
// freshly packed HEAD (that is `r1-published-totality.mjs`'s job, R-E, run unmodified). Two
// different substrates measuring the same corpus is exactly what G-7's receipt rule exists for, so
// the substrate line is printed above the table and the comparison is stated, never assumed.

import { argv, corpus } from "./lib/contract.mjs";
import { loadCandidate } from "./lib/candidate.mjs";
import { loadPublished, PUBLISHED_FNS } from "./lib/published.mjs";
import { header, table, kv, verdict, absent } from "./lib/report.mjs";

const a = argv();

/**
 * The seven non-string shapes, MATERIALIZED FROM `r1.json`'s declared rows — never a second list.
 * The decoder is explicit (no `eval`): a corpus row names a shape, the harness builds it.
 */
const SHAPES = {
    undefined: () => undefined,
    null: () => null,
    42: () => 42,
    "{}": () => ({}),
    "[]": () => [],
    true: () => true,
    NaN: () => NaN,
};

function boundaryValues(r1) {
    return r1.boundary.map((b) => {
        const make = SHAPES[b.js];
        if (!make) throw new Error(`HALT: r1.json declares boundary shape '${b.js}', which this decoder does not build`);
        return make();
    });
}

async function baseline() {
    const { mod, pin } = await loadPublished();
    const r1 = corpus("r1.json");
    const inputs = r1.inputs.map((r) => r.src);
    const boundary = boundaryValues(r1);

    header("X.P.W2.g — r1-candidates --baseline (G-5, the third cell alone)", [
        `subject  vendored @mkbabb/value.js@4.0.0 /css`,
        `path     ${pin.path}`,
        `sha256   ${pin.sha256}  ${pin.matches ? "== pinned 8b5381…0c42" : "!! PIN MISMATCH"}`,
        `corpus   ${inputs.length} inputs (18 × 9 + 10) + ${boundary.length} JS-boundary values`,
    ]);

    const rows = [];
    let throws = 0;
    let calls = 0;
    const modes = new Map();
    for (const fn of PUBLISHED_FNS) {
        const f = mod[fn];
        if (typeof f !== "function") {
            rows.push(["SKIP", fn, "not exported", "-"]);
            continue;
        }
        let n = 0;
        for (const s of inputs) {
            calls++;
            try {
                f(s);
            } catch (e) {
                n++;
                throws++;
                const m = String(e).split("\n")[0];
                modes.set(m, (modes.get(m) ?? 0) + 1);
            }
        }
        let b = 0;
        for (const v of boundary) {
            try {
                f(v);
            } catch {
                b++;
            }
        }
        rows.push([n ? "RED" : "ok", fn, `${n}/${inputs.length}`, `${b}/${boundary.length}`]);
    }
    table(["", "parser", "throws (R1 corpus)", "throws (JS boundary)"], rows);
    console.log();
    kv([
        ["TOTAL", `${throws} throws / ${calls} calls`],
        ["DISTINCT FAILURE MODES", String(modes.size)],
        ...[...modes.entries()].map(([m, n]) => [`  ${n}x`, m]),
    ]);

    const color = rows.find((r) => r[1] === "parseCssColor");
    const knowns = [
        ["parseCssColor throws", color?.[2], "102/172", color?.[2] === `102/${inputs.length}`],
        ["parseCssColor boundary throws", color?.[3], "7/7", color?.[3] === `7/${boundary.length}`],
        ["total", `${throws} throws / ${calls} calls`, "324 throws / 1548 calls", throws === 324 && calls === 1548],
        ["distinct failure modes", String(modes.size), "1", modes.size === 1],
    ];
    console.log();
    table(["known (W2.md §6 G-5 · X-P-W2.md B.1)", "measured here", "pasted", "reproduces"], knowns.map((k) => [k[0], k[1], k[2], k[3] ? "YES" : "NO"]));

    const bad = knowns.filter((k) => !k[3]).map((k) => `${k[0]}: measured ${k[1]}, pasted ${k[2]}`);
    return verdict(
        bad.length === 0,
        bad.length === 0
            ? `the vendored third cell reproduces every pasted known to the digit (R1 is live: ${throws} throws over ${calls} calls, one failure mode)`
            : bad.join(" | "),
    );
}

async function candidate(id) {
    const c = await loadCandidate(id, a.at ?? null);
    const r1 = corpus("r1.json");
    header(`X.P.W2.g — r1-candidates --candidate ${id} (G-5)`);
    if (!c.present) return absent(`candidate ${id}`, c.reason);

    const prods = Object.keys(c.lowerings.js.grammar().entries ?? {});
    const rows = [];
    const red = [];
    for (const k of ["js", "wasm"]) {
        const L = c.lowerings[k];
        for (const prod of prods) {
            const entry = L.entry(prod);
            let threw = 0;
            let emptyDiag = 0;
            let boundaryOk = 0;
            for (const { src } of r1.inputs) {
                try {
                    const r = entry(src);
                    if (r && r.ok === false && (r.diagnostics ?? []).length === 0) emptyDiag++;
                } catch {
                    threw++;
                }
            }
            for (const v of boundaryValues(r1)) {
                try {
                    const r = entry(v);
                    const one = r && r.ok === false && (r.diagnostics ?? []).length >= 1 && r.diagnostics[0].code === "css_syntax";
                    if (one) boundaryOk++;
                } catch {
                    /* a throw at the boundary is K-8 and is counted by `boundaryOk` staying short */
                }
            }
            rows.push([k, prod, `${threw}/${r1.inputs.length}`, `${emptyDiag}`, `${boundaryOk}/7`]);
            if (threw) red.push(`${k}/${prod}: ${threw} throws (K-8)`);
            if (emptyDiag) red.push(`${k}/${prod}: ${emptyDiag} rejections with an empty diagnostics tuple (types.ts:27)`);
            if (boundaryOk !== 7) red.push(`${k}/${prod}: ${7 - boundaryOk} of 7 JS-boundary values not refused as ok:false + one css_syntax issue (BND-1/PT-07)`);
        }
    }
    table(["lowering", "production", "throws", "empty-diagnostic rejections", "boundary ok:false+issue"], rows);
    return verdict(red.length === 0, red.length === 0 ? `zero throws over ${r1.inputs.length} + 7, every rejection carrying ≥1 diagnostic, both lowerings` : red.join(" | "));
}

const code = a.candidate ? await candidate(a.candidate) : await baseline();
process.exit(code);
