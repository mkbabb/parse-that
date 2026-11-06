import assert from "node:assert/strict";
import test from "node:test";
import {
    createGrammar,
    parseFull,
    type Parser,
    type Rule,
} from "../src/index.js";
import {
    binaryInputs,
    canonicalBodies,
    compile,
    oracle,
    prng,
    randomAst,
    structuralNodes,
    type Ast,
    type OracleAnswer,
    type Value,
} from "./oracle-support.js";

function vmParser(rules: readonly Ast[]): Parser<Value> {
    const grammar = createGrammar();
    const handles: Rule<Value>[] = rules.map((_, index) => grammar.rule<Value>(`r${index}`));
    rules.forEach((body, index) => grammar.define(handles[index] as Rule<Value>, compile(grammar, body, handles)));
    return grammar.seal(handles[0] as Rule<Value>);
}

function vm(parser: Parser<Value>, input: string): OracleAnswer {
    const result = parseFull(parser, input);
    if (result.kind === "success") {
        return { kind: "success", offset: result.offset, value: result.value };
    }
    return { kind: "failure", offset: result.offset, expected: result.expected };
}

function compare(rules: readonly Ast[], input: string): void {
    const expected = oracle(rules, input);
    const actual = vm(vmParser(rules), input);
    assert.deepEqual(actual, expected, JSON.stringify({ rules, input }));
}

test("O01 every canonical two-rule grammar through six total body nodes matches every binary input through six", () => {
    const bodies = canonicalBodies(6);
    const inputs = binaryInputs(6);
    let comparisons = 0;
    let grammars = 0;
    for (const first of bodies) {
        for (const second of bodies) {
            if (structuralNodes(first) + structuralNodes(second) > 6) continue;
            const rules = [first, second];
            const parser = vmParser(rules);
            grammars += 1;
            for (const input of inputs) {
                const expected = oracle(rules, input);
                const actual = vm(parser, input);
                assert.deepEqual(actual, expected, JSON.stringify({ rules, input }));
                comparisons += 1;
            }
        }
    }
    assert.equal(grammars, 13_025);
    assert.equal(comparisons, 1_654_175);
});

test("O02 10,000 seed-recorded generated grammars have zero discarded cases", () => {
    const seed = 0x5eed_c0de;
    const next = prng(seed);
    const cases = 10_000;
    let compared = 0;
    for (let index = 0; index < cases; index += 1) {
        const ruleCount = 1 + Math.floor(next() * 3);
        const rules = Array.from({ length: ruleCount }, () => randomAst(next, 12, ruleCount));
        const length = Math.floor(next() * 13);
        let input = "";
        for (let offset = 0; offset < length; offset += 1) input += next() < 0.5 ? "a" : "b";
        compare(rules, input);
        compared += 1;
    }
    assert.deepEqual({ seed, cases, compared }, { seed: 1_592_639_710, cases: 10_000, compared: 10_000 });
});
