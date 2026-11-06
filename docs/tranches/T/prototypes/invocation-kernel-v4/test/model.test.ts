import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar } from "@parse-that/invocation-kernel-v4-prototype";

test("model records are frozen and inspection sanitizes callbacks and borrowed values", () => {
    const grammar = createGrammar();
    const callback = (value: string) => ({ value });
    const constant = { constant: true };
    const parser = grammar.seal(grammar.sequence(grammar.succeed(constant), grammar.map(grammar.literal("x"), callback)));
    assert.equal(Object.isFrozen(parser), true);
    assert.deepEqual(Object.keys(parser), []);
    const inspection = grammar.inspect();
    assert(inspection.includes("<borrowed-value>"));
    assert(inspection.includes("<callback>"));
    assert.equal(inspection.includes("constant\":true"), false);
});
