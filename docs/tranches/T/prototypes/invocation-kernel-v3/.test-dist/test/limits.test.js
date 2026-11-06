import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull } from "../src/index.js";
import { assertBalanced } from "./assertions.js";
test("H07 resource exhaustion is terminal and cannot backtrack into a partial answer", () => {
    const g = createGrammar();
    const recursive = g.rule("budgeted");
    g.define(recursive, g.choice(g.map(g.sequence(g.literal("a"), recursive), ([, count]) => count + 1), g.succeed(0)));
    const parser = g.seal(g.choice(recursive, g.literal("a")));
    const result = parseFull(parser, "a".repeat(100), { maxSteps: 40, trace: true });
    assert.equal(result.kind, "resource");
    if (result.kind !== "resource")
        return;
    assert.equal(result.resource, "step-budget");
    assert.deepEqual(result.expected, ["<step-budget>"]);
    assertBalanced(result.debug);
    assert((result.debug.ruleTransitions["Growing->Empty"] ?? 0) > 0);
});
test("L06 initial recursive failure terminalizes as Done", () => {
    const g = createGrammar();
    const dead = g.rule("dead");
    g.define(dead, dead);
    const result = parseFull(g.seal(dead), "");
    assert.equal(result.kind, "failure");
    assertBalanced(result.debug);
    assert((result.debug.ruleTransitions["Growing->Done"] ?? 0) >= 1);
});
test("C08 cut without a live visible choice is an invariant resource failure", () => {
    const g = createGrammar();
    const result = parseFull(g.seal(g.commit(g.literal("a"))), "a");
    assert.equal(result.kind, "resource");
    if (result.kind === "resource") {
        assert.equal(result.resource, "invariant");
        assert.deepEqual(result.expected, ["<cut-without-choice>"]);
        assertBalanced(result.debug);
    }
});
test("L08 simultaneous SCC prepopulation is itself cell-budgeted", () => {
    const g = createGrammar();
    const left = g.rule("left");
    g.define(left, g.choice(g.map(g.sequence(left, g.literal("a")), ([count]) => count + 1), g.map(g.literal("x"), () => 1)));
    const result = parseFull(g.seal(left), `x${"a".repeat(100)}`, { maxSteps: 3 });
    assert.equal(result.kind, "resource");
    if (result.kind === "resource") {
        assert.equal(result.resource, "step-budget");
        assertBalanced(result.debug);
        assert((result.debug.ruleTransitions["Growing->Empty"] ?? 0) > 0);
    }
});
