import { idNumber, type NodeId, type RuleId } from "./model.js";
import type { RelativeAnswer } from "./outcome.js";
import { DebugRecorder } from "./debug.js";
import type { Utf16Offset } from "./types.js";

export interface MemoAddress {
    readonly node: NodeId;
    readonly offset: Utf16Offset;
}

export interface RuleAddress {
    readonly rule: RuleId;
    readonly offset: Utf16Offset;
}

export interface DoneCell {
    readonly state: "Done";
    readonly answer: RelativeAnswer;
}

export type JournalEntry =
    | { readonly table: "memo"; readonly address: MemoAddress; readonly previous: DoneCell | undefined }
    | { readonly table: "rule"; readonly address: RuleAddress; readonly previous: DoneCell | undefined };

interface LoggedAddresses {
    readonly memo: Map<NodeId, Set<Utf16Offset>>;
    readonly rule: Map<RuleId, Set<Utf16Offset>>;
}

interface Transaction {
    readonly id: number;
    readonly mark: number;
    readonly logged: LoggedAddresses;
}

function lookup<K>(table: ReadonlyMap<K, ReadonlyMap<Utf16Offset, DoneCell>>, key: K, offset: Utf16Offset): DoneCell | undefined {
    return table.get(key)?.get(offset);
}

function mutate<K>(table: Map<K, Map<Utf16Offset, DoneCell>>, key: K, offset: Utf16Offset, value: DoneCell | undefined): void {
    if (value) {
        let row = table.get(key);
        if (!row) {
            row = new Map();
            table.set(key, row);
        }
        row.set(offset, value);
        return;
    }
    const row = table.get(key);
    row?.delete(offset);
    if (row?.size === 0) table.delete(key);
}

function countCells<K>(table: ReadonlyMap<K, ReadonlyMap<Utf16Offset, DoneCell>>): number {
    let count = 0;
    for (const row of table.values()) count += row.size;
    return count;
}

export class TransactionJournal {
    readonly #memo = new Map<NodeId, Map<Utf16Offset, DoneCell>>();
    readonly #rule = new Map<RuleId, Map<Utf16Offset, DoneCell>>();
    readonly #entries: JournalEntry[] = [];
    readonly #transactions: Transaction[] = [];
    readonly #debug: DebugRecorder;
    #nextTransaction = 1;

    constructor(debug: DebugRecorder) {
        this.#debug = debug;
    }

    get length(): number { return this.#entries.length; }
    get depth(): number { return this.#transactions.length; }
    get memoDoneCells(): number { return countCells(this.#memo); }
    get ruleDoneCells(): number { return countCells(this.#rule); }

    memo(address: MemoAddress): DoneCell | undefined {
        return lookup(this.#memo, address.node, address.offset);
    }

    rule(address: RuleAddress): DoneCell | undefined {
        return lookup(this.#rule, address.rule, address.offset);
    }

    begin(): number {
        const transaction: Transaction = {
            id: this.#nextTransaction++,
            mark: this.#entries.length,
            logged: { memo: new Map(), rule: new Map() },
        };
        this.#transactions.push(transaction);
        this.#debug.emit({ kind: "transaction-open", id: transaction.id });
        return transaction.id;
    }

    #leaf(id: number): Transaction {
        const transaction = this.#transactions.at(-1);
        if (!transaction || transaction.id !== id) throw new Error(`Transaction ${id} is not the live leaf`);
        return transaction;
    }

    #log(entry: JournalEntry): void {
        const transaction = this.#transactions.at(-1);
        if (!transaction) return;
        const id = entry.table === "memo" ? entry.address.node : entry.address.rule;
        const table = entry.table === "memo" ? transaction.logged.memo : transaction.logged.rule;
        let row = table.get(id as NodeId & RuleId);
        if (!row) {
            row = new Set();
            table.set(id as NodeId & RuleId, row);
        }
        if (row.has(entry.address.offset)) return;
        row.add(entry.address.offset);
        this.#entries.push(entry);
        this.#debug.journalHighWater = Math.max(this.#debug.journalHighWater, this.#entries.length);
    }

    publishMemo(address: MemoAddress, answer: RelativeAnswer): void {
        this.#log({ table: "memo", address, previous: this.memo(address) });
        mutate(this.#memo, address.node, address.offset, { state: "Done", answer });
        this.#debug.emit({
            kind: "memo-publish",
            address: { domain: "memo", id: idNumber(address.node), offset: address.offset },
        });
    }

    publishRule(address: RuleAddress, answer: RelativeAnswer): void {
        this.#log({ table: "rule", address, previous: this.rule(address) });
        mutate(this.#rule, address.rule, address.offset, { state: "Done", answer });
        this.#debug.emit({
            kind: "rule-publish",
            address: { domain: "rule", id: idNumber(address.rule), offset: address.offset },
        });
    }

    commit(id: number): void {
        const transaction = this.#leaf(id);
        this.#transactions.pop();
        this.#debug.emit({ kind: "transaction-commit", id });
        const parent = this.#transactions.at(-1);
        if (!parent) {
            this.#entries.length = 0;
            return;
        }
        for (const domain of ["memo", "rule"] as const) {
            for (const [key, offsets] of transaction.logged[domain]) {
                const target = parent.logged[domain] as Map<typeof key, Set<Utf16Offset>>;
                let row = target.get(key);
                if (!row) {
                    row = new Set();
                    target.set(key, row);
                }
                for (const offset of offsets) row.add(offset);
            }
        }
    }

    rollback(id: number): void {
        const transaction = this.#leaf(id);
        for (let index = this.#entries.length - 1; index >= transaction.mark; index -= 1) {
            const entry = this.#entries[index];
            if (!entry) throw new Error("Journal hole");
            if (entry.table === "memo") {
                mutate(this.#memo, entry.address.node, entry.address.offset, entry.previous);
                this.#debug.emit({ kind: "memo-rollback", address: { domain: "memo", id: idNumber(entry.address.node), offset: entry.address.offset } });
            } else {
                mutate(this.#rule, entry.address.rule, entry.address.offset, entry.previous);
                this.#debug.emit({ kind: "rule-rollback", address: { domain: "rule", id: idNumber(entry.address.rule), offset: entry.address.offset } });
            }
        }
        this.#entries.length = transaction.mark;
        this.#transactions.pop();
        this.#debug.emit({ kind: "transaction-rollback", id });
    }

    abortAll(): void {
        while (this.#transactions.length > 0) {
            this.rollback((this.#transactions.at(-1) as Transaction).id);
        }
        this.#entries.length = 0;
    }
}
