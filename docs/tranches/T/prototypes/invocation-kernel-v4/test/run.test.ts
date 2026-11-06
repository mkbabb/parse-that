import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull } from "@parse-that/invocation-kernel-v4-prototype";

function crossScc(count: number) {
    const grammar = createGrammar();
    const rules = Array.from({ length: count }, (_, index) => grammar.rule<number>(`r${index}`));
    for (let index = count - 1; index >= 0; index -= 1) {
        const rule = rules[index]!;
        grammar.define(rule, grammar.choice(
            grammar.map(grammar.sequence(grammar.literal("a"), rule), ([, value]) => value + 1),
            rules[index + 1] ?? grammar.succeed(0),
        ));
    }
    return parseFull(grammar.seal(rules[0]!), "");
}

test("V4-R01 1,250 separately recursive SCCs execute on the dispatch loop", () => {
    const result = crossScc(1_250);
    assert.equal(result.kind, "success");
    assert.equal(result.debug.consumingHeads, 1_250);
});

test("V4-R01 extended 10,000-SCC witness", { skip: process.env.PT_V4_EXTENDED !== "1" }, () => {
    assert.equal(crossScc(10_000).kind, "success");
});

test("H08 100,000-code-unit right recursion is host-stack independent", () => {
    const grammar = createGrammar();
    const right = grammar.rule<number>("right");
    grammar.define(right, grammar.choice(
        grammar.map(grammar.sequence(grammar.literal("a"), right), ([, count]) => count + 1),
        grammar.succeed(0),
    ));
    const result = parseFull(grammar.seal(right), "a".repeat(100_000));
    assert.equal(result.kind, "success");
    if (result.kind === "success") assert.equal(result.value, 100_000);
});

test("H07 the exact 10,001-input shape terminates as a resource without partial success", () => {
    const grammar = createGrammar();
    const budgeted = grammar.rule<number>("Budgeted");
    grammar.define(budgeted, grammar.choice(grammar.map(grammar.sequence(budgeted, grammar.literal("a")), ([items]) => items + 1), grammar.succeed(0)));
    const parser = grammar.seal(grammar.choice(budgeted, grammar.sequence(budgeted, grammar.literal("a"))));
    const result = parseFull(parser, "a".repeat(10_001), { maxSteps: 40 });
    assert.equal(result.kind, "resource");
    assert.equal(result.debug.proof.balanced, true);
});
