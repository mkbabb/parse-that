import type { ParserState, Suggestion, SecondarySpan } from "./state.js";

export type { Suggestion, SecondarySpan } from "./state.js";

// ── Diagnostics Flag ─────────────────────────────────────────
let diagnosticsEnabled = false;

export function enableDiagnostics() {
    diagnosticsEnabled = true;
}

export function disableDiagnostics() {
    diagnosticsEnabled = false;
}

export function isDiagnosticsEnabled() {
    return diagnosticsEnabled;
}

// ── Per-parse error tracking (threaded onto ParserState) ─────
//
// The furthest-offset / expected-set / suggestions / secondarySpans live on the
// ParserState instance (the Rust port's `state.furthest_offset` model), not on
// module globals. This makes a parse reentrant and interleave-safe: a nested
// `.parse()` mid-rule operates on its own state and cannot corrupt the outer
// parse's error tracking.

export function mergeErrorState(state: ParserState<unknown>, label?: string) {
    if (state.offset > state.furthest) {
        // New furthest offset — clear and start fresh. The expected-set is a
        // diagnostic feature: only seed it when diagnostics are enabled.
        state.furthest = state.offset;
        state.expected = diagnosticsEnabled && label ? [label] : undefined;
        state.suggestions = [];
        state.secondarySpans = [];
    } else if (state.offset === state.furthest) {
        // Same furthest offset — accumulate the label (diagnostics only).
        if (diagnosticsEnabled && label) {
            if (state.expected) {
                if (!state.expected.includes(label)) {
                    state.expected.push(label);
                }
            } else {
                state.expected = [label];
            }
        }
    }
    return state;
}

export function addSuggestion(state: ParserState<unknown>, suggestion: Suggestion) {
    if (diagnosticsEnabled) {
        state.suggestions.push(suggestion);
    }
}

export function addSecondarySpan(state: ParserState<unknown>, offset: number, label: string) {
    if (diagnosticsEnabled) {
        state.secondarySpans.push({ offset, label });
    }
}

/**
 * Report an unclosed delimiter diagnostic. Used by wrap().
 */
export function reportUnclosedDelimiter(
    state: ParserState<unknown>,
    openText: string,
    openOffset: number,
) {
    if (!diagnosticsEnabled) return;
    const closeText =
        openText === "{" ? "}" : openText === "[" ? "]" : openText === "(" ? ")" : openText;
    addSuggestion(state, {
        kind: "unclosed-delimiter",
        message: `close the delimiter with \`${closeText}\``,
        openOffset,
    });
    addSecondarySpan(state, openOffset, `unclosed \`${openText}\` opened here`);
}

// ── Collected Diagnostics (for error recovery) ──────────────

export interface Diagnostic {
    offset: number;
    furthestOffset: number;
    line: number;
    column: number;
    expected: string[];
    suggestions: Suggestion[];
    secondarySpans: SecondarySpan[];
    found: string;
}

let collectedDiagnostics: Diagnostic[] = [];

/**
 * Snapshot the parse state's current error tracking into a Diagnostic object,
 * push it to the collection, then reset the state's error tracking so the next
 * error starts fresh.
 */
export function collectDiagnostic(state: ParserState<unknown>, errorOffset: number): void {
    const src = state.src;
    const furthest = state.furthest >= 0 ? state.furthest : errorOffset;

    // Compute line/column from the furthest offset
    const before = src.slice(0, furthest);
    const lastNl = before.lastIndexOf("\n");
    const line = lastNl === -1 ? 1 : before.slice(0, lastNl + 1).split("\n").length;
    const column = lastNl === -1 ? furthest : furthest - lastNl - 1;

    // Extract a "found" snippet (up to 20 chars from the furthest offset)
    const found = src.slice(furthest, furthest + 20).replace(/\n/g, "\\n");

    collectedDiagnostics.push({
        offset: errorOffset,
        furthestOffset: furthest,
        line,
        column,
        expected: state.expected ? [...state.expected] : [],
        suggestions: [...state.suggestions],
        secondarySpans: [...state.secondarySpans],
        found,
    });

    // Reset so the next parse error starts fresh
    resetErrorState(state);
}

/** Reset the per-parse error tracking on a state. */
export function resetErrorState(state: ParserState<unknown>): void {
    state.furthest = -1;
    state.expected = undefined;
    state.suggestions = [];
    state.secondarySpans = [];
}

export function getCollectedDiagnostics(): readonly Diagnostic[] {
    return collectedDiagnostics;
}

export function clearCollectedDiagnostics(): void {
    collectedDiagnostics = [];
}

export function popLastDiagnostic(): Diagnostic | undefined {
    return collectedDiagnostics.pop();
}

// ── Imperative byte-scanners (harvested from the removed CSS parser, A.W1) ──
//
// The monolithic byte-loop technique (D7): a tight charCode/indexOf scan that
// mutates `state.offset` in place — no closure-per-step, no Parser allocation.
// These are the primitives a hand-rolled grammar (value.js's canonical CSS
// grammar) drives its hot paths with, distinct from the `whitespace` Parser
// combinator. Kept after the CSS grammar itself left for value.js (D2/D3).

/** Skip ASCII whitespace (charCode <= 32) in place. No comment handling. */
export function skipWhitespace(state: ParserState<unknown>): void {
    const src = state.src;
    let i = state.offset;
    while (i < src.length && src.charCodeAt(i) <= 32) i++;
    state.offset = i;
}

/** Skip whitespace and CSS block comments in place (memchr-style closing-token
 *  scan via indexOf). An unterminated comment stops the scan at its start. */
export function skipBlockComments(state: ParserState<unknown>): void {
    const src = state.src;
    let i = state.offset;
    while (i < src.length) {
        const ch = src.charCodeAt(i);
        if (ch <= 32) {
            i++;
            continue;
        }
        if (ch === 47 /* / */ && src.charCodeAt(i + 1) === 42 /* * */) {
            const end = src.indexOf("*/", i + 2);
            if (end === -1) break;
            i = end + 2;
            continue;
        }
        break;
    }
    state.offset = i;
}
