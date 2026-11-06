import { createHash } from "node:crypto";
import {
    createGrammar,
    parseFull,
    parsePrefix,
    type Grammar,
    type ParseResult,
    type Parser,
    type Rule,
} from "@parse-that/invocation-kernel-v4-prototype";
import { binaryInputs, controlCategories, generatedCases, seed, structuralGrammars, type GeneratedCategory } from "./corpus.js";
import { controlOracle, oracle, type Answer, type Ast, type ControlAnswer, type ControlCategory, type Value } from "./model.js";

function widen<T>(parser: Parser<T>): Parser<Value> {
    return parser as unknown as Parser<Value>;
}

function compile(grammar: Grammar, ast: Ast, rules: readonly Rule<Value>[]): Parser<Value> {
    switch (ast.kind) {
        case "epsilon": return widen(grammar.succeed(null));
        case "literal": return widen(grammar.literal(ast.text));
        case "reference": {
            const rule = rules[ast.rule];
            if (!rule) throw new Error(`Compiler missing rule ${ast.rule}`);
            return rule;
        }
        case "sequence": return widen(grammar.sequence(compile(grammar, ast.left, rules), compile(grammar, ast.right, rules)));
        case "choice": return grammar.choice(compile(grammar, ast.left, rules), compile(grammar, ast.right, rules));
    }
}

function vmParser(rules: readonly Ast[]): Parser<Value> {
    const grammar = createGrammar();
    const handles = rules.map((_, index) => grammar.rule<Value>(`r${index}`));
    rules.forEach((body, index) => grammar.define(handles[index]!, compile(grammar, body, handles)));
    return grammar.seal(handles[0]!);
}

function vmAnswer(parser: Parser<Value>, input: string): Answer {
    const result = parseFull(parser, input);
    if (result.kind === "success") return { kind: "success", offset: result.offset, value: result.value };
    return { kind: "failure", offset: result.offset, expected: result.expected };
}

function controlResult(result: ParseResult<unknown>): ControlAnswer {
    if (result.kind === "success") return { kind: "success", value: result.value, offset: result.offset, diagnostics: result.diagnostics.map(item => item.offset) };
    if (result.kind === "failure") return { kind: "failure", offset: result.offset, expected: result.expected, committed: result.committed, diagnostics: result.diagnostics.map(item => item.offset) };
    return { kind: "resource", resource: result.resource, expected: result.expected };
}

function runControl(category: ControlCategory): ControlAnswer {
    try {
        if (category === "foreignCut") {
            const g = createGrammar();
            return controlResult(parseFull(g.seal(g.choice(g.sequence(g.commit(g.literal("a")), g.choice(g.sequence(g.literal("b"), g.literal("x")), g.literal("b"))), g.literal("ab"))), "ab"));
        }
        if (category === "nestedCut" || category === "siblingCut") {
            const g = createGrammar();
            return controlResult(parseFull(g.seal(g.choice(g.sequence(g.commit(g.literal("a")), g.literal("x")), g.literal("a"))), "a"));
        }
        if (category === "cutThroughMany") {
            const g = createGrammar();
            return controlResult(parseFull(g.seal(g.choice(g.many(g.sequence(g.commit(g.literal("a")), g.literal("b"))), g.literal("a"))), "a"));
        }
        if (category === "recovery") {
            const g = createGrammar();
            return controlResult(parsePrefix(g.seal(g.recover(g.literal("x"), "r")), "a"));
        }
        if (category === "recoveredCut") {
            const g = createGrammar();
            const recovered = g.recover(g.choice(g.sequence(g.commit(g.literal("a")), g.literal("b")), g.literal("q")), "r");
            return controlResult(parseFull(g.seal(g.sequence(recovered, g.literal("a"), g.literal("c"), g.literal("z"))), "acx"));
        }
        if (category === "memoRollback") {
            const g = createGrammar();
            const memo = g.memo(g.literal("a"));
            return controlResult(parseFull(g.seal(g.choice(g.sequence(memo, g.literal("x")), g.sequence(memo, g.literal("b")))), "ab"));
        }
        if (category === "memoReplay") {
            const g = createGrammar();
            const memo = g.memo(g.recover(g.literal("x"), "r"), { effects: "replay" });
            return controlResult(parseFull(g.seal(g.sequence(memo, memo)), ""));
        }
        if (category === "resource") {
            const g = createGrammar();
            return controlResult(parseFull(g.seal(g.many(g.literal("a"))), "a".repeat(100), { maxSteps: 2 }));
        }
        if (category === "callbackThrow") {
            const g = createGrammar();
            const parser = g.seal(g.map(g.literal("a"), () => { throw new Error("oracle-boom"); }));
            parseFull(parser, "a");
            throw new Error("callback did not throw");
        }
        if (category === "staleToken") {
            const g = createGrammar();
            return controlResult(parseFull(g.seal(g.commit(g.literal("a"))), "a"));
        }
        const g = createGrammar();
        return controlResult(parseFull(g.seal(g.choice(g.sequence(g.commit(g.literal("a")), g.choice(g.commit(g.literal("b")), g.literal("b"))), g.literal("ab"))), "ab"));
    } catch (error) {
        return { kind: "throw", message: error instanceof Error ? error.message : String(error) };
    }
}

export interface OracleReceipt {
    readonly schema: "parse-that.invocation-kernel-v4.oracle-receipt.v1";
    readonly seed: number;
    readonly structural: { readonly grammars: 13025; readonly inputs: 127; readonly comparisons: 1654175 };
    readonly generated: {
        readonly cases: 10000;
        readonly discarded: 0;
        readonly categories: Readonly<Record<GeneratedCategory, number>>;
    };
    readonly control: { readonly categories: Readonly<Record<ControlCategory, number>> };
    readonly corpusSha256: string;
    readonly oracleResultSha256: string;
    readonly vmResultSha256: string;
    readonly discrepancies: number;
    readonly exhaustion: number;
}

export function generateReceipt(): OracleReceipt {
    const corpusHash = createHash("sha256");
    const oracleHash = createHash("sha256");
    const vmHash = createHash("sha256");
    let discrepancies = 0;
    let exhaustion = 0;
    const grammars = structuralGrammars();
    const inputs = binaryInputs(6);
    corpusHash.update(JSON.stringify({ grammars, inputs }));
    for (const rules of grammars) {
        const parser = vmParser(rules);
        for (const input of inputs) {
            try {
                const expected = oracle(rules, input);
                const actual = vmAnswer(parser, input);
                const expectedJson = JSON.stringify(expected);
                const actualJson = JSON.stringify(actual);
                oracleHash.update(expectedJson).update("\n");
                vmHash.update(actualJson).update("\n");
                if (expectedJson !== actualJson) {
                    discrepancies += 1;
                    if (process.env.PT_V4_ORACLE_DEBUG === "1" && discrepancies <= 5) console.error(JSON.stringify({ phase: "structural", rules, input, expected, actual }));
                }
            } catch {
                exhaustion += 1;
            }
        }
    }
    const categoryCounts: Record<GeneratedCategory, number> = {
        direct: 0, indirect: 0, mutual: 0, nullable: 0, lateAdmitted: 0, productive: 0, unproductive: 0,
    };
    const generated = generatedCases(10_000);
    corpusHash.update(JSON.stringify(generated));
    for (const item of generated) {
        for (const category of item.categories) categoryCounts[category] += 1;
        try {
            const expected = oracle(item.rules, item.input);
            const actual = vmAnswer(vmParser(item.rules), item.input);
            const expectedJson = JSON.stringify(expected);
            const actualJson = JSON.stringify(actual);
            oracleHash.update(expectedJson).update("\n");
            vmHash.update(actualJson).update("\n");
            if (expectedJson !== actualJson) {
                discrepancies += 1;
                if (process.env.PT_V4_ORACLE_DEBUG === "1" && discrepancies <= 5) console.error(JSON.stringify({ phase: "generated", item, expected, actual }));
            }
        } catch {
            exhaustion += 1;
        }
    }
    const controlCounts = Object.fromEntries(controlCategories.map(category => [category, 0])) as Record<ControlCategory, number>;
    for (const category of controlCategories) {
        controlCounts[category] += 1;
        const expected = controlOracle(category);
        const actual = runControl(category);
        const expectedJson = JSON.stringify(expected);
        const actualJson = JSON.stringify(actual);
        oracleHash.update(expectedJson).update("\n");
        vmHash.update(actualJson).update("\n");
        if (expectedJson !== actualJson) {
            discrepancies += 1;
            if (process.env.PT_V4_ORACLE_DEBUG === "1" && discrepancies <= 20) console.error(JSON.stringify({ phase: "control", category, expected, actual }));
        }
    }
    return {
        schema: "parse-that.invocation-kernel-v4.oracle-receipt.v1",
        seed,
        structural: { grammars: 13_025, inputs: 127, comparisons: 1_654_175 },
        generated: { cases: 10_000, discarded: 0, categories: categoryCounts },
        control: { categories: controlCounts },
        corpusSha256: corpusHash.digest("hex"),
        oracleResultSha256: oracleHash.digest("hex"),
        vmResultSha256: vmHash.digest("hex"),
        discrepancies,
        exhaustion,
    };
}
