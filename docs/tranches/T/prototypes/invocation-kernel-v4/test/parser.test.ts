import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull, type Parser } from "@parse-that/invocation-kernel-v4-prototype";

test("V4-R07 the public grammar/parser surface leaks no graph, callback, or executor capability", () => {
    const grammar = createGrammar();
    const callback = (value: string) => value;
    const parser = grammar.seal(grammar.map(grammar.literal("x"), callback));
    assert.deepEqual(Object.keys(grammar).filter(key => /graph|callback|execut|sealed/i.test(key)), []);
    assert.equal("_sealedGraph" in grammar, false);
    assert.equal("bindingOf" in grammar, false);
    assert.deepEqual(Object.keys(parser), []);
    assert.equal(parseFull(parser, "x").kind, "success");
    assert.throws(() => parseFull({} as Parser<unknown>, ""), /originate/);
});
