type Expected = ReadonlySet<string>;

interface Evidence {
    readonly offset: number;
    readonly expected: Expected;
}

interface Diagnostic extends Evidence {
    readonly found: string;
}

interface Checkpoint {
    readonly offset: number;
    readonly value: unknown;
    readonly failed: boolean;
    readonly committed: boolean;
    readonly furthest: number;
    readonly expected: Expected;
    readonly diagnosticLength: number;
}

interface MemoAnswer {
    readonly offset: number;
    readonly value: unknown;
    readonly failed: boolean;
    readonly committed: boolean;
    readonly evidence: Evidence;
}

class Run {
    offset = 0;
    value: unknown;
    failed = false;
    committed = false;
    furthest = -1;
    expected = new Set<string>();
    readonly diagnostics: Diagnostic[] = [];
    readonly memo = new Map<string, MemoAnswer>();

    constructor(readonly source: string) {}

    checkpoint(): Checkpoint {
        return {
            offset: this.offset,
            value: this.value,
            failed: this.failed,
            committed: this.committed,
            furthest: this.furthest,
            expected: new Set(this.expected),
            diagnosticLength: this.diagnostics.length,
        };
    }

    restore(mark: Checkpoint): void {
        this.offset = mark.offset;
        this.value = mark.value;
        this.failed = mark.failed;
        this.committed = mark.committed;
        this.furthest = mark.furthest;
        this.expected = new Set(mark.expected);
        this.diagnostics.length = mark.diagnosticLength;
    }

    fail(label: string): void {
        this.failed = true;
        if (this.offset > this.furthest) {
            this.furthest = this.offset;
            this.expected = new Set([label]);
        } else if (this.offset === this.furthest) {
            this.expected.add(label);
        }
    }

    evidence(): Evidence {
        return { offset: this.furthest, expected: new Set(this.expected) };
    }

    merge(evidence: Evidence): void {
        if (evidence.offset > this.furthest) {
            this.furthest = evidence.offset;
            this.expected = new Set(evidence.expected);
        } else if (evidence.offset === this.furthest) {
            for (const label of evidence.expected) this.expected.add(label);
        }
    }

    collect(): void {
        const offset = Math.max(this.offset, this.furthest);
        this.diagnostics.push({
            offset,
            expected: new Set(this.expected),
            found: this.source.slice(offset, offset + 20),
        });
    }
}

export type ParseResult<T> =
    | {
          readonly ok: true;
          readonly value: T;
          readonly offset: number;
          readonly diagnostics: readonly Diagnostic[];
      }
    | {
          readonly ok: false;
          readonly offset: number;
          readonly expected: readonly string[];
          readonly committed: boolean;
          readonly diagnostics: readonly Diagnostic[];
      };

type Step<T> = (run: Run) => void;

let nextParserId = 0;

export class Parser<T> {
    readonly #id = nextParserId++;
    readonly #step: Step<T>;

    private constructor(step: Step<T>) {
        this.#step = step;
    }

    static define<T>(step: Step<T>): Parser<T> {
        return new Parser(step);
    }

    parse(source: string): ParseResult<T> {
        const run = new Run(source);
        this.#step(run);
        if (run.failed) {
            return {
                ok: false,
                offset: Math.max(run.offset, run.furthest),
                expected: [...run.expected].sort(),
                committed: run.committed,
                diagnostics: [...run.diagnostics],
            };
        }
        return {
            ok: true,
            value: run.value as T,
            offset: run.offset,
            diagnostics: [...run.diagnostics],
        };
    }

    then<U>(right: Parser<U>): Parser<readonly [T, U]> {
        return Parser.define(run => {
            const mark = run.checkpoint();
            this.#step(run);
            if (run.failed) return;
            const leftValue = run.value as T;
            right.#step(run);
            if (run.failed) {
                const evidence = run.evidence();
                const committed = run.committed;
                run.restore(mark);
                run.failed = true;
                run.committed = committed;
                run.merge(evidence);
                return;
            }
            run.value = [leftValue, run.value as U] as const;
        });
    }

    or<U>(right: Parser<U>): Parser<T | U> {
        return Parser.define(run => {
            const mark = run.checkpoint();
            this.#step(run);
            if (!run.failed || run.committed) return;
            const leftEvidence = run.evidence();
            run.restore(mark);
            right.#step(run);
            if (run.failed) run.merge(leftEvidence);
        });
    }

    cut(): Parser<T> {
        return Parser.define(run => {
            this.#step(run);
            if (!run.failed) run.committed = true;
        });
    }

    recover(sync: Parser<unknown>): Parser<T | undefined> {
        return Parser.define(run => {
            const mark = run.checkpoint();
            this.#step(run);
            if (!run.failed) return;
            run.collect();
            const diagnostics = [...run.diagnostics];
            const evidence = run.evidence();
            run.restore(mark);
            run.diagnostics.push(...diagnostics.slice(mark.diagnosticLength));
            run.merge(evidence);
            run.failed = false;
            run.committed = false;
            sync.#step(run);
            if (!run.failed) run.value = undefined;
        });
    }

    memoized(): Parser<T> {
        return Parser.define(run => {
            const key = `${this.#id}:${run.offset}`;
            const answer = run.memo.get(key);
            if (answer) {
                run.offset = answer.offset;
                run.value = answer.value;
                run.failed = answer.failed;
                run.committed = answer.committed;
                run.merge(answer.evidence);
                return;
            }
            this.#step(run);
            run.memo.set(key, {
                offset: run.offset,
                value: run.value,
                failed: run.failed,
                committed: run.committed,
                evidence: run.evidence(),
            });
        });
    }
}

function text(literal: string): Parser<string> {
    return Parser.define(run => {
        if (run.source.startsWith(literal, run.offset)) {
            run.offset += literal.length;
            run.value = literal;
            run.failed = false;
        } else {
            run.fail(JSON.stringify(literal));
        }
    });
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const word = text("hello").memoized();
const first = word.parse("hello");
const second = word.parse("world");
assert(first.ok && first.value === "hello", "first memoized source failed");
assert(!second.ok, "memo crossed invocation ownership");

const sequence = text("a").then(text("b"));
const failed = sequence.parse("aX");
assert(!failed.ok && failed.offset === 1, "sequence lost furthest failure");
assert(!failed.ok && failed.expected.includes('"b"'), "sequence lost expected label");

const recovered = text("x").then(text("z")).recover(text("x"));
const recovery = recovered.parse("xy");
assert(recovery.ok, "recovery failed");
assert(recovery.diagnostics.length === 1, "recovery lost its diagnostic transaction");
assert(
    recovery.diagnostics[0].expected.has('"z"'),
    "recovery attributed the wrong expected label",
);

const nested = Parser.define<string>(run => {
    const inner = word.parse("world");
    assert(!inner.ok, "nested parse observed outer memo state");
    text("hello").parse(run.source);
    run.offset = run.source.length;
    run.value = run.source;
});
const outer = nested.parse("hello");
assert(outer.ok && outer.value === "hello", "nested invocation corrupted caller");

const choice = text("a").cut().then(text("b")).or(text("a").then(text("c")));
const committed = choice.parse("ac");
assert(!committed.ok && committed.committed, "committed choice backtracked");

console.log(
    JSON.stringify({
        crossSource: "isolated",
        result: "discriminated",
        furthest: failed.ok ? null : failed.offset,
        nested: "isolated",
        parserObserverFields: Object.keys(sequence),
    }),
);
