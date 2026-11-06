import {
    idNumber,
    memoPolicy,
    nodeId,
    ruleId,
    type AcquiredParser,
    type DraftNode,
    type DraftNodeInput,
    type DraftRule,
    type MapCallback,
    type NodeId,
    type ParserBinding,
    type RuleId,
    type SealedGraph,
} from "./model.js";
import { sealGrammar } from "./seal.js";
import type { Grammar, MemoOptions, Parser, Rule } from "./types.js";

interface GrammarState {
    readonly owner: object;
    readonly nodes: DraftNode[];
    readonly rules: DraftRule[];
    graph?: SealedGraph;
}

interface ReferenceBinding extends ParserBinding {
    readonly rule?: RuleId;
}

const references = new WeakMap<object, ReferenceBinding>();
const states = new WeakMap<object, GrammarState>();

function parserReference<T>(binding: ReferenceBinding): Parser<T> {
    const parser = Object.freeze(Object.create(null)) as Parser<T>;
    references.set(parser as object, binding);
    return parser;
}

function ruleReference<T>(binding: ReferenceBinding): Rule<T> {
    const rule = Object.freeze(Object.create(null)) as Rule<T>;
    references.set(rule as object, binding);
    return rule;
}

class GrammarImplementation implements Grammar {
    readonly #state: GrammarState;

    constructor() {
        const owner = Object.freeze(Object.create(null)) as object;
        this.#state = { owner, nodes: [], rules: [] };
        states.set(owner, this.#state);
    }

    #assertOpen(): void {
        if (this.#state.graph) throw new TypeError("The grammar graph is sealed");
    }

    #append<T>(input: DraftNodeInput): Parser<T> {
        this.#assertOpen();
        const id = nodeId(this.#state.nodes.length);
        this.#state.nodes.push({ ...input, id } as DraftNode);
        return parserReference<T>({ owner: this.#state.owner, node: id });
    }

    #reference<T>(parser: Parser<T>): ReferenceBinding {
        const binding = references.get(parser as object);
        if (!binding || binding.owner !== this.#state.owner) {
            throw new TypeError("Parser did not originate from this grammar");
        }
        return binding;
    }

    succeed<T>(value: T): Parser<T> {
        return this.#append<T>({ kind: "epsilon", value });
    }

    literal<const T extends string>(text: T): Parser<T> {
        if (typeof text !== "string") throw new TypeError("literal requires a string");
        return this.#append<T>({ kind: "literal", text });
    }

    map<T, U>(parser: Parser<T>, transform: (value: T) => U): Parser<U> {
        if (typeof transform !== "function") throw new TypeError("map requires a callback");
        return this.#append<U>({
            kind: "map",
            child: this.#reference(parser).node,
            callback: transform as unknown as MapCallback,
        });
    }

    sequence<const T extends readonly unknown[]>(
        ...parsers: { [K in keyof T]: Parser<T[K]> }
    ): Parser<T> {
        return this.#append<T>({
            kind: "sequence",
            children: Object.freeze(parsers.map(parser => this.#reference(parser).node)),
        });
    }

    choice<const T extends readonly unknown[]>(
        ...parsers: { [K in keyof T]: Parser<T[K]> }
    ): Parser<T[number]> {
        if (parsers.length === 0) throw new TypeError("choice requires an alternative");
        return this.#append<T[number]>({
            kind: "choice",
            children: Object.freeze(parsers.map(parser => this.#reference(parser).node)),
        });
    }

    many<T>(parser: Parser<T>): Parser<readonly T[]> {
        return this.#append({ kind: "many", child: this.#reference(parser).node });
    }

    commit<T>(parser: Parser<T>): Parser<T> {
        return this.#append({ kind: "commit", child: this.#reference(parser).node });
    }

    recover<T, U>(parser: Parser<T>, fallback: U): Parser<T | U> {
        return this.#append({ kind: "recover", child: this.#reference(parser).node, fallback });
    }

    memo<T>(parser: Parser<T>, options?: MemoOptions): Parser<T> {
        return this.#append({
            kind: "memo",
            child: this.#reference(parser).node,
            policy: memoPolicy(options),
        });
    }

    rule<T>(name: string): Rule<T> {
        this.#assertOpen();
        if (!name) throw new TypeError("rule requires a name");
        if (this.#state.rules.some(rule => rule.name === name)) {
            throw new TypeError(`Duplicate rule name: ${name}`);
        }
        const id = ruleId(this.#state.rules.length);
        const callNode = nodeId(this.#state.nodes.length);
        this.#state.nodes.push({ id: callNode, kind: "call", rule: id });
        this.#state.rules.push({ id, name, callNode });
        return ruleReference<T>({ owner: this.#state.owner, node: callNode, rule: id });
    }

    define<T>(rule: Rule<T>, body: Parser<T>): void {
        this.#assertOpen();
        const ruleBinding = this.#reference(rule);
        const bodyBinding = this.#reference(body);
        if (ruleBinding.rule === undefined) throw new TypeError("define requires a rule handle");
        const draft = this.#state.rules[idNumber(ruleBinding.rule)];
        if (!draft) throw new TypeError("Unknown rule");
        if (draft.body !== undefined) throw new TypeError(`Rule already defined: ${draft.name}`);
        draft.body = bodyBinding.node;
    }

    seal<T>(root: Parser<T>): Parser<T> {
        const binding = this.#reference(root);
        if (!this.#state.graph) {
            this.#state.graph = sealGrammar({
                owner: this.#state.owner,
                nodes: this.#state.nodes,
                rules: this.#state.rules,
                root: binding.node,
            });
        }
        return root;
    }

    inspect(): string {
        if (!this.#state.graph) throw new TypeError("The grammar graph is not sealed");
        return this.#state.graph.inspection;
    }
}

export function createGrammar(): Grammar {
    return new GrammarImplementation();
}

/** Internal package capability; absent from the root runtime and declarations. */
export function openInvocation<T>(parser: Parser<T>): AcquiredParser {
    const binding = references.get(parser as object);
    if (!binding) throw new TypeError("Parser did not originate from this kernel");
    const graph = states.get(binding.owner)?.graph;
    if (!graph) throw new TypeError("Parser grammar is not sealed");
    return { graph, node: binding.node };
}
