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
//
// TWO FAMILIES ADDED BY `## Repair 1 — round 4` (X.P.W3, the F-L1 / ESC-g1 cure):
//
//   F · CAPACITY       §7 — the nine declared capacity bounds `.f` landed on both lowerings,
//                      generated from `bounds.mjs`'s own `CAPACITY_REGIONS` and measured either
//                      side of a binary-searched coordinate. F-L1: they narrow the accepted
//                      language on the shipped JS target and no row declared them.
//   G · SPEC-DIVERGENCE §8 — the wave's own spec-cited divergences on entries the candidate DOES
//                      realize; SP-1, the legacy-`hsl()` mis-accept `.e` found under L-14 and
//                      returned as F-e2 "for a `.d`-emitted row". ESC-g1's wall was that the five
//                      families were each closed to it; this is the sixth.
//
// AND F-e7 IS CURED AT THE GENERATOR: every prior emission dropped `.e`'s hand-written §6 block and
// every prior seat re-appended it by hand. This program now lifts every `### §6.x` subsection out of
// the CANONICAL ledger — `lib/ledger.mjs`'s `CANONICAL_LEDGER_PATH`, not whatever `--out` names
// (**F-y2**) — and re-emits it verbatim. It still authors none of it.
//
// AND F-y1 IS CURED AT THE GENERATOR: a capacity row's incumbent sentence and consumer direction are
// now READ BACK from the row's own measured cells (`capacityMeasuredReading`) instead of asserted by
// a template across all nine regions, because for three of them the template claimed an incumbent
// verdict the row's own table denies.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { readPin } from "../css-totality/lib/pin.mjs";
import { loadPublicSurfaces, UNREALIZED_ENTRIES } from "../../src/css/entry.mjs";
import { disposeOracle, loadOracle } from "./lib/oracle.mjs";
import {
    CANONICAL_LEDGER_PATH,
    CAPACITY_AUTHORITY,
    DISSENTS,
    FIXTURES,
    LABEL_ROW,
    INCUMBENT_DEFECTS,
    SPEC_DIVERGENCES,
    adjudicatedRows,
    capacityMeasuredReading,
    capacityRows,
    directionAudit,
    fixtureAnchorsPresent,
    groupDigits,
    measureCapacityRow,
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

/**
 * A cardinal in prose, spelled. Count-driven headings (ESC-g1) must read like English and still move
 * with the family, so the number is taken from the family's length and spelled here — never typed
 * into the sentence, which is the defect ESC-g1 measured ("an assertion that hard-codes 'four'").
 */
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const numberWord = (n) => WORDS[n] ?? String(n);

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

    const capacity = capacityRows();

    const allRows = [
        ...adjudications.map((r) => ({ id: r.id, consumerDirection: r.consumerDirection })),
        ...DISSENTS,
        ...FIXTURES,
        LABEL_ROW,
        ...narrowing,
        ...capacity,
        ...SPEC_DIVERGENCES,
        ...INCUMBENT_DEFECTS,
    ];
    const empty = directionAudit(allRows);
    const anchors = fixtureAnchorsPresent();

    // F-e7's cure, at the root rather than at the hand: `.e` — the FRESH Fable adjudicator — owns
    // §6 by `W3.md` §4a, and its block is the one hand-written region of a generated file. Every
    // prior emission DROPPED it, and every prior seat re-appended it by hand (`.e` wrote the warning
    // into the block itself; `.g` obeyed it; `## Close — round 4` carries F-e7 as a standing
    // residual). A generator that destroys the one section it is forbidden to write is the defect.
    // It is now CARRIED FORWARD VERBATIM: read off the CANONICAL ledger, emitted unaltered under
    // §6's own preamble. This program still authors not one byte of it.
    //
    // The block is BOUNDED at both ends: it starts at the first `### §6.` and stops at the next
    // level-2 heading, because §7 and §8 follow it. An unbounded tail-slice is not idempotent — the
    // first double-run of this cure carried 47 lines, then 286, then 525, swallowing the families
    // below it on every pass. A generated document that grows when you regenerate it is a defect,
    // and the two-run check is what found this one.
    //
    // F-y2's cure: the carry reads the CANONICAL ledger, not `--out`. Lifting the block out of "the
    // file this run replaces" made the carry PATH-DEPENDENT — an emission to a fresh path found
    // nothing to carry and dropped `.e`'s block again, which is F-e7 returning through the door the
    // cure left open. `.e`'s block lives in exactly one artefact; the carry now addresses that
    // artefact by name and `--out` decides only where the bytes land. The canonical emission is
    // unaffected (it IS the canonical path), and a fresh-path emission now reproduces it.
    const outPath = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out);
    const carryPath = CANONICAL_LEDGER_PATH;
    const previous = existsSync(carryPath) ? readFileSync(carryPath, "utf8") : "";
    const carriedAt = previous.indexOf("\n### §6.");
    const tail = carriedAt < 0 ? "" : previous.slice(carriedAt + 1);
    const ends = ["\n## ", "\n---\n"].map((mark) => tail.indexOf(mark)).filter((i) => i >= 0);
    const block = ends.length > 0 ? tail.slice(0, Math.min(...ends)) : tail;
    const carried = carriedAt < 0 ? [] : block.replace(/\s+$/, "").split("\n");

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
    say(`\`registry/adjudicated/parser-band.md\`; §2's ${DISSENTS.length} DISSENTS and §3's ${FIXTURES.length} fixtures come from their own`);
    say("authorities; §4 is `.b`'s F-b4, routed to this seat inside the wave; §5 is generated from the");
    say("candidate's own `UNREALIZED_ENTRIES` against the pinned barrel; **§7** is generated from `bounds.mjs`'s");
    say(`own \`CAPACITY_REGIONS\` and carries §0p/§0q as its authority; **§9** carries ${INCUMBENT_DEFECTS.length} INCUMBENT-DEFECT rows,`);
    say("each citing the specification the incumbent's acceptance contradicts. **This seat adjudicates nothing.**");
    say("§6 is reserved for `.e`, the fresh Fable");
    say("adjudicator (M-23 §1) — *an author cannot adjudicate his own union* — is deliberately left empty by");
    say("this program, and is now CARRIED VERBATIM across re-emissions instead of being destroyed by them.");
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
    // COUNT-DRIVEN (ESC-g1): the census is generated from the families themselves, so a family that
    // is added, emptied or promoted moves the table and the total without a hand touching either.
    // The §6 row is `.e`'s carried block, which this program counts but does not generate.
    const families = [
        { section: "§1", family: "ADJUDICATED", rows: adjudications.length, authority: "`registry/adjudicated/parser-band.md` via `.a`'s `lib/adjudications.mjs`" },
        { section: "§2", family: "PRESERVED DISSENT", rows: DISSENTS.length, authority: "`parser-band.md` DISSENTS, anchored by text" },
        { section: "§3", family: "REGRESSION FIXTURE", rows: FIXTURES.length, authority: "`apotheosis/parser-proof/GATE-VERDICT.md` F-2" },
        { section: "§4", family: "LABEL SURFACE", rows: 1, authority: "`X-P-W3.md` `.b` F-b4" },
        { section: "§5", family: "DECLARED COVERAGE NARROWING", rows: narrowing.length, authority: "the candidate's `UNREALIZED_ENTRIES` × the pinned barrel" },
        { section: "§7", family: "CAPACITY BOUND", rows: capacity.length, authority: "`bounds.mjs`'s own `CAPACITY_REGIONS`, measured or derived" },
        { section: "§8", family: "SPEC-DIVERGENCE (realized entry)", rows: SPEC_DIVERGENCES.length, authority: "this wave's own measurement; EMPTY since `.k` promoted SP-1 to §9" },
        { section: "§9", family: "INCUMBENT-DEFECT", rows: INCUMBENT_DEFECTS.length, authority: "ESC-g1 — the oracle mis-accepts, the candidate is right per spec" },
    ];
    say("| § | family | rows | authority |");
    say("|---|---|---|---|");
    for (const f of families) say(`| ${f.section} | ${f.family} | ${f.rows} | ${f.authority} |`);
    say(`| | **total** | **${families.reduce((n, f) => n + f.rows, 0)}** | ${families.length} generated families; §6 is \`.e\`'s carried block and is counted in neither column |`);
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
    say(`## §2 The ${numberWord(DISSENTS.length)} preserved DISSENTS`);
    say("");
    say(`\`W3.md\` §2c routes them here by name — ${DISSENTS.length} of them: *"\`parser-band.md\` DISSENTS (token juxtaposition · non-finite ·`);
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
    say(`## §3 ${FIXTURES[0]?.id ?? "—"}–${FIXTURES[FIXTURES.length - 1]?.id ?? "—"} — the spec-correct regression fixtures`);
    say("");
    say("`W3.md` §5 `.d`: *\"R1–R5 from `GATE-VERDICT.md` F-2 are held as **spec-correct regression fixtures** —");
    // NO CARDINAL HERE. The fixtures carry no `met` field, so a count would be this program's guess
    // about rows it did not author — and a typed "three" is the very defect ESC-g1 measured. Each
    // row states its own standing in its own adjudication, which is where a reader must look.
    say(`the mirror preserves spec-correctness, never bug-compatibility."* The fixtures NOT met by this`);
    say("wave say so in their own rows; a fixture recorded as met when it was not is the dishonesty §11");
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
    if (carried.length > 0) {
        say("**`.e`'s block below is CARRIED, not regenerated** (F-e7, cured at the generator): this program reads");
        say("the canonical ledger — by name, not by `--out` (F-y2) — lifts every `### §6.x` subsection out of it, and emits it");
        say("here unaltered. It authors none of it and it no longer destroys it, so no seat has to remember to");
        say("re-append it. `.e`'s own warning — *\"If the emitter is re-run, it will drop this section\"* — is the");
        say("sentence this cure retires; it is left standing in the block because the block is `.e`'s and E-3");
        say("makes it immutable. The block predates **§7** and **§8** below, which are therefore **NOT**");
        say("adjudicated by it.");
        say("");
        for (const line of carried) say(line);
        say("");
    }

    say("---");
    say("");
    say("## §7 The declared capacity bounds");
    say("");
    say("**Landed by this emission, after `.e`'s L-14 pass — so §6 does NOT adjudicate these rows.** They");
    say("answer **F-L1**, raised against the round-4 close: X.P.W3.f gave both lowerings a set of capacity");
    say("rejections that NARROW the accepted language relative to published 4.0.0, on the shipped JS target,");
    say("and no row of this file declared them. G-7 does not grade intent — *\"an **unrowed** intentional");
    say("difference … identical to a defect\"* — and CN-2 set the wave's own standard: *\"an absence nobody");
    say("declared is exactly what G-7 treats as a defect. Rowed rather than left to be discovered.\"*");
    say("");
    say("**Not one byte of the candidate is wrong here, and nothing below asks for one to change.** The bounds");
    say("are ordained and the labels promote; what was owed was the declaration. The rows are **generated from");
    say(`\`bounds.mjs\`'s own \`CAPACITY_REGIONS\`** — ${capacity.length} regions, in the order the boundary names a breach — so they`);
    say("cannot drift from Θ: a region added, renamed or re-capped moves these rows at the next emission.");
    say("");
    say(`**Authority.** ${CAPACITY_AUTHORITY}`);
    say("");
    say("**The witness coordinates are FOUND, not pinned.** For every class-1 region this program binary-searches");
    say("the smallest witness that names the region's own promoted production (`.f`'s census method) and prints");
    say("the pair either side of it; a moved bound therefore moves the pair instead of falsifying a fixture.");
    say("Classes 2 and 3 have no such coordinate under the derived window — that absence *is* the claim — so");
    say("they carry the densest declared family AT the window and record that it does not name them.");
    say("");
    for (const row of capacity) {
        const m = measureCapacityRow(row, oracle, surfaces);
        // F-y1: the incumbent sentence and the consumer direction are READ BACK from `m`, the cells
        // printed two lines below them, and are returned unchanged wherever the incumbent did
        // return a value. A row that asserts across its own measurement is the self-authored answer
        // key one level up, in the one field G-7 says the packets quote.
        const reading = capacityMeasuredReading(row, m);
        say(`### ${row.id} — ${row.title}`);
        say("");
        say("| field | value |");
        say("|---|---|");
        say(`| **region / class** | ${code(row.region)} · class ${row.cls} · checked ${esc(row.when)} |`);
        say(`| **declared capacity Θ.${row.region}** | ${groupDigits(row.capacity)} ${esc(row.unit)}${row.capacity === row.layoutCap ? " (the layout CAP itself)" : ` (DERIVED; the layout CAP is ${groupDigits(row.layoutCap)})`} |`);
        say(`| **raw label → promoted production** | ${code(row.label)} → ${code(row.production)} |`);
        say(`| **incumbent** | ${esc(reading.incumbentPosture)} |`);
        say(`| **candidate** | ${esc(row.candidatePosture)} |`);
        say(`| **spec citation** | ${esc(row.specCitation)} |`);
        say(`| **adjudication** | ${esc(row.adjudication)} |`);
        say(`| **consumer direction** | ${esc(reading.consumerDirection)} |`);
        say(`| **witness family** | ${code(`witnessAtCapacity("${row.region}", n)`)} under ${code(row.witnessProduction)}, driven through ${code(m.entryName)} |`);
        say("");
        say("| witness | code units | incumbent (published 4.0.0, MEASURED) | candidate js (MEASURED) | candidate wasm (MEASURED) | js ≡ wasm |");
        say("|---|---|---|---|---|---|");
        const cells =
            m.kind === "pair"
                ? [["AT the bound", m.at], ["ONE PAST the bound", m.past]]
                : [[m.kind === "window-limited" ? "AT the largest witness the WINDOW admits" : "AT the full window", m.window]];
        if (m.kind === "window-limited") {
            say(`**NO COORDINATE, AND THE REASON IS MEASURED:** ${esc(m.why)}`);
            say("");
        }
        for (const [what, c] of cells)
            say(`| **${what}** — ${code(c.witness)} | ${groupDigits(c.length)} | ${esc(c.incumbent)} | ${esc(c.js)} | ${esc(c.wasm)} | ${c.identical ? "YES" : "**NO**"} |`);
        say("");
        if (m.kind === "pair")
            say(`_Coordinate found by binary search at this generation: the region is first named at n = ${groupDigits(m.coordinate)}._`);
        else
            say(`_No coordinate exists under Θ.input: the densest declared family at the window (n = ${groupDigits(m.coordinate)}) names this region in neither lowering (js ${m.window.jsNamesRegion ? "NAMES" : "does not name"} it · wasm ${m.window.wasmNamesRegion ? "NAMES" : "does not name"} it), which is what "unreachable" means here._`);
        say("");
    }

    say("---");
    say("");
    say("## §8 Spec-cited divergences on REALIZED entries");
    say("");
    say("**Landed by this emission, after `.e`'s L-14 pass — so §6 does NOT adjudicate these rows.** This is");
    say("the family `.e` asked for and `.g` could not reach (**ESC-g1**): a difference on an entry the");
    say("candidate DOES realize, where the specification's own text says the candidate is right and the");
    say("incumbent is wrong. It is not §2 (`W3.md` §2c routes exactly four `parser-band.md` dissents there by");
    say("name), not §3 (`GATE-VERDICT.md` carries no anchor for this subject), and not §5 (the entry is");
    say("realized), which is why it needed a family of its own rather than a borrowed heading.");
    say("");
    say("`.e`'s instruction is honoured literally: *\"Returned as F-e2 for a `.d`-emitted row … not hand-added");
    say("here\"* — the two result columns below are re-measured at every emission, never typed.");
    say("");
    say(`**Rows at this emission: ${SPEC_DIVERGENCES.length}.**${SPEC_DIVERGENCES.length === 0 ? " SP-1, the family's first row, was an oracle MIS-ACCEPT and `.k` promoted it into §9's INCUMBENT-DEFECT family — one meaning, one row (F-aa3 (c)). The heading stands so that an empty family can be told from an absent one." : ""}`);
    say("");
    for (const row of SPEC_DIVERGENCES) {
        say(`### ${row.id} — ${row.title}`);
        say("");
        say("| field | value |");
        say("|---|---|");
        say(`| **input(s)** | ${row.inputs.map((i) => code(JSON.stringify(i))).join(" · ")} |`);
        say(`| **entry** | ${code(row.parser)} |`);
        say(`| **incumbent** | ${esc(row.incumbentPosture)} |`);
        say(`| **candidate** | ${esc(row.candidatePosture)} |`);
        say(`| **spec citation** | ${esc(row.specCitation)} |`);
        say(`| **adjudication** | ${esc(row.adjudication)} |`);
        say(`| **consumer direction** | ${esc(row.consumerDirection)} |`);
        say("");
        for (const line of measuredTable(row.inputs, oracle, surfaces, entryFor(row))) say(line);
    }

    say("---");
    say("");
    say("## §9 INCUMBENT-DEFECT — the oracle mis-accepts, the candidate is right per spec");
    say("");
    say("**ESC-g1's family** (COHESION §0r). A row here is a difference where the INCUMBENT accepts a string the");
    say("specification forbids and the candidate refuses it, correctly. It is not §2 (`W3.md` §2c routes exactly");
    say(`${DISSENTS.length} \`parser-band.md\` dissents there by name), not §3 (no \`GATE-VERDICT.md\` anchor), not §5 (the entry is`);
    say("realized) and not §8 (whose subject is a spec-cited divergence that is NOT a mis-accept) — which is why");
    say("it needed a heading of its own. It takes the next free level-2 number: **§6 is `.e`'s reserved");
    say("hand-written adjudication block** and a generated family written over it would destroy the fresh");
    say("adjudicator's region (F-aa3 (a)).");
    say("");
    say(`Of the ${INCUMBENT_DEFECTS.length} rows, ${INCUMBENT_DEFECTS.filter((r) => /UNADJUDICATED/.test(r.adjudication)).length} are **UNADJUDICATED** and say so in their own adjudication field: \`.k\` measured them`);
    say("at G-1's honest remainder and declines to rule them, because an author cannot adjudicate his own union");
    say("(M-23 §1). Their cells REMAIN counted as mirror-defects at G-7 — a row declares a difference, it does");
    say("not excuse one.");
    say("");
    for (const row of INCUMBENT_DEFECTS) {
        say(`### ${row.id} — ${row.title}`);
        say("");
        say("| field | value |");
        say("|---|---|");
        say(`| **input(s)** | ${row.inputs.map((i) => code(JSON.stringify(i))).join(" · ")} |`);
        say(`| **entry** | ${code(row.parser)} |`);
        say(`| **incumbent** | ${esc(row.incumbentPosture)} |`);
        say(`| **candidate** | ${esc(row.candidatePosture)} |`);
        say(`| **spec citation** | ${esc(row.specCitation)} |`);
        say(`| **adjudication** | ${esc(row.adjudication)} |`);
        say(`| **consumer direction** | ${esc(row.consumerDirection)} |`);
        say("");
        for (const line of measuredTable(row.inputs, oracle, surfaces, entryFor(row))) say(line);
    }

    // One trailing newline and no blank line before it — `git diff --check` reads a blank line at
    // EOF as whitespace damage, and a generated document should land clean on the first try.
    while (L.length > 0 && L[L.length - 1] === "") L.pop();
    const text = `${L.join("\n")}\n`;
    writeFileSync(outPath, text);
    console.log(
        `wrote ${out} — ${Buffer.byteLength(text)} B · ${L.length} lines · ${allRows.length} rows · empty directions ${empty.length} · ` +
            `\`.e\`'s §6 block carried ${carried.length > 0 ? `${carried.length} lines` : "ABSENT (nothing to carry)"}`,
    );
    disposeOracle();
    return empty.length === 0 ? 0 : 1;
};

process.exit(await main());
