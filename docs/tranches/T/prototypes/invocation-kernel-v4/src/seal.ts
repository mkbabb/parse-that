import {
    Effect,
    childNodes,
    idNumber,
    nodeId,
    ruleId,
    type DraftGrammar,
    type DraftNode,
    type NodeId,
    type RuleId,
    type SealedGraph,
    type SealedRule,
    type SealedScc,
} from "./model.js";

interface Analysis {
    readonly nullable: boolean;
    readonly minimum: number | null;
}

function ruleDependencies(nodes: readonly DraftNode[], body: number): {
    readonly dependencies: readonly RuleId[];
    readonly intrinsic: Effect;
} {
    const dependencies = new Set<RuleId>();
    const seen = new Set<number>();
    const pending = [body];
    let intrinsic = Effect.None;
    while (pending.length > 0) {
        const current = pending.pop();
        if (current === undefined || seen.has(current)) continue;
        seen.add(current);
        const node = nodes[current];
        if (!node) throw new TypeError(`Missing node ${current}`);
        if (node.kind === "call") {
            dependencies.add(node.rule);
            continue;
        }
        if (node.kind === "commit") intrinsic |= Effect.Cut;
        if (node.kind === "recover") intrinsic |= Effect.Diagnostic | Effect.Recover;
        for (const child of childNodes(node)) pending.push(idNumber(child));
    }
    return {
        dependencies: [...dependencies].sort((left, right) => idNumber(left) - idNumber(right)),
        intrinsic,
    };
}

function stronglyConnected(edges: readonly (readonly RuleId[])[]): readonly (readonly RuleId[])[] {
    const visited = new Uint8Array(edges.length);
    const order: number[] = [];
    for (let root = 0; root < edges.length; root += 1) {
        if (visited[root]) continue;
        visited[root] = 1;
        const stack: { vertex: number; next: number }[] = [{ vertex: root, next: 0 }];
        while (stack.length > 0) {
            const frame = stack.at(-1);
            if (!frame) throw new Error("SCC traversal underflow");
            const targets = edges[frame.vertex] ?? [];
            const target = targets[frame.next];
            if (target !== undefined) {
                frame.next += 1;
                const index = idNumber(target);
                if (!visited[index]) {
                    visited[index] = 1;
                    stack.push({ vertex: index, next: 0 });
                }
                continue;
            }
            stack.pop();
            order.push(frame.vertex);
        }
    }

    const reverse = edges.map(() => [] as RuleId[]);
    edges.forEach((targets, source) => {
        for (const target of targets) reverse[idNumber(target)]?.push(ruleId(source));
    });
    const assigned = new Uint8Array(edges.length);
    const components: RuleId[][] = [];
    for (let cursor = order.length - 1; cursor >= 0; cursor -= 1) {
        const root = order[cursor];
        if (root === undefined || assigned[root]) continue;
        assigned[root] = 1;
        const component: RuleId[] = [];
        const pending = [root];
        while (pending.length > 0) {
            const current = pending.pop();
            if (current === undefined) continue;
            component.push(ruleId(current));
            for (const source of reverse[current] ?? []) {
                const index = idNumber(source);
                if (!assigned[index]) {
                    assigned[index] = 1;
                    pending.push(index);
                }
            }
        }
        component.sort((left, right) => idNumber(left) - idNumber(right));
        components.push(component);
    }
    return components.sort((left, right) => idNumber(left[0] ?? ruleId(0)) - idNumber(right[0] ?? ruleId(0)));
}

function analyzeBody(
    nodes: readonly DraftNode[],
    root: number,
    ruleAnalysis: readonly Analysis[],
): Analysis {
    const values = new Map<number, Analysis>();
    const stack: { node: number; expanded: boolean }[] = [{ node: root, expanded: false }];
    while (stack.length > 0) {
        const frame = stack.pop();
        if (!frame || values.has(frame.node)) continue;
        const node = nodes[frame.node];
        if (!node) throw new TypeError(`Missing node ${frame.node}`);
        if (!frame.expanded) {
            stack.push({ node: frame.node, expanded: true });
            const children = childNodes(node);
            for (let index = children.length - 1; index >= 0; index -= 1) {
                const child = children[index];
                if (child !== undefined && !values.has(idNumber(child))) {
                    stack.push({ node: idNumber(child), expanded: false });
                }
            }
            continue;
        }
        const child = (id: number): Analysis => values.get(id) ?? { nullable: false, minimum: null };
        let value: Analysis;
        switch (node.kind) {
            case "epsilon":
            case "recover":
            case "many":
                value = { nullable: true, minimum: 0 };
                break;
            case "literal":
                value = { nullable: node.text.length === 0, minimum: node.text.length };
                break;
            case "call":
                value = ruleAnalysis[idNumber(node.rule)] ?? { nullable: false, minimum: null };
                break;
            case "map":
            case "commit":
            case "memo":
                value = child(idNumber(node.child));
                break;
            case "sequence": {
                let minimum = 0;
                let productive = true;
                let nullable = true;
                for (const id of node.children) {
                    const part = child(idNumber(id));
                    nullable &&= part.nullable;
                    if (part.minimum === null) productive = false;
                    else minimum += part.minimum;
                }
                value = { nullable: productive && nullable, minimum: productive ? minimum : null };
                break;
            }
            case "choice": {
                let minimum: number | null = null;
                let nullable = false;
                for (const id of node.children) {
                    const part = child(idNumber(id));
                    nullable ||= part.nullable;
                    if (part.minimum !== null) minimum = minimum === null ? part.minimum : Math.min(minimum, part.minimum);
                }
                value = { nullable, minimum };
                break;
            }
        }
        values.set(frame.node, value);
    }
    return values.get(root) ?? { nullable: false, minimum: null };
}

function rightGuarded(
    nodes: readonly DraftNode[],
    bodies: readonly number[],
    members: ReadonlySet<number>,
    nodeMinimum: readonly (number | null)[],
): boolean {
    for (const body of bodies) {
        const pending: { node: number; positive: boolean }[] = [{ node: body, positive: false }];
        const seen = new Set<number>();
        while (pending.length > 0) {
            const state = pending.pop();
            if (!state) continue;
            const key = state.node * 2 + (state.positive ? 1 : 0);
            if (seen.has(key)) continue;
            seen.add(key);
            const node = nodes[state.node];
            if (!node) return false;
            if (node.kind === "call") {
                if (members.has(idNumber(node.rule)) && !state.positive) return false;
                continue;
            }
            if (node.kind === "sequence") {
                let positive = state.positive;
                for (const child of node.children) {
                    pending.push({ node: idNumber(child), positive });
                    const minimum = nodeMinimum[idNumber(child)];
                    if (minimum !== undefined && minimum !== null && minimum > 0) positive = true;
                }
                continue;
            }
            for (const child of childNodes(node)) {
                pending.push({ node: idNumber(child), positive: state.positive });
            }
        }
    }
    return true;
}

function sanitizedNode(node: DraftNode): object {
    switch (node.kind) {
        case "epsilon":
            return { id: idNumber(node.id), kind: node.kind, value: "<borrowed-value>" };
        case "map":
            return { id: idNumber(node.id), kind: node.kind, child: idNumber(node.child), callback: "<callback>" };
        case "recover":
            return { id: idNumber(node.id), kind: node.kind, child: idNumber(node.child), fallback: "<borrowed-value>" };
        case "sequence":
        case "choice":
            return { id: idNumber(node.id), kind: node.kind, children: node.children.map(idNumber) };
        case "literal":
            return { id: idNumber(node.id), kind: node.kind, text: node.text };
        case "call":
            return { id: idNumber(node.id), kind: node.kind, rule: idNumber(node.rule) };
        case "memo":
            return { id: idNumber(node.id), kind: node.kind, child: idNumber(node.child), policy: node.policy };
        case "many":
        case "commit":
            return { id: idNumber(node.id), kind: node.kind, child: idNumber(node.child) };
    }
}

export function sealGrammar(draft: DraftGrammar): SealedGraph {
    for (const rule of draft.rules) {
        if (rule.body === undefined) throw new TypeError(`Dangling rule: ${rule.name}`);
    }

    const reachableNodes = new Set<number>();
    const reachableRules = new Set<number>();
    const pendingNodes = [idNumber(draft.root)];
    while (pendingNodes.length > 0) {
        const current = pendingNodes.pop();
        if (current === undefined || reachableNodes.has(current)) continue;
        reachableNodes.add(current);
        const node = draft.nodes[current];
        if (!node) throw new TypeError(`Missing node ${current}`);
        if (node.kind === "call") {
            const rule = draft.rules[idNumber(node.rule)];
            if (!rule || rule.body === undefined) throw new TypeError(`Missing rule ${idNumber(node.rule)}`);
            reachableRules.add(idNumber(node.rule));
            pendingNodes.push(idNumber(rule.body));
        } else {
            for (const child of childNodes(node)) pendingNodes.push(idNumber(child));
        }
    }

    const reductions = draft.rules.map(rule => ruleDependencies(draft.nodes, idNumber(rule.body as NodeId)));
    const dependencies = reductions.map(item => item.dependencies);
    const reverse = dependencies.map(() => [] as RuleId[]);
    dependencies.forEach((targets, source) => {
        for (const target of targets) reverse[idNumber(target)]?.push(ruleId(source));
    });
    reverse.forEach(row => row.sort((left, right) => idNumber(left) - idNumber(right)));

    const components = stronglyConnected(dependencies);
    const sccOf = new Int32Array(draft.rules.length).fill(-1);
    components.forEach((members, scc) => members.forEach(member => (sccOf[idNumber(member)] = scc)));
    const recursive = draft.rules.map((rule, index) => {
        const members = components[sccOf[index] ?? -1] ?? [];
        return members.length > 1 || (dependencies[index] ?? []).some(target => target === rule.id);
    });

    const ruleEffects = reductions.map(item => item.intrinsic | (item.dependencies.length > 0 ? Effect.RuleDependent : Effect.None));
    const effectQueue = draft.rules.map((_, index) => index);
    const effectQueued = new Uint8Array(draft.rules.length).fill(1);
    while (effectQueue.length > 0) {
        const index = effectQueue.pop();
        if (index === undefined) continue;
        effectQueued[index] = 0;
        let effect = reductions[index]?.intrinsic ?? Effect.None;
        const targets = dependencies[index] ?? [];
        if (targets.length > 0) effect |= Effect.RuleDependent;
        for (const target of targets) effect |= ruleEffects[idNumber(target)] ?? Effect.None;
        if (effect === ruleEffects[index]) continue;
        ruleEffects[index] = effect;
        for (const source of reverse[index] ?? []) {
            const sourceIndex = idNumber(source);
            if (!effectQueued[sourceIndex]) {
                effectQueued[sourceIndex] = 1;
                effectQueue.push(sourceIndex);
            }
        }
    }

    const ruleAnalysis: Analysis[] = draft.rules.map(() => ({ nullable: false, minimum: null }));
    const analysisQueue = draft.rules.map((_, index) => index);
    const analysisQueued = new Uint8Array(draft.rules.length).fill(1);
    while (analysisQueue.length > 0) {
        const index = analysisQueue.pop();
        if (index === undefined) continue;
        analysisQueued[index] = 0;
        const body = draft.rules[index]?.body;
        if (body === undefined) throw new TypeError(`Missing rule body ${index}`);
        const next = analyzeBody(draft.nodes, idNumber(body), ruleAnalysis);
        const previous = ruleAnalysis[index] as Analysis;
        if (next.nullable === previous.nullable && next.minimum === previous.minimum) continue;
        ruleAnalysis[index] = next;
        for (const source of reverse[index] ?? []) {
            const sourceIndex = idNumber(source);
            if (!analysisQueued[sourceIndex]) {
                analysisQueued[sourceIndex] = 1;
                analysisQueue.push(sourceIndex);
            }
        }
    }

    const nodeEffects: Effect[] = [];
    const nodeNullable: boolean[] = [];
    const nodeMinimum: (number | null)[] = [];
    for (const node of draft.nodes) {
        let effect = Effect.None;
        if (node.kind === "commit") effect |= Effect.Cut;
        if (node.kind === "recover") effect |= Effect.Diagnostic | Effect.Recover;
        if (node.kind === "call") effect |= Effect.RuleDependent | (ruleEffects[idNumber(node.rule)] ?? Effect.None);
        for (const child of childNodes(node)) effect |= nodeEffects[idNumber(child)] ?? Effect.None;
        nodeEffects[idNumber(node.id)] = effect;
        const child = (id: number): Analysis => ({
            nullable: nodeNullable[id] ?? false,
            minimum: nodeMinimum[id] ?? null,
        });
        let analysis: Analysis;
        switch (node.kind) {
            case "epsilon":
            case "recover":
            case "many":
                analysis = { nullable: true, minimum: 0 };
                break;
            case "literal":
                analysis = { nullable: node.text.length === 0, minimum: node.text.length };
                break;
            case "call":
                analysis = ruleAnalysis[idNumber(node.rule)] ?? { nullable: false, minimum: null };
                break;
            case "map":
            case "commit":
            case "memo":
                analysis = child(idNumber(node.child));
                break;
            case "sequence": {
                let minimum = 0;
                let productive = true;
                let nullable = true;
                for (const id of node.children) {
                    const part = child(idNumber(id));
                    nullable &&= part.nullable;
                    if (part.minimum === null) productive = false;
                    else minimum += part.minimum;
                }
                analysis = { nullable: productive && nullable, minimum: productive ? minimum : null };
                break;
            }
            case "choice": {
                let minimum: number | null = null;
                let nullable = false;
                for (const id of node.children) {
                    const part = child(idNumber(id));
                    nullable ||= part.nullable;
                    if (part.minimum !== null) minimum = minimum === null ? part.minimum : Math.min(minimum, part.minimum);
                }
                analysis = { nullable, minimum };
                break;
            }
        }
        nodeNullable[idNumber(node.id)] = analysis.nullable;
        nodeMinimum[idNumber(node.id)] = analysis.minimum;
    }

    draft.nodes.forEach(node => {
        if (node.kind !== "memo") return;
        const effect = nodeEffects[idNumber(node.child)] ?? Effect.None;
        if ((effect & Effect.RuleDependent) !== 0) throw new TypeError("memo rejects transitive rule dependency");
        if ((effect & Effect.Cut) !== 0) throw new TypeError("memo rejects transitive cut effect");
        if ((effect & (Effect.Diagnostic | Effect.Recover)) !== 0 && node.policy !== "replay") {
            throw new TypeError('diagnostic memo requires { effects: "replay" }');
        }
    });
    draft.rules.forEach((rule, index) => {
        if (recursive[index] && ((ruleEffects[index] ?? Effect.None) & Effect.Cut) !== 0) {
            throw new TypeError(`Recursive cut effect is forbidden: ${rule.name}`);
        }
    });

    const sealedSccs: SealedScc[] = components.map((members, id) => {
        const set = new Set(members.map(idNumber));
        const bodies = members.map(member => idNumber(draft.rules[idNumber(member)]?.body as NodeId));
        return Object.freeze({
            id,
            rules: Object.freeze([...members]),
            rightGuarded: rightGuarded(draft.nodes, bodies, set, nodeMinimum),
        });
    });
    const sealedRules: SealedRule[] = draft.rules.map((rule, index) => Object.freeze({
        id: rule.id,
        name: rule.name,
        callNode: rule.callNode,
        body: rule.body as NodeId,
        dependencies: Object.freeze([...(dependencies[index] ?? [])]),
        reverseDependencies: Object.freeze([...(reverse[index] ?? [])]),
        scc: sccOf[index] ?? -1,
        recursive: recursive[index] ?? false,
        effects: ruleEffects[index] ?? Effect.None,
        nullable: ruleAnalysis[index]?.nullable ?? false,
        minimumGuaranteedConsumption: ruleAnalysis[index]?.minimum ?? null,
    }));
    const frozenNodes = draft.nodes.map(node => {
        if (node.kind === "sequence" || node.kind === "choice") {
            return Object.freeze({ ...node, children: Object.freeze([...node.children]) });
        }
        return Object.freeze({ ...node });
    });
    const inspection = JSON.stringify({
        root: idNumber(draft.root),
        nodes: frozenNodes.map(sanitizedNode),
        rules: sealedRules.map(rule => ({
            id: idNumber(rule.id),
            name: rule.name,
            callNode: idNumber(rule.callNode),
            body: idNumber(rule.body),
            dependencies: rule.dependencies.map(idNumber),
            reverseDependencies: rule.reverseDependencies.map(idNumber),
            scc: rule.scc,
            recursive: rule.recursive,
            effects: rule.effects,
            nullable: rule.nullable,
            minimumGuaranteedConsumption: rule.minimumGuaranteedConsumption,
        })),
        sccs: sealedSccs.map(scc => ({ id: scc.id, rules: scc.rules.map(idNumber), rightGuarded: scc.rightGuarded })),
        reachableNodes: [...reachableNodes].sort((left, right) => left - right),
        reachableRules: [...reachableRules].sort((left, right) => left - right),
    });
    return Object.freeze({
        nodes: Object.freeze(frozenNodes),
        rules: Object.freeze(sealedRules),
        sccs: Object.freeze(sealedSccs),
        nodeEffects: Object.freeze(nodeEffects),
        nodeNullable: Object.freeze(nodeNullable),
        nodeMinimumGuaranteedConsumption: Object.freeze(nodeMinimum),
        reachableNodes: Object.freeze([...reachableNodes].sort((left, right) => left - right).map(nodeId)),
        reachableRules: Object.freeze([...reachableRules].sort((left, right) => left - right).map(ruleId)),
        inspection,
    });
}
