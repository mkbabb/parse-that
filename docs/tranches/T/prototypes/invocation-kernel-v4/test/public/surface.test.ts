import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull, type Parser } from "@parse-that/invocation-kernel-v4-prototype";

test("public root identity and tuple/choice declarations agree with runtime", () => {
    const grammar = createGrammar();
    const parser: Parser<readonly ["a", "b"]> = grammar.seal(grammar.sequence(grammar.literal("a"), grammar.literal("b")));
    const result = parseFull(parser, "ab");
    assert.equal(result.kind, "success");
    if (result.kind === "success") {
        const value: readonly ["a", "b"] = result.value;
        assert.deepEqual(value, ["a", "b"]);
    }
});
