import { ParserState } from "../../../../src/parse/state.js";
import {
    collectDiagnostic,
    isDiagnosticsEnabled,
} from "../../../../src/parse/utils.js";

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
type SequenceNode = Readonly<{
    kind: "sequence";
    children: readonly Node<unknown>[];
}>;
type RecoveryNode = Readonly<{
    kind: "recovery";
    child: Node<unknown>;
    sync: Node<unknown>;
    sentinel: unknown;
}>;
type Node<T> =
    | LiteralNode
    | MapNode
    | SpanNode
    | ChoiceNode
    | SequenceNode
    | RecoveryNode;

type Terminal<T> = Readonly<{
    text: string;
    project: (start: number, end: number) => T;
}>;
type TerminalTable = Readonly<{
    alphabet: Int8Array;
    ascii: Uint16Array | Uint32Array;
    cold: ReadonlyMap<number, number>;
    hasColdEdges: boolean;
    labelLimits: Uint16Array | Uint32Array;
    labels: readonly string[];
    width: number;
    winning: Uint16Array | Uint32Array;
    winningDepth: Uint16Array | Uint32Array;
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

    then<U>(other: Grammar<U>): Grammar<[T, U]> {
        return sequence(this as Grammar<T>, other);
    }

    recover<U>(sync: Grammar<unknown>, sentinel: U): Grammar<T | U> {
        return new Grammar<T | U>({
            kind: "recovery",
            child: this.node as Node<unknown>,
            sync: sync.node,
            sentinel,
        });
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

type GrammarValues<P extends readonly Grammar<unknown>[]> = {
    -readonly [K in keyof P]: P[K] extends Grammar<infer T> ? T : never;
};

export function sequence<const P extends readonly Grammar<unknown>[]>(
    ...parsers: P
): Grammar<GrammarValues<P>> {
    return new Grammar({
        kind: "sequence",
        children: parsers.map(parser => parser.node),
    }) as Grammar<GrammarValues<P>>;
}

export type Compiled<T> = Readonly<{
    plan: StagedPlan;
    parser: (state: ParserState<T>) => ParserState<T>;
    parseState: (source: string) => ParserState<T>;
    parse: (source: string) => T;
}>;

type MutablePlan = {
    -readonly [K in keyof StagedPlan]: number;
};
type Runner<T> = (state: ParserState<T>) => ParserState<T>;

/**
 * Compile supported graph nodes into source-direct terminals and transactions.
 * There is no token, scanner result, generated source, or fallback runtime.
 */
export function compile<T>(grammar: Grammar<T>): Compiled<T> {
    const plan: MutablePlan = {
        terminals: 0,
        states: 0,
        asciiAlphabet: 0,
        asciiCells: 0,
        coldEdges: 0,
        tableBytes: 0,
    };
    const parser = compileNode(grammar.node, plan);
    const parseState = (source: string) =>
        parser(new ParserState<T>(source));

    return {
        plan,
        parser,
        parseState,
        parse: source => parseState(source).value,
    };
}

function compileNode<T>(node: Node<T>, plan: MutablePlan): Runner<T> {
    const terminals = flatten(node);
    if (terminals?.length) return compileTerminals(terminals, plan);

    if (node.kind === "map") {
        const child = compileNode(node.child, plan);
        return ((state: ParserState<unknown>) => {
            const savedOffset = state.offset;
            const savedValue = state.value;
            const savedDiagnostics = state.diagnostics.length;
            child(state);
            if (state.fault) {
                return state.rollback(
                    savedOffset,
                    savedValue,
                    savedDiagnostics,
                    true,
                );
            }
            if (!state.isError) return state.ok(node.map(state.value));
            return state;
        }) as unknown as Runner<T>;
    }
    if (node.kind === "span") {
        const child = compileNode(node.child, plan);
        return ((state: ParserState<unknown>) => {
            const start = state.offset;
            child(state);
            if (state.isError) return state;
            return state.ok({
                value: state.value,
                span: { start, end: state.offset },
            });
        }) as unknown as Runner<T>;
    }
    if (node.kind === "recovery") {
        const child = compileNode(node.child, plan);
        const sync = compileNode(node.sync, plan);
        return ((state: ParserState<unknown>) => {
            const checkpoint = state.offset;
            const savedValue = state.value;
            const savedDiagnostics = state.diagnostics.length;
            child(state);
            if (!state.isError) return state;
            if (state.fault) {
                return state.rollback(
                    checkpoint,
                    savedValue,
                    savedDiagnostics,
                    true,
                );
            }

            collectDiagnostic(state, checkpoint);
            state.rollback(
                checkpoint,
                savedValue,
                state.diagnostics.length,
                false,
            );
            sync(state);
            if (state.isError) {
                return state.rollback(
                    checkpoint,
                    savedValue,
                    savedDiagnostics,
                    true,
                );
            }
            if (state.offset === checkpoint) {
                state.fault ??= {
                    kind: "RecoveryNonProgress",
                    offset: checkpoint,
                };
                return state.rollback(
                    checkpoint,
                    savedValue,
                    savedDiagnostics,
                    true,
                );
            }
            return state.ok(node.sentinel);
        }) as unknown as Runner<T>;
    }
    if (node.kind === "sequence") {
        if (node.children.length === 2) {
            const firstSpanned = flattenSpannedLiterals(node.children[0]);
            const secondSpanned = flattenSpannedLiterals(node.children[1]);
            if (
                firstSpanned?.length
                && secondSpanned?.length === 1
                && secondSpanned[0].length === 1
            ) {
                return compileSpannedSequence(
                    firstSpanned,
                    secondSpanned[0],
                    plan,
                ) as unknown as Runner<T>;
            }
            const firstTerminals = flatten(node.children[0]);
            const secondTerminals = flatten(node.children[1]);
            if (firstTerminals?.length && secondTerminals?.length === 1) {
                return compileTerminals(
                    firstTerminals,
                    plan,
                    secondTerminals[0],
                ) as unknown as Runner<T>;
            }
        }
        const children = node.children.map(child => compileNode(child, plan));
        if (children.length === 2) {
            const first = children[0];
            const second = children[1];
            return ((state: ParserState<unknown[]>) => {
                const savedOffset = state.offset;
                const savedValue = state.value;
                const savedDiagnostics = state.diagnostics.length;
                first(state as ParserState<unknown>);
                if (state.isError) {
                    return state.rollback(
                        savedOffset,
                        savedValue,
                        savedDiagnostics,
                        true,
                    );
                }
                const firstValue = state.value;
                second(state as ParserState<unknown>);
                if (state.isError) {
                    return state.rollback(
                        savedOffset,
                        savedValue,
                        savedDiagnostics,
                        true,
                    );
                }
                state.value = [firstValue, state.value];
                state.isError = state.fault !== undefined;
                return state;
            }) as unknown as Runner<T>;
        }
        return ((state: ParserState<unknown[]>) => {
            const savedOffset = state.offset;
            const savedValue = state.value;
            const savedDiagnostics = state.diagnostics.length;
            const values: unknown[] = new Array(children.length);
            for (let index = 0; index < children.length; index++) {
                children[index](state as ParserState<unknown>);
                if (state.isError) {
                    return state.rollback(
                        savedOffset,
                        savedValue,
                        savedDiagnostics,
                        true,
                    );
                }
                values[index] = state.value;
            }
            return state.ok(values);
        }) as unknown as Runner<T>;
    }
    throw new TypeError("S prototype has no compiled path for this graph");
}

function compileTerminals<T>(
    terminals: readonly Terminal<T>[],
    plan: MutablePlan,
    suffix?: Terminal<unknown>,
): Runner<T> {
    const suffixText = suffix?.text;
    const suffixLength = suffixText?.length ?? 0;
    const suffixCode = suffixLength === 1
        ? suffixText!.charCodeAt(0)
        : -1;
    const suffixLabel = suffix ? `"${suffix.text}"` : "";
    if (suffix) plan.terminals++;
    if (terminals.length === 1) {
        const terminal = terminals[0];
        const { text } = terminal;
        const label = `"${text}"`;
        const length = text.length;
        const code = length === 1 ? text.charCodeAt(0) : -1;
        plan.terminals++;
        return (state: ParserState<T>) => {
            const start = state.offset;
            const matches = length === 1
                ? state.src.charCodeAt(start) === code
                : state.src.startsWith(text, start);
            if (matches) {
                const end = start + length;
                const value = terminal.project(start, end);
                if (suffix) {
                    const suffixMatches = suffixLength === 1
                        ? state.src.charCodeAt(end) === suffixCode
                        : state.src.startsWith(suffixText!, end);
                    if (!suffixMatches) {
                        mergeLabels(state, end, [suffixLabel]);
                        state.isError = true;
                        return state;
                    }
                    const suffixEnd = end + suffixLength;
                    state.offset = suffixEnd;
                    state.value = [
                        value,
                        suffix.project(end, suffixEnd),
                    ] as T;
                    state.isError = state.fault !== undefined;
                    return state;
                }
                state.offset = end;
                state.value = value;
                state.isError = state.fault !== undefined;
                return state;
            }
            mergeLabels(state, start, [label]);
            state.isError = true;
            return state;
        };
    }

    const {
        alphabet,
        ascii,
        cold,
        hasColdEdges,
        labelLimits,
        labels,
        width,
        winning,
        winningDepth,
    } = buildTerminalTable(
        terminals.map(terminal => terminal.text),
        plan,
    );

    return (state: ParserState<T>): ParserState<T> => {
        const start = state.offset;
        const source = state.src;
        let node = 0;
        let at = start;
        if (hasColdEdges) {
            while (at < source.length) {
                const code = source.charCodeAt(at);
                const symbol = code < 128 ? alphabet[code] : -1;
                const next = symbol >= 0
                    ? ascii[node * width + symbol]
                    : cold.get(node * 65_536 + code) ?? 0;
                if (next === 0) break;
                node = next;
                at++;
            }
        } else {
            while (at < source.length) {
                const code = source.charCodeAt(at);
                const symbol = alphabet[code];
                const next = symbol >= 0
                    ? ascii[node * width + symbol]
                    : 0;
                if (next === 0) break;
                node = next;
                at++;
            }
        }

        const selected = winning[node] - 1;
        if (selected >= 0) {
            const selectedEnd = start + winningDepth[node];
            const labelLimit = labelLimits[selected];
            if (labelLimit > 0) {
                mergeLabels(state, start, labels, labelLimit);
            }
            const value = terminals[selected].project(start, selectedEnd);
            if (suffix) {
                const suffixMatches = suffixLength === 1
                    ? source.charCodeAt(selectedEnd) === suffixCode
                    : source.startsWith(suffixText!, selectedEnd);
                if (!suffixMatches) {
                    mergeLabels(state, selectedEnd, [suffixLabel]);
                    state.isError = true;
                    return state;
                }
                const suffixEnd = selectedEnd + suffixLength;
                state.offset = suffixEnd;
                state.value = [
                    value,
                    suffix.project(selectedEnd, suffixEnd),
                ] as T;
                state.isError = state.fault !== undefined;
                return state;
            }
            state.offset = selectedEnd;
            state.value = value;
            state.isError = state.fault !== undefined;
            return state;
        }
        mergeLabels(state, start, labels);
        state.isError = true;
        return state;
    };
}

function compileSpannedSequence(
    texts: readonly string[],
    suffix: string,
    plan: MutablePlan,
): Runner<readonly [Spanned<string>, Spanned<string>]> {
    const suffixCode = suffix.charCodeAt(0);
    const suffixLabel = `"${suffix}"`;
    plan.terminals++;
    if (texts.length === 1) {
        const text = texts[0];
        const label = `"${text}"`;
        const length = text.length;
        const code = length === 1 ? text.charCodeAt(0) : -1;
        plan.terminals++;
        return state => {
            const start = state.offset;
            const matches = length === 1
                ? state.src.charCodeAt(start) === code
                : state.src.startsWith(text, start);
            if (!matches) {
                mergeLabels(state, start, [label]);
                state.isError = true;
                return state;
            }
            const end = start + length;
            if (state.src.charCodeAt(end) !== suffixCode) {
                mergeLabels(state, end, [suffixLabel]);
                state.isError = true;
                return state;
            }
            const suffixEnd = end + 1;
            state.offset = suffixEnd;
            state.value = [
                { value: text, span: { start, end } },
                {
                    value: suffix,
                    span: { start: end, end: suffixEnd },
                },
            ];
            return state;
        };
    }

    const {
        alphabet,
        ascii,
        cold,
        hasColdEdges,
        labelLimits,
        labels,
        width,
        winning,
        winningDepth,
    } = buildTerminalTable(texts, plan);

    return state => {
        const start = state.offset;
        const source = state.src;
        let node = 0;
        let at = start;
        if (hasColdEdges) {
            while (at < source.length) {
                const code = source.charCodeAt(at);
                const symbol = code < 128 ? alphabet[code] : -1;
                const next = symbol >= 0
                    ? ascii[node * width + symbol]
                    : cold.get(node * 65_536 + code) ?? 0;
                if (next === 0) break;
                node = next;
                at++;
            }
        } else {
            while (at < source.length) {
                const code = source.charCodeAt(at);
                const symbol = alphabet[code];
                const next = symbol >= 0
                    ? ascii[node * width + symbol]
                    : 0;
                if (next === 0) break;
                node = next;
                at++;
            }
        }

        const selected = winning[node] - 1;
        if (selected < 0) {
            mergeLabels(state, start, labels);
            state.isError = true;
            return state;
        }
        const selectedEnd = start + winningDepth[node];
        const labelLimit = labelLimits[selected];
        if (labelLimit > 0) {
            if (isDiagnosticsEnabled()) {
                mergeLabels(state, start, labels, labelLimit);
            } else if (start > state.furthest) {
                state.furthest = start;
            }
        }
        if (source.charCodeAt(selectedEnd) !== suffixCode) {
            mergeLabels(state, selectedEnd, [suffixLabel]);
            state.isError = true;
            return state;
        }
        const suffixEnd = selectedEnd + 1;
        state.offset = suffixEnd;
        state.value = [
            {
                value: texts[selected],
                span: { start, end: selectedEnd },
            },
            {
                value: suffix,
                span: { start: selectedEnd, end: suffixEnd },
            },
        ];
        return state;
    };
}

function buildTerminalTable(
    texts: readonly string[],
    plan: MutablePlan,
): TerminalTable {
    const edges: Map<number, number>[] = [new Map()];
    const accept: number[] = [-1];
    const parent: number[] = [-1];
    const depth: number[] = [0];
    let maximumDepth = 0;
    for (let index = 0; index < texts.length; index++) {
        let state = 0;
        for (let at = 0; at < texts[index].length; at++) {
            const code = texts[index].charCodeAt(at);
            let next = edges[state].get(code);
            if (next === undefined) {
                next = edges.length;
                edges[state].set(code, next);
                edges.push(new Map());
                accept.push(-1);
                parent.push(state);
                depth.push(depth[state] + 1);
                maximumDepth = Math.max(maximumDepth, depth[next]);
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
    const winning = texts.length <= 65_535
        ? new Uint16Array(accept.length)
        : new Uint32Array(accept.length);
    const winningDepth = maximumDepth <= 65_535
        ? new Uint16Array(accept.length)
        : new Uint32Array(accept.length);
    for (let state = 0; state < accept.length; state++) {
        const own = accept[state] + 1;
        const inherited = state === 0 ? 0 : winning[parent[state]];
        if (own > 0 && (inherited === 0 || own < inherited)) {
            winning[state] = own;
            winningDepth[state] = depth[state];
        } else if (state > 0) {
            winning[state] = inherited;
            winningDepth[state] = winningDepth[parent[state]];
        }
    }
    const labels: string[] = [];
    const labelLimits = texts.length <= 65_535
        ? new Uint16Array(texts.length + 1)
        : new Uint32Array(texts.length + 1);
    const seenLabels = new Set<string>();
    for (let index = 0; index < texts.length; index++) {
        labelLimits[index] = labels.length;
        const label = `"${texts[index]}"`;
        if (!seenLabels.has(label)) {
            seenLabels.add(label);
            labels.push(label);
        }
    }
    labelLimits[texts.length] = labels.length;

    plan.terminals += texts.length;
    plan.states += edges.length;
    plan.asciiAlphabet = Math.max(plan.asciiAlphabet, width);
    plan.asciiCells += ascii.length;
    plan.coldEdges += cold.size;
    plan.tableBytes +=
        alphabet.byteLength
        + ascii.byteLength
        + winning.byteLength
        + winningDepth.byteLength
        + labelLimits.byteLength;
    return {
        alphabet,
        ascii,
        cold,
        hasColdEdges: cold.size > 0,
        labelLimits,
        labels,
        width,
        winning,
        winningDepth,
    };
}

function flattenSpannedLiterals(
    node: Node<unknown>,
    output: string[] = [],
): string[] | undefined {
    if (node.kind === "span" && node.child.kind === "literal") {
        output.push(node.child.text);
        return output;
    }
    if (node.kind !== "choice") return undefined;
    for (const child of node.children) {
        if (!flattenSpannedLiterals(child, output)) return undefined;
    }
    return output;
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
    if (node.kind === "sequence" || node.kind === "recovery") return undefined;
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
