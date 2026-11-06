import assert from "node:assert/strict";
import test from "node:test";
import { evidence, improve, mergeEvidence, seed } from "../src/outcome.js";
import { utf16Offset } from "../src/types.js";

test("outcome evidence and deterministic improvement are local and monotone", () => {
    assert.deepEqual(mergeEvidence(evidence(utf16Offset(1), ["b"]), evidence(utf16Offset(1), ["a"])).expected, ["a", "b"]);
    const candidate = {
        kind: "success" as const,
        value: "x",
        next: utf16Offset(1),
        diagnostics: [],
        control: null,
    };
    assert.equal(improve(utf16Offset(0), seed(utf16Offset(0)), candidate)?.kind, "success");
    const stable = { kind: "success" as const, value: "first", nextDelta: 1, diagnostics: [] };
    assert.equal(improve(utf16Offset(0), stable, candidate), null, "equal-offset established value stays stable");
});
