import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull, parsePrefix } from "../src/index.js";
import { assertBalanced, expectSuccess } from "./assertions.js";
test("H01 recovered commitment is transactional and does not taint a later failure", () => {
    const g = createGrammar();
    const recovered = g.recover(g.choice(g.sequence(g.commit(g.literal("a")), g.literal("b")), g.literal("q")), "recovered");
    const parser = g.seal(g.sequence(recovered, g.literal("a"), g.literal("c"), g.literal("z")));
    const result = parseFull(parser, "acx", { trace: true });
    assert.equal(result.kind, "failure");
    if (result.kind !== "failure")
        return;
    assert.equal(result.committed, false);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.expected, ['"z"']);
    assert.deepEqual(result.diagnostics.map(item => [item.offset, item.expected]), [[1, ['"b"']]]);
    assertBalanced(result.debug);
});
test("H02 repetition is not a visible choice and cannot swallow an enclosing cut", () => {
    const g = createGrammar();
    const parser = g.seal(g.choice(g.many(g.sequence(g.commit(g.literal("a")), g.literal("b"))), g.literal("a")));
    const result = parseFull(parser, "a", { trace: true });
    assert.equal(result.kind, "failure");
    if (result.kind !== "failure")
        return;
    assert.equal(result.committed, true);
    assert.equal(result.offset, 1);
    assert.deepEqual(result.expected, ['"b"']);
    assertBalanced(result.debug);
    const opens = result.debug.events.filter(event => event.kind === "choice-open");
    assert.equal(opens.length, 1);
});
test("H04 recovery renders only its child-local evidence", () => {
    const g = createGrammar();
    const parser = g.seal(g.sequence(g.recover(g.sequence(g.literal("a"), g.literal("x")), "one"), g.recover(g.literal("z"), "two")));
    const result = parsePrefix(parser, "a");
    assert.deepEqual(expectSuccess(result), ["one", "two"]);
    if (result.kind !== "success")
        return;
    assert.deepEqual(result.diagnostics.map(item => [item.offset, item.expected]), [
        [1, ['"x"']],
        [0, ['"z"']],
    ]);
});
test("H09 memo rollback is typed, compact, and replay is entry-local", () => {
    const g = createGrammar();
    let calls = 0;
    const cached = g.memo(g.map(g.literal("a"), value => (calls += 1, value)));
    const parser = g.seal(g.choice(g.sequence(cached, g.literal("x")), g.sequence(cached, g.literal("b"))));
    const result = parseFull(parser, "ab", { trace: true });
    assert.deepEqual(expectSuccess(result), ["a", "b"]);
    assert.equal(calls, 2, "abandoned memo cell was rolled back");
    assert.equal(result.debug.memoMisses, 2);
    assert.equal(result.debug.journalLength, 0);
    assert(result.debug.journalHighWater >= 1);
    const replayGrammar = createGrammar();
    const replay = replayGrammar.memo(replayGrammar.recover(replayGrammar.literal("x"), "r"), { effects: "replay" });
    const replayParser = replayGrammar.seal(replayGrammar.sequence(replay, replay));
    const replayResult = parseFull(replayParser, "");
    assert.deepEqual(expectSuccess(replayResult), ["r", "r"]);
    if (replayResult.kind !== "success")
        return;
    assert.equal(replayResult.debug.memoHits, 1);
    assert.deepEqual(replayResult.diagnostics.map(item => item.offset), [0, 0]);
});
test("M10 invocation diagnostics and memo tables are isolated", () => {
    const g = createGrammar();
    const parser = g.seal(g.recover(g.literal("x"), "r"));
    const first = parseFull(parser, "a");
    const second = parseFull(parser, "b");
    assert.equal(first.kind, "failure");
    assert.equal(second.kind, "failure");
    if (first.kind !== "failure" || second.kind !== "failure")
        return;
    assert.equal(first.diagnostics[0]?.found, "a");
    assert.equal(second.diagnostics[0]?.found, "b");
    assertBalanced(first.debug);
    assertBalanced(second.debug);
});
test("M11 UTF-16 coordinates survive the public result", () => {
    const g = createGrammar();
    const result = parseFull(g.seal(g.literal("😀")), "😀");
    expectSuccess(result);
    if (result.kind === "success")
        assert.equal(result.offset, 2);
});
