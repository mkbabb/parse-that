import { asOffset, offsetNumber } from "./types.js";
export class TransactionJournal {
    memo = new Map();
    rule = new Map();
    #entries = [];
    #transactions = [];
    #next = 1;
    highWater = 0;
    get length() {
        return this.#entries.length;
    }
    get depth() {
        return this.#transactions.length;
    }
    begin() {
        const transaction = {
            id: this.#next,
            mark: this.#entries.length,
            logged: new Set(),
            closed: false,
        };
        this.#next += 1;
        this.#transactions.push(transaction);
        return transaction.id;
    }
    #current(id) {
        const transaction = this.#transactions.at(-1);
        if (!transaction || transaction.id !== id || transaction.closed) {
            throw new Error(`Transaction ${id} is not the live leaf`);
        }
        return transaction;
    }
    #log(entry) {
        const transaction = this.#transactions.at(-1);
        if (!transaction)
            return;
        const address = `${entry.table}:${entry.key}`;
        if (transaction.logged.has(address))
            return;
        transaction.logged.add(address);
        this.#entries.push(entry);
        this.highWater = Math.max(this.highWater, this.#entries.length);
    }
    setMemo(key, cell) {
        this.#log({ table: "memo", key, previous: this.memo.get(key) });
        if (cell)
            this.memo.set(key, cell);
        else
            this.memo.delete(key);
    }
    setRule(key, cell) {
        this.#log({ table: "rule", key, previous: this.rule.get(key) });
        if (cell)
            this.rule.set(key, cell);
        else
            this.rule.delete(key);
    }
    commit(id) {
        const transaction = this.#current(id);
        transaction.closed = true;
        this.#transactions.pop();
        const parent = this.#transactions.at(-1);
        if (!parent) {
            this.#entries.length = 0;
            return;
        }
        for (const address of transaction.logged)
            parent.logged.add(address);
    }
    rollback(id) {
        const transaction = this.#current(id);
        for (let index = this.#entries.length - 1; index >= transaction.mark; index -= 1) {
            const entry = this.#entries[index];
            if (!entry)
                throw new Error("Journal hole");
            const table = entry.table === "memo" ? this.memo : this.rule;
            if (entry.previous)
                table.set(entry.key, entry.previous);
            else
                table.delete(entry.key);
        }
        this.#entries.length = transaction.mark;
        transaction.closed = true;
        this.#transactions.pop();
    }
    abortAll() {
        while (this.#transactions.length > 0) {
            this.rollback(this.#transactions.at(-1).id);
        }
        this.#entries.length = 0;
    }
}
export function evidence(at, expected, committedOwner = null) {
    return {
        offset: asOffset(at),
        expected: [...new Set(expected)].sort(),
        committedOwner,
    };
}
export function mergeEvidence(left, right) {
    const leftOffset = offsetNumber(left.offset);
    const rightOffset = offsetNumber(right.offset);
    if (leftOffset > rightOffset)
        return left;
    if (rightOffset > leftOffset)
        return right;
    return evidence(leftOffset, [...left.expected, ...right.expected], right.committedOwner ?? left.committedOwner);
}
export function failure(at, label, control) {
    return {
        kind: "failure",
        evidence: evidence(at, [label]),
        diagnostics: [],
        control,
    };
}
export function resource(at, kind, label) {
    return {
        kind: "resource",
        resource: kind,
        evidence: evidence(at, [label]),
        diagnostics: [],
    };
}
export function relativize(entry, outcome) {
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
export function applyRelative(entry, answer, control) {
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
        evidence: evidence(entry + answer.evidence.delta, answer.evidence.expected, answer.evidence.committedOwner),
        diagnostics,
        control,
    };
}
export function improve(entry, previous, candidate) {
    const next = relativize(entry, candidate);
    if (next.kind === "success") {
        if (previous.kind === "failure")
            return next;
        return next.nextDelta > previous.nextDelta ? next : null;
    }
    if (previous.kind === "success")
        return null;
    if (next.evidence.delta > previous.evidence.delta)
        return next;
    if (next.evidence.delta < previous.evidence.delta)
        return null;
    const expected = [...new Set([...previous.evidence.expected, ...next.evidence.expected])].sort();
    const owner = next.evidence.committedOwner ?? previous.evidence.committedOwner;
    if (owner === previous.evidence.committedOwner &&
        expected.length === previous.evidence.expected.length &&
        expected.every((label, index) => label === previous.evidence.expected[index])) {
        return null;
    }
    return {
        kind: "failure",
        evidence: { delta: next.evidence.delta, expected, committedOwner: owner },
        diagnostics: next.diagnostics,
    };
}
