// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — G-6: TOTALITY MAPPED AND REPORTED (52; REPORT, NOT CURE).
//
//   node harness/w2/coverage-52-report.mjs                      # the map, joined; the lane's distance
//   node harness/w2/coverage-52-report.mjs --candidate <id>     # a candidate's surface, assayed
//   node harness/w2/coverage-52-report.mjs --at typescript/src/css   # the graduated location (G-12)
//
// TWO RULES THIS FILE IS BUILT AROUND.
//
//   1. "reads **W1's** totality manifest; never a second manifest" (`W2.md` §6 G-6). The manifest is
//      read, and the VERBS come from W1's own `classify()` — imported, executed, never re-authored.
//      `harness/totality/**` is execute + read, no write (§4 R-E): this file imports two pure
//      modules from it and writes nothing there.
//   2. "This gate REPORTS; 52/52 TOTAL is the band's staged CLOSE gate (OP-8), and a W2 that claims
//      it has overreached by definition." No verb is stamped here, and the inherited baseline is
//      restated beside whatever is measured.
//
// G-6's falsifier is "a row upgraded without a named assay behind it — the reporter re-runs the
// assay, it never hand-edits verbs". The join below therefore carries, per row, the CLASS from the
// contract (P/V/K/W/X, X.P.W2.c's Q-B4 ratification) and the VERB from a re-run assay, and prints
// the two in the same table so a verb without an assay is visible as a blank.

import path from "node:path";

import { argv, contractMap, w1Manifest, P2_ROOT, sha256 } from "./lib/contract.mjs";
import { loadCandidate } from "./lib/candidate.mjs";
import { header, table, kv, verdict } from "./lib/report.mjs";
import { deriveSurface, deriveVariants, readTypeDeclarations } from "../totality/lib/surface.mjs";
import { classify } from "../totality/lib/classify.mjs";

const a = argv();

/** The inherited baseline, pasted — never re-derived, never quietly improved (epoch rule). */
const INHERITED = {
    "GATE-VERDICT P-2 (the incumbent's measured distance)": "0 TOTAL / 3 PARTIAL / 16 ABSENT runtime + 33 types ABSENT; kf seams 3/37",
    "X.P.W1 `p2-native` (the fresh root's own distance)": "0 TOTAL / 0 PARTIAL / 52 ABSENT",
    "mapped productions before X.P.W2.c": "0",
};

async function main() {
    const manifest = w1Manifest();
    const map = contractMap();
    const surface = deriveSurface();
    const variants = deriveVariants();

    header("X.P.W2.g — coverage-52-report (G-6: report, never cure)", [
        `manifest   harness/totality/manifest.json — ${manifest.counts.total} exports (${manifest.counts.types} types + ${manifest.counts.runtime} runtime), derived ${manifest.derivedAt}`,
        `contract   ALGEBRA.md §9 — ${map.length} rows read by the §9 row grammar`,
        `surface    re-derived in-process from ${surface.exports.length} exports of src/css/index.ts`,
    ]);

    // The join: manifest names vs contract rows, both ways.
    const manifestNames = manifest.exports.map((e) => e.name);
    const mapped = map.map((r) => r.export);
    const universeMinusMap = manifestNames.filter((n) => !mapped.includes(n));
    const mapMinusUniverse = mapped.filter((n) => !manifestNames.includes(n));
    const byClass = {};
    for (const r of map) byClass[r.class] = (byClass[r.class] ?? 0) + 1;

    kv([
        ["manifest names", String(manifestNames.length)],
        ["contract rows", String(map.length)],
        ["universe − map", universeMinusMap.length ? universeMinusMap.join(", ") : "∅"],
        ["map − universe", mapMinusUniverse.length ? mapMinusUniverse.join(", ") : "∅"],
        ["by class", Object.entries(byClass).map(([k, v]) => `${k}:${v}`).join(" · ")],
        ["declared holes (W + X)", String((byClass.W ?? 0) + (byClass.X ?? 0))],
    ]);

    // The subject whose verbs are assayed — a candidate, a location, or nothing at all.
    let subject = { id: "p2-native", namespace: null, declarationText: null, reason: `no CSS surface exists under ${P2_ROOT}/typescript/src/css` };
    if (a.candidate) {
        const c = await loadCandidate(a.candidate, a.at ?? null);
        if (!c.present) {
            subject = { id: a.candidate, namespace: null, declarationText: null, reason: c.reason };
        } else {
            const entryPath = c.meta.artifacts?.jsEntry;
            if (!entryPath) {
                subject = { id: a.candidate, namespace: null, declarationText: null, reason: "meta.artifacts.jsEntry not declared by the adapter" };
            } else {
                const abs = path.isAbsolute(entryPath) ? entryPath : path.join(P2_ROOT, entryPath);
                subject = {
                    id: a.candidate,
                    namespace: await import(abs),
                    declarationText: c.meta.artifacts?.dts ?? null,
                    reason: null,
                };
            }
        }
    }

    const classified = classify({
        surface,
        variants,
        candidate: { id: subject.id, peers: {}, absentReason: subject.reason },
        namespace: subject.namespace,
        declarationText: subject.declarationText ? readTypeDeclarations(subject.declarationText) : null,
    });

    // W1's `classify()` returns every row under `rows` (runtime then types), each with its own
    // verdict — the assay's output, read as it is published rather than re-tallied here.
    const verbOf = new Map();
    for (const row of classified.rows ?? []) verbOf.set(row.name, row.verdict);

    const rows = map.map((r) => [
        String(r.n), r.export, r.kind, r.class, r.production,
        verbOf.get(r.export) ?? "—",
        r.class === "W" || r.class === "X" ? "declared hole (owner W3)" : "",
    ]);
    console.log();
    table(["#", "export", "kind", "class", "production", "verb (assayed)", "note"], rows);

    const tally = {};
    for (const v of verbOf.values()) tally[v] = (tally[v] ?? 0) + 1;
    console.log();
    kv([
        ["subject", subject.id + (subject.reason ? ` — ${subject.reason}` : "")],
        ["verbs, this run (W1's own assay, re-run — never hand-edited)", Object.entries(tally).map(([k, v]) => `${k}:${v}`).join(" · ") || "none"],
        ["aggregate (W1's tally)", JSON.stringify(classified.aggregate)],
        ["throws recorded by the assay", String(classified.throws)],
        ...Object.entries(INHERITED).map(([k, v]) => [`inherited · ${k}`, v]),
        ["OP-8", "this gate REPORTS. 52/52 TOTAL is the band's staged CLOSE gate; a W2 run that claimed it would have overreached by definition."],
        ["map digest", sha256(JSON.stringify(map)).slice(0, 32)],
    ]);

    const clean = universeMinusMap.length === 0 && mapMinusUniverse.length === 0 && map.length === manifest.counts.total;
    return verdict(
        clean,
        clean
            ? `the 52-map joins W1's manifest ∅ both ways (${map.length} rows; classes ${Object.entries(byClass).map(([k, v]) => `${k}:${v}`).join(" ")}), verbs assayed against ${subject.id}`
            : `the map does not join the manifest: universe−map [${universeMinusMap}] · map−universe [${mapMinusUniverse}]`,
    );
}

process.exit(await main());
