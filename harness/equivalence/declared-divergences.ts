// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.b — THE DECLARED-DIVERGENCE ROWS.
//
// W1.md §5.b: "Carry the adjudication's 22-row divergence ledger and the four
// preserved DISSENTs as DECLARED DIVERGENCE ROWS in the harness's own output, so
// a divergence that was ruled is visibly distinct from one that was never seen."
//
// These rows are NOT defects and are never summed into A/B/C. They are the
// opposite: the set of disagreements that an adjudication already looked at and
// ruled on. Their whole purpose is that a future reader of a GREEN run can tell
// "nothing disagreed" from "twenty-two things disagreed and every one of them was
// already decided".
//
// AUTHORITY (read-only; an adjudicated record — W1.md §4 do-not-touch):
//   docs/tranches/V/megatranche/registry/adjudicated/parser-band.md
// which states at its own §4 of the verdict summary: "a 22-row divergence ledger
// asserted in both directions". The 22 are 15 + 7: fifteen published-parser
// defect rows, and the seven cand-F vs cand-O disagreements of the structured
// 86-input differential ("79 agree, 7 disagree").

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const ADJUDICATION_PATH =
    "/Users/mkbabb/Programming/value.js/docs/tranches/V/megatranche/registry/adjudicated/parser-band.md";

export interface DivergenceRow {
    /** Stable id: L = the published-parser ledger, D = the cand-F/cand-O differential. */
    readonly id: string;
    /** The input or the axis the row is about. */
    readonly subject: string;
    /** A substring that MUST still be found in the adjudication — the row's address. */
    readonly anchor: string;
    readonly published: string;
    readonly candF: string;
    readonly candO: string;
    readonly ruling: string;
}

/** Ledger A — MEASURED published-parser defects, 15 rows, each confirmed by
 *  direct probe at adjudication time (2026-07-27). */
export const PUBLISHED_DEFECT_LEDGER: readonly DivergenceRow[] = [
    {
        id: "L-01",
        subject: "rgba(1, 2, 3, 0.5)",
        anchor: "`rgba(1, 2, 3, 0.5)`",
        published: "REJECT (gap)",
        candF: "accept",
        candO: "accept",
        ruling: "GAP confirmed (P-012): the most-deployed colour syntax on the web fails",
    },
    {
        id: "L-02",
        subject: "hsla(120, 50%, 50%, 0.5)",
        anchor: "`hsla(120, 50%, 50%, 0.5)`",
        published: "REJECT (gap)",
        candF: "accept",
        candO: "accept",
        ruling: "GAP confirmed (P-015)",
    },
    {
        id: "L-03",
        subject: "rgb(1,2,3,)",
        anchor: "`rgb(1,2,3,)`",
        published: "ACCEPT",
        candF: "reject",
        candO: "reject",
        ruling: "P-037 unsound accept confirmed",
    },
    {
        id: "L-04",
        subject: "rgb(1 2 3 / )",
        anchor: "`rgb(1 2 3 / )`",
        published: "ACCEPT",
        candF: "reject",
        candO: "reject",
        ruling: "P-037 confirmed",
    },
    {
        id: "L-05",
        subject: "rgb(1, 2 3) — mixed separators",
        anchor: "mixed separators",
        published: "ACCEPT [1,2,3]",
        candF: "reject",
        candO: "reject",
        ruling: "comma→space rewrite makes separators invisible (found by the bench honesty gate)",
    },
    {
        id: "L-06",
        subject: "hsl(120%, 50%, 50%)",
        anchor: "`hsl(120%, 50%, 50%)`",
        published: "ACCEPT, hue=432",
        candF: "reject",
        candO: "reject",
        ruling: "percentage <hue> over-accept, §7",
    },
    {
        id: "L-07",
        subject: "lch(50% 50% 50%)",
        anchor: "`lch(50% 50% 50%)`",
        published: "ACCEPT, hue=180",
        candF: "reject",
        candO: "reject",
        ruling: "same class as L-06",
    },
    {
        id: "L-08",
        subject: "rgb(300 -20 3)",
        anchor: "`rgb(300 -20 3)`",
        published: "[300,−20,3] unclamped",
        candF: "[255,0,3]",
        candO: "[255,0,3]",
        ruling: "§8.1 clamp missing in published",
    },
    {
        id: "L-09",
        subject: "rgb(1 2 3 / 1.5)",
        anchor: "`rgb(1 2 3 / 1.5)`",
        published: "REJECT",
        candF: "alpha=1",
        candO: "alpha=1",
        ruling: "§4.2 says clamp, not reject",
    },
    {
        id: "L-10",
        subject: "hsl(120 50 50) vs hsl(120 50% 50%)",
        anchor: "**R6 confirmed**",
        published: "[120,50,50] vs [120,0.5,0.5]",
        candF: "consistent",
        candO: "consistent (0.5)",
        ruling: "R6 confirmed: two spec-identical spellings disagree 100×",
    },
    {
        id: "L-11",
        subject: "rgb(1. 2 3)",
        anchor: "`rgb(1. 2 3)`",
        published: "ACCEPT",
        candF: "reject",
        candO: "reject",
        ruling: "`1.` is not a CSS number",
    },
    {
        id: "L-12",
        subject: "hwb(120, 30%, 40%)",
        anchor: "`hwb(120, 30%, 40%)`",
        published: "ACCEPT",
        candF: "reject",
        candO: "reject",
        ruling: "css-color-4 functions have no comma form",
    },
    {
        id: "L-13",
        subject: "currentcolor",
        anchor: "`currentcolor`",
        published: "REJECT",
        candF: "accept (node)",
        candO: "context node; adapter color_context_required",
        ruling: "published gap",
    },
    {
        id: "L-14",
        subject: "lab(50 1e400 0)",
        anchor: "`lab(50 1e400 0)`",
        published: "REJECT",
        candF: "accept, a=∞ in AST",
        candO: "color_non_finite",
        ruling: "cand-F's sole adjudicated correctness debit",
    },
    {
        id: "L-15",
        subject: "hsl(480 …) / hsl(-120 …)",
        anchor: "`hsl(480 …)` / `hsl(-120 …)`",
        published: "480 / −120 (unwrapped)",
        candF: "120 / 240 (wrapped)",
        candO: "480 / −120",
        ruling: "cand-F's parse-time mod-360 is a drop-in divergence; wrapping is serialisation-time",
    },
];

/** Ledger B — the cand-F vs cand-O differential: "Structured corpus 86 inputs:
 *  79 agree, 7 disagree — all seven adjudicated above or here." */
export const CANDIDATE_DIFFERENTIAL_LEDGER: readonly DivergenceRow[] = [
    {
        id: "D-01",
        subject: "hue wrap — hsl(480 …)",
        anchor: "hue wrap ×2 (O correct)",
        published: "480 (unwrapped)",
        candF: "120 (wrapped at parse time)",
        candO: "480",
        ruling: "O correct; wrapping is serialisation-time, not parse-time",
    },
    {
        id: "D-02",
        subject: "hue wrap — hsl(-120 …)",
        anchor: "hue wrap ×2 (O correct)",
        published: "−120 (unwrapped)",
        candF: "240 (wrapped at parse time)",
        candO: "−120",
        ruling: "O correct; same axis as D-01, counted as its own row by the adjudication's ×2",
    },
    {
        id: "D-03",
        subject: "color(xyz-d50 …) Bradford adaptation",
        anchor: "`xyz-d50` adaptation",
        published: "0.20946884509321387… (adapted)",
        candF: "unadapted; excluded from its own equivalence set",
        candO: "matches published bit-for-bit",
        ruling: "O matches published bit-for-bit; F leaves it unadapted and excludes it from equivalence",
    },
    {
        id: "D-04",
        subject: "token juxtaposition — rgb(50%20%30%)",
        anchor: "`rgb(50%20%30%)`",
        published: "reject",
        candF: "reject (declared simplification)",
        candO: "accept (css-syntax token-stream reading; browsers agree)",
        ruling: "O diverges from the incumbent TOWARD the spec; DISSENT S-1 preserved",
    },
    {
        id: "D-05",
        subject: "token juxtaposition — rgb(1.5.5 3)",
        anchor: "`rgb(1.5.5 3)`",
        published: "reject",
        candF: "reject (declared simplification)",
        candO: "accept (token-stream reading)",
        ruling: "as D-04; DISSENT S-1 preserved",
    },
    {
        id: "D-06",
        subject: "token juxtaposition — hsl(120 50%50%)",
        anchor: "`hsl(120 50%50%)`",
        published: "reject",
        candF: "reject (declared simplification)",
        candO: "accept (token-stream reading)",
        ruling: "as D-04; DISSENT S-1 preserved",
    },
    {
        id: "D-07",
        subject: "lab(50 1e400 0) — non-finite numeral",
        anchor: "(O rejects explicitly, F admits Infinity)",
        published: "REJECT",
        candF: "admits Infinity",
        candO: "rejects explicitly (color_non_finite)",
        ruling: "O adjudicated correct; DISSENT S-2 preserved on the contract question",
    },
];

export interface DissentRow {
    readonly id: string;
    readonly title: string;
    readonly anchor: string;
    readonly status: "PRESERVED, UNRESOLVED";
    readonly summary: string;
}

/** The four preserved DISSENTs named by W1.md §2c: token juxtaposition,
 *  non-finite numerals, try/catch posture, bench epistemics. The adjudication's
 *  fifth bullet ("cand-F's disclosure hygiene is noted for the record") is a
 *  process note, not a dissent, and is deliberately NOT carried as one. */
export const PRESERVED_DISSENTS: readonly DissentRow[] = [
    {
        id: "S-1",
        title: "Token juxtaposition",
        anchor: "**Token juxtaposition**",
        status: "PRESERVED, UNRESOLVED",
        summary:
            "cand-O accepts rgb(50%20%30%) per css-syntax token-stream reading (browsers agree); cand-F rejects; published rejects. The adjudication adopts cand-O, which WIDENS acceptance relative to the incumbent. To be pinned as a DECLARED divergence row; the owner may overrule toward cand-F's stricter line.",
    },
    {
        id: "S-2",
        title: "Non-finite numerals",
        anchor: "**Non-finite numerals**",
        status: "PRESERVED, UNRESOLVED",
        summary:
            "Three-way split: published rejects 1e400 outright; cand-O clamps where clamps exist and fails color_non_finite on unclamped channels; cand-F admits Infinity. The GROUND-C contract question — are ±Infinity admitted? — deserves an owner ruling.",
    },
    {
        id: "S-3",
        title: "try/catch posture",
        anchor: "**try/catch posture**",
        status: "PRESERVED, UNRESOLVED",
        summary:
            "cand-F ships without a shield, proven by 10,000-case fuzz over a recursion-free grammar; cand-O keeps a guard proven non-load-bearing. If the wave lands the depth-bounded tail, cand-F's position becomes tenable again. Recorded as live disagreement, not settled doctrine.",
    },
    {
        id: "S-4",
        title: "Bench epistemics",
        anchor: "**Bench epistemics**",
        status: "PRESERVED, UNRESOLVED",
        summary:
            "Both candidates and the adjudication measure same-process hot loops on one machine. The direction-reversal against the prior gate's 'regex ~1.8× fastest' is measured three times by two authors and an arbiter with three methods — but OC-1 owns the bench bar and nothing pre-empts it.",
    },
];

export const DECLARED_DIVERGENCE_ROWS: readonly DivergenceRow[] = [
    ...PUBLISHED_DEFECT_LEDGER,
    ...CANDIDATE_DIFFERENTIAL_LEDGER,
];

export interface DivergenceCheck {
    readonly ok: boolean;
    readonly adjudicationPath: string;
    readonly adjudicationSha256: string;
    readonly rowCount: number;
    readonly dissentCount: number;
    readonly failures: readonly string[];
}

/**
 * Prove the ported rows still address the adjudication they claim to carry.
 * Not a byte-freeze of a whole live document — the taxonomy alone is frozen that
 * way, because it alone is the gate's RED trigger — but a per-row address check:
 * every row's anchor must still be FOUND in the adjudication, and the ported
 * counts must be exactly 22 and 4.
 */
export function checkDivergenceRows(): DivergenceCheck {
    const failures: string[] = [];
    let sha = "";

    if (DECLARED_DIVERGENCE_ROWS.length !== 22) {
        failures.push(
            `ported divergence ledger is ${DECLARED_DIVERGENCE_ROWS.length} rows, the adjudication declares 22`,
        );
    }
    if (PRESERVED_DISSENTS.length !== 4) {
        failures.push(
            `ported DISSENT list is ${PRESERVED_DISSENTS.length}, W1.md §2c names 4`,
        );
    }

    try {
        const bytes = readFileSync(ADJUDICATION_PATH);
        sha = createHash("sha256").update(bytes).digest("hex");
        const md = bytes.toString("utf8");
        for (const row of DECLARED_DIVERGENCE_ROWS) {
            if (!md.includes(row.anchor)) {
                failures.push(`${row.id}: anchor not found in the adjudication — ${row.anchor}`);
            }
        }
        for (const dissent of PRESERVED_DISSENTS) {
            if (!md.includes(dissent.anchor)) {
                failures.push(
                    `${dissent.id}: DISSENT anchor not found in the adjudication — ${dissent.anchor}`,
                );
            }
        }
    } catch (error) {
        failures.push(
            `adjudication unreadable: ${error instanceof Error ? error.message : String(error)}`,
        );
    }

    return {
        ok: failures.length === 0,
        adjudicationPath: ADJUDICATION_PATH,
        adjudicationSha256: sha,
        rowCount: DECLARED_DIVERGENCE_ROWS.length,
        dissentCount: PRESERVED_DISSENTS.length,
        failures,
    };
}
