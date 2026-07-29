import { ParserState } from "../../../../src/parse/state.js";
import { isDiagnosticsEnabled } from "../../../../src/parse/utils.js";

export type Span = Readonly<{ start: number; end: number }>;
export type Spanned<T> = Readonly<{ value: T; span: Span }>;

type LiteralNode = Readonly<{ kind: "literal"; text: string }>;
type MapNode = Readonly<{
    kind: "map";
    child: Node<unknown>;
    map: (value: unknown) => unknown;
}>;
type SpanNode = Readonly<{ kind: "span"; child: Node<unknown> }>;
type ChoiceNode = Readonly<{ kind: "choice"; children: readonly Node<unknown>[] }>;
type Node<T> = LiteralNode | MapNode | SpanNode | ChoiceNode;

type Terminal<T> = Readonly<{
    text: string;
    project: (start: number, end: number) => T;
}>;

export type StagedPlan = Readonly<{
    terminals: number;
    states: number;
    asciiAlphabet: number;
    asciiCells: number;
    coldEdges: number;
    tableBytes: number;
}>;

export class Grammar<T> {
    constructor(readonly node: Node<T>) {}

    map<U>(map: (value: T) => U): Grammar<U> {
        return new Grammar<U>({
            kind: "map",
            child: this.node as Node<unknown>,
            map: map as (value: unknown) => unknown,
        });
    }

    or<U>(other: Grammar<U>): Grammar<T | U> {
        return choice(
            this as Grammar<unknown>,
            other as Grammar<unknown>,
        ) as Grammar<T | U>;
    }

    spanned(): Grammar<Spanned<T>> {
        return new Grammar<Spanned<T>>({
            kind: "span",
            child: this.node as Node<unknown>,
        });
    }
}

export function literal<const T extends string>(text: T): Grammar<T> {
    return new Grammar<T>({ kind: "literal", text });
}

export function choice<const P extends readonly Grammar<unknown>[]>(
    ...parsers: P
): Grammar<P[number] extends Grammar<infer T> ? T : never> {
    return new Grammar({
        kind: "choice",
        children: parsers.map(parser => parser.node),
    }) as Grammar<P[number] extends Grammar<infer T> ? T : never>;
}

export type Compiled<T> = Readonly<{
    plan: StagedPlan;
    parser: (state: ParserState<T>) => ParserState<T>;
    parseState: (source: string) => ParserState<T>;
    parse: (source: string) => T;
}>;

/**
 * Compile a mapped/spanned literal choice into one source-direct terminal.
 * There is no token, scanner result, generated source, or fallback runtime.
 */
export function compile<T>(grammar: Grammar<T>): Compiled<T> {
    const terminals = flatten(grammar.node);
    if (!terminals?.length) {
        throw new TypeError("S prototype accepts only literal/map/span/choice graphs");
    }

    const edges: Map<number, number>[] = [new Map()];
    const accept: number[] = [-1];
    for (let index = 0; index < terminals.length; index++) {
        let state = 0;
        for (let at = 0; at < terminals[index].text.length; at++) {
            const code = terminals[index].text.charCodeAt(at);
            let next = edges[state].get(code);
            if (next === undefined) {
                next = edges.length;
                edges[state].set(code, next);
                edges.push(new Map());
                accept.push(-1);
            }
            state = next;
        }
        if (accept[state] < 0) accept[state] = index;
    }

    const codes = new Set<number>();
    for (const state of edges) {
        for (const code of state.keys()) {
            if (code < 128) codes.add(code);
        }
    }
    const alphabet = new Int8Array(128);
    alphabet.fill(-1);
    const orderedCodes = [...codes].sort((left, right) => left - right);
    for (let index = 0; index < orderedCodes.length; index++) {
        alphabet[orderedCodes[index]] = index;
    }
    const width = orderedCodes.length;
    const ascii = edges.length <= 65_536
        ? new Uint16Array(edges.length * width)
        : new Uint32Array(edges.length * width);
    const cold = new Map<number, number>();
    for (let state = 0; state < edges.length; state++) {
        for (const [code, next] of edges[state]) {
            if (code < 128) ascii[state * width + alphabet[code]] = next;
            else cold.set(state * 65_536 + code, next);
        }
    }
    const accepted = terminals.length <= 65_535
        ? new Uint16Array(accept.length)
        : new Uint32Array(accept.length);
    for (let state = 0; state < accept.length; state++) {
        accepted[state] = accept[state] + 1;
    }
    const labels = terminals.map(terminal => `"${terminal.text}"`);

    const parser = (state: ParserState<T>): ParserState<T> => {
        const start = state.offset;
        let node = 0;
        let at = start;
        let selected = accepted[0] - 1;
        let selectedEnd = start;
        while (at < state.src.length) {
            const code = state.src.charCodeAt(at);
            const symbol = code < 128 ? alphabet[code] : -1;
            const next = symbol >= 0
                ? ascii[node * width + symbol]
                : cold.get(node * 65_536 + code) ?? 0;
            if (next === 0) break;
            node = next;
            at++;
            const candidate = accepted[node] - 1;
            if (candidate >= 0 && (selected < 0 || candidate < selected)) {
                selected = candidate;
                selectedEnd = at;
            }
        }

        if (selected >= 0) {
            if (selected > 0) mergeLabels(state, start, labels, selected);
            return state.ok(
                terminals[selected].project(start, selectedEnd),
                selectedEnd - start,
            );
        }
        mergeLabels(state, start, labels);
        state.isError = true;
        return state;
    };
    const parseState = (source: string) =>
        parser(new ParserState<T>(source));

    return {
        plan: {
            terminals: terminals.length,
            states: edges.length,
            asciiAlphabet: width,
            asciiCells: ascii.length,
            coldEdges: cold.size,
            tableBytes:
                alphabet.byteLength + ascii.byteLength + accepted.byteLength,
        },
        parser,
        parseState,
        parse: source => parseState(source).value,
    };
}

function flatten<T>(
    node: Node<T>,
    transform: (value: unknown, start: number, end: number) => unknown =
        value => value,
    output: Terminal<unknown>[] = [],
): Terminal<T>[] | undefined {
    if (node.kind === "literal") {
        output.push({
            text: node.text,
            project: (start, end) => transform(node.text, start, end),
        });
        return output as Terminal<T>[];
    }
    if (node.kind === "map") {
        return flatten(
            node.child,
            (value, start, end) =>
                transform(node.map(value), start, end),
            output,
        ) as Terminal<T>[] | undefined;
    }
    if (node.kind === "span") {
        return flatten(
            node.child,
            (value, start, end) =>
                transform({ value, span: { start, end } }, start, end),
            output,
        ) as Terminal<T>[] | undefined;
    }
    for (const child of node.children) {
        if (!flatten(child, transform, output)) return undefined;
    }
    return output as Terminal<T>[];
}

function mergeLabels<T>(
    state: ParserState<T>,
    offset: number,
    labels: readonly string[],
    limit: number = labels.length,
): void {
    if (offset < state.furthest) return;
    const enabled = isDiagnosticsEnabled();
    if (offset > state.furthest) {
        state.furthest = offset;
        state.expected = enabled ? labels.slice(0, limit) : undefined;
        state.suggestions = [];
        state.secondarySpans = [];
        return;
    }
    if (!enabled) return;
    const incoming = labels.slice(0, limit);
    const expected = state.expected ??= [];
    for (const label of incoming) {
        if (!expected.includes(label)) expected.push(label);
    }
}
