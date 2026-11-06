import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull, parsePrefix } from "@parse-that/invocation-kernel-v4-prototype";

test("public H01/H02/H04/H06 semantics and borrowed identity law", () => {
    const h01 = createGrammar();
    const recovered = h01.recover(h01.choice(h01.sequence(h01.commit(h01.literal("a")), h01.literal("b")), h01.literal("q")), "r");
    const failed = parseFull(h01.seal(h01.sequence(recovered, h01.literal("a"), h01.literal("c"), h01.literal("z"))), "acx");
    assert.equal(failed.kind, "failure");
    if (failed.kind === "failure") { assert.equal(failed.committed, false); assert.equal(failed.offset, 2); }

    const h02 = createGrammar();
    const cutMany = parseFull(h02.seal(h02.choice(h02.many(h02.sequence(h02.commit(h02.literal("a")), h02.literal("b"))), h02.literal("a"))), "a");
    assert.equal(cutMany.kind, "failure");
    if (cutMany.kind === "failure") assert.equal(cutMany.committed, true);

    const h04 = createGrammar();
    const local = parsePrefix(h04.seal(h04.sequence(h04.recover(h04.sequence(h04.literal("a"), h04.literal("x")), "one"), h04.recover(h04.literal("z"), "two"))), "a");
    assert.equal(local.kind, "success");
    assert.deepEqual(local.diagnostics.map(item => item.offset), [1, 0]);

    const h06 = createGrammar();
    const a = h06.rule<number>("A");
    const b = h06.rule<"x">("B");
    h06.define(b, h06.literal("x"));
    h06.define(a, h06.choice(h06.map(h06.sequence(a, b), ([count]) => count + 1), h06.succeed(0)));
    const exact = parseFull(h06.seal(a), "x");
    assert.equal(exact.kind, "success");
    if (exact.kind === "success") assert.equal(exact.value, 1);

    const identity = createGrammar();
    const constant = { constant: true };
    const fallback = { fallback: true };
    const mapped = { mapped: true };
    const memoed = identity.memo(identity.map(identity.succeed(null), () => mapped));
    const parser = identity.seal(identity.sequence(identity.succeed(constant), identity.recover(identity.literal("x"), fallback), memoed, memoed));
    const first = parsePrefix(parser, "");
    const second = parsePrefix(parser, "");
    assert.equal(first.kind, "success"); assert.equal(second.kind, "success");
    if (first.kind === "success" && second.kind === "success") {
        assert.equal(first.value[0], constant); assert.equal(second.value[0], constant);
        assert.equal(first.value[1], fallback); assert.equal(second.value[1], fallback);
        assert.equal(first.value[2], mapped); assert.equal(first.value[3], mapped);
    }
});

test("public EOF, invocation-local diagnostics, and cross-source memo boundaries stay explicit", () => {
    const eof = createGrammar();
    const eofResult = parseFull(eof.seal(eof.literal("a")), "ab");
    assert.equal(eofResult.kind, "failure");
    if (eofResult.kind === "failure") {
        assert.equal(eofResult.offset, 1);
        assert.deepEqual(eofResult.expected, ["<end-of-input>"]);
    }

    const diagnostics = createGrammar();
    const recovered = diagnostics.seal(diagnostics.recover(diagnostics.literal("x"), "r"));
    const first = parsePrefix(recovered, "a");
    const second = parsePrefix(recovered, "b");
    assert.equal(first.diagnostics[0]?.found, "a");
    assert.equal(second.diagnostics[0]?.found, "b");

    const memo = createGrammar();
    let calls = 0;
    const cached = memo.memo(memo.map(memo.literal("a"), value => { calls += 1; return value; }));
    const parser = memo.seal(cached);
    assert.equal(parseFull(parser, "a").kind, "success");
    assert.equal(parseFull(parser, "a").kind, "success");
    assert.equal(calls, 2, "memo cells are invocation-owned and never cross sources/runs");
});
