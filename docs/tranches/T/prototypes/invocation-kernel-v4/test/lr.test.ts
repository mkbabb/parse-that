import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull, parsePrefix } from "@parse-that/invocation-kernel-v4-prototype";

type RecursiveValue = "a" | readonly [RecursiveValue, RecursiveValue];

test("V4-R04 recovery-aware equal-offset cycles use snapshots and preserve associativity", () => {
    const grammar = createGrammar();
    const a = grammar.rule<RecursiveValue>("A");
    const unwrap = () => grammar.map(grammar.sequence(grammar.recover(grammar.literal("x"), null), a), ([, value]) => value);
    grammar.define(a, grammar.choice(grammar.sequence(unwrap(), unwrap()), grammar.literal("a")));
    const result = parseFull(grammar.seal(a), "aaa", { trace: true });
    assert.equal(result.kind, "success");
    if (result.kind !== "success") return;
    assert.deepEqual(result.value, [["a", "a"], "a"]);
    assert.equal(result.debug.simultaneousHeads, 1);
});

test("V4-R05 demand admission does not execute unreachable callbacks", () => {
    const grammar = createGrammar();
    const a = grammar.rule<string>("A");
    let callbacks = 0;
    grammar.define(a, grammar.choice(a, grammar.map(grammar.literal("b"), () => { callbacks += 1; throw new Error("unreachable-b"); }), grammar.literal("a")));
    const result = parsePrefix(grammar.seal(a), "ab");
    assert.equal(result.kind, "success");
    if (result.kind === "success") {
        assert.equal(result.value, "a");
        assert.equal(result.offset, 1);
    }
    assert.equal(callbacks, 0);
});

test("V4-R08 participant phases are truthful and cache events are terminal Done publications", () => {
    const grammar = createGrammar();
    const a = grammar.rule<number>("A");
    grammar.define(a, grammar.choice(grammar.map(grammar.sequence(a, grammar.literal("a")), ([count]) => count + 1), grammar.succeed(0)));
    const result = parseFull(grammar.seal(a), "aa", { trace: true });
    assert.equal(result.kind, "success");
    const kinds = result.debug.events.map(event => event.kind);
    assert(kinds.includes("participant-admit"));
    assert(kinds.includes("participant-grow"));
    assert(kinds.includes("rule-publish"));
    assert.equal(kinds.some(kind => String(kind).includes("RuleCell")), false);
    assert.equal(result.debug.census.nonterminalRuleCells, 0);
});
