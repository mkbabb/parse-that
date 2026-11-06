import assert from "node:assert/strict";
import test from "node:test";
import { DebugRecorder } from "../src/debug.js";
import { TransactionJournal, type JournalEntry } from "../src/journal.js";
import { nodeId, ruleId } from "../src/model.js";
import { seed } from "../src/outcome.js";
import { utf16Offset } from "../src/types.js";

function exhaustive(entry: JournalEntry): "memo" | "rule" {
    switch (entry.table) {
        case "memo": return "memo";
        case "rule": return "rule";
    }
}

test("V4-R09 journal addresses are structured, closed, first-write, and rollback exactly", () => {
    const debug = new DebugRecorder(true);
    const journal = new TransactionJournal(debug);
    const offset = utf16Offset(0);
    const transaction = journal.begin();
    journal.publishMemo({ node: nodeId(1), offset }, seed(offset));
    journal.publishMemo({ node: nodeId(1), offset }, seed(offset));
    journal.publishRule({ rule: ruleId(2), offset }, seed(offset));
    assert.equal(journal.length, 2);
    journal.rollback(transaction);
    assert.equal(journal.length, 0);
    assert.equal(journal.memo({ node: nodeId(1), offset }), undefined);
    const witness = { table: "rule", address: { rule: ruleId(2), offset }, previous: undefined } satisfies JournalEntry;
    assert.equal(exhaustive(witness), "rule");
});
