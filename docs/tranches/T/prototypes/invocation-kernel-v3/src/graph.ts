import type { Erased, MemoOptions, Parser, Rule } from "./types.js";

export const enum Effect {
    None = 0,
    Diagnostic = 1 << 0,
    Recover = 1 << 1,
    Cut = 1 << 2,
    RuleDependent = 1 << 3,
}

interface BaseNode {
    readonly id: number;
}

export type Node =
    | (BaseNode & { readonly kind: "epsilon"; readonly value: Erased })
    | (BaseNode & { readonly kind: "literal"; readonly text: string })
    | (BaseNode & { readonly kind: "sequence"; readonly children: readonly number[] })
    | (BaseNode & { readonly kind: "choice"; readonly children: readonly number[] })
    | (BaseNode & {
          readonly kind: "map";
          readonly child: number;
          readonly transform: (value: Erased) => Erased;
      })
    | (BaseNode & { readonly kind: "many"; readonly child: number })
    | (BaseNode & { readonly kind: "commit"; readonly child: number })
    | (BaseNode & { readonly kind: "recover"; readonly child: number; readonly fallback: Erased })
    | (BaseNode & {
          readonly kind: "memo";
          readonly child: number;
          readonly policy: "reject" | "replay";
      })
    | (BaseNode & { readonly kind: "call"; readonly rule: number });

type DraftNode = Node extends infer Candidate
    ? Candidate extends { readonly id: number }
        ? Omit<Candidate, "id">
        : never
    : never;

export interface SealedRule {
    readonly id: number;
    readonly name: string;
    readonly callNode: number;
    readonly body: number;
    readonly dependencies: readonly number[];
    readonly reverseDependencies: readonly number[];
    readonly scc: number;
    readonly recursive: boolean;
    readonly effects: Effect;
}

export interface SealedGraph {
    readonly nodes: readonly Node[];
    readonly rules: readonly SealedRule[];
    readonly nodeEffects: readonly Effect[];
    readonly sccs: readonly (readonly number[])[];
    readonly graphJson: string;
}

interface DraftRule {
    readonly id: number;
    readonly name: string;
    readonly callNode: number;
    body?: number;
}

interface Binding {
    readonly builder: GrammarBuilder;
    readonly node: number;
    readonly rule?: number;
}

const bindings = new WeakMap<object, Binding>();

function parserObject<T>(binding: Binding): Parser<T> {
    const parser = Object.freeze(Object.create(null)) as Parser<T>;
    bindings.set(parser, binding);
    return parser;
}

function ruleObject<T>(binding: Binding): Rule<T> {
    const rule = Object.freeze(Object.create(null)) as Rule<T>;
    bindings.set(rule, binding);
    return rule;
}

function children(node: Node): readonly number[] {
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

function stableNode(node: Node): object {
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

function tarjan(edges: readonly (readonly number[])[]): readonly (readonly number[])[] {
    const index = Array<number>(edges.length).fill(-1);
    const low = Array<number>(edges.length).fill(0);
    const active = Array<boolean>(edges.length).fill(false);
    const stack: number[] = [];
    const components: number[][] = [];
    let next = 0;

    const visit = (vertex: number): void => {
        index[vertex] = next;
        low[vertex] = next;
        next += 1;
        stack.push(vertex);
        active[vertex] = true;
        for (const target of edges[vertex] ?? []) {
            if (index[target] === -1) {
                visit(target);
                low[vertex] = Math.min(low[vertex] ?? 0, low[target] ?? 0);
            } else if (active[target]) {
                low[vertex] = Math.min(low[vertex] ?? 0, index[target] ?? 0);
            }
        }
        if (low[vertex] !== index[vertex]) return;
        const component: number[] = [];
        for (;;) {
            const member = stack.pop();
            if (member === undefined) throw new Error("Tarjan stack underflow");
            active[member] = false;
            component.push(member);
            if (member === vertex) break;
        }
        components.push(component.sort((left, right) => left - right));
    };

    for (let vertex = 0; vertex < edges.length; vertex += 1) {
        if (index[vertex] === -1) visit(vertex);
    }
    return components.sort((left, right) => (left[0] ?? 0) - (right[0] ?? 0));
}

export class GrammarBuilder {
    readonly #nodes: Node[] = [];
    readonly #rules: DraftRule[] = [];
    #graph: SealedGraph | undefined;

    #open(): void {
        if (this.#graph) throw new TypeError("The grammar graph is sealed");
    }

    #append<T>(node: DraftNode): Parser<T> {
        this.#open();
        const id = this.#nodes.length;
        this.#nodes.push({ ...node, id } as Node);
        return parserObject<T>({ builder: this, node: id });
    }

    #binding<T>(parser: Parser<T>): Binding {
        const binding = bindings.get(parser);
        if (!binding || binding.builder !== this) {
            throw new TypeError("Parser did not originate from this builder");
        }
        return binding;
    }

    succeed<T>(value: T): Parser<T> {
        return this.#append<T>({ kind: "epsilon", value });
    }

    literal<const T extends string>(text: T): Parser<T> {
        return this.#append<T>({ kind: "literal", text });
    }

    map<T, U>(parser: Parser<T>, transform: (value: T) => U): Parser<U> {
        if (typeof transform !== "function") throw new TypeError("map requires a function");
        return this.#append<U>({
            kind: "map",
            child: this.#binding(parser).node,
            transform: transform as (value: Erased) => Erased,
        });
    }

    sequence<const T extends readonly Erased[]>(
        ...parsers: { [K in keyof T]: Parser<T[K]> }
    ): Parser<T> {
        return this.#append<T>({
            kind: "sequence",
            children: Object.freeze(parsers.map(parser => this.#binding(parser).node)),
        });
    }

    choice<const T extends readonly Erased[]>(
        ...parsers: { [K in keyof T]: Parser<T[K]> }
    ): Parser<T[number]> {
        if (parsers.length === 0) throw new TypeError("choice requires an alternative");
        return this.#append<T[number]>({
            kind: "choice",
            children: Object.freeze(parsers.map(parser => this.#binding(parser).node)),
        });
    }

    many<T>(parser: Parser<T>): Parser<readonly T[]> {
        return this.#append<readonly T[]>({ kind: "many", child: this.#binding(parser).node });
    }

    commit<T>(parser: Parser<T>): Parser<T> {
        return this.#append<T>({ kind: "commit", child: this.#binding(parser).node });
    }

    recover<T, U>(parser: Parser<T>, fallback: U): Parser<T | U> {
        return this.#append<T | U>({
            kind: "recover",
            child: this.#binding(parser).node,
            fallback,
        });
    }

    memo<T>(parser: Parser<T>, options: MemoOptions = {}): Parser<T> {
        return this.#append<T>({
            kind: "memo",
            child: this.#binding(parser).node,
            policy: options.effects ?? "reject",
        });
    }

    rule<T>(name: string): Rule<T> {
        this.#open();
        if (!name) throw new TypeError("rule requires a name");
        if (this.#rules.some(rule => rule.name === name)) {
            throw new TypeError(`Duplicate rule name: ${name}`);
        }
        const id = this.#rules.length;
        const node = this.#nodes.length;
        this.#nodes.push({ id: node, kind: "call", rule: id });
        this.#rules.push({ id, name, callNode: node });
        return ruleObject<T>({ builder: this, node, rule: id });
    }

    define<T>(rule: Rule<T>, body: Parser<T>): void {
        this.#open();
        const ruleBinding = this.#binding(rule);
        const bodyBinding = this.#binding(body);
        if (ruleBinding.rule === undefined) throw new TypeError("define requires a rule handle");
        const draft = this.#rules[ruleBinding.rule];
        if (!draft) throw new TypeError("Unknown rule");
        if (draft.body !== undefined) throw new TypeError(`Rule already defined: ${draft.name}`);
        draft.body = bodyBinding.node;
    }

    seal<T>(root: Parser<T>): Parser<T> {
        const rootBinding = this.#binding(root);
        if (this.#graph) return root;
        for (const rule of this.#rules) {
            if (rule.body === undefined) throw new TypeError(`Dangling rule: ${rule.name}`);
        }

        const dependencies = this.#rules.map(rule => {
            const found = new Set<number>();
            const seen = new Set<number>();
            const pending = [rule.body as number];
            while (pending.length > 0) {
                const nodeId = pending.pop();
                if (nodeId === undefined || seen.has(nodeId)) continue;
                seen.add(nodeId);
                const node = this.#nodes[nodeId];
                if (!node) throw new TypeError(`Missing node ${nodeId}`);
                if (node.kind === "call") found.add(node.rule);
                else pending.push(...children(node));
            }
            return [...found].sort((left, right) => left - right);
        });

        const reverse = dependencies.map(() => [] as number[]);
        dependencies.forEach((targets, source) => {
            for (const target of targets) reverse[target]?.push(source);
        });
        reverse.forEach(row => row.sort((left, right) => left - right));

        const sccs = tarjan(dependencies);
        const sccOf = Array<number>(this.#rules.length).fill(-1);
        sccs.forEach((component, scc) => component.forEach(rule => (sccOf[rule] = scc)));
        const recursive = this.#rules.map((rule, id) => {
            const component = sccs[sccOf[id] ?? -1] ?? [];
            return component.length > 1 || (dependencies[id] ?? []).includes(rule.id);
        });

        const localEffect = (nodeId: number, ruleEffects: readonly Effect[], seen: Set<number>): Effect => {
            if (seen.has(nodeId)) return Effect.None;
            seen.add(nodeId);
            const node = this.#nodes[nodeId];
            if (!node) throw new TypeError(`Missing node ${nodeId}`);
            switch (node.kind) {
                case "epsilon":
                case "literal":
                    return Effect.None;
                case "call":
                    return Effect.RuleDependent | (ruleEffects[node.rule] ?? Effect.None);
                case "commit":
                    return Effect.Cut | localEffect(node.child, ruleEffects, seen);
                case "recover":
                    return (
                        Effect.Diagnostic |
                        Effect.Recover |
                        localEffect(node.child, ruleEffects, seen)
                    );
                case "map":
                case "many":
                case "memo":
                    return localEffect(node.child, ruleEffects, seen);
                case "sequence":
                case "choice":
                    return node.children.reduce(
                        (all, child) => all | localEffect(child, ruleEffects, seen),
                        Effect.None,
                    );
            }
        };

        const ruleEffects = Array<Effect>(this.#rules.length).fill(Effect.None);
        for (;;) {
            let changed = false;
            this.#rules.forEach((rule, id) => {
                const effect = localEffect(rule.body as number, ruleEffects, new Set());
                if (effect !== ruleEffects[id]) {
                    ruleEffects[id] = effect;
                    changed = true;
                }
            });
            if (!changed) break;
        }

        const nodeEffects = this.#nodes.map(node =>
            localEffect(node.id, ruleEffects, new Set()),
        );
        this.#nodes.forEach(node => {
            if (node.kind !== "memo") return;
            const effect = nodeEffects[node.child] ?? Effect.None;
            if ((effect & Effect.RuleDependent) !== 0) {
                throw new TypeError("memo rejects transitive rule dependency");
            }
            if ((effect & Effect.Cut) !== 0) {
                throw new TypeError("memo rejects transitive cut effect");
            }
            if (
                (effect & (Effect.Diagnostic | Effect.Recover)) !== 0 &&
                node.policy !== "replay"
            ) {
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
        const sealedRules = this.#rules.map((rule, id): SealedRule =>
            Object.freeze({
                id,
                name: rule.name,
                callNode: rule.callNode,
                body: rule.body as number,
                dependencies: Object.freeze([...(dependencies[id] ?? [])]),
                reverseDependencies: Object.freeze([...(reverse[id] ?? [])]),
                scc: sccOf[id] ?? -1,
                recursive: recursive[id] ?? false,
                effects: ruleEffects[id] ?? Effect.None,
            }),
        );
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
    inspect(): string {
        if (!this.#graph) throw new TypeError("The grammar graph is not sealed");
        return this.#graph.graphJson;
    }

    _sealedGraph(): SealedGraph {
        if (!this.#graph) throw new TypeError("Parser graph is not sealed");
        return this.#graph;
    }
}

export function bindingOf<T>(parser: Parser<T>): { readonly graph: SealedGraph; readonly node: number } {
    const binding = bindings.get(parser);
    if (!binding) throw new TypeError("Parser did not originate from this kernel");
    return { graph: binding.builder._sealedGraph(), node: binding.node };
}
