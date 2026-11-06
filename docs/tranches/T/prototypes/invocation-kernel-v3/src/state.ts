import type { Diagnostic, Erased, Offset } from "./types.js";
import { asOffset, offsetNumber } from "./types.js";

export interface Evidence {
    readonly offset: Offset;
    readonly expected: readonly string[];
    readonly committedOwner: number | null;
}

interface OutcomeBase {
    readonly diagnostics: readonly Diagnostic[];
}

export interface Success extends OutcomeBase {
    readonly kind: "success";
    readonly value: Erased;
    readonly next: Offset;
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

export interface RelativeEvidence {
    readonly delta: number;
    readonly expected: readonly string[];
    readonly committedOwner: number | null;
}

export interface RelativeDiagnostic {
    readonly delta: number;
    readonly expected: readonly string[];
    readonly found: string;
}

export type RelativeAnswer =
    | {
          readonly kind: "success";
          readonly value: Erased;
          readonly nextDelta: number;
          readonly diagnostics: readonly RelativeDiagnostic[];
      }
    | {
          readonly kind: "failure";
          readonly evidence: RelativeEvidence;
          readonly diagnostics: readonly RelativeDiagnostic[];
      };

export type MemoCell =
    | { readonly state: "Evaluating" }
    | { readonly state: "Done"; readonly answer: RelativeAnswer };

export type RuleCell =
    | { readonly state: "Evaluating"; readonly head: number }
    | { readonly state: "Growing"; readonly head: number; readonly answer: RelativeAnswer }
    | { readonly state: "Done"; readonly answer: RelativeAnswer };

export type JournalEntry =
    | {
          readonly table: "memo";
          readonly key: string;
          readonly previous: MemoCell | undefined;
      }
    | {
          readonly table: "rule";
          readonly key: string;
          readonly previous: RuleCell | undefined;
      };

interface Transaction {
    readonly id: number;
    readonly mark: number;
    readonly logged: Set<string>;
    closed: boolean;
}

export class TransactionJournal {
    readonly memo = new Map<string, MemoCell>();
    readonly rule = new Map<string, RuleCell>();
    readonly #entries: JournalEntry[] = [];
    readonly #transactions: Transaction[] = [];
    #next = 1;
    highWater = 0;

    get length(): number {
        return this.#entries.length;
    }

    get depth(): number {
        return this.#transactions.length;
    }

    begin(): number {
        const transaction: Transaction = {
            id: this.#next,
            mark: this.#entries.length,
            logged: new Set(),
            closed: false,
        };
        this.#next += 1;
        this.#transactions.push(transaction);
        return transaction.id;
    }

    #current(id: number): Transaction {
        const transaction = this.#transactions.at(-1);
        if (!transaction || transaction.id !== id || transaction.closed) {
            throw new Error(`Transaction ${id} is not the live leaf`);
        }
        return transaction;
    }

    #log(entry: JournalEntry): void {
        const transaction = this.#transactions.at(-1);
        if (!transaction) return;
        const address = `${entry.table}:${entry.key}`;
        if (transaction.logged.has(address)) return;
        transaction.logged.add(address);
        this.#entries.push(entry);
        this.highWater = Math.max(this.highWater, this.#entries.length);
    }

    setMemo(key: string, cell: MemoCell | undefined): void {
        this.#log({ table: "memo", key, previous: this.memo.get(key) });
        if (cell) this.memo.set(key, cell);
        else this.memo.delete(key);
    }

    setRule(key: string, cell: RuleCell | undefined): void {
        this.#log({ table: "rule", key, previous: this.rule.get(key) });
        if (cell) this.rule.set(key, cell);
        else this.rule.delete(key);
    }

    commit(id: number): void {
        const transaction = this.#current(id);
        transaction.closed = true;
        this.#transactions.pop();
        const parent = this.#transactions.at(-1);
        if (!parent) {
            this.#entries.length = 0;
            return;
        }
        for (const address of transaction.logged) parent.logged.add(address);
    }

    rollback(id: number): void {
        const transaction = this.#current(id);
        for (let index = this.#entries.length - 1; index >= transaction.mark; index -= 1) {
            const entry = this.#entries[index];
            if (!entry) throw new Error("Journal hole");
            const table = entry.table === "memo" ? this.memo : this.rule;
            if (entry.previous) table.set(entry.key, entry.previous as never);
            else table.delete(entry.key);
        }
        this.#entries.length = transaction.mark;
        transaction.closed = true;
        this.#transactions.pop();
    }

    abortAll(): void {
        while (this.#transactions.length > 0) {
            this.rollback((this.#transactions.at(-1) as Transaction).id);
        }
        this.#entries.length = 0;
    }
}

export function evidence(
    at: number,
    expected: readonly string[],
    committedOwner: number | null = null,
): Evidence {
    return {
        offset: asOffset(at),
        expected: [...new Set(expected)].sort(),
        committedOwner,
    };
}

export function mergeEvidence(left: Evidence, right: Evidence): Evidence {
    const leftOffset = offsetNumber(left.offset);
    const rightOffset = offsetNumber(right.offset);
    if (leftOffset > rightOffset) return left;
    if (rightOffset > leftOffset) return right;
    return evidence(
        leftOffset,
        [...left.expected, ...right.expected],
        right.committedOwner ?? left.committedOwner,
    );
}

export function failure(at: number, label: string, control: number | null): Failure {
    return {
        kind: "failure",
        evidence: evidence(at, [label]),
        diagnostics: [],
        control,
    };
}

export function resource(
    at: number,
    kind: ResourceFailure["resource"],
    label: string,
): ResourceFailure {
    return {
        kind: "resource",
        resource: kind,
        evidence: evidence(at, [label]),
        diagnostics: [],
    };
}

export function relativize(entry: number, outcome: Success | Failure): RelativeAnswer {
    const diagnostics = outcome.diagnostics.map(item => ({
        delta: offsetNumber(item.offset) - entry,
        expected: [...item.expected],
        found: item.found,
    }));
    if (outcome.kind === "success") {
        return {
            kind: "success",
            value: outcome.value,
            nextDelta: offsetNumber(outcome.next) - entry,
            diagnostics,
        };
    }
    return {
        kind: "failure",
        evidence: {
            delta: offsetNumber(outcome.evidence.offset) - entry,
            expected: [...outcome.evidence.expected],
            committedOwner: outcome.evidence.committedOwner,
        },
        diagnostics,
    };
}

export function applyRelative(
    entry: number,
    answer: RelativeAnswer,
    control: number | null,
): Success | Failure {
    const diagnostics = answer.diagnostics.map(item => ({
        offset: asOffset(entry + item.delta),
        expected: [...item.expected],
        found: item.found,
    }));
    if (answer.kind === "success") {
        return {
            kind: "success",
            value: answer.value,
            next: asOffset(entry + answer.nextDelta),
            diagnostics,
            control,
        };
    }
    return {
        kind: "failure",
        evidence: evidence(
            entry + answer.evidence.delta,
            answer.evidence.expected,
            answer.evidence.committedOwner,
        ),
        diagnostics,
        control,
    };
}

export function improve(
    entry: number,
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
    ) {
        return null;
    }
    return {
        kind: "failure",
        evidence: { delta: next.evidence.delta, expected, committedOwner: owner },
        diagnostics: next.diagnostics,
    };
}
