declare const OFFSET: unique symbol;
declare const PARSER_VALUE: unique symbol;
declare const RULE_VALUE: unique symbol;

/** Zero-based JavaScript string coordinate, measured in UTF-16 code units. */
export type Offset = number & { readonly [OFFSET]: "utf16" };

/** Opaque and invariant. Definitions are usable only after their builder seals. */
export interface Parser<T> {
    readonly [PARSER_VALUE]: (value: T) => T;
}

/** Opaque invariant named-rule handle. */
export interface Rule<T> extends Parser<T> {
    readonly [RULE_VALUE]: (value: T) => T;
}

export interface Diagnostic {
    readonly offset: Offset;
    readonly expected: readonly string[];
    readonly found: string;
}

export interface DebugEvent {
    readonly kind: string;
    readonly detail: string;
}

export interface DebugReport {
    readonly steps: number;
    readonly continuationHighWater: number;
    readonly journalHighWater: number;
    readonly journalLength: number;
    readonly liveTransactions: number;
    readonly liveChoices: number;
    readonly liveHeads: number;
    readonly transitionalMemoCells: number;
    readonly transitionalRuleCells: number;
    readonly memoHits: number;
    readonly memoMisses: number;
    readonly ruleHits: number;
    readonly ruleTransitions: Readonly<Record<string, number>>;
    readonly events: readonly DebugEvent[];
}

export interface ParseOptions {
    readonly maxSteps?: number;
    readonly trace?: boolean;
    readonly onDebug?: (report: DebugReport) => void;
}

export type ParseResult<T> =
    | {
          readonly kind: "success";
          readonly value: T;
          readonly offset: Offset;
          readonly diagnostics: readonly Diagnostic[];
          readonly debug: DebugReport;
      }
    | {
          readonly kind: "failure";
          readonly offset: Offset;
          readonly expected: readonly string[];
          readonly committed: boolean;
          readonly diagnostics: readonly Diagnostic[];
          readonly debug: DebugReport;
      }
    | {
          readonly kind: "resource";
          readonly resource: "step-budget" | "invariant";
          readonly offset: Offset;
          readonly expected: readonly string[];
          readonly diagnostics: readonly Diagnostic[];
          readonly debug: DebugReport;
      };

export interface MemoOptions {
    readonly effects?: "reject" | "replay";
}

export const asOffset = (value: number): Offset => value as Offset;
export const offsetNumber = (value: Offset): number => value as number;

export type Erased = unknown;

export const erase = <T>(value: T): Erased => value;
export const reveal = <T>(value: Erased): T => value as T;
