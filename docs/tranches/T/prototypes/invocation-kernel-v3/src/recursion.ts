import type { SealedGraph } from "./graph.js";

function minimumConsumption(
    graph: SealedGraph,
    nodeId: number,
    visiting = new Set<number>(),
): number {
    if (visiting.has(nodeId)) return 0;
    visiting.add(nodeId);
    const node = graph.nodes[nodeId];
    if (!node) return 0;
    switch (node.kind) {
        case "epsilon":
        case "call":
            return 0;
        case "literal":
            return node.text.length;
        case "map":
        case "commit":
        case "recover":
        case "memo":
            return minimumConsumption(graph, node.child, visiting);
        case "many":
            return 0;
        case "sequence":
            return node.children.reduce(
                (sum, child) =>
                    sum + minimumConsumption(graph, child, new Set(visiting)),
                0,
            );
        case "choice":
            return Math.min(
                ...node.children.map(child =>
                    minimumConsumption(graph, child, new Set(visiting)),
                ),
            );
    }
}

/**
 * Conservative proof that every intra-SCC call is reached after guaranteed
 * consumption in its defining rule. False selects simultaneous generations;
 * true permits the dependency worklist used by deep right recursion.
 */
export function isRightGuarded(graph: SealedGraph, scc: number): boolean {
    const members = new Set(graph.sccs[scc] ?? []);
    const walk = (nodeId: number, prefix: number, visiting: Set<number>): boolean => {
        if (visiting.has(nodeId)) return true;
        const node = graph.nodes[nodeId];
        if (!node) return false;
        const nextVisiting = new Set(visiting).add(nodeId);
        switch (node.kind) {
            case "call":
                return !members.has(node.rule) || prefix > 0;
            case "sequence": {
                let consumed = prefix;
                for (const child of node.children) {
                    if (!walk(child, consumed, nextVisiting)) return false;
                    consumed += minimumConsumption(graph, child);
                }
                return true;
            }
            case "choice":
                return node.children.every(child => walk(child, prefix, nextVisiting));
            case "map":
            case "many":
            case "commit":
            case "recover":
            case "memo":
                return walk(node.child, prefix, nextVisiting);
            case "epsilon":
            case "literal":
                return true;
        }
    };
    return [...members].every(rule => {
        const body = graph.rules[rule]?.body;
        return body !== undefined && walk(body, 0, new Set());
    });
}
