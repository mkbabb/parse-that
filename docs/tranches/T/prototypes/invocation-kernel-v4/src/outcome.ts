import type { BorrowedValue } from "./model.js";
import { offsetNumber, utf16Offset, type Diagnostic, type Utf16Offset } from "./types.js";

export interface Evidence {
    readonly offset: Utf16Offset;
    readonly expected: readonly string[];
    readonly committedOwner: number | null;
}

interface OutcomeBase {
    readonly diagnostics: readonly Diagnostic[];
}

export interface Success extends OutcomeBase {
    readonly kind: "success";
    readonly value: BorrowedValue;
    readonly next: Utf16Offset;
    readonly control: number | null;
}

export interface Failure extends OutcomeBase {
    readonly kind: "failure";
    readonly evidence: Evidence;
    readonly control: number | null;
}

export interface ResourceFailure extends OutcomeBase {
    readonly kind: "resource";
    readonly resource: "step-budget" | "invariant";
    readonly evidence: Evidence;
}

export type Outcome = Success | Failure | ResourceFailure;

export interface RelativeDiagnostic {
    readonly delta: number;
    readonly expected: readonly string[];
    readonly found: string;
}

export type RelativeAnswer =
    | {
          readonly kind: "success";
          readonly value: BorrowedValue;
          readonly nextDelta: number;
          readonly diagnostics: readonly RelativeDiagnostic[];
      }
    | {
          readonly kind: "failure";
          readonly evidence: {
              readonly delta: number;
              readonly expected: readonly string[];
              readonly committedOwner: number | null;
          };
          readonly diagnostics: readonly RelativeDiagnostic[];
      };

export function evidence(
    offset: Utf16Offset,
    expected: readonly string[],
    committedOwner: number | null = null,
): Evidence {
    return {
        offset,
        expected: Object.freeze([...new Set(expected)].sort()),
        committedOwner,
    };
}

export function mismatch(offset: Utf16Offset, label: string, control: number | null): Failure {
    return { kind: "failure", evidence: evidence(offset, [label]), diagnostics: [], control };
}

export function resource(
    offset: Utf16Offset,
    kind: ResourceFailure["resource"],
    label: string,
): ResourceFailure {
    return { kind: "resource", resource: kind, evidence: evidence(offset, [label]), diagnostics: [] };
}

export function mergeEvidence(left: Evidence, right: Evidence): Evidence {
    const leftOffset = offsetNumber(left.offset);
    const rightOffset = offsetNumber(right.offset);
    if (leftOffset > rightOffset) return left;
    if (rightOffset > leftOffset) return right;
    return evidence(
        left.offset,
        [...left.expected, ...right.expected],
        right.committedOwner ?? left.committedOwner,
    );
}

export function prependDiagnostics(prefix: readonly Diagnostic[], outcome: Outcome): Outcome {
    return prefix.length === 0 ? outcome : { ...outcome, diagnostics: [...prefix, ...outcome.diagnostics] };
}

export function relativize(entry: Utf16Offset, outcome: Success | Failure): RelativeAnswer {
    const base = offsetNumber(entry);
    const diagnostics = outcome.diagnostics.map(item => ({
        delta: offsetNumber(item.offset) - base,
        expected: [...item.expected],
        found: item.found,
    }));
    if (outcome.kind === "success") {
        return {
            kind: "success",
            value: outcome.value,
            nextDelta: offsetNumber(outcome.next) - base,
            diagnostics,
        };
    }
    return {
        kind: "failure",
        evidence: {
            delta: offsetNumber(outcome.evidence.offset) - base,
            expected: [...outcome.evidence.expected],
            committedOwner: outcome.evidence.committedOwner,
        },
        diagnostics,
    };
}

export function applyRelative(
    entry: Utf16Offset,
    answer: RelativeAnswer,
    control: number | null,
): Success | Failure {
    const base = offsetNumber(entry);
    const diagnostics = answer.diagnostics.map(item => ({
        offset: utf16Offset(base + item.delta),
        expected: [...item.expected],
        found: item.found,
    }));
    if (answer.kind === "success") {
        return {
            kind: "success",
            value: answer.value,
            next: utf16Offset(base + answer.nextDelta),
            diagnostics,
            control,
        };
    }
    return {
        kind: "failure",
        evidence: evidence(
            utf16Offset(base + answer.evidence.delta),
            answer.evidence.expected,
            answer.evidence.committedOwner,
        ),
        diagnostics,
        control,
    };
}

export function seed(entry: Utf16Offset): RelativeAnswer {
    return relativize(entry, {
        kind: "failure",
        evidence: evidence(entry, []),
        diagnostics: [],
        control: null,
    });
}

export function improve(
    entry: Utf16Offset,
    previous: RelativeAnswer,
    candidate: Success | Failure,
): RelativeAnswer | null {
    const next = relativize(entry, candidate);
    if (next.kind === "success") {
        if (previous.kind === "failure") return next;
        return next.nextDelta > previous.nextDelta ? next : null;
    }
    if (previous.kind === "success") return null;
    if (next.evidence.delta > previous.evidence.delta) return next;
    if (next.evidence.delta < previous.evidence.delta) return null;
    const expected = [...new Set([...previous.evidence.expected, ...next.evidence.expected])].sort();
    const owner = next.evidence.committedOwner ?? previous.evidence.committedOwner;
    if (
        owner === previous.evidence.committedOwner &&
        expected.length === previous.evidence.expected.length &&
        expected.every((label, index) => label === previous.evidence.expected[index])
    ) return null;
    return {
        kind: "failure",
        evidence: { delta: next.evidence.delta, expected, committedOwner: owner },
        diagnostics: next.diagnostics,
    };
}
