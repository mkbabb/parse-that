import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull } from "../src/index.js";
import { expectSuccess } from "./assertions.js";
test("H08 100,000 right-recursive literals execute without host-stack growth", () => {
    const g = createGrammar();
    const right = g.rule("right");
    g.define(right, g.choice(g.map(g.sequence(g.literal("a"), right), ([, count]) => count + 1), g.succeed(0)));
    const size = 100_000;
    const result = parseFull(g.seal(right), "a".repeat(size));
    assert.equal(expectSuccess(result), size);
    assert(result.debug.continuationHighWater < 32, `continuation depth ${result.debug.continuationHighWater} depended on input`);
    assert.equal(result.debug.journalLength, 0);
});
