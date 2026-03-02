import type { ParserState } from "./state.js";

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

// ── Diagnostic Types ─────────────────────────────────────────
export interface Suggestion {
    kind: "unclosed-delimiter" | "trailing-content";
    message: string;
    openOffset?: number;
}

export interface SecondarySpan {
    offset: number;
    label: string;
}

// ── Error Tracking Globals ───────────────────────────────────
let lastFurthestOffset = -1;
let lastState: ParserState<unknown> | undefined;
let lastExpected: string[] = [];
let lastSuggestions: Suggestion[] = [];
let lastSecondarySpans: SecondarySpan[] = [];

export function mergeErrorState(state: ParserState<unknown>, label?: string) {
    if (state.offset > lastFurthestOffset) {
        lastFurthestOffset = state.offset;
        lastState = state;
        // New furthest offset — clear and start fresh
        if (diagnosticsEnabled && label) {
            lastExpected = [label];
        } else {
            lastExpected = [];
        }
        lastSuggestions = [];
        lastSecondarySpans = [];
        // Also maintain backward-compat expected on state
        if (label) {
            state.expected = [label];
        } else {
            state.expected = undefined;
        }
    } else if (state.offset === lastFurthestOffset) {
        if (diagnosticsEnabled && label) {
            if (!lastExpected.includes(label)) {
                lastExpected.push(label);
            }
        }
        if (label) {
            const target = lastState ?? state;
            if (target.expected) {
                if (!target.expected.includes(label)) {
                    target.expected.push(label);
                }
            } else {
                target.expected = [label];
            }
        }
    }
    return lastState;
}

export function addSuggestion(suggestion: Suggestion) {
    if (diagnosticsEnabled) {
        lastSuggestions.push(suggestion);
    }
}

export function addSecondarySpan(offset: number, label: string) {
    if (diagnosticsEnabled) {
        lastSecondarySpans.push({ offset, label });
    }
}

/**
 * Report an unclosed delimiter diagnostic. Shared by wrap() and wrapSpan().
 */
export function reportUnclosedDelimiter(openText: string, openOffset: number) {
    if (!diagnosticsEnabled) return;
    const closeText =
        openText === "{" ? "}" : openText === "[" ? "]" : openText === "(" ? ")" : openText;
    addSuggestion({
        kind: "unclosed-delimiter",
        message: `close the delimiter with \`${closeText}\``,
        openOffset,
    });
    addSecondarySpan(openOffset, `unclosed \`${openText}\` opened here`);
}

export function resetErrorState() {
    lastState = undefined;
    lastFurthestOffset = -1;
    lastExpected = [];
    lastSuggestions = [];
    lastSecondarySpans = [];
}

export function getLastState() {
    return lastState;
}

export function getLastFurthestOffset() {
    return lastFurthestOffset;
}

export function getLastExpected(): readonly string[] {
    return lastExpected;
}

export function getLastSuggestions(): readonly Suggestion[] {
    return lastSuggestions;
}

export function getLastSecondarySpans(): readonly SecondarySpan[] {
    return lastSecondarySpans;
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
 * Snapshot the current global error state into a Diagnostic object,
 * push it to the collection, then reset the error state so the next
 * error starts fresh.
 */
export function collectDiagnostic(src: string, errorOffset: number): void {
    const furthest = lastFurthestOffset >= 0 ? lastFurthestOffset : errorOffset;

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
        expected: [...lastExpected],
        suggestions: [...lastSuggestions],
        secondarySpans: [...lastSecondarySpans],
        found,
    });

    // Reset so the next parse error starts fresh
    resetErrorState();
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
