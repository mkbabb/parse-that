export var Effect;
(function (Effect) {
    Effect[Effect["None"] = 0] = "None";
    Effect[Effect["Diagnostic"] = 1] = "Diagnostic";
    Effect[Effect["Recover"] = 2] = "Recover";
    Effect[Effect["Cut"] = 4] = "Cut";
    Effect[Effect["RuleDependent"] = 8] = "RuleDependent";
})(Effect || (Effect = {}));
const bindings = new WeakMap();
function parserObject(binding) {
    const parser = Object.freeze(Object.create(null));
    bindings.set(parser, binding);
    return parser;
}
function ruleObject(binding) {
    const rule = Object.freeze(Object.create(null));
    bindings.set(rule, binding);
    return rule;
}
function children(node) {
    switch (node.kind) {
        case "sequence":
        case "choice":
            return node.children;
        case "map":
        case "many":
        case "commit":
        case "recover":
        case "memo":
            return [node.child];
        case "epsilon":
        case "literal":
        case "call":
            return [];
    }
}
function stableNode(node) {
    switch (node.kind) {
        case "epsilon":
            return { id: node.id, kind: node.kind, value: "<value>" };
        case "literal":
            return { id: node.id, kind: node.kind, text: node.text };
        case "sequence":
        case "choice":
            return { id: node.id, kind: node.kind, children: node.children };
        case "map":
            return { id: node.id, kind: node.kind, child: node.child, transform: "<callback>" };
        case "many":
        case "commit":
            return { id: node.id, kind: node.kind, child: node.child };
        case "recover":
            return { id: node.id, kind: node.kind, child: node.child, fallback: "<value>" };
        case "memo":
            return { id: node.id, kind: node.kind, child: node.child, policy: node.policy };
        case "call":
            return { id: node.id, kind: node.kind, rule: node.rule };
    }
}
function tarjan(edges) {
    const index = Array(edges.length).fill(-1);
    const low = Array(edges.length).fill(0);
    const active = Array(edges.length).fill(false);
    const stack = [];
    const components = [];
    let next = 0;
    const visit = (vertex) => {
        index[vertex] = next;
        low[vertex] = next;
        next += 1;
        stack.push(vertex);
        active[vertex] = true;
        for (const target of edges[vertex] ?? []) {
            if (index[target] === -1) {
                visit(target);
                low[vertex] = Math.min(low[vertex] ?? 0, low[target] ?? 0);
            }
            else if (active[target]) {
                low[vertex] = Math.min(low[vertex] ?? 0, index[target] ?? 0);
            }
        }
        if (low[vertex] !== index[vertex])
            return;
        const component = [];
        for (;;) {
            const member = stack.pop();
            if (member === undefined)
                throw new Error("Tarjan stack underflow");
            active[member] = false;
            component.push(member);
            if (member === vertex)
                break;
        }
        components.push(component.sort((left, right) => left - right));
    };
    for (let vertex = 0; vertex < edges.length; vertex += 1) {
        if (index[vertex] === -1)
            visit(vertex);
    }
    return components.sort((left, right) => (left[0] ?? 0) - (right[0] ?? 0));
}
export class GrammarBuilder {
    #nodes = [];
    #rules = [];
    #graph;
    #open() {
        if (this.#graph)
            throw new TypeError("The grammar graph is sealed");
    }
    #append(node) {
        this.#open();
        const id = this.#nodes.length;
        this.#nodes.push({ ...node, id });
        return parserObject({ builder: this, node: id });
    }
    #binding(parser) {
        const binding = bindings.get(parser);
        if (!binding || binding.builder !== this) {
            throw new TypeError("Parser did not originate from this builder");
        }
        return binding;
    }
    succeed(value) {
        return this.#append({ kind: "epsilon", value });
    }
    literal(text) {
        return this.#append({ kind: "literal", text });
    }
    map(parser, transform) {
        if (typeof transform !== "function")
            throw new TypeError("map requires a function");
        return this.#append({
            kind: "map",
            child: this.#binding(parser).node,
            transform: transform,
        });
    }
    sequence(...parsers) {
        return this.#append({
            kind: "sequence",
            children: Object.freeze(parsers.map(parser => this.#binding(parser).node)),
        });
    }
    choice(...parsers) {
        if (parsers.length === 0)
            throw new TypeError("choice requires an alternative");
        return this.#append({
            kind: "choice",
            children: Object.freeze(parsers.map(parser => this.#binding(parser).node)),
        });
    }
    many(parser) {
        return this.#append({ kind: "many", child: this.#binding(parser).node });
    }
    commit(parser) {
        return this.#append({ kind: "commit", child: this.#binding(parser).node });
    }
    recover(parser, fallback) {
        return this.#append({
            kind: "recover",
            child: this.#binding(parser).node,
            fallback,
        });
    }
    memo(parser, options = {}) {
        return this.#append({
            kind: "memo",
            child: this.#binding(parser).node,
            policy: options.effects ?? "reject",
        });
    }
    rule(name) {
        this.#open();
        if (!name)
            throw new TypeError("rule requires a name");
        if (this.#rules.some(rule => rule.name === name)) {
            throw new TypeError(`Duplicate rule name: ${name}`);
        }
        const id = this.#rules.length;
        const node = this.#nodes.length;
        this.#nodes.push({ id: node, kind: "call", rule: id });
        this.#rules.push({ id, name, callNode: node });
        return ruleObject({ builder: this, node, rule: id });
    }
    define(rule, body) {
        this.#open();
        const ruleBinding = this.#binding(rule);
        const bodyBinding = this.#binding(body);
        if (ruleBinding.rule === undefined)
            throw new TypeError("define requires a rule handle");
        const draft = this.#rules[ruleBinding.rule];
        if (!draft)
            throw new TypeError("Unknown rule");
        if (draft.body !== undefined)
            throw new TypeError(`Rule already defined: ${draft.name}`);
        draft.body = bodyBinding.node;
    }
    seal(root) {
        const rootBinding = this.#binding(root);
        if (this.#graph)
            return root;
        for (const rule of this.#rules) {
            if (rule.body === undefined)
                throw new TypeError(`Dangling rule: ${rule.name}`);
        }
        const dependencies = this.#rules.map(rule => {
            const found = new Set();
            const seen = new Set();
            const pending = [rule.body];
            while (pending.length > 0) {
                const nodeId = pending.pop();
                if (nodeId === undefined || seen.has(nodeId))
                    continue;
                seen.add(nodeId);
                const node = this.#nodes[nodeId];
                if (!node)
                    throw new TypeError(`Missing node ${nodeId}`);
                if (node.kind === "call")
                    found.add(node.rule);
                else
                    pending.push(...children(node));
            }
            return [...found].sort((left, right) => left - right);
        });
        const reverse = dependencies.map(() => []);
        dependencies.forEach((targets, source) => {
            for (const target of targets)
                reverse[target]?.push(source);
        });
        reverse.forEach(row => row.sort((left, right) => left - right));
        const sccs = tarjan(dependencies);
        const sccOf = Array(this.#rules.length).fill(-1);
        sccs.forEach((component, scc) => component.forEach(rule => (sccOf[rule] = scc)));
        const recursive = this.#rules.map((rule, id) => {
            const component = sccs[sccOf[id] ?? -1] ?? [];
            return component.length > 1 || (dependencies[id] ?? []).includes(rule.id);
        });
        const localEffect = (nodeId, ruleEffects, seen) => {
            if (seen.has(nodeId))
                return Effect.None;
            seen.add(nodeId);
            const node = this.#nodes[nodeId];
            if (!node)
                throw new TypeError(`Missing node ${nodeId}`);
            switch (node.kind) {
                case "epsilon":
                case "literal":
                    return Effect.None;
                case "call":
                    return Effect.RuleDependent | (ruleEffects[node.rule] ?? Effect.None);
                case "commit":
                    return Effect.Cut | localEffect(node.child, ruleEffects, seen);
                case "recover":
                    return (Effect.Diagnostic |
                        Effect.Recover |
                        localEffect(node.child, ruleEffects, seen));
                case "map":
                case "many":
                case "memo":
                    return localEffect(node.child, ruleEffects, seen);
                case "sequence":
                case "choice":
                    return node.children.reduce((all, child) => all | localEffect(child, ruleEffects, seen), Effect.None);
            }
        };
        const ruleEffects = Array(this.#rules.length).fill(Effect.None);
        for (;;) {
            let changed = false;
            this.#rules.forEach((rule, id) => {
                const effect = localEffect(rule.body, ruleEffects, new Set());
                if (effect !== ruleEffects[id]) {
                    ruleEffects[id] = effect;
                    changed = true;
                }
            });
            if (!changed)
                break;
        }
        const nodeEffects = this.#nodes.map(node => localEffect(node.id, ruleEffects, new Set()));
        this.#nodes.forEach(node => {
            if (node.kind !== "memo")
                return;
            const effect = nodeEffects[node.child] ?? Effect.None;
            if ((effect & Effect.RuleDependent) !== 0) {
                throw new TypeError("memo rejects transitive rule dependency");
            }
            if ((effect & Effect.Cut) !== 0) {
                throw new TypeError("memo rejects transitive cut effect");
            }
            if ((effect & (Effect.Diagnostic | Effect.Recover)) !== 0 &&
                node.policy !== "replay") {
                throw new TypeError('diagnostic memo requires { effects: "replay" }');
            }
        });
        this.#rules.forEach((rule, id) => {
            if (recursive[id] && ((ruleEffects[id] ?? Effect.None) & Effect.Cut) !== 0) {
                throw new TypeError(`Recursive cut effect is forbidden: ${rule.name}`);
            }
        });
        const frozenNodes = this.#nodes.map(node => {
            if (node.kind === "sequence" || node.kind === "choice") {
                return Object.freeze({ ...node, children: Object.freeze([...node.children]) });
            }
            return Object.freeze({ ...node });
        });
        const frozenSccs = Object.freeze(sccs.map(component => Object.freeze([...component])));
        const sealedRules = this.#rules.map((rule, id) => Object.freeze({
            id,
            name: rule.name,
            callNode: rule.callNode,
            body: rule.body,
            dependencies: Object.freeze([...(dependencies[id] ?? [])]),
            reverseDependencies: Object.freeze([...(reverse[id] ?? [])]),
            scc: sccOf[id] ?? -1,
            recursive: recursive[id] ?? false,
            effects: ruleEffects[id] ?? Effect.None,
        }));
        const graphJson = JSON.stringify({
            root: rootBinding.node,
            nodes: frozenNodes.map(stableNode),
            nodeEffects,
            rules: sealedRules.map(rule => ({
                id: rule.id,
                name: rule.name,
                callNode: rule.callNode,
                body: rule.body,
                dependencies: rule.dependencies,
                reverseDependencies: rule.reverseDependencies,
                scc: rule.scc,
                recursive: rule.recursive,
                effects: rule.effects,
            })),
            sccs: frozenSccs,
        });
        this.#graph = Object.freeze({
            nodes: Object.freeze(frozenNodes),
            rules: Object.freeze(sealedRules),
            nodeEffects: Object.freeze(nodeEffects),
            sccs: frozenSccs,
            graphJson,
        });
        return root;
    }
    /** Stable inspection surface for executable graph/effect proofs. */
    inspect() {
        if (!this.#graph)
            throw new TypeError("The grammar graph is not sealed");
        return this.#graph.graphJson;
    }
    _sealedGraph() {
        if (!this.#graph)
            throw new TypeError("Parser graph is not sealed");
        return this.#graph;
    }
}
export function bindingOf(parser) {
    const binding = bindings.get(parser);
    if (!binding)
        throw new TypeError("Parser did not originate from this kernel");
    return { graph: binding.builder._sealedGraph(), node: binding.node };
}
