import type { Ast, ControlCategory } from "./model.js";

export const seed = 0x5eed_c0de;

export function structuralNodes(ast: Ast): number {
    return ast.kind === "sequence" || ast.kind === "choice" ? 1 + structuralNodes(ast.left) + structuralNodes(ast.right) : 1;
}

export function canonicalBodies(maxNodes: number): readonly Ast[] {
    const bySize = new Map<number, Ast[]>();
    bySize.set(1, [
        { kind: "epsilon" }, { kind: "literal", text: "a" }, { kind: "literal", text: "b" },
        { kind: "reference", rule: 0 }, { kind: "reference", rule: 1 },
    ]);
    for (let size = 2; size <= maxNodes; size += 1) {
        const bodies: Ast[] = [];
        for (let leftSize = 1; leftSize < size - 1; leftSize += 1) {
            const rightSize = size - 1 - leftSize;
            for (const left of bySize.get(leftSize) ?? []) for (const right of bySize.get(rightSize) ?? []) {
                bodies.push({ kind: "sequence", left, right }, { kind: "choice", left, right });
            }
        }
        bySize.set(size, bodies);
    }
    return [...bySize].filter(([size]) => size <= maxNodes).flatMap(([, bodies]) => bodies);
}

export function structuralGrammars(): readonly (readonly Ast[])[] {
    const bodies = canonicalBodies(6);
    const grammars: Ast[][] = [];
    for (const first of bodies) for (const second of bodies) {
        if (structuralNodes(first) + structuralNodes(second) <= 6) grammars.push([first, second]);
    }
    return grammars;
}

export function binaryInputs(maxLength: number): readonly string[] {
    const inputs: string[] = [];
    for (let length = 0; length <= maxLength; length += 1) {
        for (let bits = 0; bits < 2 ** length; bits += 1) {
            let input = "";
            for (let index = length - 1; index >= 0; index -= 1) input += (bits & (1 << index)) === 0 ? "a" : "b";
            inputs.push(input);
        }
    }
    return inputs;
}

function prng(initial: number): () => number {
    let state = initial >>> 0;
    return () => {
        state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
        return state / 0x1_0000_0000;
    };
}

function randomAst(next: () => number, budget: number, rules: number): Ast {
    if (budget < 3 || next() < 0.42) {
        const atom = Math.floor(next() * (3 + rules));
        if (atom === 0) return { kind: "epsilon" };
        if (atom === 1) return { kind: "literal", text: "a" };
        if (atom === 2) return { kind: "literal", text: "b" };
        return { kind: "reference", rule: (atom - 3) % rules };
    }
    const leftBudget = 1 + Math.floor(next() * (budget - 2));
    const rightBudget = Math.max(1, budget - 1 - leftBudget);
    const left = randomAst(next, leftBudget, rules);
    const right = randomAst(next, rightBudget, rules);
    return next() < 0.5 ? { kind: "sequence", left, right } : { kind: "choice", left, right };
}

export type GeneratedCategory = "direct" | "indirect" | "mutual" | "nullable" | "lateAdmitted" | "productive" | "unproductive";
export interface GeneratedCase { readonly rules: readonly Ast[]; readonly input: string; readonly categories: readonly GeneratedCategory[]; }

export function generatedCases(count: number): readonly GeneratedCase[] {
    const next = prng(seed);
    const ref = (rule: number): Ast => ({ kind: "reference", rule });
    const a: Ast = { kind: "literal", text: "a" };
    const epsilon: Ast = { kind: "epsilon" };
    const fixtures: GeneratedCase[] = [
        { rules: [{ kind: "choice", left: { kind: "sequence", left: ref(0), right: a }, right: a }], input: "aa", categories: ["direct"] },
        { rules: [ref(1), { kind: "choice", left: { kind: "sequence", left: ref(0), right: a }, right: a }], input: "aa", categories: ["indirect"] },
        { rules: [{ kind: "choice", left: ref(1), right: a }, { kind: "choice", left: ref(0), right: { kind: "literal", text: "b" } }], input: "a", categories: ["mutual"] },
        { rules: [{ kind: "choice", left: { kind: "sequence", left: ref(0), right: a }, right: epsilon }], input: "aa", categories: ["nullable"] },
        { rules: [{ kind: "choice", left: { kind: "sequence", left: ref(0), right: ref(1) }, right: epsilon }, a], input: "a", categories: ["lateAdmitted"] },
        { rules: [a], input: "a", categories: ["productive"] },
        { rules: [ref(0)], input: "", categories: ["unproductive"] },
    ];
    const cases: GeneratedCase[] = fixtures.slice(0, count);
    for (let index = cases.length; index < count; index += 1) {
        const ruleCount = 1 + Math.floor(next() * 3);
        const rules = Array.from({ length: ruleCount }, () => randomAst(next, 12, ruleCount));
        const length = Math.floor(next() * 13);
        let input = "";
        for (let offset = 0; offset < length; offset += 1) input += next() < 0.5 ? "a" : "b";
        cases.push({ rules, input, categories: [] });
    }
    return cases;
}

export const controlCategories: readonly ControlCategory[] = [
    "nestedCut", "siblingCut", "foreignCut", "cutThroughMany", "recovery", "recoveredCut",
    "memoRollback", "memoReplay", "resource", "callbackThrow", "staleToken", "conflictingToken",
];
