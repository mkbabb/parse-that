import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull } from "../src/index.js";
import { expectSuccess } from "./assertions.js";
function buildStable() {
    const g = createGrammar();
    const expression = g.rule("expression");
    const atom = g.rule("atom");
    const number = g.map(g.literal("n"), () => 1);
    g.define(atom, number);
    g.define(expression, g.choice(g.map(g.sequence(expression, g.literal("+"), atom), ([left, , right]) => left + right), atom));
    const root = g.seal(expression);
    expectSuccess(parseFull(root, "n+n"));
    return { json: g.inspect(), frozen: Object.isFrozen(root), keys: Object.keys(root) };
}
test("G01 seal is byte-stable, opaque, frozen, and transitively summarized", () => {
    const left = buildStable();
    const right = buildStable();
    assert.equal(left.json, right.json);
    assert.equal(left.frozen, true);
    assert.deepEqual(left.keys, []);
    assert.throws(() => parseFull({}, ""), /originate/);
    const graph = JSON.parse(left.json);
    assert.equal(graph.rules.length, 2);
    assert(graph.rules.some((rule) => (rule.effects & 8) !== 0));
    assert(graph.sccs.some((scc) => scc.length === 1));
});
test("G02 seal rejects dangling and multiply-defined rules", () => {
    const dangling = createGrammar();
    const missing = dangling.rule("missing");
    assert.throws(() => dangling.seal(missing), /Dangling rule/);
    const duplicate = createGrammar();
    const named = duplicate.rule("named");
    duplicate.define(named, duplicate.literal("x"));
    assert.throws(() => duplicate.define(named, duplicate.literal("x")), /already defined/);
    assert.throws(() => duplicate.rule("named"), /Duplicate rule name/);
});
test("H03/H05 seal closes rule effects and rejects recursive cut or rule-dependent memo", () => {
    const recursive = createGrammar();
    const loop = recursive.rule("loop");
    recursive.define(loop, recursive.choice(recursive.commit(loop), recursive.literal("x")));
    assert.throws(() => recursive.seal(loop), /Recursive cut effect/);
    const ruleMemo = createGrammar();
    const named = ruleMemo.rule("named");
    ruleMemo.define(named, ruleMemo.literal("x"));
    const cached = ruleMemo.memo(ruleMemo.map(named, value => value));
    assert.throws(() => ruleMemo.seal(cached), /transitive rule dependency/);
    const cutMemo = createGrammar();
    const cachedCut = cutMemo.memo(cutMemo.commit(cutMemo.literal("x")));
    assert.throws(() => cutMemo.seal(cachedCut), /transitive cut effect/);
});
test("G04 diagnostic caches require explicit replay and sealed builders reject mutation", () => {
    const rejected = createGrammar();
    const cached = rejected.memo(rejected.recover(rejected.literal("x"), "r"));
    assert.throws(() => rejected.seal(cached), /diagnostic memo/);
    const accepted = createGrammar();
    const replay = accepted.memo(accepted.recover(accepted.literal("x"), "r"), {
        effects: "replay",
    });
    accepted.seal(replay);
    assert.throws(() => accepted.literal("later"), /sealed/);
});
