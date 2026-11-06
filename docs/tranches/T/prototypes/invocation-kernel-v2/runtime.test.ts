import assert from "node:assert/strict";
import {
    choice,
    commit,
    literal,
    many,
    map,
    memo,
    parseFull,
    parsePrefix,
    recover,
    rule,
    sequence,
    succeed,
    type Parser,
} from "./kernel.js";

function success<T>(result: ReturnType<typeof parseFull<T>>): T {
    assert.equal(result.kind, "success", JSON.stringify(result));
    return result.value;
}

function failure<T>(result: ReturnType<typeof parseFull<T>>) {
    assert.equal(result.kind, "failure", JSON.stringify(result));
    return result;
}

// Every invocation owns its source, memo cells, diagnostics, LR stack, and choices.
const word = memo(literal("hello"));
assert.deepEqual(Object.keys(word), []);
assert.equal(success(parseFull(word, "hello")), "hello");
failure(parseFull(word, "world"));

let nested!: Parser<"outer">;
nested = map(literal("outer"), value => {
    failure(parseFull(word, "inner"));
    return value;
});
assert.equal(success(parseFull(nested, "outer")), "outer");

// A failed speculative branch rolls back its memo journal.
let speculativeCalls = 0;
const countedA = memo(
    map(literal("a"), value => {
        speculativeCalls += 1;
        return value;
    }),
);
const rollback = choice(
    sequence(countedA, literal("x")),
    sequence(countedA, literal("b")),
);
assert.deepEqual(success(parseFull(rollback, "ab")), ["a", "b"]);
assert.equal(speculativeCalls, 2);

// A cached answer does not clear commitment owned by its caller's choice frame.
const cachedZero = memo(succeed("cached"));
const afterCut = choice(
    sequence(
        cachedZero,
        commit(succeed("cut")),
        cachedZero,
        literal("b"),
    ),
    literal("c"),
);
const cutFailure = failure(parseFull(afterCut, "c"));
assert.equal(cutFailure.committed, true);
assert.deepEqual(cutFailure.expected, ['"b"']);

// Effectful memo is rejected by default and faithfully replayed when requested.
assert.throws(() => memo(recover(literal("x"), "fallback")), /effectful memo/);
const replayedRecovery = memo(recover(literal("x"), "fallback"), {
    effects: "replay",
});
const recovered = parseFull(
    sequence(literal("a"), replayedRecovery, replayedRecovery),
    "a",
);
assert.deepEqual(success(recovered), ["a", "fallback", "fallback"]);
assert.equal(recovered.diagnostics.length, 2);
assert.deepEqual(
    recovered.diagnostics.map(diagnostic => diagnostic.offset),
    [1, 1],
);
assert.throws(() => memo(commit(literal("x"))), /may cut/);

// An inner cut kills only its inner alternative. The outer choice may still recover.
const inner = choice(
    sequence(commit(literal("a")), literal("b")),
    sequence(literal("a"), literal("c")),
);
const scoped = choice(inner, sequence(literal("a"), literal("c")));
assert.deepEqual(success(parseFull(scoped, "ac")), ["a", "c"]);
assert.deepEqual(
    success(
        parseFull(
            choice(
                sequence(literal("a"), literal("b")),
                sequence(literal("a"), literal("c")),
            ),
            "ac",
        ),
    ),
    ["a", "c"],
);

const outerCut = choice(
    sequence(commit(literal("a")), inner),
    sequence(literal("a"), literal("c")),
);
const outerCutFailure = failure(parseFull(outerCut, "aac"));
assert.equal(outerCutFailure.committed, true);

// Full and prefix parses are explicit and use one result algebra.
const prefix = parsePrefix(literal("a"), "ab");
assert.equal(prefix.kind, "success");
assert.equal(prefix.offset, 1);
const full = failure(parseFull(literal("a"), "ab"));
assert.equal(full.offset, 1);
assert.deepEqual(full.expected, ["<end-of-input>"]);

// JavaScript's two-code-unit astral character advances a branded UTF-16 offset by two.
const astral = parsePrefix(literal("😀"), "😀x");
assert.equal(astral.kind, "success");
assert.equal(astral.offset, 2);

// Repetition fails instead of spinning when its item succeeds without consuming.
const noProgress = failure(parseFull(many(succeed("still")), ""));
assert.deepEqual(noProgress.expected, ["<progress>"]);

// Callback throws unwind an invocation; a later invocation starts clean.
const explosive = map(literal("x"), () => {
    throw new Error("boom");
});
assert.throws(() => parseFull(explosive, "x"), /boom/);
assert.equal(success(parseFull(literal("x"), "x")), "x");

const plus = (left: number, right: number) => left + right;
const digit = map(choice(literal("1"), literal("2"), literal("3")), Number);

// Direct left recursion: Expr <- Expr "+" Digit / Digit.
let direct!: Parser<number>;
direct = rule("direct", () =>
    choice(
        map(sequence(direct, literal("+"), digit), ([left, , right]) =>
            plus(left, right),
        ),
        digit,
    ),
);
assert.equal(success(parseFull(direct, "1+2+3")), 6);

// Indirect left recursion: A <- B "a" / "a"; B <- A "b" / "a".
let indirectA!: Parser<string>;
let indirectB!: Parser<string>;
indirectA = rule("indirect-a", () =>
    choice(
        map(sequence(indirectB, literal("a")), parts => parts.join("")),
        literal("a"),
    ),
);
indirectB = rule("indirect-b", () =>
    choice(
        map(sequence(indirectA, literal("b")), parts => parts.join("")),
        literal("a"),
    ),
);
assert.equal(success(parseFull(indirectA, "aba")), "aba");

// Three-rule mutual recursion grows one shared head to the longest answer.
let mutualA!: Parser<string>;
let mutualB!: Parser<string>;
let mutualC!: Parser<string>;
mutualA = rule("mutual-a", () =>
    choice(
        map(sequence(mutualB, literal("a")), parts => parts.join("")),
        literal("a"),
    ),
);
mutualB = rule("mutual-b", () =>
    choice(
        map(sequence(mutualC, literal("b")), parts => parts.join("")),
        literal("a"),
    ),
);
mutualC = rule("mutual-c", () =>
    choice(
        map(sequence(mutualA, literal("c")), parts => parts.join("")),
        literal("a"),
    ),
);
assert.equal(success(parseFull(mutualA, "acba")), "acba");

// Nullable LR terminates at the fixed point; it cannot manufacture progress.
let nullable!: Parser<string>;
nullable = rule("nullable", () =>
    choice(map(nullable, value => value), succeed("")),
);
assert.equal(success(parseFull(nullable, "")), "");

// Throwing during LR growth unwinds the head and stack before the exception escapes.
let throwingLr!: Parser<"x">;
throwingLr = rule("throwing-lr", () =>
    choice(
        map(sequence(throwingLr, literal("x")), () => {
            throw new Error("lr-boom");
        }),
        literal("x"),
    ),
);
assert.throws(() => parseFull(throwingLr, "xx"), /lr-boom/);
assert.equal(success(parseFull(literal("ok"), "ok")), "ok");

// A pathological grammar hits the explicit growth wall instead of looping forever.
let budgeted!: Parser<string>;
budgeted = rule("budgeted", () =>
    choice(
        map(sequence(budgeted, literal("a")), ([value]) => `${value}a`),
        succeed(""),
    ),
);
const budgetFailure = failure(parseFull(budgeted, "a".repeat(10_001)));
assert.deepEqual(budgetFailure.expected, ["<budgeted:growth-budget>"]);

console.log(
    JSON.stringify({
        invocationIsolation: true,
        speculativeMemoRollback: true,
        scopedCut: true,
        utf16Offset: astral.offset,
        directLeftRecursion: 6,
        indirectLeftRecursion: "aba",
        mutualLeftRecursion: "acba",
        nullableLeftRecursion: "terminates",
        leftRecursionThrow: "unwinds",
        leftRecursionBudget: "fails-closed",
    }),
);
