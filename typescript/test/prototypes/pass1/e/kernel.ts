type LiteralValue = string | number | boolean | undefined;

export interface Span {
    start: number;
    end: number;
}

type Evidence = {
    ok: boolean;
    offset: number;
    furthest: number;
    work: number;
    eventCount: number;
    journalPeak: number;
};

export type Projected<T> =
    | (Evidence & { ok: true; value: T })
    | (Evidence & { ok: false; value: undefined });

const CAPTURE = 1;
const CHOICE = 2;
const SELECT = 3;

class Journal {
    readonly kind: number[] = [];
    readonly start: number[] = [];
    readonly end: number[] = [];
    readonly slot: number[] = [];
    peak = 0;

    get length(): number {
        return this.kind.length;
    }

    push(kind: number, start: number, end: number, slot: number): void {
        this.kind.push(kind);
        this.start.push(start);
        this.end.push(end);
        this.slot.push(slot);
        if (this.kind.length > this.peak) this.peak = this.kind.length;
    }

    truncate(length: number): void {
        this.kind.length = length;
        this.start.length = length;
        this.end.length = length;
        this.slot.length = length;
    }
}

type Run = {
    readonly source: string;
    readonly journal: Journal | undefined;
    offset: number;
    furthest: number;
    work: number;
    scalar: number;
};

type Projection = { journal: Journal; at: number };

export interface Kernel<T> {
    readonly recognize: (run: Run, retain: boolean) => boolean;
    readonly project: (projection: Projection) => T;
}

type Values<P extends readonly Kernel<unknown>[]> = {
    [K in keyof P]: P[K] extends Kernel<infer T> ? T : never;
};
type ChoiceValue<P extends readonly Kernel<unknown>[]> =
    P[number] extends Kernel<infer T> ? T : never;

function fail(run: Run, offset: number): false {
    if (offset > run.furthest) run.furthest = offset;
    return false;
}

function rollback(
    run: Run,
    offset: number,
    scalar: number,
    events: number,
): void {
    run.offset = offset;
    run.scalar = scalar;
    run.journal?.truncate(events);
}

function event(projection: Projection, expected: number): number {
    const at = projection.at++;
    if (projection.journal.kind[at] !== expected) {
        throw new Error("projection journal does not match its recognizer");
    }
    return at;
}

export function literal<const T extends LiteralValue>(
    text: string,
    value: T,
    eagerScalar?: number,
): Kernel<T> {
    return {
        recognize(run) {
            const start = run.offset;
            let index = 0;
            while (
                index < text.length &&
                run.source.charCodeAt(start + index) === text.charCodeAt(index)
            ) {
                index++;
            }
            run.work += Math.max(1, index + (index < text.length ? 1 : 0));
            if (index !== text.length) return fail(run, start + index);
            run.offset = start + index;
            if (eagerScalar !== undefined) run.scalar = eagerScalar;
            return true;
        },
        project: () => value,
    };
}

export function seq<const P extends readonly Kernel<unknown>[]>(
    ...parsers: P
): Kernel<Values<P>> {
    return {
        recognize(run, retain) {
            const offset = run.offset;
            const scalar = run.scalar;
            const events = run.journal?.length ?? 0;
            for (let index = 0; index < parsers.length; index++) {
                if (!parsers[index].recognize(run, retain)) {
                    rollback(run, offset, scalar, events);
                    return false;
                }
            }
            return true;
        },
        project(projection) {
            return parsers.map(parser =>
                parser.project(projection)) as unknown as Values<P>;
        },
    };
}

export function choice<const P extends readonly Kernel<unknown>[]>(
    ...parsers: P
): Kernel<ChoiceValue<P>> {
    return {
        recognize(run, retain) {
            const offset = run.offset;
            const scalar = run.scalar;
            const events = run.journal?.length ?? 0;
            for (let index = 0; index < parsers.length; index++) {
                rollback(run, offset, scalar, events);
                if (retain) run.journal!.push(CHOICE, offset, offset, index);
                if (parsers[index].recognize(run, retain)) {
                    if (retain) run.journal!.end[events] = run.offset;
                    return true;
                }
            }
            rollback(run, offset, scalar, events);
            return false;
        },
        project(projection) {
            const at = event(projection, CHOICE);
            return parsers[projection.journal.slot[at]].project(
                projection,
            ) as ChoiceValue<P>;
        },
    };
}

export function capture(parser: Kernel<unknown>): Kernel<Span> {
    return {
        recognize(run, retain) {
            const start = run.offset;
            const scalar = run.scalar;
            if (!parser.recognize(run, false)) {
                run.scalar = scalar;
                return false;
            }
            if (retain) run.journal!.push(CAPTURE, start, run.offset, 0);
            return true;
        },
        project(projection) {
            const at = event(projection, CAPTURE);
            return {
                start: projection.journal.start[at],
                end: projection.journal.end[at],
            };
        },
    };
}

export function select<const P extends readonly Kernel<unknown>[]>(
    register: Kernel<unknown>,
    prebuilt: P,
): Kernel<ChoiceValue<P>> {
    return {
        recognize(run, retain) {
            const offset = run.offset;
            const scalar = run.scalar;
            const events = run.journal?.length ?? 0;
            run.scalar = -1;
            if (!register.recognize(run, false)) {
                rollback(run, offset, scalar, events);
                return false;
            }
            const selected = run.scalar;
            if (retain && selected >= 0 && selected < prebuilt.length) {
                run.journal!.push(SELECT, offset, offset, selected);
            }
            if (
                !Number.isInteger(selected) ||
                selected < 0 ||
                selected >= prebuilt.length ||
                !prebuilt[selected].recognize(run, retain)
            ) {
                if (selected < 0 || selected >= prebuilt.length) {
                    fail(run, run.offset);
                }
                rollback(run, offset, scalar, events);
                return false;
            }
            if (retain) run.journal!.end[events] = run.offset;
            return true;
        },
        project(projection) {
            const at = event(projection, SELECT);
            return prebuilt[projection.journal.slot[at]].project(
                projection,
            ) as ChoiceValue<P>;
        },
    };
}

function evidence(run: Run, ok: boolean): Evidence {
    return {
        ok,
        offset: run.offset,
        furthest: run.furthest,
        work: run.work,
        eventCount: run.journal?.length ?? 0,
        journalPeak: run.journal?.peak ?? 0,
    };
}

export function runProjected<T>(parser: Kernel<T>, source: string): Projected<T> {
    const journal = new Journal();
    const run: Run = {
        source,
        journal,
        offset: 0,
        furthest: -1,
        work: 0,
        scalar: -1,
    };
    const ok = parser.recognize(run, true);
    if (!ok) return { ...evidence(run, false), ok: false, value: undefined };
    const projection: Projection = { journal, at: 0 };
    const value = parser.project(projection);
    if (projection.at !== journal.length) {
        throw new Error("projection left unconsumed journal events");
    }
    return { ...evidence(run, true), ok: true, value };
}

export function runRecognition(parser: Kernel<unknown>, source: string): Evidence {
    const run: Run = {
        source,
        journal: undefined,
        offset: 0,
        furthest: -1,
        work: 0,
        scalar: -1,
    };
    return evidence(run, parser.recognize(run, false));
}
