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
