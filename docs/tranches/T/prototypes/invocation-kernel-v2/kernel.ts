declare const OFFSET: unique symbol;

/** A zero-based JavaScript string offset, measured in UTF-16 code units. */
export type Offset = number & { readonly [OFFSET]: "utf16" };

export interface Diagnostic {
    readonly offset: Offset;
    readonly expected: readonly string[];
    readonly found: string;
}

export type ParseResult<T> =
    | {
          readonly kind: "success";
          readonly value: T;
          readonly offset: Offset;
          readonly diagnostics: readonly Diagnostic[];
      }
    | {
          readonly kind: "failure";
          readonly offset: Offset;
          readonly expected: readonly string[];
          readonly committed: boolean;
          readonly diagnostics: readonly Diagnostic[];
      };

declare const PARSER_VALUE: unique symbol;

/** An opaque parser definition. Its evaluator and invocation state are private. */
export interface Parser<T> {
    readonly [PARSER_VALUE]: (value: T) => T;
}

type Erased = unknown;

/* Audited erasure boundary: all generic values enter and leave the private VM here. */
const erase = <T>(value: T): Erased => value;
const reveal = <T>(value: Erased): T => value as T;

const offset = (value: number): Offset => value as Offset;
const numberOf = (value: Offset): number => value as number;

const enum Effect {
    None = 0,
    Diagnostic = 1,
    Cut = 2,
}

interface Evidence {
    readonly offset: Offset;
    readonly expected: ReadonlySet<string>;
}

interface RelativeEvidence {
    readonly delta: number;
    readonly expected: readonly string[];
}

interface RelativeDiagnostic {
    readonly delta: number;
    readonly expected: readonly string[];
}

interface Answer {
    readonly kind: "success" | "failure";
    readonly cursorDelta: number;
    readonly value: Erased;
    readonly evidence: RelativeEvidence | null;
    readonly diagnostics: readonly RelativeDiagnostic[];
}

interface ChoiceFrame {
    committed: boolean;
}

interface Checkpoint {
    readonly cursor: Offset;
    readonly value: Erased;
    readonly failed: boolean;
    readonly evidence: Evidence | null;
    readonly diagnosticLength: number;
    readonly memoJournal: number;
    readonly choiceFrames: readonly {
        readonly frame: ChoiceFrame;
        readonly committed: boolean;
    }[];
    readonly lrStack: readonly Recursion[];
    readonly lrHeads: readonly (readonly [number, Head])[];
    readonly growthDepth: number;
    readonly recoveryDepth: number;
}

interface BaseDef {
    readonly effects: Effect;
    readonly step: Step;
}

interface PlainDef extends BaseDef {
    readonly kind: "plain" | "memo";
}

interface RuleDef extends BaseDef {
    readonly kind: "rule";
    readonly name: string;
    readonly body: () => Def;
}

type Def = PlainDef | RuleDef;
type Step = (run: Run) => void;

const enum CellState {
    Empty = "Empty",
    Evaluating = "Evaluating",
    Growing = "Growing",
    Done = "Done",
}

interface EmptyCell {
    readonly state: CellState.Empty;
}

interface EvaluatingCell {
    readonly state: CellState.Evaluating;
    readonly recursion: Recursion;
}

interface GrowingCell {
    readonly state: CellState.Growing;
    readonly answer: Answer;
    readonly head: Head;
}

interface DoneCell {
    readonly state: CellState.Done;
    readonly answer: Answer;
}

type Cell = EmptyCell | EvaluatingCell | GrowingCell | DoneCell;

interface Recursion {
    readonly rule: RuleDef;
    seed: Answer;
    head: Head | null;
}

interface Head {
    readonly entry: Offset;
    readonly root: RuleDef;
    readonly involved: Set<RuleDef>;
    evaluation: Set<RuleDef>;
    rounds: number;
}

const EMPTY_CELL: EmptyCell = Object.freeze({ state: CellState.Empty });

const parserDefs = new WeakMap<object, Def>();

function makeParser<T>(def: Def): Parser<T> {
    const parser = Object.freeze(Object.create(null)) as Parser<T>;
    parserDefs.set(parser, def);
    return parser;
}

function defOf<T>(parser: Parser<T>): Def {
    const def = parserDefs.get(parser);
    if (!def) throw new TypeError("Parser did not originate from this kernel");
    return def;
}

function plain<T>(step: Step, effects = Effect.None): Parser<T> {
    return makeParser<T>(Object.freeze({ kind: "plain", effects, step }));
}

function unionEffects(defs: readonly Def[]): Effect {
    return defs.reduce((all, def) => all | def.effects, Effect.None);
}

function emptyAnswer(entry: Offset, label: string): Answer {
    return {
        kind: "failure",
        cursorDelta: 0,
        value: undefined,
        evidence: { delta: 0, expected: [label] },
        diagnostics: [],
    };
}

class Run {
    cursor = offset(0);
    value: Erased = undefined;
    failed = false;
    evidence: Evidence | null = null;
    readonly diagnostics: Diagnostic[] = [];
    readonly choices: ChoiceFrame[] = [];
    rootCommitted = false;

    readonly memo = new Map<Def, Map<number, Cell>>();
    readonly memoUndo: (() => void)[] = [];

    readonly ruleMemo = new Map<RuleDef, Map<number, Cell>>();
    readonly lrStack: Recursion[] = [];
    readonly lrHeads = new Map<number, Head>();
    growthDepth = 0;
    recoveryDepth = 0;

    constructor(readonly source: string) {}

    checkpoint(): Checkpoint {
        return {
            cursor: this.cursor,
            value: this.value,
            failed: this.failed,
            evidence: this.evidence
                ? {
                      offset: this.evidence.offset,
                      expected: new Set(this.evidence.expected),
                  }
                : null,
            diagnosticLength: this.diagnostics.length,
            memoJournal: this.memoUndo.length,
            choiceFrames: this.choices.map(frame => ({
                frame,
                committed: frame.committed,
            })),
            lrStack: [...this.lrStack],
            lrHeads: [...this.lrHeads.entries()],
            growthDepth: this.growthDepth,
            recoveryDepth: this.recoveryDepth,
        };
    }

    restore(mark: Checkpoint): void {
        this.cursor = mark.cursor;
        this.value = mark.value;
        this.failed = mark.failed;
        this.evidence = mark.evidence
            ? {
                  offset: mark.evidence.offset,
                  expected: new Set(mark.evidence.expected),
              }
            : null;
        this.diagnostics.length = mark.diagnosticLength;

        while (this.memoUndo.length > mark.memoJournal) this.memoUndo.pop()?.();

        this.choices.length = 0;
        for (const saved of mark.choiceFrames) {
            saved.frame.committed = saved.committed;
            this.choices.push(saved.frame);
        }

        this.lrStack.length = 0;
        this.lrStack.push(...mark.lrStack);
        this.lrHeads.clear();
        for (const [key, head] of mark.lrHeads) this.lrHeads.set(key, head);
        this.growthDepth = mark.growthDepth;
        this.recoveryDepth = mark.recoveryDepth;
    }

    fail(label: string): void {
        this.failed = true;
        this.mergeEvidence({ offset: this.cursor, expected: new Set([label]) });
    }

    mergeEvidence(next: Evidence | null): void {
        if (!next) return;
        if (!this.evidence || numberOf(next.offset) > numberOf(this.evidence.offset)) {
            this.evidence = {
                offset: next.offset,
                expected: new Set(next.expected),
            };
            return;
        }
        if (next.offset === this.evidence.offset) {
            const expected = new Set(this.evidence.expected);
            for (const label of next.expected) expected.add(label);
            this.evidence = { offset: next.offset, expected };
        }
    }

    diagnostic(from: Evidence): Diagnostic {
        const at = numberOf(from.offset);
        return {
            offset: from.offset,
            expected: [...from.expected].sort(),
            found: this.source.slice(at, at + 20),
        };
    }

    cell(table: Map<Def, Map<number, Cell>>, def: Def, at: Offset): Cell {
        return table.get(def)?.get(numberOf(at)) ?? EMPTY_CELL;
    }

    setMemo(def: Def, at: Offset, cell: Cell): void {
        const key = numberOf(at);
        let row = this.memo.get(def);
        if (!row) {
            row = new Map();
            this.memo.set(def, row);
        }
        const previous = row.get(key);
        this.memoUndo.push(() => {
            if (previous) row?.set(key, previous);
            else row?.delete(key);
        });
        row.set(key, cell);
    }

    setRule(def: RuleDef, at: Offset, cell: Cell): void {
        const key = numberOf(at);
        let row = this.ruleMemo.get(def);
        if (!row) {
            row = new Map();
            this.ruleMemo.set(def, row);
        }
        row.set(key, cell);
    }
}

function mergeRelative(run: Run, entry: Offset, evidence: RelativeEvidence | null): void {
    if (!evidence) return;
    run.mergeEvidence({
        offset: offset(numberOf(entry) + evidence.delta),
        expected: new Set(evidence.expected),
    });
}

function applyAnswer(run: Run, entry: Offset, answer: Answer): void {
    run.cursor = offset(numberOf(entry) + answer.cursorDelta);
    run.value = answer.value;
    run.failed = answer.kind === "failure";
    mergeRelative(run, entry, answer.evidence);
    for (const diagnostic of answer.diagnostics) {
        const absolute: Evidence = {
            offset: offset(numberOf(entry) + diagnostic.delta),
            expected: new Set(diagnostic.expected),
        };
        run.diagnostics.push(run.diagnostic(absolute));
    }
}

function evaluateAnswer(run: Run, entry: Offset, def: Def): Answer {
    const callerCursor = run.cursor;
    const callerValue = run.value;
    const callerFailed = run.failed;
    const callerEvidence = run.evidence;
    const diagnosticStart = run.diagnostics.length;

    run.cursor = entry;
    run.value = undefined;
    run.failed = false;
    run.evidence = null;
    def.step(run);

    const localEvidence = currentEvidence(run);
    const answer: Answer = {
        kind: run.failed ? "failure" : "success",
        cursorDelta: numberOf(run.cursor) - numberOf(entry),
        value: run.value,
        evidence: localEvidence
            ? {
                  delta: numberOf(localEvidence.offset) - numberOf(entry),
                  expected: [...localEvidence.expected].sort(),
              }
            : null,
        diagnostics: run.diagnostics.slice(diagnosticStart).map(diagnostic => ({
            delta: numberOf(diagnostic.offset) - numberOf(entry),
            expected: diagnostic.expected,
        })),
    };

    run.cursor = callerCursor;
    run.value = callerValue;
    run.failed = callerFailed;
    run.evidence = callerEvidence;
    run.diagnostics.length = diagnosticStart;
    return answer;
}

function currentEvidence(run: Run): Evidence | null {
    return run.evidence;
}

function answerLength(answer: Answer): number {
    return answer.kind === "success" ? answer.cursorDelta : -1;
}

function setupRecursion(run: Run, recursion: Recursion): void {
    let head = recursion.head;
    if (!head) {
        head = {
            entry: run.cursor,
            root: recursion.rule,
            involved: new Set(),
            evaluation: new Set(),
            rounds: 0,
        };
        recursion.head = head;
    }

    for (let i = run.lrStack.length - 1; i >= 0; i -= 1) {
        const active = run.lrStack[i];
        active.head = head;
        if (active === recursion) break;
        head.involved.add(active.rule);
    }
}

function recallRule(run: Run, rule: RuleDef, entry: Offset): Cell {
    let cell = run.cell(run.ruleMemo, rule, entry);
    const head = run.lrHeads.get(numberOf(entry));
    if (!head) return cell;

    if (
        cell.state === CellState.Empty &&
        rule !== head.root &&
        !head.involved.has(rule)
    ) {
        return Object.freeze({
            state: CellState.Done,
            answer: emptyAnswer(entry, `<${rule.name}>`),
        });
    }

    if (head.evaluation.delete(rule)) {
        const answer = evaluateAnswer(run, entry, rule.body());
        cell = Object.freeze({ state: CellState.Growing, answer, head });
        run.setRule(rule, entry, cell);
    }
    return cell;
}

const MAX_GROWTH_ROUNDS = 10_000;

function finishGrowth(run: Run, head: Head, entry: Offset): Answer {
    const rootCell = run.cell(run.ruleMemo, head.root, entry);
    if (rootCell.state !== CellState.Growing) {
        throw new Error("left-recursion root lost its growing cell");
    }
    let best = rootCell.answer;
    if (answerLength(best) < 0) return best;

    run.lrHeads.set(numberOf(entry), head);
    run.growthDepth += 1;
    try {
        for (;;) {
            head.rounds += 1;
            if (head.rounds > MAX_GROWTH_ROUNDS) {
                return emptyAnswer(entry, `<${head.root.name}:growth-budget>`);
            }
            head.evaluation = new Set(head.involved);
            const candidate = evaluateAnswer(run, entry, head.root.body());
            if (answerLength(candidate) <= answerLength(best)) break;
            best = candidate;
            run.setRule(
                head.root,
                entry,
                Object.freeze({ state: CellState.Growing, answer: best, head }),
            );
        }
    } finally {
        run.growthDepth -= 1;
        run.lrHeads.delete(numberOf(entry));
    }

    for (const participant of [head.root, ...head.involved]) {
        const participantCell = run.cell(run.ruleMemo, participant, entry);
        if (
            participantCell.state === CellState.Growing ||
            participantCell.state === CellState.Evaluating
        ) {
            const answer =
                participantCell.state === CellState.Growing
                    ? participantCell.answer
                    : participantCell.recursion.seed;
            run.setRule(
                participant,
                entry,
                Object.freeze({ state: CellState.Done, answer }),
            );
        }
    }
    return best;
}

function applyRule(run: Run, rule: RuleDef): void {
    const entry = run.cursor;
    const recalled = recallRule(run, rule, entry);
    if (recalled.state === CellState.Done || recalled.state === CellState.Growing) {
        applyAnswer(run, entry, recalled.answer);
        return;
    }
    if (recalled.state === CellState.Evaluating) {
        setupRecursion(run, recalled.recursion);
        applyAnswer(run, entry, recalled.recursion.seed);
        return;
    }

    const recursion: Recursion = {
        rule,
        seed: emptyAnswer(entry, `<${rule.name}>`),
        head: null,
    };
    run.setRule(
        rule,
        entry,
        Object.freeze({ state: CellState.Evaluating, recursion }),
    );
    run.lrStack.push(recursion);

    let initial: Answer;
    try {
        initial = evaluateAnswer(run, entry, rule.body());
    } finally {
        const popped = run.lrStack.pop();
        if (popped !== recursion) throw new Error("left-recursion stack corruption");
    }
    recursion.seed = initial;

    if (!recursion.head) {
        run.setRule(rule, entry, Object.freeze({ state: CellState.Done, answer: initial }));
        applyAnswer(run, entry, initial);
        return;
    }

    run.setRule(
        rule,
        entry,
        Object.freeze({
            state: CellState.Growing,
            answer: initial,
            head: recursion.head,
        }),
    );
    const answer =
        recursion.head.root === rule
            ? finishGrowth(run, recursion.head, entry)
            : initial;
    applyAnswer(run, entry, answer);
}

function execute<T>(parser: Parser<T>, source: string, full: boolean): ParseResult<T> {
    const run = new Run(source);
    defOf(parser).step(run);
    if (!run.failed && full && numberOf(run.cursor) !== source.length) {
        run.fail("<end-of-input>");
    }

    if (run.failed) {
        const evidence = run.evidence ?? {
            offset: run.cursor,
            expected: new Set(["<parse>"]),
        };
        return {
            kind: "failure",
            offset: evidence.offset,
            expected: [...evidence.expected].sort(),
            committed: run.rootCommitted,
            diagnostics: [...run.diagnostics],
        };
    }
    return {
        kind: "success",
        value: reveal<T>(run.value),
        offset: run.cursor,
        diagnostics: [...run.diagnostics],
    };
}

export function parsePrefix<T>(parser: Parser<T>, source: string): ParseResult<T> {
    return execute(parser, source, false);
}

export function parseFull<T>(parser: Parser<T>, source: string): ParseResult<T> {
    return execute(parser, source, true);
}

export function succeed<T>(value: T): Parser<T> {
    return plain(run => {
        run.value = erase(value);
        run.failed = false;
    });
}

export function literal<const T extends string>(text: T): Parser<T> {
    return plain(run => {
        const start = numberOf(run.cursor);
        if (!run.source.startsWith(text, start)) {
            run.fail(JSON.stringify(text));
            return;
        }
        run.cursor = offset(start + text.length);
        run.value = erase(text);
        run.failed = false;
    });
}

export function map<T, U>(parser: Parser<T>, transform: (value: T) => U): Parser<U> {
    const def = defOf(parser);
    return plain(
        run => {
            def.step(run);
            if (!run.failed) run.value = erase(transform(reveal<T>(run.value)));
        },
        def.effects,
    );
}

export function sequence<const T extends readonly Erased[]>(
    ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<T> {
    const defs = parsers.map(defOf);
    return plain(
        run => {
            const values: Erased[] = [];
            for (const def of defs) {
                def.step(run);
                if (run.failed) return;
                values.push(run.value);
            }
            run.value = erase(values);
        },
        unionEffects(defs),
    );
}

export function choice<const T extends readonly Erased[]>(
    ...alternatives: { [K in keyof T]: Parser<T[K]> }
): Parser<T[number]> {
    if (alternatives.length === 0) throw new TypeError("choice requires an alternative");
    const defs = alternatives.map(defOf);
    return plain(
        run => {
            const frame: ChoiceFrame = { committed: false };
            run.choices.push(frame);
            const entry = run.checkpoint();
            let combined: Evidence | null = null;
            try {
                for (const def of defs) {
                    def.step(run);
                    if (!run.failed) return;
                    combined = combineEvidence(combined, run.evidence);
                    if (frame.committed) {
                        if (run.choices.length === 1) run.rootCommitted = true;
                        return;
                    }
                    run.restore(entry);
                }
                run.failed = true;
                run.mergeEvidence(combined);
            } finally {
                const index = run.choices.lastIndexOf(frame);
                if (index >= 0) run.choices.splice(index, 1);
            }
        },
        unionEffects(defs),
    );
}

function combineEvidence(left: Evidence | null, right: Evidence | null): Evidence | null {
    if (!left) return right;
    if (!right) return left;
    if (numberOf(left.offset) > numberOf(right.offset)) return left;
    if (numberOf(right.offset) > numberOf(left.offset)) return right;
    return {
        offset: left.offset,
        expected: new Set([...left.expected, ...right.expected]),
    };
}

/** Commit only the nearest enclosing choice after `parser` succeeds. */
export function commit<T>(parser: Parser<T>): Parser<T> {
    const def = defOf(parser);
    return plain(
        run => {
            def.step(run);
            const frame = run.choices.at(-1);
            if (!run.failed && frame) frame.committed = true;
        },
        def.effects | Effect.Cut,
    );
}

export function many<T>(parser: Parser<T>): Parser<readonly T[]> {
    const def = defOf(parser);
    return plain(
        run => {
            const values: T[] = [];
            for (;;) {
                const frame: ChoiceFrame = { committed: false };
                run.choices.push(frame);
                const mark = run.checkpoint();
                const start = run.cursor;
                try {
                    def.step(run);
                    if (run.failed) {
                        if (frame.committed) return;
                        run.restore(mark);
                        run.failed = false;
                        run.value = erase(values);
                        return;
                    }
                    if (run.cursor === start) {
                        run.fail("<progress>");
                        return;
                    }
                    values.push(reveal<T>(run.value));
                } finally {
                    const index = run.choices.lastIndexOf(frame);
                    if (index >= 0) run.choices.splice(index, 1);
                }
            }
        },
        def.effects,
    );
}

/** Convert failure to a value while retaining a structured diagnostic. */
export function recover<T, U>(parser: Parser<T>, fallback: U): Parser<T | U> {
    const def = defOf(parser);
    return plain(
        run => {
            const mark = run.checkpoint();
            run.recoveryDepth += 1;
            try {
                def.step(run);
                if (!run.failed) return;
                const evidence = run.evidence ?? {
                    offset: run.cursor,
                    expected: new Set(["<recovery>"]),
                };
                const diagnostic = run.diagnostic(evidence);
                run.restore(mark);
                run.diagnostics.push(diagnostic);
                run.mergeEvidence(evidence);
                run.failed = false;
                run.value = erase(fallback);
            } finally {
                run.recoveryDepth = mark.recoveryDepth;
            }
        },
        def.effects | Effect.Diagnostic,
    );
}

export interface MemoOptions {
    /** Diagnostic effects must be consciously replayed; cut effects are never memoizable. */
    readonly effects?: "reject" | "replay";
}

export function memo<T>(parser: Parser<T>, options: MemoOptions = {}): Parser<T> {
    const inner = defOf(parser);
    if (inner.kind === "rule") {
        throw new TypeError("rules are already memoized by the left-recursion engine");
    }
    if ((inner.effects & Effect.Cut) !== 0) {
        throw new TypeError("memo cannot cache a parser that may cut a choice frame");
    }
    const policy = options.effects ?? "reject";
    if ((inner.effects & Effect.Diagnostic) !== 0 && policy !== "replay") {
        throw new TypeError("effectful memo requires { effects: \"replay\" }");
    }

    let def: PlainDef;
    const step: Step = run => {
        const entry = run.cursor;
        const cell = run.cell(run.memo, def, entry);
        if (cell.state === CellState.Done) {
            applyAnswer(run, entry, cell.answer);
            return;
        }
        if (cell.state !== CellState.Empty) {
            run.fail("<left-recursion-requires-rule>");
            return;
        }

        const recursion: Recursion = {
            rule: Object.freeze({
                kind: "rule",
                name: "memo",
                effects: inner.effects,
                body: () => inner,
                step: () => undefined,
            }),
            seed: emptyAnswer(entry, "<memo>"),
            head: null,
        };
        run.setMemo(
            def,
            entry,
            Object.freeze({ state: CellState.Evaluating, recursion }),
        );
        const answer = evaluateAnswer(run, entry, inner);
        run.setMemo(def, entry, Object.freeze({ state: CellState.Done, answer }));
        applyAnswer(run, entry, answer);
    };
    def = Object.freeze({ kind: "memo", effects: inner.effects, step });
    return makeParser<T>(def);
}

/** Define a named, packrat-memoized rule. The thunk may refer to the returned parser. */
export function rule<T>(name: string, body: () => Parser<T>): Parser<T> {
    let cached: Def | undefined;
    let def: RuleDef;
    const resolved = (): Def => {
        cached ??= defOf(body());
        return cached;
    };
    def = Object.freeze({
        kind: "rule",
        name,
        effects: Effect.None,
        body: resolved,
        step: (run: Run) => applyRule(run, def),
    });
    return makeParser<T>(def);
}
