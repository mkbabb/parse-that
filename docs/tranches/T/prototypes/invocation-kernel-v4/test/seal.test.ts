import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull } from "@parse-that/invocation-kernel-v4-prototype";

type RecursiveValue = "a" | readonly [RecursiveValue, RecursiveValue];

test("V4-R02 seals 15,000 nested maps without host recursion", () => {
    const grammar = createGrammar();
    let parser = grammar.literal("x");
    for (let index = 0; index < 15_000; index += 1) parser = grammar.map(parser, value => value);
    const result = parseFull(grammar.seal(parser), "x");
    assert.equal(result.kind, "success");
    assert.equal(result.debug.continuationHighWater, 15_000);
});

test("V4-R02 seals a 5,000-rule acyclic chain iteratively", () => {
    const grammar = createGrammar();
    const rules = Array.from({ length: 5_000 }, (_, index) => grammar.rule<"x">(`r${index}`));
    for (let index = rules.length - 1; index >= 0; index -= 1) {
        grammar.define(rules[index]!, rules[index + 1] ?? grammar.literal("x"));
    }
    assert.equal(parseFull(grammar.seal(rules[0]!), "x").kind, "success");
});

test("recovery contributes nullable/minimum zero and forces simultaneous certification", () => {
    const grammar = createGrammar();
    const a = grammar.rule<RecursiveValue>("A");
    const unwrap = () => grammar.map(grammar.sequence(grammar.recover(grammar.literal("x"), null), a), ([, value]) => value);
    grammar.define(a, grammar.choice(grammar.sequence(unwrap(), unwrap()), grammar.literal("a")));
    grammar.seal(a);
    const graph = JSON.parse(grammar.inspect());
    assert.equal(graph.rules[0].nullable, false);
    assert.equal(graph.rules[0].minimumGuaranteedConsumption, 1);
    assert.equal(graph.sccs[0].rightGuarded, false);
});

test("duplicate, dangling, recursive-cut, and unsafe memo definitions are rejected", () => {
    const dangling = createGrammar();
    assert.throws(() => dangling.seal(dangling.rule("missing")), /Dangling/);
    const cut = createGrammar();
    const loop = cut.rule<"x">("loop");
    cut.define(loop, cut.choice(cut.commit(loop), cut.literal("x")));
    assert.throws(() => cut.seal(loop), /Recursive cut/);
    const memo = createGrammar();
    const named = memo.rule<"x">("named");
    memo.define(named, memo.literal("x"));
    assert.throws(() => memo.seal(memo.memo(named)), /rule dependency/);
});
