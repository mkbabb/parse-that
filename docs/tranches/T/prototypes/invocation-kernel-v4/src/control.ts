import { DebugRecorder } from "./debug.js";
import type { Evidence, Failure, Outcome, Success } from "./outcome.js";
import type { NodeId } from "./model.js";
import type { Utf16Offset } from "./types.js";

export interface ChoiceFrame {
    readonly kind: "choice";
    readonly children: readonly NodeId[];
    readonly index: number;
    readonly entry: Utf16Offset;
    readonly incomingControl: number | null;
    readonly owner: number;
    readonly transaction: number;
    readonly combined: Evidence | null;
}

export interface ManyFrame {
    readonly kind: "many";
    readonly child: NodeId;
    readonly cursor: Utf16Offset;
    readonly values: readonly unknown[];
    readonly diagnostics: readonly import("./types.js").Diagnostic[];
    readonly control: number | null;
    readonly transaction: number;
}

export interface RecoverFrame {
    readonly kind: "recover";
    readonly entry: Utf16Offset;
    readonly fallback: unknown;
    readonly incomingControl: number | null;
    readonly transaction: number;
}

export type UnwindAction =
    | { readonly kind: "rollback-transaction"; readonly transaction: number }
    | { readonly kind: "abort-choice"; readonly owner: number }
    | { readonly kind: "discard-memo"; readonly node: NodeId; readonly offset: Utf16Offset }
    | { readonly kind: "abort-head"; readonly head: number };

export type ChoiceDisposition =
    | "accept"
    | "owned-success"
    | "owned-failure"
    | "foreign"
    | "backtrack"
    | "stale";

export class VisibleChoices {
    readonly #owners: number[] = [];
    readonly #debug: DebugRecorder;
    #next = 1;

    constructor(debug: DebugRecorder) {
        this.#debug = debug;
    }

    get depth(): number { return this.#owners.length; }

    open(): number {
        const owner = this.#next++;
        this.#owners.push(owner);
        this.#debug.emit({ kind: "choice-open", id: owner });
        return owner;
    }

    nearest(): number | undefined { return this.#owners.at(-1); }
    live(owner: number): boolean { return this.#owners.includes(owner); }

    close(owner: number): void {
        if (this.#owners.at(-1) !== owner) throw new Error(`Unbalanced choice ${owner}`);
        this.#owners.pop();
        this.#debug.emit({ kind: "choice-close", id: owner });
    }

    abort(owner: number): void {
        if (this.#owners.at(-1) !== owner) throw new Error(`Unbalanced choice ${owner}`);
        this.#owners.pop();
        this.#debug.emit({ kind: "choice-abort", id: owner });
    }

    disposition(outcome: Success | Failure, current: number): ChoiceDisposition {
        const token = outcome.control;
        if (token !== null && !this.live(token)) return "stale";
        if (outcome.kind === "success") {
            if (token === current) return "owned-success";
            if (token !== null) return "foreign";
            return "accept";
        }
        if (token === current) return "owned-failure";
        if (token !== null) return "foreign";
        return "backtrack";
    }

    targetCommit(outcome: Success): { readonly owner?: number; readonly conflict: boolean } {
        const owner = this.nearest();
        if (owner === undefined) return { conflict: false };
        return { owner, conflict: outcome.control !== null && outcome.control !== owner };
    }

    abortRemaining(): void {
        while (this.#owners.length > 0) this.abort(this.#owners.at(-1) as number);
    }
}

export function clearControl(outcome: Success): Success {
    return outcome.control === null ? outcome : { ...outcome, control: null };
}

export function commitFailure(outcome: Failure, owner: number): Failure {
    return {
        ...outcome,
        evidence: { ...outcome.evidence, committedOwner: owner },
        control: null,
    };
}

export function outcomeControl(outcome: Outcome): number | null {
    return outcome.kind === "resource" ? null : outcome.control;
}
