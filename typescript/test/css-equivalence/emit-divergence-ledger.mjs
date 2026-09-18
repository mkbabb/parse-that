#!/usr/bin/env node
// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — THE DIVERGENCE LEDGER, EMITTED WITH ITS TWO HALVES MEASURED.
//
//   node test/css-equivalence/emit-divergence-ledger.mjs --out <DIVERGENCE-LEDGER.md> --pinned-value-commit <sha>
//
// `W3.md` §5 `.d` fixes the six fields every row must carry: input · incumbent result · candidate
// result · spec citation · adjudication · THE DIRECTION OF BEHAVIOUR CHANGE FOR A CONSUMER.
//
// THE TWO RESULT COLUMNS ARE MEASURED HERE, NEVER TYPED. Every input is run through the vendored
// sha-pinned published 4.0.0 (the incumbent) and through BOTH candidate lowerings, and what the
// engines actually did is what lands in the file. A ledger whose "incumbent" column was written
// from memory would be the self-authored answer key `W3.md` §3 prohibits, one level up.
//
// THE ADJUDICATION AND DIRECTION COLUMNS ARE CARRIED, NEVER INVENTED. The sixteen come from `.a`'s
// `lib/adjudications.mjs` (out of `parser-band.md`), the four DISSENTS and the five fixtures from
// their own authorities, F-b4 from `.b`'s receipt, and the three narrowing rows are generated from
// the candidate's own `UNREALIZED_ENTRIES` against the pinned barrel. `.e` — a FRESH Fable
// adjudicator — owns §6 and is the only seat that may adjudicate; this program leaves that section
// empty and says so in it.

import { writeFileSync } from "node:fs";
import path from "node:path";

import { readPin } from "../css-totality/lib/pin.mjs";
import { loadPublicSurfaces, UNREALIZED_ENTRIES } from "../../src/css/entry.mjs";
import { disposeOracle, loadOracle } from "./lib/oracle.mjs";
import {
    DISSENTS,
    FIXTURES,
    LABEL_ROW,
    adjudicatedRows,
    directionAudit,
    fixtureAnchorsPresent,
    measureInput,
    narrowingRows,
} from "./lib/ledger.mjs";

const arg = (name, fallback = null) => {
    const i = process.argv.indexOf(`--${name}`);
    if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
    const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : fallback;
};

const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const code = (s) => `\`${String(s).replace(/`/g, "ʼ")}\``;

const entryFor = (row) => row.parser ?? "parseCssColor";

const measuredTable = (inputs, oracle, surfaces, entryName) => {
    if (inputs.length === 0) return ["_No input cell: this row is an axis, not a string. Its two halves are stated as postures above._", ""];
    const out = [
        "| input | incumbent (published 4.0.0, MEASURED) | candidate js (MEASURED) | candidate wasm (MEASURED) |",
        "|---|---|---|---|",
    ];
    for (const input of inputs) {
        const m = measureInput(input, oracle.module[entryName], surfaces, entryName);
        out.push(`| ${code(JSON.stringify(input))} | ${esc(m.incumbent)} | ${esc(m.js)} | ${esc(m.wasm)} |`);
    }
    out.push("");
    return out;
};

const main = async () => {
    const commit = arg("pinned-value-commit");
    const out = arg("out");
    if (!commit || !out) {
        console.error("emit-divergence-ledger: --pinned-value-commit <sha> and --out <path> are both REQUIRED.");
        return 2;
    }

    const pin = await readPin(commit);
    const oracle = await loadOracle();
    const surfaces = await loadPublicSurfaces();
    const realizedEntries = surfaces.js.entries();
    const candidateTypeNames = ["CssColor", "CssTimingFunction", "Stylesheet", "StyleRule", "Declaration"];

    const adjudications = adjudicatedRows();
    const narrowing = narrowingRows({
        runtimeUniverse: pin.universe.runtime,
        typeUniverse: pin.universe.types,
        realizedEntries,
        realizedTypes: candidateTypeNames,
    });

    const allRows = [
        ...adjudications.map((r) => ({ id: r.id, consumerDirection: r.consumerDirection })),
        ...DISSENTS,
        ...FIXTURES,
        LABEL_ROW,
        ...narrowing,
    ];
    const empty = directionAudit(allRows);
    const anchors = fixtureAnchorsPresent();

    const L = [];
    const say = (s = "") => L.push(s);

    say("SERVED MODEL: claude-opus-5[1m]");
    say("");
    say("# DIVERGENCE-LEDGER — X·P, opened by X.P.W3.d");
    say("");
    say("**Authority**: `docs/tranches/X/parse-that/waves/W3.md` §5 `.d` and §6 **G-7**. **Sub-tranche** X·P,");
    say("`docs/tranches/X/COHESION.md` §0j.E. **Generated**, never hand-written:");
    say("`<p2>/typescript/test/css-equivalence/emit-divergence-ledger.mjs`. Re-running it against the same");
    say("settled bytes reproduces this file byte-for-byte — the document carries no timestamp, by design.");
    say("");
    say("## §0 What this file is, and what it is not");
    say("");
    say("`W3.md` §5 `.d` names the six fields every row carries: **input · incumbent result · candidate");
    say("result · spec citation · adjudication · the direction of behaviour change for a consumer**. §6 G-7's");
    say("falsifier makes the last one load-bearing: *\"A row whose 'direction of behaviour change for a");
    say("consumer' field is empty fails; that field is what the KF and glass packets quote.\"* And it makes the");
    say("file itself load-bearing: *\"one mirror-defect reddens it, and so does an **unrowed** intentional");
    say("difference — the gate treats 'we meant to do that' without a ledger row as identical to a defect.\"*");
    say("");
    say("**The two result columns are MEASURED.** Every input below was run, at this file's generation, through");
    say("the vendored sha-pinned published 4.0.0 tarball and through **both** candidate lowerings, and what the");
    say("engines did is what is printed. Nothing in those two columns was typed from a document.");
    say("");
    say("**The adjudication and direction columns are CARRIED.** §1's sixteen are `.a`'s, out of");
    say("`registry/adjudicated/parser-band.md`; §2's four DISSENTS and §3's five fixtures come from their own");
    say("authorities; §4 is `.b`'s F-b4, routed to this seat inside the wave; §5 is generated from the");
    say("candidate's own `UNREALIZED_ENTRIES` against the pinned barrel. **This seat adjudicates nothing.**");
    say("§6 is reserved for `.e`, the fresh Fable adjudicator (M-23 §1) — *an author cannot adjudicate his own");
    say("union* — and is deliberately left empty by this program.");
    say("");
    say("### §0.1 Provenance, measured");
    say("");
    say("| item | reading |");
    say("|---|---|");
    say(`| pinned value.js commit | \`${pin.commit}\` |`);
    say(`| frozen barrel | \`${pin.sources.index.path}\` — ${pin.sources.index.bytes} B, sha256 \`${pin.sources.index.sha256}\` |`);
    say(`| frozen types | \`${pin.sources.types.path}\` — ${pin.sources.types.bytes} B, sha256 \`${pin.sources.types.sha256}\` |`);
    say(`| **oracle** | \`typescript/test/css-equivalence/vendor/${path.basename(oracle.pin.path)}\` — ${oracle.pin.bytes} B, sha256 \`${oracle.pin.sha256}\` |`);
    say(`| oracle npm integrity | \`${oracle.pin.npmIntegrity}\` — the registry's own, asserted in-test before any comparison runs |`);
    say(`| oracle exports | ${oracle.exports.length} runtime names |`);
    say(`| candidate | AC-1 TAGLESS-TWIN, two lowerings (\`js\`, \`wasm\`), entries \`${realizedEntries.join("\`, \`")}\` |`);
    say(`| candidate unrealized | \`${UNREALIZED_ENTRIES.join("\`, \`")}\` — named by the candidate itself, never omitted |`);
    say("");
    say("### §0.2 Row census");
    say("");
    say("| § | family | rows | authority |");
    say("|---|---|---|---|");
    say(`| §1 | ADJUDICATED | ${adjudications.length} | \`registry/adjudicated/parser-band.md\` via \`.a\`'s \`lib/adjudications.mjs\` |`);
    say(`| §2 | PRESERVED DISSENT | ${DISSENTS.length} | \`parser-band.md\` DISSENTS, anchored by text |`);
    say(`| §3 | REGRESSION FIXTURE | ${FIXTURES.length} | \`apotheosis/parser-proof/GATE-VERDICT.md\` F-2 |`);
    say("| §4 | LABEL SURFACE | 1 | `X-P-W3.md` `.b` F-b4 |");
    say(`| §5 | DECLARED COVERAGE NARROWING | ${narrowing.length} | the candidate's \`UNREALIZED_ENTRIES\` × the pinned barrel |`);
    say(`| | **total** | **${allRows.length}** | |`);
    say("");
    say(`**Empty consumer-direction fields: ${empty.length === 0 ? "0" : empty.join(", ")}.** (G-7 fails on any.)`);
    say(`**\`GATE-VERDICT.md\` anchors present: ${anchors.filter((a) => a.present).length}/${anchors.length}** — each fixture's anchor re-read in its authority at generation.`);
    say("");
    say("---");
    say("");
    say("## §1 The adjudicated conflicts — `.a` resolved them, this seat rows them");
    say("");
    say("`X-P-W3.md` §P.1 binds the two halves: *\"`.a`'s adjudicated conflicts and `.d`'s divergence rows are");
    say("one family: every conflict `.a` resolves against `parser-band.md` MUST appear as a `.d` row. G-7 fails");
    say("on an unrowed intentional difference exactly as it fails on a defect.\"* The family is asserted");
    say("mechanically by `node typescript/scripts/css-universe.mjs --cross-check-ledger <this file>`, which");
    say("checks each row's **id** and each of its **inputs** by string.");
    say("");
    say("**NO NINTH `ParseIssue` CODE IS PROPOSED ANYWHERE IN THIS FILE.** `parser-band.md` spells ADJ-3's");
    say("resolution `color_non_finite`, which is cand-O's own diagnostic vocabulary and is **not** one of the");
    say("frozen eight (`src/css/types.ts:11-19`). The adjudication is carried at its MEANING — clamp where a");
    say("clamp exists, reject the unclamped non-finite channel — lowered onto `css_syntax`, and the naming");
    say("difference is itself ADJ-3's own field. Adding the ninth would be a `W3.md` §3a halt to X·V and the");
    say("owner, *\"never a local decision\"*.");
    say("");

    for (const row of adjudications) {
        const entryName = entryFor(row);
        say(`### ${row.id} — ${row.title}`);
        say("");
        say("| field | value |");
        say("|---|---|");
        say(`| **input(s)** | ${row.inputs.map((i) => code(JSON.stringify(i))).join(" · ")} |`);
        say(`| **parser** | \`${entryName}\` |`);
        say(`| **incumbent (as adjudicated)** | ${esc(row.published)} |`);
        // ADJ-3 has no single `expect`: "clamp where a clamp exists, reject where none does" is a
        // per-input verdict, carried in `expectByInput`. Printed as the map, never flattened.
        const required = row.expect
            ? row.expect.toUpperCase()
            : Object.entries(row.expectByInput ?? {})
                  .map(([i, e]) => `${code(JSON.stringify(i))} → ${e.toUpperCase()}`)
                  .join(" · ");
        say(`| **candidate (required)** | ${esc(required)}${row.expectShape ? ` — ${code(JSON.stringify(row.expectShape))}` : ""} |`);
        if (row.codeNaming) say(`| **code naming** | ${esc(row.codeNaming)} |`);
        say(`| **spec citation** | ${esc(row.specCitation)} |`);
        say(`| **adjudication** | ${esc(row.ruling)} |`);
        say(`| **citation** | ${esc(row.citation)} |`);
        say(`| **consumer direction** | ${esc(row.consumerDirection)} |`);
        say(`| **G-6 row** | ${row.g6 ? `\`${row.g6}\`` : "— (not one of the twelve named G-6 rows)"} |`);
        say(`| **diverges from incumbent** | ${row.divergesFromIncumbent ? "YES" : "no — both engines agree; rowed so the agreement is on the record too"} |`);
        say("");
        for (const line of measuredTable(row.inputs, oracle, surfaces, entryName)) say(line);
    }

    say("---");
    say("");
    say("## §2 The four preserved DISSENTS");
    say("");
    say("`W3.md` §2c routes them here by name: *\"`parser-band.md` DISSENTS (token juxtaposition · non-finite ·");
    say("try/catch posture · bench epistemics) | **DECLARED-DIVERGENCE ROWS, not silent picks** | `.d`'s ledger,");
    say("asserted in both directions; **G-7** fails if any divergence is unrowed.\"* Each is PRESERVED and");
    say("UNRESOLVED: a dissent that this seat resolved would be a dissent this seat overruled.");
    say("");
    for (const row of DISSENTS) {
        say(`### ${row.id} — ${row.title}`);
        say("");
        say("| field | value |");
        say("|---|---|");
        say(`| **input(s)** | ${row.inputs.length ? row.inputs.map((i) => code(JSON.stringify(i))).join(" · ") : "— an axis, not a string" } |`);
        say(`| **incumbent** | ${esc(row.incumbentPosture)} |`);
        say(`| **candidate** | ${esc(row.candidatePosture)} |`);
        say(`| **spec citation** | ${esc(row.specCitation)} |`);
        say(`| **adjudication** | ${esc(row.adjudication)} |`);
        say(`| **consumer direction** | ${esc(row.consumerDirection)} |`);
        say(`| **anchor in \`parser-band.md\`** | ${code(row.anchor)} |`);
        say("");
        for (const line of measuredTable(row.inputs, oracle, surfaces, "parseCssColor")) say(line);
    }

    say("---");
    say("");
    say("## §3 R1–R5 — the spec-correct regression fixtures");
    say("");
    say("`W3.md` §5 `.d`: *\"R1–R5 from `GATE-VERDICT.md` F-2 are held as **spec-correct regression fixtures** —");
    say("the mirror preserves spec-correctness, never bug-compatibility.\"* Three of the five are NOT met by this");
    say("wave and say so in their own rows; a fixture recorded as met when it was not is the dishonesty §11");
    say("guardrail 2 names.");
    say("");
    for (const row of FIXTURES) {
        const anchor = anchors.find((a) => a.id === row.id);
        say(`### ${row.id} — ${row.title}`);
        say("");
        say("| field | value |");
        say("|---|---|");
        say(`| **input(s)** | ${row.inputs.length ? row.inputs.map((i) => code(JSON.stringify(i))).join(" · ") : "— no input cell in this wave's corpus; see the adjudication field"} |`);
        say(`| **incumbent** | ${esc(row.incumbentPosture)} |`);
        say(`| **candidate** | ${esc(row.candidatePosture)} |`);
        say(`| **spec citation** | ${esc(row.specCitation)} |`);
        say(`| **adjudication** | ${esc(row.adjudication)} |`);
        say(`| **consumer direction** | ${esc(row.consumerDirection)} |`);
        say(`| **anchor in \`GATE-VERDICT.md\`** | ${code(row.anchor)} — ${anchor?.present ? "PRESENT, re-read at generation" : "ABSENT"} |`);
        say("");
        for (const line of measuredTable(row.inputs, oracle, surfaces, "parseCssColor")) say(line);
    }

    say("---");
    say("");
    say("## §4 The label surface");
    say("");
    say(`### ${LABEL_ROW.id} — ${LABEL_ROW.title}`);
    say("");
    say("| field | value |");
    say("|---|---|");
    say(`| **input(s)** | ${LABEL_ROW.inputs.map((i) => code(JSON.stringify(i))).join(" · ")} |`);
    say(`| **incumbent** | ${esc(LABEL_ROW.incumbentPosture)} |`);
    say(`| **candidate** | ${esc(LABEL_ROW.candidatePosture)} |`);
    say(`| **spec citation** | ${esc(LABEL_ROW.specCitation)} |`);
    say(`| **adjudication** | ${esc(LABEL_ROW.adjudication)} |`);
    say(`| **consumer direction** | ${esc(LABEL_ROW.consumerDirection)} |`);
    say("");
    for (const line of measuredTable(LABEL_ROW.inputs, oracle, surfaces, "parseCssColor")) say(line);

    say("---");
    say("");
    say("## §5 The declared coverage narrowing");
    say("");
    say("The P-1 taxonomy this wave inherits makes **COVERAGE_NARROWING** a declared NON-defect *on condition");
    say("that it is declared*: *\"C14 declines an input outside its declared shape that the live superset accepts");
    say("is **not** a defect — `status.json` declares it.\"* These three rows are that declaration, and they are");
    say("generated from the candidate's own bytes rather than listed, so the declaration cannot be wider than the");
    say("candidate. **None of them is discharged by this wave**; each names the standing row that owns it.");
    say("");
    for (const row of narrowing) {
        say(`### ${row.id} — ${row.title}`);
        say("");
        say("| field | value |");
        say("|---|---|");
        say(`| **subjects** | ${row.subjects.length ? row.subjects.map((s) => `\`${s}\``).join(" · ") : "—"} |`);
        say(`| **incumbent** | ${esc(row.incumbentPosture)} |`);
        say(`| **candidate** | ${esc(row.candidatePosture)} |`);
        say(`| **spec citation** | ${esc(row.specCitation)} |`);
        say(`| **adjudication** | ${esc(row.adjudication)} |`);
        say(`| **consumer direction** | ${esc(row.consumerDirection)} |`);
        say("");
    }

    say("---");
    say("");
    say("## §6 Adjudication — RESERVED FOR `.e`");
    say("");
    say("**This section is deliberately empty.** `W3.md` §4a gives `.e` — a **fresh** Fable adjudicator — the");
    say("sole write on `DIVERGENCE-LEDGER.md` §Adjudication, and §5 `.e` gives the reason: *\"an author cannot");
    say("adjudicate his own union.\"* `.e` is obligated under L-14 to attempt REFUTATION, not to average, and its");
    say("second named obligation lands here: *\"at least one divergence row's **spec reading**\"*.");
    say("");
    say("Three rows are offered to that refutation as the ones whose spec reading is most load-bearing and least");
    say("settled, named by this seat so the choice is not left to convenience:");
    say("");
    say("1. **S-1 (token juxtaposition)** — the widening is adopted from a css-syntax token-stream reading that");
    say("   `parser-band.md` itself marks PRESERVED, UNRESOLVED, and the owner may overrule toward cand-F.");
    say("2. **ADJ-3 / S-2 (non-finite numerals)** — a three-way split whose contract question (GROUND-C, are");
    say("   ±Infinity admitted?) is OWNER-OWED and which `W3.md` §10 explicitly does not open.");
    say("3. **PB-03 (the two `hsl` spellings)** — the 100× disagreement is the single largest value change in");
    say("   the file, and the row claims the incumbent's reading, not the candidate's, is the defect.");
    say("");
    say("A fourth claim, outside the ledger but named in `.e`'s own obligations, is `.c`'s: that the retained");
    say("shield is non-load-bearing. Its evidence is `.c`'s T-1/T-1b/T-2/T-3/T-4 and it is designed to be");
    say("refutable at the bytes.");
    say("");

    // One trailing newline and no blank line before it — `git diff --check` reads a blank line at
    // EOF as whitespace damage, and a generated document should land clean on the first try.
    while (L.length > 0 && L[L.length - 1] === "") L.pop();
    const text = `${L.join("\n")}\n`;
    writeFileSync(path.isAbsolute(out) ? out : path.resolve(process.cwd(), out), text);
    console.log(`wrote ${out} — ${Buffer.byteLength(text)} B · ${L.length} lines · ${allRows.length} rows · empty directions ${empty.length}`);
    disposeOracle();
    return empty.length === 0 ? 0 : 1;
};

process.exit(await main());
