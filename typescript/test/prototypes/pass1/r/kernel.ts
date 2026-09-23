const VALUE = Symbol("value");
type Status = "ok" | "mismatch" | "fault";
export type Fault =
    | Readonly<{ kind: "ForeignResult"; offset: number }>
    | Readonly<{ kind: "Nesting"; offset: number; limit: number }>
    | Readonly<{ kind: "RecoveryNonProgress"; offset: number }>;
export type Span = Readonly<{ start: number; end: number }>;
export type Diagnostic = Readonly<{ offset: number; expected: readonly string[] }>;
interface Run {
    readonly source: string;
    cursor: number; value: unknown;
    readonly diagnostics: Diagnostic[]; readonly captures: Span[];
    frontier: number; expected: string[]; work: number;
    depth: number; maxDepth: number;
    readonly depthLimit: number;
    checkpoints: number; journalPeak: number;
    readonly token: symbol; status: Status; fault?: Fault;
}
export type Parser<T> = ((run: Run) => symbol) & { readonly [VALUE]?: T };
type ParserValue<P> = P extends Parser<infer T> ? T : never;
type Values<Ps extends readonly Parser<unknown>[]> = {
    -readonly [K in keyof Ps]: ParserValue<Ps[K]>;
};
interface Checkpoint {
    readonly cursor: number; readonly value: unknown;
    readonly diagnosticsLength: number; readonly capturesLength: number;
    readonly depth: number;
}
interface Evidence {
    readonly offset: number; readonly isError: boolean; readonly furthest: number;
    readonly expected: readonly string[]; readonly diagnostics: readonly Diagnostic[];
    readonly captures: readonly Span[]; readonly work: number;
    readonly maxDepth: number; readonly checkpoints: number; readonly journalPeak: number;
    readonly resultAllocations: number;
}
export type Outcome<T> =
    | (Evidence & Readonly<{ kind: "ok"; value: T }>)
    | (Evidence & Readonly<{ kind: "mismatch"; value: unknown }>)
    | (Evidence & Readonly<{ kind: "fault"; value: unknown; fault: Fault }>);
function immutable<T>(parser: Parser<T>): Parser<T> {
    return Object.freeze(parser);
}
function finish(run: Run, status: Status, fault?: Fault): symbol {
    run.status = status;
    run.fault = fault;
    return run.token;
}
function invoke<T>(run: Run, parser: Parser<T>): Status {
    if (run.depth >= run.depthLimit) {
        finish(run, "fault", {
            kind: "Nesting",
            offset: run.cursor,
            limit: run.depthLimit,
        });
        return "fault";
    }
    run.depth++;
    if (run.depth > run.maxDepth) run.maxDepth = run.depth;
    let answer: symbol;
    try {
        answer = parser(run);
    } finally {
        run.depth--;
    }
    if (answer !== run.token) {
        finish(run, "fault", {
            kind: "ForeignResult",
            offset: run.cursor,
        });
    }
    return run.status;
}
function checkpoint(run: Run): Checkpoint {
    run.checkpoints++;
    return {
        cursor: run.cursor,
        value: run.value,
        diagnosticsLength: run.diagnostics.length,
        capturesLength: run.captures.length,
        depth: run.depth,
    };
}
function restore(run: Run, saved: Checkpoint): void {
    run.cursor = saved.cursor;
    run.value = saved.value;
    run.diagnostics.length = saved.diagnosticsLength;
    run.captures.length = saved.capturesLength;
    run.depth = saved.depth;
}
function observeJournal(run: Run): void {
    const size = run.diagnostics.length + run.captures.length;
    if (size > run.journalPeak) run.journalPeak = size;
}
function fail(run: Run, label: string): void {
    if (run.cursor > run.frontier) {
        run.frontier = run.cursor;
        run.expected = [label];
    } else if (
        run.cursor === run.frontier &&
        !run.expected.includes(label)
    ) {
        run.expected.push(label);
    }
}
export function literal(text: string): Parser<string>;
export function literal<const T>(text: string, value: T): Parser<T>;
export function literal<T>(
    text: string,
    value?: T,
): Parser<T | string> {
    const produced = arguments.length === 1 ? text : value;
    const label = JSON.stringify(text);
    return immutable(run => {
        run.work++;
        if (!run.source.startsWith(text, run.cursor)) {
            fail(run, label);
            return finish(run, "mismatch");
        }
        run.cursor += text.length;
        run.value = produced;
        return finish(run, "ok");
    });
}

export function seq<const Ps extends readonly Parser<unknown>[]>(
    ...parsers: Ps
): Parser<Values<Ps>> {
    return immutable(run => {
        const saved = checkpoint(run);
        const output = new Array(parsers.length);
        for (let index = 0; index < parsers.length; index++) {
            const child = invoke(run, parsers[index]);
            if (child !== "ok") {
                const fault = run.fault;
                restore(run, saved);
                return finish(run, child, fault);
            }
            output[index] = run.value;
        }
        run.value = output;
        return finish(run, "ok");
    });
}

export function choice<const Ps extends readonly Parser<unknown>[]>(
    ...parsers: Ps
): Parser<ParserValue<Ps[number]>> {
    return immutable(run => {
        const saved = checkpoint(run);
        for (const parser of parsers) {
            const child = invoke(run, parser);
            if (child === "ok") return finish(run, "ok");
            const fault = run.fault;
            restore(run, saved);
            if (child === "fault") return finish(run, child, fault);
        }
        return finish(run, "mismatch");
    });
}

export function recover<T, S>(
    parser: Parser<T>,
    sync: Parser<unknown>,
    sentinel: S,
): Parser<T | S> {
    return immutable(run => {
        const saved = checkpoint(run);
        const inner = invoke(run, parser);
        if (inner === "ok") return finish(run, "ok");
        if (inner === "fault") {
            const fault = run.fault;
            restore(run, saved);
            return finish(run, inner, fault);
        }
        const diagnostic = Object.freeze({
            offset: run.frontier,
            expected: Object.freeze(run.expected.slice()),
        });
        restore(run, saved);
        const synced = invoke(run, sync);
        if (synced !== "ok") {
            const fault = run.fault;
            restore(run, saved);
            return finish(run, synced, fault);
        }
        if (run.cursor === saved.cursor) {
            restore(run, saved);
            return finish(run, "fault", {
                kind: "RecoveryNonProgress",
                offset: saved.cursor,
            });
        }
        run.diagnostics.push(diagnostic);
        observeJournal(run);
        run.value = sentinel;
        return finish(run, "ok");
    });
}

export function capture<T>(parser: Parser<T>): Parser<Span> {
    return immutable(run => {
        const saved = checkpoint(run);
        const child = invoke(run, parser);
        if (child !== "ok") {
            const fault = run.fault;
            restore(run, saved);
            return finish(run, child, fault);
        }
        const span = Object.freeze({ start: saved.cursor, end: run.cursor });
        run.captures.push(span);
        observeJournal(run);
        run.value = span;
        return finish(run, "ok");
    });
}

export function parse<T>(
    parser: Parser<T>,
    source: string,
    options: Readonly<{ initial?: unknown; maxDepth?: number }> = {},
): Outcome<T> {
    const depthLimit = options.maxDepth ?? 256;
    if (!Number.isSafeInteger(depthLimit) || depthLimit < 1) {
        throw new RangeError("maxDepth must be a positive safe integer");
    }
    const run: Run = {
        source,
        cursor: 0,
        value: options.initial,
        diagnostics: [],
        captures: [],
        frontier: -1,
        expected: [],
        work: 0,
        depth: 0,
        maxDepth: 0,
        depthLimit,
        checkpoints: 0,
        journalPeak: 0,
        token: Symbol("run"),
        status: "mismatch",
    };
    const answer = invoke(run, parser);
    const evidence: Evidence = {
        offset: run.cursor,
        isError: answer !== "ok",
        furthest: run.frontier,
        expected: Object.freeze(run.expected.slice()),
        diagnostics: Object.freeze(run.diagnostics.slice()),
        captures: Object.freeze(run.captures.slice()),
        work: run.work,
        maxDepth: run.maxDepth,
        checkpoints: run.checkpoints,
        journalPeak: run.journalPeak,
        resultAllocations: 1,
    };
    if (answer === "ok") {
        return Object.freeze({ ...evidence, kind: "ok", value: run.value as T });
    }
    if (answer === "fault") {
        return Object.freeze({
            ...evidence,
            kind: "fault",
            value: run.value,
            fault: run.fault!,
        });
    }
    return Object.freeze({ ...evidence, kind: "mismatch", value: run.value });
}
