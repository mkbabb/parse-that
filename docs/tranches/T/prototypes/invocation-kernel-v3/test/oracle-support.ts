import type { GrammarBuilder, Parser, Rule } from "../src/index.js";

export type Ast =
    | { readonly kind: "epsilon" }
    | { readonly kind: "literal"; readonly text: "a" | "b" }
    | { readonly kind: "reference"; readonly rule: number }
    | { readonly kind: "sequence"; readonly left: Ast; readonly right: Ast }
    | { readonly kind: "choice"; readonly left: Ast; readonly right: Ast };

export type Value = null | "a" | "b" | readonly [Value, Value];

export type OracleAnswer =
    | { readonly kind: "success"; readonly offset: number; readonly value: Value }
    | { readonly kind: "failure"; readonly offset: number; readonly expected: readonly string[] };

function failed(offset: number, expected: readonly string[]): OracleAnswer {
    return { kind: "failure", offset, expected: [...new Set(expected)].sort() };
}

function merge(left: OracleAnswer, right: OracleAnswer): OracleAnswer {
    if (left.kind === "success") return left;
    if (right.kind === "success") return right;
    if (left.offset > right.offset) return left;
    if (right.offset > left.offset) return right;
    return failed(left.offset, [...left.expected, ...right.expected]);
}

function evaluate(
    ast: Ast,
    input: string,
    entry: number,
    previous: ReadonlyMap<string, OracleAnswer>,
    rules: readonly Ast[],
    relation: ReadonlyMap<string, OracleAnswer>,
    sccOf: readonly number[],
    currentScc: number,
): OracleAnswer {
    switch (ast.kind) {
        case "epsilon":
            return { kind: "success", offset: entry, value: null };
        case "literal":
            return input.startsWith(ast.text, entry)
                ? { kind: "success", offset: entry + 1, value: ast.text }
                : failed(entry, [JSON.stringify(ast.text)]);
        case "reference":
            return (sccOf[ast.rule] === currentScc ? previous : relation).get(
                `${ast.rule}@${entry}`,
            ) ?? failed(entry, []);
        case "sequence": {
            const left = evaluate(
                ast.left,
                input,
                entry,
                previous,
                rules,
                relation,
                sccOf,
                currentScc,
            );
            if (left.kind === "failure") return left;
            const right = evaluate(
                ast.right,
                input,
                left.offset,
                previous,
                rules,
                relation,
                sccOf,
                currentScc,
            );
            if (right.kind === "failure") return right;
            return {
                kind: "success",
                offset: right.offset,
                value: [left.value, right.value],
            };
        }
        case "choice": {
            const left = evaluate(
                ast.left,
                input,
                entry,
                previous,
                rules,
                relation,
                sccOf,
                currentScc,
            );
            if (left.kind === "success") return left;
            const right = evaluate(
                ast.right,
                input,
                entry,
                previous,
                rules,
                relation,
                sccOf,
                currentScc,
            );
            return right.kind === "success" ? right : merge(left, right);
        }
    }
}

function improve(previous: OracleAnswer, candidate: OracleAnswer): OracleAnswer {
    if (candidate.kind === "success") {
        if (previous.kind === "failure" || candidate.offset > previous.offset) return candidate;
        return previous;
    }
    if (previous.kind === "success") return previous;
    if (candidate.offset > previous.offset) return candidate;
    if (candidate.offset < previous.offset) return previous;
    return failed(candidate.offset, [...previous.expected, ...candidate.expected]);
}

/**
 * Independent finite relation oracle. It imports no VM, graph, SCC, journal, or
 * memo implementation and advances every rule/offset from the previous
 * simultaneous generation only.
 */
export function oracle(rules: readonly Ast[], input: string): OracleAnswer {
    const dependencies = rules.map(body => {
        const found = new Set<number>();
        const pending = [body];
        while (pending.length > 0) {
            const node = pending.pop();
            if (!node) continue;
            if (node.kind === "reference") found.add(node.rule);
            else if (node.kind === "sequence" || node.kind === "choice") {
                pending.push(node.left, node.right);
            }
        }
        return [...found];
    });
    const reachable = dependencies.map((_, root) => {
        const seen = new Set<number>();
        const pending = [...(dependencies[root] ?? [])];
        while (pending.length > 0) {
            const target = pending.pop();
            if (target === undefined || seen.has(target)) continue;
            seen.add(target);
            pending.push(...(dependencies[target] ?? []));
        }
        return seen;
    });
    const sccs: number[][] = [];
    const sccOf = Array<number>(rules.length).fill(-1);
    for (let rule = 0; rule < rules.length; rule += 1) {
        if ((sccOf[rule] ?? -1) >= 0) continue;
        const component = rules
            .map((_, candidate) => candidate)
            .filter(candidate =>
                candidate === rule ||
                (reachable[rule]?.has(candidate) && reachable[candidate]?.has(rule)),
            );
        const scc = sccs.length;
        component.forEach(member => (sccOf[member] = scc));
        sccs.push(component);
    }
    const relation = new Map<string, OracleAnswer>();
    for (let rule = 0; rule < rules.length; rule += 1) {
        for (let entry = 0; entry <= input.length; entry += 1) {
            relation.set(`${rule}@${entry}`, failed(entry, []));
        }
    }
    const solved = new Set<number>();
    const solving = new Set<number>();
    const solve = (scc: number): void => {
        if (solved.has(scc)) return;
        if (solving.has(scc)) throw new Error("Oracle SCC condensation cycle");
        solving.add(scc);
        const members = sccs[scc] ?? [];
        const dependencySccs = new Set<number>();
        for (const member of members) {
            for (const dependency of dependencies[member] ?? []) {
                const target = sccOf[dependency] as number;
                if (target !== scc) dependencySccs.add(target);
            }
        }
        for (const dependency of dependencySccs) solve(dependency);

        const isRecursive =
            members.length > 1 ||
            (members.length === 1 && (dependencies[members[0] as number] ?? []).includes(members[0] as number));
        const limit = Math.max(32, members.length * (input.length + 1) ** 2 * 4);
        for (let generation = 0; generation < limit; generation += 1) {
            const previous = new Map(
                [...relation].filter(([key]) => members.includes(Number(key.split("@")[0]))),
            );
            const improvements: [string, OracleAnswer][] = [];
            for (const member of members) {
                const body = rules[member];
                if (!body) throw new Error(`Oracle missing rule ${member}`);
                for (let entry = 0; entry <= input.length; entry += 1) {
                    const key = `${member}@${entry}`;
                    const before = relation.get(key) as OracleAnswer;
                    const candidate = evaluate(
                        body,
                        input,
                        entry,
                        previous,
                        rules,
                        relation,
                        sccOf,
                        scc,
                    );
                    const after = isRecursive ? improve(before, candidate) : candidate;
                    if (JSON.stringify(before) !== JSON.stringify(after)) improvements.push([key, after]);
                }
            }
            for (const [key, answer] of improvements) relation.set(key, answer);
            if (improvements.length === 0 || !isRecursive) {
                solved.add(scc);
                solving.delete(scc);
                return;
            }
        }
        throw new Error(`Oracle exhausted SCC ${scc} on ${input.length} code units`);
    };
    solve(sccOf[0] as number);
    const root = relation.get("0@0") as OracleAnswer;
    if (root.kind === "success" && root.offset !== input.length) {
        return failed(root.offset, ["<end-of-input>"]);
    }
    return root;
}

function widen<T>(parser: Parser<T>): Parser<Value> {
    return parser as unknown as Parser<Value>;
}

export function compile(
    grammar: GrammarBuilder,
    ast: Ast,
    rules: readonly Rule<Value>[],
): Parser<Value> {
    switch (ast.kind) {
        case "epsilon":
            return widen(grammar.succeed(null));
        case "literal":
            return widen(grammar.literal(ast.text));
        case "reference": {
            const rule = rules[ast.rule];
            if (!rule) throw new Error(`Compiler missing rule ${ast.rule}`);
            return rule;
        }
        case "sequence":
            return widen(grammar.sequence(compile(grammar, ast.left, rules), compile(grammar, ast.right, rules)));
        case "choice":
            return grammar.choice(compile(grammar, ast.left, rules), compile(grammar, ast.right, rules));
    }
}

export function structuralNodes(ast: Ast): number {
    switch (ast.kind) {
        case "epsilon":
        case "literal":
        case "reference":
            return 1;
        case "sequence":
        case "choice":
            return 1 + structuralNodes(ast.left) + structuralNodes(ast.right);
    }
}

export function canonicalBodies(maxNodes: number): readonly Ast[] {
    const bySize = new Map<number, Ast[]>();
    bySize.set(1, [
        { kind: "epsilon" },
        { kind: "literal", text: "a" },
        { kind: "literal", text: "b" },
        { kind: "reference", rule: 0 },
        { kind: "reference", rule: 1 },
    ]);
    for (let size = 2; size <= maxNodes; size += 1) {
        const bodies: Ast[] = [];
        for (let leftSize = 1; leftSize < size - 1; leftSize += 1) {
            const rightSize = size - 1 - leftSize;
            for (const left of bySize.get(leftSize) ?? []) {
                for (const right of bySize.get(rightSize) ?? []) {
                    bodies.push({ kind: "sequence", left, right });
                    bodies.push({ kind: "choice", left, right });
                }
            }
        }
        bySize.set(size, bodies);
    }
    return [...bySize]
        .filter(([size]) => size <= maxNodes)
        .flatMap(([, bodies]) => bodies);
}

export function binaryInputs(maxLength: number): readonly string[] {
    const inputs: string[] = [];
    for (let length = 0; length <= maxLength; length += 1) {
        for (let bits = 0; bits < 2 ** length; bits += 1) {
            let input = "";
            for (let index = length - 1; index >= 0; index -= 1) {
                input += (bits & (1 << index)) === 0 ? "a" : "b";
            }
            inputs.push(input);
        }
    }
    return inputs;
}

export function randomAst(next: () => number, budget: number, rules: number): Ast {
    if (budget < 3 || next() < 0.42) {
        const atom = Math.floor(next() * (3 + rules));
        if (atom === 0) return { kind: "epsilon" };
        if (atom === 1) return { kind: "literal", text: "a" };
        if (atom === 2) return { kind: "literal", text: "b" };
        return { kind: "reference", rule: (atom - 3) % rules };
    }
    const leftBudget = 1 + Math.floor(next() * (budget - 2));
    const rightBudget = budget - 1 - leftBudget;
    const left = randomAst(next, leftBudget, rules);
    const right = randomAst(next, Math.max(1, rightBudget), rules);
    return next() < 0.5
        ? { kind: "sequence", left, right }
        : { kind: "choice", left, right };
}

export function prng(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
        return state / 0x1_0000_0000;
    };
}
