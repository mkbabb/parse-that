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
import { assertPin, crossCheckUnpacked, loadOracle, PIN } from "./lib/oracle.mjs";
import { loadCorpus } from "./lib/corpus.mjs";
import { runFullSurface } from "./lib/differential.mjs";
import {
    DISSENTS,
    FIXTURES,
    LABEL_ROW,
    SPEC_DIVERGENCES,
    capacityRows,
    directionAudit,
    fixtureAnchorsPresent,
    narrowingRows,
} from "./lib/ledger.mjs";

/** The pin the wave reads its universe at (`.a`'s, and this seat's — one universe, one commit). */
const PINNED_VALUE_COMMIT = "6aca86020b6b2605e7d0f04fccb6601746e387f7";

const LEDGER_PATH =
    "/Users/mkbabb/Programming/value.js/docs/tranches/X/parse-that/DIVERGENCE-LEDGER.md";
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
        expect(corpus.rows.length).toBe(26604);
    });

    it("carries all six folded arms, none silently dropped", () => {
        const corpus = loadCorpus();
        for (const arm of ["ground-a", "fuzz-f", "fuzz-o", "named", "p1", "r1"]) {
            expect(corpus.bands[arm], `arm '${arm}' has no rows in the union`).toBeGreaterThan(0);
        }
    });

    it("F-c3 — 172 r1 rows arrive as {id, src} objects and are unwrapped losslessly, with the count published", () => {
        const corpus = loadCorpus();
        expect(corpus.unwrapped).toBe(172);
        expect(corpus.rows.every((r: { src: unknown }) => typeof r.src === "string")).toBe(true);
    });
});

/* ── 3. THE LEDGER — every declared difference rowed, every direction non-empty ────────────────── */

describe("G-7 · DIVERGENCE-LEDGER.md", () => {
    const ledger = () => readFileSync(LEDGER_PATH, "utf8");

    it("exists and carries all seven row families", () => {
        const text = ledger();
        for (const heading of [
            "## §1 The adjudicated conflicts",
            "## §2 The four preserved DISSENTS",
            "## §3 R1–R5",
            "## §4 The label surface",
            "## §5 The declared coverage narrowing",
            "## §6 Adjudication — RESERVED FOR `.e`",
            "## §7 The declared capacity bounds",
            "## §8 Spec-cited divergences on REALIZED entries",
        ]) {
            expect(text, `the ledger is missing the section: ${heading}`).toContain(heading);
        }
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

    it("the candidate's declared shape is read from its own grammar registry, not from this suite", () => {
        expect(result.shape.declaredHeads.color).toEqual(["hsl", "hsla", "oklch", "rgb", "rgba", "var"]);
        expect(result.shape.declaredHeads.timing).toEqual(["cubic-bezier", "linear", "steps"]);
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
