import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull, type DebugReport } from "../src/index.js";
import { assertBalanced, expectSuccess } from "./assertions.js";

function verifyTrace(report: DebugReport): void {
    const choices: string[] = [];
    const heads: string[] = [];
    const allowed = new Set([
        "Empty->Evaluating",
        "Evaluating->Growing",
        "Growing->Growing",
        "Growing->Done",
        "Growing->Empty",
    ]);
    for (const event of report.events) {
        if (event.kind === "choice-open") choices.push(event.detail);
        if (event.kind === "choice-close") assert.equal(choices.pop(), event.detail);
        if (event.kind === "cut") assert(choices.includes(event.detail));
        if (event.kind === "head-open") heads.push(event.detail.split(":")[0] as string);
        if (event.kind === "head-close") assert.equal(heads.pop(), event.detail);
        if (event.kind === "rule") {
            const transition = event.detail.slice(event.detail.lastIndexOf(":") + 1);
            assert(allowed.has(transition), `invalid transition ${transition}`);
        }
    }
    assert.deepEqual(choices, []);
    assert.deepEqual(heads, []);
    assertBalanced(report);
}

test("P01 independent trace verifier accepts nested/sibling cut and recovery paths", () => {
    const g = createGrammar();
    const nested = g.choice(
        g.sequence(
            g.literal("a"),
            g.choice(
                g.sequence(g.commit(g.literal("b")), g.literal("c")),
                g.literal("b"),
            ),
        ),
        g.literal("fallback"),
    );
    const parser = g.seal(g.recover(nested, "recovered"));
    const result = parseFull(parser, "abx", { trace: true });
    assert.equal(result.kind, "failure");
    verifyTrace(result.debug);
    assert.deepEqual(result.diagnostics.map(item => item.offset), [2]);
});

test("P02 journal high-water is exactly the changed addresses under the oldest checkpoint", () => {
    const g = createGrammar();
    const count = 1_000;
    const cells = Array.from({ length: count }, () => g.memo(g.literal("a")));
    const parser = g.seal(g.choice(g.sequence(...cells), g.literal("z")));
    const result = parseFull(parser, "a".repeat(count), { trace: true });
    expectSuccess(result);
    assert.equal(result.debug.memoMisses, count);
    assert.equal(result.debug.journalHighWater, count);
    assert.equal(result.debug.journalLength, 0);
    assert.equal(
        result.debug.events.filter(event => event.kind === "memo-miss").length,
        count,
    );
    verifyTrace(result.debug);
});

test("P03 repeated runs emit byte-identical semantic and state summaries", () => {
    const g = createGrammar();
    const expression = g.rule<number>("expression");
    g.define(
        expression,
        g.choice(
            g.map(g.sequence(expression, g.literal("+"), g.literal("1")), ([value]) => value + 1),
            g.map(g.literal("1"), () => 1),
        ),
    );
    const parser = g.seal(expression);
    const summaries = Array.from({ length: 3 }, () => {
        const result = parseFull(parser, "1+1+1", { trace: true });
        const value = expectSuccess(result);
        verifyTrace(result.debug);
        return JSON.stringify({ value, debug: result.debug });
    });
    assert.equal(new Set(summaries).size, 1);
});

test("P04 full/prefix, failure evidence, and control results are discriminated", () => {
    const g = createGrammar();
    const parser = g.seal(g.literal("a"));
    const full = parseFull(parser, "ab");
    assert.equal(full.kind, "failure");
    if (full.kind === "failure") {
        assert.equal(full.offset, 1);
        assert.deepEqual(full.expected, ["<end-of-input>"]);
        assert.equal(full.committed, false);
    }
});

test("P05 committed repetition prefixes compact their journal when no parent is live", () => {
    const g = createGrammar();
    const cached = g.memo(g.literal("a"));
    const result = parseFull(g.seal(g.many(cached)), "a".repeat(1_000));
    expectSuccess(result);
    assert.equal(result.debug.memoMisses, 1_001);
    assert.equal(result.debug.journalHighWater, 1);
    assert.equal(result.debug.journalLength, 0);
});
