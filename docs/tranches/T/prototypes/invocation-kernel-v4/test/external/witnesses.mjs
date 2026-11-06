import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

function captured(run) {
    try {
        return { status: "returned", value: run() };
    } catch (error) {
        return {
            status: "threw",
            name: error instanceof Error ? error.name : typeof error,
            message: error instanceof Error ? error.message : String(error),
        };
    }
}

function resultShape(result) {
    if (result.kind === "success") {
        return { kind: result.kind, value: result.value, offset: result.offset };
    }
    return {
        kind: result.kind,
        ...(result.kind === "resource" ? { resource: result.resource } : { committed: result.committed }),
        offset: result.offset,
        expected: result.expected,
    };
}

function crossScc(api, count) {
    const g = api.createGrammar();
    const rules = Array.from({ length: count }, (_, index) => g.rule(`r${index}`));
    for (let index = count - 1; index >= 0; index -= 1) {
        const rule = rules[index];
        const next = rules[index + 1] ?? g.succeed(0);
        g.define(
            rule,
            g.choice(
                g.map(g.sequence(g.literal("a"), rule), ([, value]) => value + 1),
                next,
            ),
        );
    }
    const root = g.seal(rules[0]);
    return resultShape(api.parseFull(root, ""));
}

function nestedMaps(api, count) {
    const g = api.createGrammar();
    let parser = g.literal("x");
    for (let index = 0; index < count; index += 1) parser = g.map(parser, value => value);
    return resultShape(api.parseFull(g.seal(parser), "x"));
}

function ruleChain(api, count) {
    const g = api.createGrammar();
    const rules = Array.from({ length: count }, (_, index) => g.rule(`r${index}`));
    for (let index = count - 1; index >= 0; index -= 1) {
        g.define(rules[index], rules[index + 1] ?? g.literal("x"));
    }
    return resultShape(api.parseFull(g.seal(rules[0]), "x"));
}

function associativity(api) {
    const g = api.createGrammar();
    const a = g.rule("A");
    const unwrap = () => g.map(g.sequence(g.recover(g.literal("x"), null), a), ([, value]) => value);
    g.define(a, g.choice(g.sequence(unwrap(), unwrap()), g.literal("a")));
    const result = api.parseFull(g.seal(a), "aaa", { trace: true });
    return {
        ...resultShape(result),
        mode: result.debug.events.some(event => event.kind === "participant" && event.detail.includes("@1"))
            ? "prepopulated-simultaneous"
            : "unknown",
    };
}

function unreachable(api) {
    const g = api.createGrammar();
    const a = g.rule("A");
    let calls = 0;
    g.define(
        a,
        g.choice(
            a,
            g.map(g.literal("b"), () => {
                calls += 1;
                throw new Error("unreachable-b");
            }),
            g.literal("a"),
        ),
    );
    const observed = captured(() => resultShape(api.parsePrefix(g.seal(a), "ab")));
    return { observed, callbackCalls: calls };
}

function throwTrace(api) {
    const g = api.createGrammar();
    const parser = g.seal(
        g.choice(
            g.map(g.literal("a"), () => {
                throw new Error("boom");
            }),
            g.literal("a"),
        ),
    );
    let report;
    const observed = captured(() => api.parseFull(parser, "a", { trace: true, onDebug(value) { report = value; } }));
    const opens = report?.events.filter(event => event.kind.endsWith("-open")).length ?? -1;
    const closes = report?.events.filter(event => event.kind.endsWith("-close") || event.kind.endsWith("-abort")).length ?? -1;
    return {
        observed,
        opens,
        closes,
        live: report ? {
            journal: report.journalLength,
            transactions: report.liveTransactions,
            choices: report.liveChoices,
            heads: report.liveHeads,
            nonterminal: report.transitionalMemoCells + report.transitionalRuleCells,
        } : null,
    };
}

function inherited(api, id) {
    if (id === "H01") {
        const g = api.createGrammar();
        const recovered = g.recover(g.choice(g.sequence(g.commit(g.literal("a")), g.literal("b")), g.literal("q")), "r");
        return resultShape(api.parseFull(g.seal(g.sequence(recovered, g.literal("a"), g.literal("c"), g.literal("z"))), "acx"));
    }
    if (id === "H02") {
        const g = api.createGrammar();
        return resultShape(api.parseFull(g.seal(g.choice(g.many(g.sequence(g.commit(g.literal("a")), g.literal("b"))), g.literal("a"))), "a"));
    }
    if (id === "H03") {
        const g = api.createGrammar();
        const loop = g.rule("loop");
        g.define(loop, g.choice(g.commit(loop), g.literal("x")));
        return captured(() => g.seal(loop));
    }
    if (id === "H04") {
        const g = api.createGrammar();
        const result = api.parsePrefix(g.seal(g.sequence(g.recover(g.sequence(g.literal("a"), g.literal("x")), "one"), g.recover(g.literal("z"), "two"))), "a");
        return { ...resultShape(result), diagnostics: result.diagnostics.map(item => ({ offset: item.offset, expected: item.expected })) };
    }
    if (id === "H05") {
        const g = api.createGrammar();
        const named = g.rule("named");
        g.define(named, g.literal("x"));
        return captured(() => g.seal(g.memo(g.map(named, value => value))));
    }
    if (id === "H06") {
        const g = api.createGrammar();
        const a = g.rule("A");
        const b = g.rule("B");
        g.define(b, g.literal("x"));
        g.define(a, g.choice(g.map(g.sequence(a, b), ([count]) => count + 1), g.succeed(0)));
        return resultShape(api.parseFull(g.seal(a), "x"));
    }
    if (id === "H07") {
        const g = api.createGrammar();
        const budgeted = g.rule("Budgeted");
        g.define(budgeted, g.choice(g.map(g.sequence(budgeted, g.literal("a")), ([items]) => items + 1), g.succeed(0)));
        const parser = g.seal(g.choice(budgeted, g.sequence(budgeted, g.literal("a"))));
        return resultShape(api.parseFull(parser, "a".repeat(10_001), { maxSteps: 200_000 }));
    }
    if (id === "H08") {
        const g = api.createGrammar();
        const right = g.rule("right");
        g.define(right, g.choice(g.map(g.sequence(g.literal("a"), right), ([, count]) => count + 1), g.succeed(0)));
        return resultShape(api.parseFull(g.seal(right), "a".repeat(100_000)));
    }
    if (id === "H09") {
        const g = api.createGrammar();
        const count = 1_000;
        const cells = Array.from({ length: count }, () => g.memo(g.literal("a")));
        const result = api.parseFull(g.seal(g.choice(g.sequence(...cells), g.literal("z"))), "a".repeat(count));
        return { ...resultShape(result), highWater: result.debug.journalHighWater, finalJournal: result.debug.journalLength };
    }
    throw new Error(`Unknown inherited witness ${id}`);
}

export async function runV3Witnesses(v3) {
    const api = v3.api;
    const root = fileURLToPath(v3.packageRoot);
    const machine = readFileSync(new URL("src/machine.ts", v3.packageRoot), "utf8");
    const state = readFileSync(new URL("src/state.ts", v3.packageRoot), "utf8");
    const readme = readFileSync(new URL("README.md", v3.packageRoot), "utf8");
    const results = {};
    results["V4-R01-1250"] = captured(() => crossScc(api, 1_250));
    results["V4-R01-10000"] = captured(() => crossScc(api, 10_000));
    results["V4-R02-maps"] = captured(() => nestedMaps(api, 15_000));
    results["V4-R02-rules"] = captured(() => ruleChain(api, 5_000));
    {
        const g = api.createGrammar();
        const parser = g.seal(g.choice(g.sequence(g.commit(g.literal("a")), g.choice(g.sequence(g.literal("b"), g.literal("x")), g.literal("b"))), g.literal("ab")));
        results["V4-R03"] = resultShape(api.parseFull(parser, "ab"));
    }
    results["V4-R04"] = associativity(api);
    results["V4-R05"] = unreachable(api);
    results["V4-R06"] = throwTrace(api);
    {
        const g = api.createGrammar();
        const callback = value => value;
        g.seal(g.map(g.literal("x"), callback));
        const builder = g;
        results["V4-R07"] = {
            exportedBuilderName: builder.constructor.name,
            sealedGraphMethod: typeof builder._sealedGraph,
            callbackRecovered: builder._sealedGraph().nodes.some(node => node.kind === "map" && node.transform === callback),
        };
    }
    {
        const g = api.createGrammar();
        const a = g.rule("a");
        g.define(a, g.choice(g.map(g.sequence(a, g.literal("a")), ([n]) => n + 1), g.succeed(0)));
        const result = api.parseFull(g.seal(a), "aa", { trace: true });
        results["V4-R08"] = {
            syntheticRuleEvents: result.debug.events.filter(event => event.kind === "rule").length,
            nonterminalCacheCellsAtParticipantEvents: result.debug.transitionalRuleCells,
        };
    }
    results["V4-R09"] = {
        composedAddressFunctions: /return `\$\{(?:rule|node)\}@\$\{entry\}`/.test(machine),
        stringJournalKeys: /readonly key: string/.test(state),
    };
    results["V4-R10"] = [-1, -0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, -0].map(value => {
        const observed = captured(() => api.utf16Offset(value));
        return { input: Object.is(value, -0) ? "-0" : String(value), observed, negativeZero: observed.status === "returned" && Object.is(observed.value, -0) };
    });
    {
        const g = api.createGrammar();
        const constant = { kind: "constant" };
        const fallback = { kind: "fallback" };
        const mapped = { kind: "mapped" };
        const parser = g.seal(g.sequence(g.succeed(constant), g.recover(g.literal("x"), fallback), g.memo(g.map(g.succeed(null), () => mapped)), g.memo(g.map(g.succeed(null), () => mapped))));
        const first = api.parsePrefix(parser, "");
        const second = api.parsePrefix(parser, "");
        results["V4-R11"] = {
            runtimeIdentity: first.kind === "success" && second.kind === "success" && first.value[0] === second.value[0] && first.value[1] === second.value[1] && first.value[2] === mapped && first.value[3] === mapped,
            documentedBorrowedLaw: readme.includes("borrowed immutable-by-contract"),
        };
    }
    results["V4-R12"] = { versionedReceipt: false, controlCategories: false, stableThreeDigests: false };
    results["V4-R13"] = { sharedPublicSuiteLedger: false, packedSuiteReplay: false };
    results["V4-R14"] = {
        sourceModules: ["types", "graph", "recursion", "state", "machine", "index"],
        goldilocksTopology: false,
        sourceIsomorphicMirrors: false,
    };
    for (const id of ["H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08", "H09"]) {
        results[id] = captured(() => inherited(api, id));
    }
    const command = (args) => captured(() => execFileSync("npm", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim().split("\n").at(-1));
    results.H10 = {
        test: command(["test", "--", "--test-reporter=spec"]),
        pack: command(["pack", "--dry-run", "--json"]),
    };
    return results;
}

export function sha256(text) {
    return createHash("sha256").update(text).digest("hex");
}
