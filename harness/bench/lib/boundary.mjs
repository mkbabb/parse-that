// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W1.d — THE JS-BOUNDARY INVARIANT, ASSERTED ABOVE parse-that (W1.md §3 item 9, G-10).
//
// O-15 PT-07, reproduced by `parsethat-surface-gaps.mjs` at this seat's clock:
//
//     RED GUARD  parseState(non-string) totality   5/5 throw raw TypeError
//     RED GUARD  .parse() failure signal           returns undefined — indistinguishable from .opt()
//
// Per O-15's own posture the cure is a NAMED INVARIANT ABOVE parse-that, not an ask of the
// library — so this wave asserts it here and files nothing upstream.
//
// THE INVARIANT: a non-string input returns a typed failure; it never crosses the boundary as
// an exception.
//
// WHAT THIS GUARD DELIBERATELY DOES NOT DO: it does not catch exceptions thrown by the engine
// on a STRING input. Wrapping those would convert R1 — the live `parseCssColor("oklch()")`
// shipping crash — into a tidy `ok:false` and delete the very defect the r1-throw leg exists
// to price. A guard that hides the thing being measured is not a cure, it is a mask (standing
// law). The boundary is typed at the INPUT edge only.

export const NON_STRING_PROBES = [undefined, null, 42, {}, []];

export function describe(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v;
}

/**
 * Call `fn` under the boundary invariant.
 * Non-string input -> a typed failure, always, for every engine.
 * String input     -> the engine's own return value, untouched, exceptions and all.
 */
export function totalParse(fn, input) {
    if (typeof input !== "string") {
        return {
            ok: false,
            issue: { code: "non_string_input", got: describe(input) },
        };
    }
    return fn(input);
}

/**
 * Measure the invariant rather than assert it in prose: run the five non-string probes
 * through the raw entry and through the guard, and report both throw counts.
 * The RAW count reproduces PT-07 (5/5); the GUARDED count is the invariant (0/5).
 */
export function measureBoundary(rawFn) {
    let rawThrows = 0;
    const rawModes = new Set();
    for (const bad of NON_STRING_PROBES) {
        try {
            rawFn(bad);
        } catch (e) {
            rawThrows++;
            rawModes.add(e?.constructor?.name ?? String(e));
        }
    }
    let guardedThrows = 0;
    const guardedCodes = new Set();
    for (const bad of NON_STRING_PROBES) {
        try {
            const r = totalParse(rawFn, bad);
            guardedCodes.add(r?.issue?.code ?? "MISSING");
        } catch {
            guardedThrows++;
        }
    }
    return {
        probes: NON_STRING_PROBES.length,
        rawThrows,
        rawModes: [...rawModes],
        guardedThrows,
        guardedCodes: [...guardedCodes],
        holds: guardedThrows === 0 && guardedCodes.size === 1 && guardedCodes.has("non_string_input"),
    };
}
