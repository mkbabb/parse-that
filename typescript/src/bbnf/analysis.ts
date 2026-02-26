import type { AST, Expression } from "./types.js";

/**
 * Recursively collect all nonterminal references from an expression.
 */
export function collectDependencies(expr: Expression, deps: Set<string>): void {
    if (!expr?.type) return;
    if (expr.type === "nonterminal") {
        deps.add(expr.value as string);
        return;
    }
    if (expr.value instanceof Array) {
        for (const child of expr.value) {
            collectDependencies(child as Expression, deps);
        }
    } else if (
        expr.value &&
        typeof expr.value === "object" &&
        "type" in (expr.value as object)
    ) {
        collectDependencies(expr.value as Expression, deps);
    }
}

/**
 * Build forward and reverse dependency graphs for the entire AST.
 */
export function buildDepGraphs(ast: AST) {
    const depGraph = new Map<string, Set<string>>();
    const rdepGraph = new Map<string, Set<string>>();

    for (const [name] of ast) {
        depGraph.set(name, new Set());
        rdepGraph.set(name, new Set());
    }

    for (const [name, rule] of ast) {
        const deps = new Set<string>();
        collectDependencies(rule.expression, deps);
        depGraph.set(name, deps);
        for (const dep of deps) {
            if (!rdepGraph.has(dep)) rdepGraph.set(dep, new Set());
            rdepGraph.get(dep)!.add(name);
        }
    }

    return { depGraph, rdepGraph };
}

export interface SCCResult {
    sccs: string[][];
    sccIndex: Map<string, number>;
    cyclicRules: Set<string>;
}

/**
 * Tarjan's SCC algorithm. Returns SCCs in reverse topological order
 * (leaf SCCs first — the order we want for bottom-up construction).
 */
export function tarjanSCC(depGraph: Map<string, Set<string>>): SCCResult {
    let index = 0;
    const stack: string[] = [];
    const onStack = new Set<string>();
    const indices = new Map<string, number>();
    const lowlinks = new Map<string, number>();
    const sccs: string[][] = [];

    function strongconnect(v: string) {
        indices.set(v, index);
        lowlinks.set(v, index);
        index++;
        stack.push(v);
        onStack.add(v);

        for (const w of depGraph.get(v) ?? []) {
            if (!depGraph.has(w)) continue; // skip external refs
            if (!indices.has(w)) {
                strongconnect(w);
                lowlinks.set(
                    v,
                    Math.min(lowlinks.get(v)!, lowlinks.get(w)!),
                );
            } else if (onStack.has(w)) {
                lowlinks.set(
                    v,
                    Math.min(lowlinks.get(v)!, indices.get(w)!),
                );
            }
        }

        if (lowlinks.get(v) === indices.get(v)) {
            const scc: string[] = [];
            let w: string;
            do {
                w = stack.pop()!;
                onStack.delete(w);
                scc.push(w);
            } while (w !== v);
            sccs.push(scc);
        }
    }

    for (const v of depGraph.keys()) {
        if (!indices.has(v)) strongconnect(v);
    }

    // Build sccIndex and cyclicRules
    const sccIndex = new Map<string, number>();
    const cyclicRules = new Set<string>();

    for (let i = 0; i < sccs.length; i++) {
        const scc = sccs[i];
        for (const name of scc) {
            sccIndex.set(name, i);
        }
        if (scc.length > 1) {
            for (const name of scc) cyclicRules.add(name);
        } else {
            // Self-referencing single-node SCC
            const name = scc[0];
            if (depGraph.get(name)?.has(name)) {
                cyclicRules.add(name);
            }
        }
    }

    return { sccs, sccIndex, cyclicRules };
}

/**
 * Count how many times each nonterminal is referenced across the AST.
 */
export function computeRefCounts(ast: AST): Map<string, number> {
    const counts = new Map<string, number>();
    for (const [name] of ast) counts.set(name, 0);

    for (const [, rule] of ast) {
        const deps = new Set<string>();
        collectDependencies(rule.expression, deps);
        for (const dep of deps) {
            counts.set(dep, (counts.get(dep) ?? 0) + 1);
        }
    }
    return counts;
}

export interface AnalysisCache {
    depGraph: Map<string, Set<string>>;
    rdepGraph: Map<string, Set<string>>;
    sccs: string[][];
    sccIndex: Map<string, number>;
    cyclicRules: Set<string>;
    topoOrder: string[];
    refCounts: Map<string, number>;
}

/**
 * Full grammar analysis: dep graphs, Tarjan's SCC, topological order, ref counts.
 */
export function analyzeGrammar(ast: AST): AnalysisCache {
    const { depGraph, rdepGraph } = buildDepGraphs(ast);
    const { sccs, sccIndex, cyclicRules } = tarjanSCC(depGraph);

    // Tarjan's yields SCCs in reverse topological order (leaves first).
    // Flatten to get rule-level topological order.
    const topoOrder: string[] = [];
    for (const scc of sccs) {
        for (const name of scc) {
            topoOrder.push(name);
        }
    }

    const refCounts = computeRefCounts(ast);

    return {
        depGraph,
        rdepGraph,
        sccs,
        sccIndex,
        cyclicRules,
        topoOrder,
        refCounts,
    };
}
