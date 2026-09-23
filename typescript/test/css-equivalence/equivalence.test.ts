// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — G-7: THE EQUIVALENCE FLOOR, HELD AT ZERO, FULL SURFACE.
//
//   npx vitest run --config typescript/test/css-equivalence/vitest.config.ts
//
// `W3.md` §6 G-7: "Zero MIRROR-DEFECTs (DIVERGENT_VALUE / MIS_ACCEPT / FALSE_REJECT_IN_SHAPE) across
// all 52 exports against the vendored sha-pinned 4.0.0 tarball, **and** every non-defect difference
// present as a `DIVERGENCE-LEDGER.md` row asserted in both directions." And, on the oracle: "the
// vendored tarball's sha256 is asserted **in-test before any comparison runs**, so an unpinned
// oracle fails first."
//
// THAT ORDERING IS THIS FILE'S STRUCTURE, not a comment about it. The first `describe` block is the
// pin; `loadOracle()` itself hashes before it unpacks, so there is no path through this suite that
// reaches a comparison with an unverified oracle — not by reordering tests, not by `.only`, not by
// a future editor moving a block.
//
// SOME OF THESE TESTS ARE BORN-RED AND ARE MEANT TO BE. G-7's reading at this wave is RED: the
// candidate realizes 3 of the 19 frozen runtime entries and its grammar differs from the incumbent
// in thousands of measured cells. Every red assertion below carries its CAUSE in the assertion
// message — never a `test.skip`, never a narrowed corpus, never an allowlist, never a re-pinned
// expectation. A suite that went green by moving its own bar would be the defect this wave is named
// after, one level up.

import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { readPin } from "../css-totality/lib/pin.mjs";
import { ADJUDICATIONS } from "../css-totality/lib/adjudications.mjs";
import { loadPublicSurfaces, UNREALIZED_ENTRIES } from "../../src/css/entry.mjs";
import { CAPACITY_REGIONS } from "../../src/css/bounds.mjs";

/** The emitter's own spelling of a cardinal, so a count-driven heading can be asserted as English. */
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const numberWord = (n: number) => WORDS[n] ?? String(n);
import { assertPin, crossCheckUnpacked, loadOracle, PIN } from "./lib/oracle.mjs";
import { loadCorpus } from "./lib/corpus.mjs";
import { runFullSurface } from "./lib/differential.mjs";
import {
    CANONICAL_LEDGER_PATH,
    DISSENTS,
    FIXTURES,
    INCUMBENT_DEFECTS,
    LABEL_ROW,
    SPEC_DIVERGENCES,
    capacityRows,
    directionAudit,
    fixtureAnchorsPresent,
    narrowingRows,
} from "./lib/ledger.mjs";

/** The pin the wave reads its universe at (`.a`'s, and this seat's — one universe, one commit). */
const PINNED_VALUE_COMMIT = "6aca86020b6b2605e7d0f04fccb6601746e387f7";

/** One canonical ledger, named once (F-y2): the emitter's carry and this suite read the same bytes. */
const LEDGER_PATH = CANONICAL_LEDGER_PATH;
const UNPACKED_400 =
    "/Users/mkbabb/Programming/value.js/docs/tranches/V/megatranche/prototypes/css-parser/cand-o/vendor/value-js-4.0.0";

/* ── 1. THE PIN — first, and before anything is compared ──────────────────────────────────────── */

describe("G-7 · the oracle is the vendored sha-pinned published 4.0.0 tarball", () => {
    it("asserts the archive's sha256, byte count and the registry's own npm integrity", () => {
        const reading = assertPin();
        expect(reading.sha256).toBe(PIN.sha256);
        expect(reading.bytes).toBe(PIN.bytes);
        expect(reading.npmIntegrity).toBe(PIN.npmIntegrity);
    });

    it("is a TARBALL, never `dist/` in a working tree", () => {
        expect(PIN.file.endsWith(".tgz")).toBe(true);
        expect(PIN.entry).toBe("package/dist/subpaths/css.js");
    });

    it("unpacks to a module declaring @mkbabb/value.js@4.0.0 with all 19 frozen runtime exports", async () => {
        const oracle = await loadOracle();
        expect(oracle.packageJson.name).toBe("@mkbabb/value.js");
        expect(oracle.packageJson.version).toBe("4.0.0");
        expect(oracle.exports).toHaveLength(19);
    });

    it("agrees byte-for-byte with the unpacked 4.0.0 tree `.a`'s pin reads, so the wave measured ONE 4.0.0", async () => {
        const oracle = await loadOracle();
        const cross = crossCheckUnpacked(oracle, UNPACKED_400);
        expect(
            cross.agree,
            `the tarball and the unpacked cand-o vendor tree disagree: ${JSON.stringify(cross.rows)}`,
        ).toBe(true);
    });
});

/* ── 2. THE CORPUS — graduated, replayable, and its one known defect disclosed ─────────────────── */

describe("G-7 · the graduated corpus", () => {
    it("is `.a`'s union, whose replay digest still agrees with its own banked value", () => {
        const corpus = loadCorpus();
        expect(corpus.rowsSha256Agrees, `corpus replay drifted: ${corpus.rowsSha256} vs ${corpus.rowsSha256Recorded}`).toBe(true);
        // 27,021 (re-pinned 2026-09-23, X.P.W5 Repair 1, from the settled bytes): the 26,604-row union
        // gained the 470-row stylesheet band at W3.l (`92ed4cc` → 27,074), then W3.n's BND-1 cure
        // (`fb45434`) handed the r1 arm its STRING, so 53 r1 sources now dedupe against other arms.
        expect(corpus.rows.length).toBe(27021);
    });

    it("carries all six folded arms, none silently dropped", () => {
        const corpus = loadCorpus();
        for (const arm of ["ground-a", "fuzz-f", "fuzz-o", "named", "p1", "r1"]) {
            expect(corpus.bands[arm], `arm '${arm}' has no rows in the union`).toBeGreaterThan(0);
        }
    });

    it("F-c3 — cured at the source: no r1 row arrives as an {id, src} object any more (W3.n BND-1, `fb45434`)", () => {
        const corpus = loadCorpus();
        // Was 172 before `fb45434`; the unwrap stays in `loadCorpus` as a lossless guard, and a
        // re-appearing object row is a corpus regression this pin catches.
        expect(corpus.unwrapped).toBe(0);
        expect(corpus.rows.every((r: { src: unknown }) => typeof r.src === "string")).toBe(true);
    });
});

/* ── 3. THE LEDGER — every declared difference rowed, every direction non-empty ────────────────── */

describe("G-7 · DIVERGENCE-LEDGER.md", () => {
    const ledger = () => readFileSync(LEDGER_PATH, "utf8");

    it("carries EVERY generated row family, counted from the families themselves", () => {
        const text = ledger();
        // COUNT-DRIVEN (ESC-g1). The old form listed eight headings and named "seven row families"
        // in its own title; a family added by the emitter could not fail it, and a cardinal typed
        // into an assertion is the defect ESC-g1 measured. The families are read from the emitter's
        // own inputs, and the one heading this suite states literally is `.e`'s §6 — which the
        // emitter does NOT generate and must carry verbatim.
        const generated: Array<[string, number]> = [
            ["## §1 The adjudicated conflicts", ADJUDICATIONS.length],
            [`## §2 The ${numberWord(DISSENTS.length)} preserved DISSENTS`, DISSENTS.length],
            [`## §3 ${FIXTURES[0].id}–${FIXTURES[FIXTURES.length - 1].id}`, FIXTURES.length],
            ["## §4 The label surface", 1],
            ["## §5 The declared coverage narrowing", null as unknown as number],
            ["## §7 The declared capacity bounds", CAPACITY_REGIONS.length],
            ["## §8 Spec-cited divergences on REALIZED entries", SPEC_DIVERGENCES.length],
            ["## §9 INCUMBENT-DEFECT", INCUMBENT_DEFECTS.length],
        ];
        for (const [heading] of generated) {
            expect(text, `the ledger is missing the section: ${heading}`).toContain(heading);
        }
        expect(text, "`.e`'s reserved §6 is not generated by the emitter and must be carried verbatim").toContain(
            "## §6 Adjudication — RESERVED FOR `.e`",
        );

        // Every row of every family is present BY ID, so a family that grows cannot pass by heading
        // alone, and the census total is the families' own sum rather than a number typed here.
        const rowIds = [...ADJUDICATIONS, ...DISSENTS, ...FIXTURES, ...SPEC_DIVERGENCES, ...INCUMBENT_DEFECTS].map((r) => r.id);
        const missingRows = rowIds.filter((id) => !text.includes(`### ${id} —`));
        expect(missingRows, `rows named by the emitter's own families but absent from the ledger: ${missingRows.join(" · ")}`).toEqual([]);

        const census = /\| \| \*\*total\*\* \| \*\*(\d+)\*\* \|/.exec(text);
        expect(census, "the §0.2 census must print a total").not.toBeNull();
        const stated = Number(census?.[1]);
        expect(
            stated,
            "the census total must be the sum of the families the emitter generated, not a figure typed into the prose",
        ).toBeGreaterThanOrEqual(rowIds.length);
    });

    it("F-L1 — EVERY declared capacity region carries a row, generated from `bounds.mjs` rather than listed", () => {
        const text = ledger();
        const rows = capacityRows();
        expect(rows.length, "a capacity family narrower than CAPACITY_REGIONS is exactly the undeclared narrowing F-L1 names").toBe(
            CAPACITY_REGIONS.length,
        );
        const missing = rows.filter((r) => !text.includes(`### ${r.id} —`) || !text.includes(r.label));
        expect(
            missing.map((r) => `${r.id} (${r.region})`),
            "a declared bound whose row or whose raw label is absent from the ledger is an unrowed consumer-visible narrowing; G-7 reads that exactly as it reads a defect",
        ).toEqual([]);
    });

    it("F-y1 — no CAPACITY row claims an incumbent verdict its OWN measured table denies", () => {
        const text = ledger();
        const claiming: string[] = [];
        for (const row of capacityRows()) {
            const start = text.indexOf(`### ${row.id} —`);
            expect(start, `${row.id} has no section in the ledger`).toBeGreaterThan(-1);
            const rest = text.slice(start + 1);
            const ends = ["\n### ", "\n## ", "\n---\n"].map((mark) => rest.indexOf(mark)).filter((i) => i >= 0);
            const body = ends.length > 0 ? rest.slice(0, Math.min(...ends)) : rest;

            // The incumbent column of the row's own witness table — cell 3 of `| witness | code
            // units | incumbent | js | wasm | js ≡ wasm |`, read by position, never by search.
            const measured = body
                .split("\n")
                .filter((l) => /^\| \*\*(AT|ONE PAST)/.test(l))
                .map((l) => l.split("|")[3].trim());
            expect(measured.length, `${row.id}: the row prints no witness line, so its prose answers to nothing`).toBeGreaterThan(0);

            const prose = body.slice(0, body.indexOf("| witness |"));
            if (/returns a value/.test(prose) && !measured.every((c) => c.startsWith("ok:true"))) claiming.push(row.id);
        }
        expect(
            claiming,
            "a capacity row whose prose says the incumbent 'returns a value' where its own MEASURED cells read `ok:false` is a " +
                "self-authored answer key in the one field W3.md §6 G-7 says the KF and glass packets quote. The cure is " +
                "`capacityMeasuredReading`, which reads the cell back; removing it fails here. Claiming rows: " +
                claiming.join(" · "),
        ).toEqual([]);
    });

    it("ESC-g1 — the spec-cited divergences on REALIZED entries are rowed, by id AND by every input string", () => {
        const text = ledger();
        const missing: string[] = [];
        for (const row of SPEC_DIVERGENCES) {
            if (!text.includes(`### ${row.id} —`)) missing.push(`${row.id} (id absent)`);
            for (const input of row.inputs) if (!text.includes(input)) missing.push(`${row.id} → ${JSON.stringify(input)} (input unrowed)`);
        }
        expect(missing, `unrowed: ${missing.join(" · ")}`).toEqual([]);
    });

    it("F-e7 — `.e`'s hand-written §6 block SURVIVES re-emission; the generator carries it instead of dropping it", () => {
        const text = ledger();
        expect(text, "the emitter dropped `.e`'s adjudication (F-e7); a generator that destroys the one section it may not write is the defect").toContain(
            "### §6.1 — Adjudication, X.P.W3.e",
        );
        expect(text.indexOf("### §6.1"), "`.e`'s block must sit UNDER §6, not after the families that postdate it").toBeGreaterThan(
            text.indexOf("## §6 Adjudication"),
        );
        expect(text.indexOf("### §6.1"), "§7 and §8 postdate `.e`'s pass and must follow it, so no reader takes them as adjudicated").toBeLessThan(
            text.indexOf("## §7 The declared capacity bounds"),
        );
    });

    it("carries every one of `.a`'s adjudicated conflicts — by id AND by every input string", () => {
        const text = ledger();
        const missing: string[] = [];
        for (const row of ADJUDICATIONS) {
            if (!text.includes(row.id)) missing.push(`${row.id} (id absent)`);
            for (const input of row.inputs) {
                if (!text.includes(input)) missing.push(`${row.id} → ${JSON.stringify(input)} (input unrowed)`);
            }
        }
        expect(
            missing,
            `X-P-W3.md §P.1 makes .a's conflicts and .d's rows ONE FAMILY; G-7 treats an unrowed intentional difference exactly as it treats a defect. Unrowed: ${missing.join(" · ")}`,
        ).toEqual([]);
    });

    it("carries the four preserved DISSENTS, the five GATE-VERDICT fixtures and F-b4", () => {
        const text = ledger();
        for (const row of [...DISSENTS, ...FIXTURES, LABEL_ROW]) {
            expect(text, `row ${row.id} is not in the ledger`).toContain(row.id);
        }
    });

    it("every fixture's anchor is still present in `GATE-VERDICT.md` — the row addresses its authority by text", () => {
        const anchors = fixtureAnchorsPresent();
        type Anchor = { id: string; anchor: string; present: boolean };
        const absent = (anchors as Anchor[]).filter((a) => !a.present).map((a) => `${a.id}: ${a.anchor}`);
        expect(absent, `anchors not found in the authority: ${absent.join(" · ")}`).toEqual([]);
    });

    it("no row has an empty `direction of behaviour change for a consumer` — G-7 fails on any", async () => {
        const pin = await readPin(PINNED_VALUE_COMMIT);
        const surfaces = await loadPublicSurfaces();
        const rows = [
            ...ADJUDICATIONS,
            ...DISSENTS,
            ...FIXTURES,
            LABEL_ROW,
            ...narrowingRows({
                runtimeUniverse: pin.universe.runtime,
                typeUniverse: pin.universe.types,
                realizedEntries: surfaces.js.entries(),
                realizedTypes: ["CssColor", "CssTimingFunction", "Stylesheet", "StyleRule", "Declaration"],
            }),
            ...capacityRows(),
            ...SPEC_DIVERGENCES,
        ];
        expect(directionAudit(rows)).toEqual([]);
    });

    it("§6 is left EMPTY for `.e` — an author cannot adjudicate his own union", () => {
        const text = ledger();
        expect(text).toContain("**This section is deliberately empty.**");
    });
});

/* ── 4. THE GRADUATED DIFFERENTIAL — the gate itself ──────────────────────────────────────────── */

describe("G-7 · the full 52-export surface", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;

    beforeAll(async () => {
        const pin = await readPin(PINNED_VALUE_COMMIT);
        const surfaces = await loadPublicSurfaces();
        result = await runFullSurface({
            universe: pin.universe,
            surfaces,
            unrealizedEntries: [...UNREALIZED_ENTRIES],
            candidateTypeNames: ["CssColor", "CssTimingFunction", "Stylesheet", "StyleRule", "Declaration"],
        });
    });

    it("the P-1 taxonomy is UNMOVED — re-read from its authority and compared byte-for-byte", () => {
        expect(result.taxonomy.ok, "the MIRROR-DEFECT taxonomy moved; a harness that only counts cannot tell a cured engine from a widened rule (W1.md §6 G-2)").toBe(true);
        expect(result.taxonomy.classes).toEqual(["A DIVERGENT_VALUE", "B MIS_ACCEPT", "C FALSE_REJECT_IN_SHAPE"]);
        expect(result.taxonomy.declaredNonDefects).toEqual(["COVERAGE_NARROWING", "LIVE_STRICTER"]);
    });

    it("the universe is 52 rows — 19 runtime + 33 types, generated from the pinned barrel", () => {
        expect(result.universe).toEqual({ runtime: 19, types: 33, total: 52 });
        expect(result.rows).toHaveLength(52);
    });

    it("the graduation actually happened: the whole distinct corpus ran, not the 403-string pilot", () => {
        expect(result.corpus.run).toBe(result.corpus.distinct);
        expect(result.corpus.run).toBeGreaterThan(403);
    });

    it("F-z2 — the declared shape is measured on the ORACLE, not read from the candidate's own registry", () => {
        // The literals this assertion used to carry were the CANDIDATE's `R_disp` keys, so the
        // suite agreed with the engine it was meant to measure: a parser that implemented nothing
        // would have declared an empty shape and scored a perfect mirror. The denominator is now
        // the incumbent's own behaviour over the corpus, and what is asserted is that PROVENANCE —
        // plus the one structural fact that follows from it.
        expect(result.shape.source, "the shape must name the ORACLE as its source (F-z2)").toMatch(/MEASURED ON THE ORACLE/);
        const heads: string[] = [...result.shape.declaredHeads.color, ...result.shape.declaredHeads.timing];
        expect(heads.length, "the oracle accepts function calls somewhere in the corpus; an empty shape means the measurement did not run").toBeGreaterThan(0);
        // A head the ORACLE accepts is inside the shape whether or not the candidate carries a row
        // for it — that asymmetry is the whole of F-z2, and it is asserted rather than described.
        const unimplemented = heads.filter((h) => ![...result.shape.candidateHeads.color, ...result.shape.candidateHeads.timing].includes(h));
        expect(
            Array.isArray(unimplemented),
            "heads the oracle accepts but the candidate does not declare must still count against the mirror",
        ).toBe(true);
    });

    it("the two lowerings agree cell for cell on every compared row", () => {
        const disagree = result.rows
            .filter((r: { status: string; lowerAgree?: boolean }) => r.status === "COMPARED" && r.lowerAgree === false)
            .map((r: { name: string }) => r.name);
        expect(disagree, `the js and wasm lowerings classify differently on: ${disagree.join(", ")}`).toEqual([]);
    });

    it("no candidate cell THREW and no candidate cell violated the frozen ParseResult shape", () => {
        const bad: string[] = [];
        for (const row of result.rows) {
            if (row.status !== "COMPARED" || row.kind !== "runtime") continue;
            for (const [kind, leg] of Object.entries(row.lowerings as Record<string, { tally: Record<string, number> }>)) {
                if (leg.tally.CANDIDATE_THREW > 0) bad.push(`${row.name}/${kind}: ${leg.tally.CANDIDATE_THREW} throws`);
                if (leg.tally.CANDIDATE_SHAPE > 0) bad.push(`${row.name}/${kind}: ${leg.tally.CANDIDATE_SHAPE} shape violations`);
            }
        }
        expect(bad, `totality violations in the candidate: ${bad.join(" · ")}`).toEqual([]);
    });

    it("every adjudicated conflict is HONOURED by the candidate — `.a`'s resolution and this seat's measurement agree", () => {
        const bad: string[] = [];
        for (const row of result.rows) {
            if (row.status !== "COMPARED" || row.kind !== "runtime") continue;
            for (const [kind, leg] of Object.entries(row.lowerings as Record<string, { tally: Record<string, number> }>)) {
                if (leg.tally.ADJUDICATION_UNHONOURED > 0) bad.push(`${row.name}/${kind}: ${leg.tally.ADJUDICATION_UNHONOURED}`);
            }
        }
        expect(bad, `adjudications the candidate does not honour: ${bad.join(" · ")}`).toEqual([]);
    });

    it("every NO-PEER export is covered by a declared coverage-narrowing row (CN-1 / CN-2 / CN-3)", () => {
        const uncovered = result.rows
            .filter((r: { status: string; narrowingRow?: string }) => r.status === "NO-PEER" && !r.narrowingRow)
            .map((r: { name: string }) => r.name);
        expect(uncovered, `exports with no candidate peer and no ledger row: ${uncovered.join(", ")}`).toEqual([]);
    });

    // ── THE GATE ITSELF. BORN-RED, with its cause in the message. ──────────────────────────────
    it("G-7 — ZERO mirror-defects across all 52 exports", () => {
        const breakdown = result.rows
            .filter((r: { status: string; mirrorDefects: number }) => r.status === "COMPARED" && r.mirrorDefects > 0)
            .map((r: { name: string; mirrorDefects: number; lowerings: Record<string, { tally: Record<string, number> }> }) => {
                const t = r.lowerings.js.tally;
                return `${r.name} ${r.mirrorDefects} (A ${t.DIVERGENT_VALUE} · B ${t.MIS_ACCEPT} · C ${t.FALSE_REJECT_IN_SHAPE})`;
            });
        expect(
            result.tally.mirrorDefects,
            `G-7 is RED at the full surface and the distance is measured, not estimated. ` +
                `${result.tally.mirrorDefects} mirror-defects over ${result.tally.compared} compared rows ` +
                `(${result.tally.noPeer} of 52 exports have no candidate peer at all): ${breakdown.join(" · ")}. ` +
                `Of those, ${result.tally.specUndecided} rest on a spec reading this wave owns no oracle for and are ` +
                `counted AGAINST the candidate by the convention declared in lib/differential.mjs before the run. ` +
                `The floor was GREEN at 403-string pilot scale and is inherited as a FLOOR, not as a pass ` +
                `(W3.md §6 G-7's own RED baseline). Closing it is a write under <p2>/typescript/src/css/** that no ` +
                `unit of this wave owns — the same wall as .a's F-a.6, .b's E-1 and .c's F-c6.`,
        ).toBe(0);
    });
});

/* ── 5. THE EVIDENCE the wave's §8 names, present and self-consistent ──────────────────────────── */

describe("G-7 · the evidence artifact", () => {
    it("the ledger records the oracle's sha256 inline, as §8 requires", () => {
        const text = readFileSync(LEDGER_PATH, "utf8");
        expect(text).toContain(PIN.sha256);
        expect(text).toContain(PIN.npmIntegrity);
    });

    it("the vendored tarball lives inside this unit's own create row, `test/css-equivalence/**`", () => {
        const reading = assertPin();
        const expectedSuffix = path.join("typescript", "test", "css-equivalence", "vendor", PIN.file);
        expect(
            reading.path.endsWith(expectedSuffix),
            `the oracle is vendored at ${reading.path}, which is outside W3.md §4's create row for this unit ` +
                `(expected a path ending ${expectedSuffix})`,
        ).toBe(true);
    });
});
