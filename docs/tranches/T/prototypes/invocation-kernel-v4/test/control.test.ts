import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull } from "@parse-that/invocation-kernel-v4-prototype";

test("V4-R03 a foreign cut crosses an inner choice and commits the exact outer failure", () => {
    const grammar = createGrammar();
    const parser = grammar.seal(grammar.choice(
        grammar.sequence(
            grammar.commit(grammar.literal("a")),
            grammar.choice(grammar.sequence(grammar.literal("b"), grammar.literal("x")), grammar.literal("b")),
        ),
        grammar.literal("ab"),
    ));
    const result = parseFull(parser, "ab", { trace: true });
    assert.equal(result.kind, "failure");
    if (result.kind !== "failure") return;
    assert.equal(result.committed, true);
    assert.equal(result.offset, 2);
    assert.deepEqual(result.expected, ['"x"']);
    assert.equal(result.debug.proof.balanced, true);
});

test("stale and conflicting control tokens become typed invariant resources", () => {
    const stale = createGrammar();
    const noOwner = parseFull(stale.seal(stale.commit(stale.literal("a"))), "a");
    assert.equal(noOwner.kind, "resource");
    if (noOwner.kind === "resource") assert.deepEqual(noOwner.expected, ["<cut-without-choice>"]);

    const conflict = createGrammar();
    const parser = conflict.seal(conflict.choice(
        conflict.sequence(conflict.commit(conflict.literal("a")), conflict.choice(conflict.commit(conflict.literal("b")), conflict.literal("b"))),
        conflict.literal("ab"),
    ));
    const result = parseFull(parser, "ab");
    assert.equal(result.kind, "resource");
    if (result.kind === "resource") assert.deepEqual(result.expected, ["<conflicting-cut>"]);
});
