import assert from "node:assert/strict";
import type { DebugReport, ParseResult } from "../src/index.js";

export function assertBalanced(debug: DebugReport): void {
    assert.equal(debug.journalLength, 0, "journal is empty");
    assert.equal(debug.liveTransactions, 0, "transactions are closed");
    assert.equal(debug.liveChoices, 0, "choices are closed");
    assert.equal(debug.liveHeads, 0, "LR heads are closed");
    assert.equal(debug.transitionalMemoCells, 0, "memo cells are terminal");
    assert.equal(debug.transitionalRuleCells, 0, "rule cells are terminal");
}

export function expectSuccess<T>(result: ParseResult<T>): T {
    assert.equal(result.kind, "success", JSON.stringify(result));
    if (result.kind !== "success") throw new Error("unreachable");
    assertBalanced(result.debug);
    return result.value;
}
