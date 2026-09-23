// SERVED MODEL: claude-fable-5-1
//
// X.P.W3.f — G-9's CAPACITY LEG, G-3's PROOF LEG ON THE CAPACITY WITNESSES, AND G-5's BOUNDARY BAND
// (COHESION §0p / §0q; `W3.md` ADDENDUM 2026-09-18 `.f`).
//
//   npx vitest run --config typescript/test/css-recovery/boundary/vitest.config.ts test/css-recovery/boundary/capacity.test.ts
//
// THE RED THIS REPLACES — ESC-e1, measured by `.e` (L-14) and re-taken by every seat since: a valid
// stylesheet of 8,191 rules overflowed the Wasm mark journal, `lowering-wasm/index.mjs:274` THREW,
// the public entry's shield re-shaped the throw (`SHIELD.caught` 0→1), and the JS lowering answered
// `ok:true`. The shield was LOAD-BEARING and the two targets DIVERGED on valid input. This seat then
// measured the harder half (2026-09-18): `a{}`×40,000, `linear(0, )`×70,000 and `;`×70,000 do not
// even set the overflow flag — they TRAP the module (`RuntimeError: memory access out of bounds`),
// because the emitted runtime never stops a run at an overflow and the arena's overflow is a trap.
//
// THE CURE, per §0q's three classes, and what each leg below measures:
//
//   CLASS 1 (input · marks · recoveries · D)  both lowerings reject AT the declared bound as an
//       ordinary `ok:false css_syntax` whose `expected[0]` NAMES the bound, byte-identically — the
//       witnesses are GENERATED and the bound's coordinate is found by reading the counter back off
//       the lowering (the census method), never by a pinned string;
//   CLASS 2 (C · P)  the PEAK of each restored journal is measured at the Wasm appender and at the
//       JS push sites, and the two readings are identical; a NEGATIVE CONTROL shows the peak
//       exceeding the final count, which is why final-count-with-proof was REFUSED;
//   CLASS 3 (value stack · arena · expsnap)  unreachable by construction: `bounds.mjs` derives a
//       per-code-unit ceiling K from the emitter's node table and asserts `cap₃ >= K × Θ.input + S`
//       AT LOAD; here the census maxima are measured against K (`<=`, never `=`), and the derived
//       Θ.input is shown to be the largest window under which the ceilings fit.
//   G-3 PROOF LEG  `SHIELD.caught` moves by ZERO across every row of this file — the capacity
//       witnesses are answered by the lowerings, never by the shield.
//   G-5 BOUNDARY BAND (E-f3)  G-5's own `canonical()` — fixed key order, NO array sorted — over
//       every witness, across both lowerings, reported BESIDE the sealed 79,674 / 0, which this
//       file does not touch (`corpus.json` and `css-dual-target-identity.mjs` are `.a`'s / `.d`'s).

import { describe, expect, it } from "vitest";

import { L } from "../../../src/css/algebra/tables.mjs";
import {
    BOUNDARY_REGIONS,
    CAPACITY,
    CAPACITY_LABELS,
    CAPACITY_REGIONS,
    CLASS3_CEILINGS,
    CLASS3_PROOF,
    DEPTH_BOUND,
    INPUT_BOUND,
    THETA,
    WITNESS_PRODUCTION,
    assertCapacityBound,
    assertCapacityBounds,
    assertClass3Unreachable,
    capacityBreaches,
    deriveClass3Ceilings,
    witnessAtCapacity,
    witnessAtDepth,
} from "../../../src/css/bounds.mjs";
import { isNamedProduction, promoteLabel } from "../../../src/css/diagnostics.mjs";
import { loadPublicSurfaces, SHIELD } from "../../../src/css/entry.mjs";
import { lowerings } from "../../../src/css/harness-adapter.mjs";
import * as lay from "../../../src/css/lowering-wasm/layout.mjs";
import { RESULT } from "../../../src/css/lowering-wasm/runtime.mjs";
import { loadCorpusUnion } from "./lib/corpus.mjs";

const SWEEP_TIMEOUT_MS = 600_000;

const surfaces = await loadPublicSurfaces();
const KINDS = ["js", "wasm"] as const;
type Kind = (typeof KINDS)[number];
type Issue = { code: string; start: number; end: number; expected: readonly string[]; actual: string | null };
type Result = { ok: boolean; value?: unknown; diagnostics: readonly Issue[] };
type Product = {
    ok: boolean; C: unknown[]; P: unknown[]; D: unknown[]; marks: unknown[]; recoveries: unknown[];
    far: unknown; sigma: unknown; peaks: { C: number; P: number };
};
type Lowering = { parse: (prod: string, src: string) => Product; theta: () => Record<string, number>; kind: string };
type Region = keyof typeof CAPACITY;

const REGIONS = CAPACITY_REGIONS.map((r: { region: string }) => r.region) as Region[];
const ENTRY: Record<string, string> = { "P:color": "parseCssColor", "P:timing-function": "parseTimingFunction", "P:stylesheet": "parseStylesheet" };
const entryFor = (kind: Kind, prod: string) => (surfaces[kind] as unknown as Record<string, (s: string) => Result>)[ENTRY[prod]];
const lowering = (kind: Kind) => lowerings[kind] as unknown as Lowering;

// The shield ledger this file inherits — asserted as a DELTA (the sibling files' own discipline).
const LEDGER_AT_LOAD = SHIELD.caught;

/* ── G-5's canonicalization, transcribed from `scripts/css-dual-target-identity.mjs` ───────── */
//
// Fixed KEY order for the six-tuple; NO array sorted; NO number rounded; `undefined` → `null`.
// The band below compares the FIRST issue (G-5's letter) and EVERY issue (`canonicalAll`), and the
// accepted value beside them, exactly as the sealed comparator does.

const KEYS = ["ok", "code", "start", "end", "expected", "actual"];
const canonical = (result: Result) => {
    const issue = result && result.ok === false ? (result.diagnostics?.[0] ?? null) : null;
    return JSON.stringify(
        {
            ok: result?.ok ?? null,
            code: issue ? (issue.code ?? null) : null,
            start: issue ? (issue.start ?? null) : null,
            end: issue ? (issue.end ?? null) : null,
            expected: issue ? (Array.isArray(issue.expected) ? [...issue.expected] : null) : null,
            actual: issue ? (issue.actual === undefined ? null : issue.actual) : null,
        },
        KEYS,
    );
};
const canonicalAll = (result: Result) =>
    result && result.ok === false
        ? JSON.stringify(result.diagnostics.map((i) => ({ ok: false, code: i.code, start: i.start, end: i.end, expected: [...i.expected], actual: i.actual ?? null })))
        : canonical(result);
const canonicalValue = (result: Result) => (result && result.ok === true ? JSON.stringify(result.value) : null);

/* ── the Wasm's own region peaks, read off its memory (the banked census's instrument) ───────── */

const wl = lowerings.wasm as unknown as Lowering & { memory: () => WebAssembly.Memory; internals: { instance: WebAssembly.Instance } };
const ex = wl.internals.instance.exports as unknown as { reset: () => void; highWater: () => number; cHighWater: () => number; pHighWater: () => number };
const mem = wl.memory();
const word = (f: keyof typeof RESULT) => new Int32Array(mem.buffer)[RESULT[f] >> 2];
const zeroRegions = () => {
    const u8 = new Uint8Array(mem.buffer);
    u8.fill(0, lay.VSTACK_BASE, lay.VSTACK_BASE + lay.VSTACK_CAP * 4);
    u8.fill(0, lay.EXPSNAP_BASE, lay.EXPSNAP_BASE + lay.EXPSNAP_CAP * lay.EXPSNAP_STRIDE);
};
/** The highest written entry of a zero-filled region — a LOWER bound on the peak (an all-zero entry is invisible). */
const peakOf = (base: number, cap: number, stride: number) => {
    const u32 = new Uint32Array(mem.buffer);
    for (let j = cap - 1; j >= 0; j--) {
        const b = (base + j * stride) >> 2;
        for (let w = 0; w < stride / 4; w++) if (u32[b + w] !== 0) return j + 1;
    }
    return 0;
};
/** One Wasm run, with every class-3 reading beside the result: no throw is tolerated here. */
const measureWasm = (prod: string, src: string) => {
    zeroRegions();
    ex.reset();
    const product = wl.parse(prod, src);
    return {
        product,
        len: src.length,
        ovf: word("ovf"),
        markn: word("markn"),
        recn: word("recn"),
        dlen: word("dlen"),
        arenaHigh: ex.highWater(),
        vstackPeak: peakOf(lay.VSTACK_BASE, lay.VSTACK_CAP, 4),
        expsnapPeak: peakOf(lay.EXPSNAP_BASE, lay.EXPSNAP_CAP, lay.EXPSNAP_STRIDE),
        cHigh: ex.cHighWater(),
        pHigh: ex.pHighWater(),
    };
};

/** The smallest n at which `fires(n)`; binary-searched from 1 (the census method). */
const firstFiring = (fires: (n: number) => boolean, ceiling: number) => {
    let lo = 0;
    let hi = 1;
    while (hi < ceiling && !fires(hi)) {
        lo = hi;
        hi *= 2;
    }
    if (!fires(hi)) return null;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (fires(mid)) hi = mid;
        else lo = mid;
    }
    return hi;
};
const namesRegion = (r: Result, region: Region) => !r.ok && r.diagnostics.some((d) => d.expected[0] === promoteLabel(CAPACITY_LABELS[region]));

/* ── the band: every witness row this file drives through both lowerings ───────────────────── */

const band: { name: string; prod: string; src: string }[] = [];
const bandRow = (name: string, prod: string, src: string) => {
    band.push({ name, prod, src });
    return src;
};

/* ═══ 1. DECLARED: nine regions, each a VALUE the mechanism carries, a LABEL, a PRODUCTION ═══════ */

describe("the nine capacities are declared in Θ, read from the layout, and carried by both lowerings", () => {
    it("Θ is frozen and names depthBound beside exactly the nine regions, in the declared order", () => {
        expect(Object.isFrozen(THETA)).toBe(true);
        expect(Object.keys(THETA)).toEqual(["depthBound", ...REGIONS]);
        expect(REGIONS).toEqual(["input", "marks", "recoveries", "D", "C", "P", "vstack", "arena", "expsnap"]);
        expect(THETA.depthBound).toBe(DEPTH_BOUND);
    });

    it("every VALUE is the layout's own constant — except the derived input window, which is at most it", () => {
        expect(CAPACITY.marks).toBe(lay.MARK_CAP);
        expect(CAPACITY.recoveries).toBe(lay.REC_CAP);
        expect(CAPACITY.D).toBe(lay.D_CAP);
        expect(CAPACITY.C).toBe(lay.C_CAP);
        expect(CAPACITY.P).toBe(lay.P_CAP);
        expect(CAPACITY.vstack).toBe(lay.VSTACK_CAP);
        expect(CAPACITY.arena).toBe(lay.ARENA_CAP);
        expect(CAPACITY.expsnap).toBe(lay.EXPSNAP_CAP);
        expect(CAPACITY.input).toBe(INPUT_BOUND);
        expect(CAPACITY.input).toBeLessThanOrEqual(lay.INPUT_CAP);
        //  no CAP moved (§0q): the layout's values are the ones the census banked on 2026-09-18
        expect([lay.INPUT_CAP, lay.MARK_CAP, lay.VSTACK_CAP, lay.ARENA_CAP, lay.C_CAP, lay.P_CAP, lay.D_CAP, lay.REC_CAP, lay.EXPSNAP_CAP])
            .toEqual([1048576, 32768, 65536, 7208960, 65536, 65536, 4096, 4096, 32]);
    });

    for (const kind of KINDS) {
        for (const region of REGIONS) {
            it(`${kind}: Θ.${region}, the lowering's own theta, the label in L and its named production all agree`, () => {
                const row = assertCapacityBound(lowering(kind), region);
                expect(row.capacity).toBe(CAPACITY[region]);
                expect(lowering(kind).theta()[region]).toBe(CAPACITY[region]);
                expect(row.label).toBe(`${region} <= ${CAPACITY[region]}`);
                expect(L.includes(row.label)).toBe(true);
                expect(isNamedProduction(row.production)).toBe(true);
                expect(row.production).toContain(`${CAPACITY[region]}`);
            });
        }
        it(`${kind}: assertCapacityBounds returns all nine rows and the class-3 proof`, () => {
            const all = assertCapacityBounds(lowering(kind));
            expect(all.regions.map((r: { region: string }) => r.region)).toEqual(REGIONS);
            expect(all.class3).toBe(CLASS3_PROOF);
        });
    }

    it("the nine labels sit AFTER \"<string>\" in L, so no existing label index moved (E-f1, K-10)", () => {
        const at = L.indexOf("<string>");
        expect(at).toBeGreaterThan(0);
        expect(L.slice(at + 1)).toEqual(REGIONS.map((r) => CAPACITY_LABELS[r]));
        expect(L.length).toBe(51 + 9);
    });

    it("NEGATIVE CONTROL — a lowering whose Θ disagrees with a declared capacity HALTS by name", () => {
        const widened = Object.create(lowerings.js) as Lowering;
        widened.theta = () => ({ ...(lowerings.js as unknown as Lowering).theta(), marks: CAPACITY.marks * 2 });
        expect(() => assertCapacityBound(widened, "marks")).toThrowError(/Θ\.marks=65536, not 32768/);
        expect(() => assertCapacityBound(lowerings.js as unknown as Lowering, "journal" as Region)).toThrowError(/not a declared region/);
    });
});

/* ═══ 2. THE CLASS-3 PROOF: derived, asserted at load, and its negative control ═════════════════ */

describe("class 3 — unreachable by construction: K from the emitter's node table, cap₃ >= K × bound₁ + S at load", () => {
    it("the derivation is deterministic and is what the module loaded", () => {
        const again = deriveClass3Ceilings();
        expect(again.vstack).toEqual(CLASS3_CEILINGS.vstack);
        expect(again.arena).toEqual(CLASS3_CEILINGS.arena);
        expect(again.expsnap).toEqual(CLASS3_CEILINGS.expsnap);
    });

    it("every ceiling fits its region under Θ.input, and expsnap's ceiling is static (no EXPECT recurs through the one REF cycle)", () => {
        expect(CLASS3_PROOF.vstack.ceiling).toBeLessThanOrEqual(lay.VSTACK_CAP);
        expect(CLASS3_PROOF.arena.ceiling).toBeLessThanOrEqual(lay.ARENA_CAP);
        expect(CLASS3_PROOF.expsnap.ceiling).toBeLessThanOrEqual(lay.EXPSNAP_CAP);
        expect(CLASS3_CEILINGS.vstack.K).toBe(1);
        expect(CLASS3_CEILINGS.expsnap.K).toBe(0);
        expect(CLASS3_CEILINGS.expsnap.S).toBe(1);
        expect(CLASS3_CEILINGS.arena.K).toBeGreaterThan(0);
    });

    it("Θ.input is the LARGEST window the ceilings admit: one more code unit and a class-3 region is reachable", () => {
        const c = CLASS3_CEILINGS;
        const byVstack = lay.VSTACK_CAP - c.vstack.S;
        const byArena = Math.floor((lay.ARENA_CAP - c.arena.S) / c.arena.K);
        expect(INPUT_BOUND).toBe(Math.min(lay.INPUT_CAP, byVstack, byArena));
        expect(() => assertClass3Unreachable(c, INPUT_BOUND)).not.toThrow();
        if (INPUT_BOUND < lay.INPUT_CAP) expect(() => assertClass3Unreachable(c, INPUT_BOUND + 1)).toThrowError(/HALT: a class-3 region is reachable/);
    });

    it("NEGATIVE CONTROL — a ceiling that does not fit HALTS at the assertion, naming the region", () => {
        const c = CLASS3_CEILINGS;
        expect(() => assertClass3Unreachable({ ...c, vstack: { K: 2, S: c.vstack.S, unit: "code unit" } }, INPUT_BOUND)).toThrowError(/vstack \d+ > 65536/);
        expect(() => assertClass3Unreachable({ ...c, expsnap: { K: 1, S: 1, unit: "depth level" } }, INPUT_BOUND)).toThrowError(/expsnap 65 > 32/);
        expect(() => assertClass3Unreachable(c, lay.INPUT_CAP + 1)).toThrowError(/HALT/);
    });
});

/* ═══ 3. CLASS 1: at the bound and one past it, both lowerings, byte-identical, no shield ═══════ */

/** The witness pair for a region: the last input that does NOT name it, and the first that does. */
const pairFor = (region: Region, unitCeiling: number) => {
    const prod = WITNESS_PRODUCTION[region];
    const js = entryFor("js", prod);
    const n = firstFiring((k) => namesRegion(js(witnessAtCapacity(region, k)), region), unitCeiling);
    if (n === null) throw new Error(`the '${region}' witness family never names its region up to ${unitCeiling}`);
    return { prod, at: bandRow(`${region} AT (n=${n - 1})`, prod, witnessAtCapacity(region, n - 1)), past: bandRow(`${region} PAST (n=${n})`, prod, witnessAtCapacity(region, n)), n };
};

describe("class 1 — input · marks · recoveries · D: an ordinary ok:false css_syntax naming the bound, identical in both lowerings", () => {
    const input = pairFor("input", lay.INPUT_CAP * 2);
    const marks = pairFor("marks", lay.MARK_CAP * 2);
    const recoveries = pairFor("recoveries", lay.REC_CAP * 2);

    it("the input witness generator produces exactly the length it names, and the marks/recoveries coordinates are the census's", () => {
        expect(witnessAtCapacity("input", 2)).toBe("{}");
        expect(witnessAtCapacity("input", 5)).toBe("aaa{}");
        expect(input.n).toBe(INPUT_BOUND + 1);
        expect(input.at.length).toBe(INPUT_BOUND);
        expect(input.past.length).toBe(INPUT_BOUND + 1);
        expect(marks.n).toBe(16382); //                  the banked census: `a{}`×16382 is the first to overflow the mark journal
        expect(recoveries.n).toBe(lay.REC_CAP + 1); //   one recovery per malformed rule
    });

    for (const kind of KINDS) {
        it(`${kind}: input — AT the bound is ok:true, ONE PAST is the input-window rejection over the whole source`, () => {
            const entry = entryFor(kind, input.prod);
            const at = entry(input.at);
            const past = entry(input.past);
            expect(at.ok).toBe(true);
            expect(past.ok).toBe(false);
            expect("value" in past).toBe(false);
            expect(past.diagnostics).toHaveLength(1);
            expect(past.diagnostics[0]).toEqual({ code: "css_syntax", start: 0, end: INPUT_BOUND + 1, expected: [promoteLabel(CAPACITY_LABELS.input)], actual: input.past });
        });

        it(`${kind}: marks — AT the bound is ok:true, ONE PAST names the mark journal`, () => {
            const entry = entryFor(kind, marks.prod);
            const at = entry(marks.at);
            const past = entry(marks.past);
            expect(at.ok).toBe(true);
            expect(past.ok).toBe(false);
            expect("value" in past).toBe(false);
            expect(past.diagnostics.map((d) => d.expected[0])).toEqual([promoteLabel(CAPACITY_LABELS.marks)]);
            expect(past.diagnostics[0].code).toBe("css_syntax");
            expect([past.diagnostics[0].start, past.diagnostics[0].end, past.diagnostics[0].actual]).toEqual([0, marks.past.length, marks.past]);
        });

        it(`${kind}: recoveries + D — AT the bound carries 4096 recovery diagnostics and no capacity row; ONE PAST names BOTH journals, in Θ's order`, () => {
            const entry = entryFor(kind, recoveries.prod);
            const at = entry(recoveries.at);
            const past = entry(recoveries.past);
            expect(at.ok).toBe(false);
            expect(at.diagnostics).toHaveLength(lay.REC_CAP);
            expect(at.diagnostics.some((d) => REGIONS.some((r) => d.expected[0] === promoteLabel(CAPACITY_LABELS[r])))).toBe(false);
            expect(past.ok).toBe(false);
            expect(past.diagnostics.map((d) => d.expected[0])).toEqual([promoteLabel(CAPACITY_LABELS.recoveries), promoteLabel(CAPACITY_LABELS.D)]);
            for (const d of past.diagnostics) expect([d.code, d.start, d.end, d.actual]).toEqual(["css_syntax", 0, recoveries.past.length, recoveries.past]);
        });
    }

    it("the raw σ products of a breached run are IDENTICAL across both lowerings — empty journals, the peaks, the far frontier", () => {
        for (const src of [input.past, marks.past, recoveries.past]) {
            const prod = "P:stylesheet";
            const js = lowering("js").parse(prod, src);
            const wasm = lowering("wasm").parse(prod, src);
            expect(js.ok).toBe(false);
            expect(js).toEqual(wasm);
            expect(js.C).toEqual([]);
            expect(js.marks).toEqual([]);
            expect(js.peaks).toEqual(wasm.peaks);
        }
    });

    it("capacityBreaches names every breached region in the declared order, and nothing at the bound itself", () => {
        expect(capacityBreaches({ marks: CAPACITY.marks, recoveries: CAPACITY.recoveries, D: CAPACITY.D, C: CAPACITY.C, P: CAPACITY.P })).toEqual([]);
        expect(capacityBreaches({ marks: CAPACITY.marks + 1, recoveries: 0, D: CAPACITY.D + 1, C: 0, P: CAPACITY.P + 1 })).toEqual(["marks", "D", "P"]);
        expect(BOUNDARY_REGIONS).toEqual(["marks", "recoveries", "D", "C", "P"]);
    });
});

/* ═══ 4. THE G-3 PROOF LEG: ESC-e1's own witnesses and §0q's ruled window witness ══════════════ */

describe("G-3 proof leg — the shield is NON-load-bearing on the capacity witnesses", () => {
    const esc8190 = bandRow("ESC-e1 a{color:red}×8190", "P:stylesheet", "a{color:red}".repeat(8190));
    const esc8191 = bandRow("ESC-e1 a{color:red}×8191", "P:stylesheet", "a{color:red}".repeat(8191));
    const ruled = bandRow("§0q ruled window witness \"a\"×(INPUT_CAP−1)+\"{}\"", "P:stylesheet", witnessAtCapacity("input", lay.INPUT_CAP + 1));

    it("ESC-e1's pair and the ruled 1 MB witness are answered identically by both lowerings — every one an input-window rejection under the derived Θ.input", () => {
        for (const src of [esc8190, esc8191, ruled]) {
            const js = entryFor("js", "P:stylesheet")(src);
            const wasm = entryFor("wasm", "P:stylesheet")(src);
            expect(canonicalAll(js)).toBe(canonicalAll(wasm));
            expect(js.ok).toBe(false);
            expect(js.diagnostics[0].expected[0]).toBe(promoteLabel(CAPACITY_LABELS.input));
        }
    });

    it("the three inputs that TRAPPED the module before this unit (a{}×40000 · linear(0, )×70000 · ;×70000) are input-window rejections in both lowerings, and the module is not entered", () => {
        const rows: [string, string][] = [
            ["P:stylesheet", bandRow("trap family a{}×40000", "P:stylesheet", "a{}".repeat(40000))],
            ["P:timing-function", bandRow("trap family linear(0, )×70000", "P:timing-function", `linear(${"0, ".repeat(70000)}1)`)],
            ["P:stylesheet", bandRow("trap family ;×70000", "P:stylesheet", ";".repeat(70000))],
        ];
        for (const [prod, src] of rows) {
            const js = entryFor("js", prod)(src);
            const wasm = entryFor("wasm", prod)(src);
            expect(canonicalAll(js)).toBe(canonicalAll(wasm));
            expect(js.diagnostics[0].expected[0]).toBe(promoteLabel(CAPACITY_LABELS.input));
        }
    });
});

/* ═══ 5. CLASS 2: the peak, measured at the appender and at the push sites, identical ═══════════ */

describe("class 2 — C · P: a high-water counter, the same quantity in both lowerings", () => {
    const corpus = loadCorpusUnion();

    it(
        `over the whole corpus union (${corpus.sources.length} sources × 3 productions): JS peaks == Wasm peaks, peak >= final, and each journal's peak <= length (the tiling law, per journal)`,
        () => {
            const prods = ["P:color", "P:timing-function", "P:stylesheet"];
            let cells = 0;
            let peakAboveFinal = 0;
            const mismatches: string[] = [];
            for (const prod of prods) {
                for (const src of corpus.sources) {
                    cells++;
                    const js = lowering("js").parse(prod, src);
                    const wasm = lowering("wasm").parse(prod, src);
                    if (js.peaks.C !== wasm.peaks.C || js.peaks.P !== wasm.peaks.P) mismatches.push(`${prod} ${JSON.stringify(src).slice(0, 40)} js=${JSON.stringify(js.peaks)} wasm=${JSON.stringify(wasm.peaks)}`);
                    if (js.peaks.C < js.C.length || js.peaks.P < js.P.length) mismatches.push(`${prod} ${JSON.stringify(src).slice(0, 40)} peak below final`);
                    if (js.peaks.C > js.C.length || js.peaks.P > js.P.length) peakAboveFinal++;
                    //  each journal's LIVE entries tile disjoint code units, so each PEAK (a live count at
                    //  one moment) is at most the length — the two peaks are taken at different moments
                    //  and their SUM is not (measured: "h" peaks C=1 from `sync` and P=1 from the failed body)
                    if (js.peaks.C > src.length || js.peaks.P > src.length) mismatches.push(`${prod} ${JSON.stringify(src).slice(0, 40)} peak ${JSON.stringify(js.peaks)} > ${src.length}`);
                }
            }
            expect(mismatches.slice(0, 20)).toEqual([]);
            expect(cells).toBe(prods.length * corpus.sources.length);
            //  the counter is a PEAK: on a measurable share of the corpus a restore lowered the journal
            //  below its high-water — which is the reading final-count-with-proof could not give
            expect(peakAboveFinal).toBeGreaterThan(0);
        },
        SWEEP_TIMEOUT_MS,
    );

    it("NEGATIVE CONTROL — a restoring input whose peak exceeds its final count exists in the corpus, is found rather than pinned, and both lowerings read the same peak on it", () => {
        //  a failed arm journals before the ALT/TRY restores C/P to its mark: the peak is the failed
        //  arm's, the final count the survivor's — the reading final-count-with-proof cannot give
        const found = corpus.sources
            .map((src) => ({ src, p: lowering("js").parse("P:color", src) }))
            .find(({ p }) => p.peaks.C > p.C.length || p.peaks.P > p.P.length);
        expect(found).toBeDefined();
        const { src, p } = found!;
        const w = lowering("wasm").parse("P:color", src);
        expect(w.peaks).toEqual(p.peaks);
        expect(w.C.length).toBe(p.C.length);
        expect(w.P.length).toBe(p.P.length);
        expect(Math.max(p.peaks.C - p.C.length, p.peaks.P - p.P.length)).toBeGreaterThan(0);
    });

    it("under the derived Θ.input neither journal can breach: each peak <= Θ.input < its CAP, measured on the census's densest families at the window", () => {
        expect(CAPACITY.input).toBeLessThan(lay.C_CAP);
        expect(CAPACITY.input).toBeLessThan(lay.P_CAP);
        const rows: [string, string][] = [
            ["P:timing-function", bandRow("linear(0, )×n at the window", "P:timing-function", `linear(${"0, ".repeat(Math.floor((INPUT_BOUND - 9) / 3))}1)`)],
            ["P:timing-function", bandRow("linear(0 1% 2%, )×n at the window", "P:timing-function", `linear(${"0 1% 2%, ".repeat(Math.floor((INPUT_BOUND - 9) / 9))}1)`)],
            ["P:stylesheet", bandRow("a { color : red ; } ×n at the window", "P:stylesheet", "a { color : red ; } ".repeat(Math.floor(INPUT_BOUND / 20)))],
        ];
        for (const [prod, src] of rows) {
            expect(src.length).toBeLessThanOrEqual(INPUT_BOUND);
            for (const kind of KINDS) {
                const p = lowering(kind).parse(prod, src);
                expect(p.peaks.C).toBeLessThanOrEqual(src.length);
                expect(p.peaks.P).toBeLessThanOrEqual(src.length);
                expect(p.peaks.C).toBeLessThanOrEqual(CAPACITY.C);
                expect(p.peaks.P).toBeLessThanOrEqual(CAPACITY.P);
            }
            expect(lowering("js").parse(prod, src).peaks).toEqual(lowering("wasm").parse(prod, src).peaks);
        }
    });
});

/* ═══ 6. CLASS 3: the census maxima against K — `<=`, never `=` ════════════════════════════════ */

describe("class 3 — the census families at the window: every measured peak sits under its derived ceiling, and the module never traps", () => {
    //  the banked census's twenty families (`capacity-reachability-2026-09-18.mjs`), each regenerated
    //  at the largest repetition that fits the window — GENERATED, never pinned
    const fit = (overhead: number, unit: number) => Math.max(1, Math.floor((INPUT_BOUND - overhead) / unit));
    const FAMILIES: [string, string, string][] = [
        ["a{color:red}×n", "P:stylesheet", "a{color:red}".repeat(fit(0, 12))],
        ["a{}×n", "P:stylesheet", "a{}".repeat(fit(0, 3))],
        ["a{c:r;×n}", "P:stylesheet", `a{${"c:r;".repeat(fit(3, 4))}}`],
        ["a{c:1 ×n}", "P:stylesheet", `a{c:${"1 ".repeat(fit(5, 2))}}`],
        ["a{c:x ×n}", "P:stylesheet", `a{c:${"x ".repeat(fit(5, 2))}}`],
        ["a{c:(×n)×n}", "P:stylesheet", `a{c:${"(".repeat(fit(5, 2))}${")".repeat(fit(5, 2))}}`],
        ["a×n{}", "P:stylesheet", witnessAtCapacity("input", INPUT_BOUND)],
        [" ×n a{}", "P:stylesheet", `${" ".repeat(fit(3, 1))}a{}`],
        ["a{c}×n", "P:stylesheet", "a{c}".repeat(fit(0, 4))],
        ["a{c;×n}", "P:stylesheet", `a{${"c;".repeat(fit(3, 2))}}`],
        ["linear(0, ×n)", "P:timing-function", `linear(${"0, ".repeat(fit(9, 3))}1)`],
        ["linear(0 1%, ×n)", "P:timing-function", `linear(${"0 1%, ".repeat(fit(9, 6))}1)`],
        ["linear(0 1% 2%, ×n)", "P:timing-function", `linear(${"0 1% 2%, ".repeat(fit(9, 9))}1)`],
        ["linear(0 , ×n)", "P:timing-function", `linear(${"0 , ".repeat(fit(9, 4))}1)`],
        ["linear(0/**/, ×n)", "P:timing-function", `linear(${"0/**/, ".repeat(fit(9, 7))}1)`],
        ["a { color : red ; } ×n", "P:stylesheet", "a { color : red ; } ".repeat(fit(0, 20))],
        ["cubic-bezier one-shot", "P:timing-function", "cubic-bezier(0.1, 0.2, 0.3, 0.4)"],
        ["rgb one-shot", "P:color", "rgb(1 2 3 / 0.5)"],
        ["rgb(1 ×n)", "P:color", `rgb(${"1 ".repeat(fit(5, 2))})`],
        ["var nested at depth 64", "P:color", witnessAtDepth(DEPTH_BOUND)],
        //  and the two families this unit added: one cell per code unit, and one selector part per comma
        [";×n (vstack: one recovered rule per code unit)", "P:stylesheet", witnessAtCapacity("vstack", INPUT_BOUND)],
        ["a,×n{} (one selector part per comma)", "P:stylesheet", `a${",".repeat(fit(3, 1))}{}`],
    ];
    const readings = FAMILIES.map(([name, prod, src]) => {
        bandRow(`census ${name}`, prod, src);
        return { name, prod, src, ...measureWasm(prod, src) };
    });

    it("every family is regenerated INSIDE the window, so each run is one the load-time proof covers", () => {
        for (const r of readings) expect(r.len).toBeLessThanOrEqual(INPUT_BOUND);
        expect(readings).toHaveLength(22);
    });

    it("no family throws, and the value-stack, arena and snapshot peaks all sit at or under their derived ceilings (`<=`, never `=` at the cap)", () => {
        const K = CLASS3_CEILINGS;
        const over = readings
            .filter((r) => !(r.vstackPeak <= K.vstack.K * r.len + K.vstack.S) || !(r.arenaHigh <= K.arena.K * r.len + K.arena.S) || !(r.expsnapPeak <= K.expsnap.S))
            .map((r) => `${r.name}: len ${r.len} vstack ${r.vstackPeak} arena ${r.arenaHigh} expsnap ${r.expsnapPeak}`);
        expect(over).toEqual([]);
        for (const r of readings) {
            expect(r.vstackPeak).toBeLessThan(lay.VSTACK_CAP);
            expect(r.arenaHigh).toBeLessThan(lay.ARENA_CAP);
            expect(r.expsnapPeak).toBeLessThan(lay.EXPSNAP_CAP);
        }
    });

    it("the one-cell-per-code-unit family reaches within S of the value stack's cap at the window and is answered by the declared bounds, not by a trap", () => {
        const r = readings.find((x) => x.name.startsWith(";×n"))!;
        expect(r.vstackPeak).toBeGreaterThanOrEqual(INPUT_BOUND);
        expect(r.vstackPeak).toBeLessThanOrEqual(INPUT_BOUND + CLASS3_CEILINGS.vstack.S);
        expect(r.product.ok).toBe(false);
        expect(r.product.D.map((d) => (d as Issue).expected[0])).toEqual(["marks", "recoveries", "D"].map((k) => CAPACITY_LABELS[k as Region]));
    });

    it("the snapshot stack's census maximum is 1 in every family, the derivation's own static ceiling", () => {
        expect(Math.max(...readings.map((r) => r.expsnapPeak))).toBe(CLASS3_CEILINGS.expsnap.S);
    });

    it("the arena's measured worst family sits under K with headroom (the ceiling is a bound, not a fit)", () => {
        const worst = Math.max(...readings.map((r) => r.arenaHigh / r.len));
        expect(worst).toBeLessThan(CLASS3_CEILINGS.arena.K);
        expect(worst).toBeGreaterThan(0);
    });
});

/* ═══ 7. G-5's BOUNDARY BAND, reported BESIDE the sealed 79,674 / 0 (E-f3) ═════════════════════ */

/** The band's SELF-COUNT: 3 class-1 regions × (at, past) + ESC-e1's pair + the ruled witness + 3 trap families + 3 class-2 rows + 22 census families. */
const BAND_ROWS = 3 * 2 + 2 + 1 + 3 + 3 + 22;

describe("G-5 boundary band — G-5's canonical() (fixed key order, no array sorted), reported BESIDE the sealed 79,674 / 0", () => {
    it(`every one of the ${BAND_ROWS} witness rows × 2 lowerings is byte-identical across the two targets in six-tuple, full diagnostics and value, and no target throws`, () => {
        const differing: string[] = [];
        let cells = 0;
        for (const row of band) {
            cells++;
            const js = entryFor("js", row.prod)(row.src);
            const wasm = entryFor("wasm", row.prod)(row.src);
            if (canonical(js) !== canonical(wasm)) differing.push(`${row.name}: six-tuple`);
            if (canonicalAll(js) !== canonicalAll(wasm)) differing.push(`${row.name}: full diagnostics`);
            if (canonicalValue(js) !== canonicalValue(wasm)) differing.push(`${row.name}: value`);
        }
        expect(differing).toEqual([]);
        expect(cells).toBe(band.length);
        expect(band.length).toBe(BAND_ROWS);
    });

    it("the band is a BAND: it holds the at/past pair of every class-1 region, ESC-e1's pair, the ruled witness, the trap families and the census", () => {
        const names = band.map((b) => b.name);
        for (const r of ["input", "marks", "recoveries"]) {
            expect(names.some((n) => n.startsWith(`${r} AT`))).toBe(true);
            expect(names.some((n) => n.startsWith(`${r} PAST`))).toBe(true);
        }
        expect(names.filter((n) => n.startsWith("ESC-e1"))).toHaveLength(2);
        expect(names.filter((n) => n.startsWith("trap family"))).toHaveLength(3);
        expect(names.filter((n) => n.startsWith("census"))).toHaveLength(22);
    });
});

/* ═══ 8. THE LEDGER: zero, read as a delta over everything above ════════════════════════════════ */

describe("the shield ledger, after every row of this file", () => {
    it("moved by exactly ZERO — the capacity witnesses are answered by the lowerings, never by the shield", () => {
        expect(SHIELD.caught - LEDGER_AT_LOAD).toBe(0);
        expect((SHIELD.faults() as { message: string }[]).slice(LEDGER_AT_LOAD)).toEqual([]);
    });
});
