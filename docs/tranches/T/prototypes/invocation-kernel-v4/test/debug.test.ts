import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull, verifyDebugReport, type DebugReport } from "@parse-that/invocation-kernel-v4-prototype";

test("V4-R06 callback throw preserves the original error after balanced LIFO abort", () => {
    const grammar = createGrammar();
    const parser = grammar.seal(grammar.choice(
        grammar.map(grammar.literal("a"), () => { throw new Error("boom"); }),
        grammar.literal("a"),
    ));
    let report: DebugReport | undefined;
    assert.throws(() => parseFull(parser, "a", { trace: true, onDebug(value) { report = value; throw new Error("observer"); } }), /boom/);
    assert(report);
    assert.equal(verifyDebugReport(report), true);
    assert.deepEqual(report.census, {
        liveFrames: 0, liveChoices: 0, liveTransactions: 0, liveHeads: 0,
        liveParticipants: 0, journalEntries: 0, nonterminalMemoCells: 0,
        nonterminalRuleCells: 0, memoDoneCells: 0, ruleDoneCells: 0,
    });
    assert.deepEqual(report.events.map(event => event.kind), [
        "choice-open", "transaction-open", "callback-open", "callback-abort", "transaction-rollback", "choice-abort",
    ]);
});

test("V4-R06 recursive callback throw aborts the live head and every participant", () => {
    const grammar = createGrammar();
    const recursive = grammar.rule<number>("recursive");
    grammar.define(recursive, grammar.choice(
        grammar.map(grammar.sequence(recursive, grammar.literal("a")), (): number => { throw new Error("recursive-boom"); }),
        grammar.map(grammar.literal("x"), () => 1),
    ));
    let report: DebugReport | undefined;
    assert.throws(() => parseFull(grammar.seal(recursive), "xa", { trace: true, onDebug(value) { report = value; } }), /recursive-boom/);
    assert(report);
    assert.equal(verifyDebugReport(report), true);
    assert.equal(report.census.liveHeads, 0);
    assert.equal(report.census.liveParticipants, 0);
    assert.equal(report.census.nonterminalRuleCells, 0);
    assert(report.events.some(event => event.kind === "head-abort"));
    assert(report.events.some(event => event.kind === "participant-abort"));
});
