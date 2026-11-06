declare const UTF16_OFFSET: unique symbol;
declare const PARSER_VALUE: unique symbol;
declare const RULE_VALUE: unique symbol;

/** A checked, zero-based JavaScript string coordinate in UTF-16 code units. */
export type Utf16Offset = number & { readonly [UTF16_OFFSET]: "utf16" };

/** Opaque and invariant parser reference. */
export interface Parser<T> {
    readonly [PARSER_VALUE]: (value: T) => T;
}

/** Opaque and invariant named-rule reference. */
export interface Rule<T> extends Parser<T> {
    readonly [RULE_VALUE]: (value: T) => T;
}

export interface Diagnostic {
    readonly offset: Utf16Offset;
    readonly expected: readonly string[];
    readonly found: string;
}

export interface DebugAddress {
    readonly domain: "memo" | "rule" | "participant";
    readonly id: number;
    readonly offset: Utf16Offset;
}

export interface DebugEvent {
    readonly kind:
        | "transaction-open"
        | "transaction-commit"
        | "transaction-rollback"
        | "choice-open"
        | "choice-close"
        | "choice-abort"
        | "cut-set"
        | "head-open"
        | "head-close"
        | "head-abort"
        | "participant-admit"
        | "participant-grow"
        | "participant-close"
        | "participant-abort"
        | "memo-publish"
        | "memo-rollback"
        | "rule-publish"
        | "rule-rollback"
        | "callback-open"
        | "callback-close"
        | "callback-abort"
        | "resource";
    readonly id?: number;
    readonly owner?: number;
    readonly address?: DebugAddress;
    readonly generation?: number;
    readonly reason?: string;
}

export interface DebugCensus {
    readonly liveFrames: number;
    readonly liveChoices: number;
    readonly liveTransactions: number;
    readonly liveHeads: number;
    readonly liveParticipants: number;
    readonly journalEntries: number;
    readonly nonterminalMemoCells: number;
    readonly nonterminalRuleCells: number;
    readonly memoDoneCells: number;
    readonly ruleDoneCells: number;
}

export interface DebugProof {
    readonly balanced: boolean;
    readonly eventSha256: string;
    readonly checkedEvents: number;
}

export interface DebugReport {
    readonly steps: number;
    readonly continuationHighWater: number;
    readonly journalHighWater: number;
    readonly memoHits: number;
    readonly memoMisses: number;
    readonly ruleHits: number;
    readonly simultaneousHeads: number;
    readonly consumingHeads: number;
    readonly events: readonly DebugEvent[];
    readonly census: DebugCensus;
    readonly proof: DebugProof;
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
          readonly offset: Utf16Offset;
          readonly diagnostics: readonly Diagnostic[];
          readonly debug: DebugReport;
      }
    | {
          readonly kind: "failure";
          readonly offset: Utf16Offset;
          readonly expected: readonly string[];
          readonly committed: boolean;
          readonly diagnostics: readonly Diagnostic[];
          readonly debug: DebugReport;
      }
    | {
          readonly kind: "resource";
          readonly resource: "step-budget" | "invariant";
          readonly offset: Utf16Offset;
          readonly expected: readonly string[];
          readonly diagnostics: readonly Diagnostic[];
          readonly debug: DebugReport;
      };

export interface MemoOptions {
    readonly effects?: "reject" | "replay";
}

export interface Grammar {
    succeed<T>(value: T): Parser<T>;
    literal<const T extends string>(text: T): Parser<T>;
    map<T, U>(parser: Parser<T>, transform: (value: T) => U): Parser<U>;
    sequence<const T extends readonly unknown[]>(
        ...parsers: { [K in keyof T]: Parser<T[K]> }
    ): Parser<T>;
    choice<const T extends readonly unknown[]>(
        ...parsers: { [K in keyof T]: Parser<T[K]> }
    ): Parser<T[number]>;
    many<T>(parser: Parser<T>): Parser<readonly T[]>;
    commit<T>(parser: Parser<T>): Parser<T>;
    recover<T, U>(parser: Parser<T>, fallback: U): Parser<T | U>;
    memo<T>(parser: Parser<T>, options?: MemoOptions): Parser<T>;
    rule<T>(name: string): Rule<T>;
    define<T>(rule: Rule<T>, body: Parser<T>): void;
    seal<T>(root: Parser<T>): Parser<T>;
    inspect(): string;
}

export function utf16Offset(value: number): Utf16Offset {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new RangeError("UTF-16 offset must be a nonnegative safe integer");
    }
    return (value === 0 ? 0 : value) as Utf16Offset;
}

export function offsetNumber(value: Utf16Offset): number {
    return value as number;
}

export function sourceOffset(value: number, source: string): Utf16Offset {
    const checked = utf16Offset(value);
    if (value > source.length) throw new RangeError("UTF-16 offset exceeds source length");
    return checked;
}
