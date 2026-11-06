import assert from "node:assert/strict";
import test from "node:test";
import { createGrammar, parseFull, type DebugReport } from "../src/index.js";
import { assertBalanced, expectSuccess } from "./assertions.js";

function directParser() {
    const g = createGrammar();
    const expression = g.rule<number>("expression");
    g.define(
        expression,
        g.choice(
            g.map(g.sequence(expression, g.literal("a")), ([value]) => value + 1),
            g.map(g.literal("x"), () => 1),
        ),
    );
    return g.seal(expression);
}

test("L01 direct left recursion grows monotonically and terminalizes", () => {
    const result = parseFull(directParser(), "xaaa", { trace: true });
    assert.equal(expectSuccess(result), 4);
    assert((result.debug.ruleTransitions["Growing->Growing"] ?? 0) >= 4);
    assert((result.debug.ruleTransitions["Growing->Done"] ?? 0) >= 1);
    assertBalanced(result.debug);
});

test("L02 indirect recursion admits both sealed SCC participants", () => {
    const g = createGrammar();
    const a = g.rule<number>("a");
    const b = g.rule<number>("b");
    g.define(
        a,
        g.choice(
            g.map(g.sequence(b, g.literal("a")), ([value]) => value + 1),
            g.map(g.literal("x"), () => 1),
        ),
    );
    g.define(b, g.map(a, value => value));
    const result = parseFull(g.seal(a), "xaaa", { trace: true });
    assert.equal(expectSuccess(result), 4);
    const participants = result.debug.events.filter(event => event.kind === "participant");
    assert(participants.some(event => event.detail.includes("0@0")));
    assert(participants.some(event => event.detail.includes("1@0")));
});

test("L03 mutual recursion and nullable growth reach a fixed point", () => {
    const mutual = createGrammar();
    const a = mutual.rule<number>("a");
    const b = mutual.rule<number>("b");
    mutual.define(
        a,
        mutual.choice(
            mutual.map(mutual.sequence(b, mutual.literal("a")), ([value]) => value + 1),
            mutual.map(mutual.literal("x"), () => 1),
        ),
    );
    mutual.define(
        b,
        mutual.choice(
            mutual.map(mutual.sequence(a, mutual.literal("b")), ([value]) => value + 1),
            mutual.map(mutual.literal("x"), () => 1),
        ),
    );
    assert.equal(expectSuccess(parseFull(mutual.seal(a), "xba")), 3);

    const nullable = createGrammar();
    const items = nullable.rule<number>("items");
    const item = nullable.rule<"x">("item");
    nullable.define(item, nullable.literal("x"));
    nullable.define(
        items,
        nullable.choice(
            nullable.map(nullable.sequence(items, item), ([count]) => count + 1),
            nullable.succeed(0),
        ),
    );
    assert.equal(expectSuccess(parseFull(nullable.seal(items), "xxx")), 3);
});

test("L04 multiple entry heads and mixed left/right recursion are deterministic", () => {
    const g = createGrammar();
    const run = g.rule<number>("run");
    g.define(
        run,
        g.choice(
            g.map(g.sequence(g.literal("x"), run), ([, count]) => count + 1),
            g.succeed(0),
        ),
    );
    const root = g.seal(g.sequence(run, g.literal("|"), run));
    const first = parseFull(root, "xx|xxx", { trace: true });
    assert.deepEqual(expectSuccess(first), [2, "|", 3]);
    assert(first.debug.events.filter(event => event.kind === "head-open").length >= 2);

    const mixed = createGrammar();
    const nested = mixed.rule<number>("nested");
    mixed.define(
        nested,
        mixed.choice(
            mixed.map(
                mixed.sequence(mixed.literal("a"), nested, mixed.literal("b")),
                ([, depth]) => depth + 1,
            ),
            mixed.succeed(0),
        ),
    );
    assert.equal(expectSuccess(parseFull(mixed.seal(nested), "aaabbb")), 3);
});

test("L05 callback throw evicts every transitional cell and preserves the throw", () => {
    const g = createGrammar();
    const recursive = g.rule<number>("recursive");
    g.define(
        recursive,
        g.choice(
            g.map(g.sequence(recursive, g.literal("a")), (): number => {
                throw new Error("map exploded");
            }),
            g.map(g.literal("x"), () => 1),
        ),
    );
    const parser = g.seal(recursive);
    let debug: DebugReport | undefined;
    assert.throws(
        () =>
            parseFull(parser, "xa", {
                onDebug(report) {
                    debug = report;
                },
            }),
        /map exploded/,
    );
    assert(debug);
    assertBalanced(debug as DebugReport);
});

test("H06 a right-guarded mutual SCC admits participants discovered after head creation", () => {
    const g = createGrammar();
    const a = g.rule<number>("a");
    const b = g.rule<number>("b");
    g.define(
        a,
        g.choice(
            g.map(g.sequence(g.literal("a"), b), ([, count]) => count + 1),
            g.succeed(0),
        ),
    );
    g.define(
        b,
        g.choice(
            g.map(g.sequence(g.literal("b"), a), ([, count]) => count + 1),
            g.succeed(0),
        ),
    );
    const result = parseFull(g.seal(a), "ab", { trace: true });
    assert.equal(expectSuccess(result), 2);
    const participants = result.debug.events
        .filter(event => event.kind === "participant")
        .map(event => event.detail);
    assert(participants.some(detail => detail.includes("0@0")));
    assert(participants.some(detail => detail.includes("1@1")));
    assert(participants.some(detail => detail.includes("0@2")));
});

test("L07 recursive rule diagnostics replay locally and nonrecursive cut rules stay uncached", () => {
    const diagnostics = createGrammar();
    const recursive = diagnostics.rule<number | "r">("recursive");
    diagnostics.define(
        recursive,
        diagnostics.choice(
            diagnostics.map(
                diagnostics.sequence(diagnostics.literal("a"), recursive),
                ([, value]) => (typeof value === "number" ? value + 1 : 1),
            ),
            diagnostics.recover(diagnostics.map(diagnostics.literal("x"), () => 0), "r" as const),
        ),
    );
    const replay = parseFull(diagnostics.seal(diagnostics.sequence(recursive, recursive)), "");
    assert.deepEqual(expectSuccess(replay), ["r", "r"]);
    if (replay.kind === "success") {
        assert.equal(replay.debug.ruleHits, 1);
        assert.deepEqual(replay.diagnostics.map(item => item.offset), [0, 0]);
    }

    const cuts = createGrammar();
    let calls = 0;
    const cutRule = cuts.rule<"a">("cutRule");
    cuts.define(
        cutRule,
        cuts.commit(cuts.map(cuts.literal("a"), value => (calls += 1, value))),
    );
    const cutParser = cuts.seal(
        cuts.choice(cuts.sequence(cutRule, cuts.literal("b")), cuts.literal("a")),
    );
    const first = parseFull(cutParser, "a");
    const second = parseFull(cutParser, "a");
    assert.equal(first.kind, "failure");
    assert.equal(second.kind, "failure");
    assert.equal(calls, 2);
});
