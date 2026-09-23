export type Fault = Readonly<{ kind: "Nesting" | "Progress"; offset: number }>;
type CommonMetrics = Readonly<{ choicePeak: number }>;
export type Metrics =
    | (CommonMetrics & Readonly<{
        kind: "V"; dispatches: number; calls: number;
        instructionPeak: number; callPeak: number;
    }>)
    | (CommonMetrics & Readonly<{
        kind: "K"; bounces: number; continuationPeak: number;
        transientAllocations: number; executionContainers: number;
    }>);
export type Outcome = Readonly<{
    status: "success" | "mismatch" | "fault"; offset: number; nodes: number;
    furthest: number; expected: readonly string[]; work: number;
    liveDepth: number; maxDepth: number; fault?: Fault; metrics: Metrics;
}>;
export type Grammar<P> = Readonly<{
    literal(text: string): P; seq(...members: P[]): P;
    choice(...arms: P[]): P; lazy(get: () => P): P;
}>;
export type Fixture = <P>(grammar: Grammar<P>) => P;
export type Kernel = Readonly<{
    parse(source: string, depthLimit?: number): Outcome; constructionUnits: number;
    retainedBytes: number | undefined;
}>;
const enum Op { Literal, Seq, Choice, Call, Return, Accept, Fail }
type VNode =
    | { kind: Op.Literal; text: string }
    | { kind: Op.Seq | Op.Choice; children: number[] }
    | { kind: Op.Call; get: () => number; target?: number };

const joinExpected = (
    expected: string[], offset: number, label: string, frontier: { value: number },
) => {
    if (offset > frontier.value) {
        frontier.value = offset;
        expected.length = 0;
        expected.push(label);
    } else if (offset === frontier.value && !expected.includes(label)) {
        expected.push(label);
    }
};

export function buildV(fixture: Fixture): Kernel {
    const nodes: VNode[] = [];
    const grammar: Grammar<number> = {
        literal(text) {
            nodes.push({ kind: Op.Literal, text });
            return nodes.length - 1;
        },
        seq(...children) {
            nodes.push({ kind: Op.Seq, children });
            return nodes.length - 1;
        },
        choice(...children) {
            nodes.push({ kind: Op.Choice, children });
            return nodes.length - 1;
        },
        lazy(get) {
            nodes.push({ kind: Op.Call, get });
            return nodes.length - 1;
        },
    };
    const root = fixture(grammar);
    for (const node of nodes) if (node.kind === Op.Call) node.target = node.get();

    const addresses = new Int32Array(nodes.length);
    let size = 2;
    for (let i = 0; i < nodes.length; i++) {
        addresses[i] = size;
        const node = nodes[i];
        size += node.kind === Op.Literal
            ? 3
            : node.kind === Op.Seq
                ? node.children.length + 2
                : node.kind === Op.Choice
                    ? node.children.length * 2 + 1
                    : 2;
    }
    const ops = new Int32Array(size);
    const operands = new Int32Array(size);
    const literals: string[] = [];
    let pc = 0;
    ops[pc] = Op.Call; operands[pc++] = addresses[root];
    ops[pc++] = Op.Accept;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.kind === Op.Literal) {
            const literal = literals.push(node.text) - 1;
            ops[pc] = Op.Literal; operands[pc++] = literal;
            ops[pc] = Op.Fail; operands[pc++] = literal;
            ops[pc++] = Op.Return;
        } else if (node.kind === Op.Seq) {
            ops[pc] = Op.Seq; operands[pc++] = node.children.length;
            for (const child of node.children) {
                ops[pc] = Op.Call; operands[pc++] = addresses[child];
            }
            ops[pc++] = Op.Return;
        } else if (node.kind === Op.Choice) {
            ops[pc] = Op.Choice; operands[pc++] = node.children.length;
            for (const child of node.children) {
                ops[pc] = Op.Call; operands[pc++] = addresses[child];
                ops[pc] = Op.Return; operands[pc++] = 1;
            }
        } else {
            const lazy = node as Extract<VNode, { kind: Op.Call }>;
            ops[pc] = Op.Call; operands[pc++] = -addresses[lazy.target!] - 1;
            ops[pc++] = Op.Return;
        }
    }
    const retainedBytes = ops.byteLength + operands.byteLength
        + literals.reduce((sum, text) => sum + text.length * 2, 0);

    return {
        constructionUnits: nodes.length,
        retainedBytes,
        parse(source, depthLimit = Number.POSITIVE_INFINITY): Outcome {
            const instruction: number[] = [0];
            const returns: number[] = [];
            const recursive: number[] = [];
            const choices: number[] = [];
            const progress: number[] = [0];
            const expected: string[] = [];
            const frontier = { value: -1 };
            let cursor = 0, nodesOut = 0, work = 0, liveDepth = 1, maxDepth = 1;
            let dispatches = 0, calls = 0, instructionPeak = 1, callPeak = 0;
            let choicePeak = 0, status = 0;
            let fault: Fault | undefined;

            while (instruction.length && status === 0) {
                const at = instruction.pop()!;
                dispatches++;
                switch (ops[at]) {
                    case Op.Literal: {
                        work++;
                        const text = literals[operands[at]];
                        if (source.startsWith(text, cursor)) {
                            cursor += text.length;
                            nodesOut++;
                            instruction.push(at + 2);
                        } else {
                            instruction.push(at + 1);
                        }
                        break;
                    }
                    case Op.Seq:
                        instruction.push(at + 1);
                        break;
                    case Op.Choice:
                        choices.push(at, 0, operands[at], cursor, nodesOut,
                            returns.length, liveDepth);
                        choicePeak = Math.max(choicePeak, choices.length / 7);
                        instruction.push(at + 1);
                        break;
                    case Op.Call: {
                        calls++;
                        let target = operands[at];
                        const isRecursive = target < 0;
                        if (isRecursive) {
                            target = -target - 1;
                            if (liveDepth >= depthLimit) {
                                fault = { kind: "Nesting", offset: cursor };
                                status = 3;
                                break;
                            }
                            if (cursor <= progress[progress.length - 1]) {
                                fault = { kind: "Progress", offset: cursor };
                                status = 3;
                                break;
                            }
                            progress.push(cursor);
                            liveDepth++;
                            maxDepth = Math.max(maxDepth, liveDepth);
                        }
                        returns.push(at + 1);
                        recursive.push(isRecursive ? 1 : 0);
                        callPeak = Math.max(callPeak, returns.length);
                        instruction.push(target);
                        break;
                    }
                    case Op.Return: {
                        if (operands[at] === 1) choices.length -= 7;
                        const wasRecursive = recursive.pop();
                        const next = returns.pop();
                        if (wasRecursive) {
                            progress.pop();
                            liveDepth--;
                        }
                        if (next === undefined) status = 1;
                        else instruction.push(next);
                        break;
                    }
                    case Op.Accept:
                        status = 1;
                        break;
                    case Op.Fail: {
                        joinExpected(
                            expected,
                            cursor,
                            JSON.stringify(literals[operands[at]]),
                            frontier,
                        );
                        let resumed = false;
                        while (choices.length) {
                            const base = choices.length - 7;
                            const nextArm = choices[base + 1] + 1;
                            while (returns.length > choices[base + 5]) {
                                if (recursive.pop()) progress.pop();
                                returns.pop();
                            }
                            cursor = choices[base + 3];
                            nodesOut = choices[base + 4];
                            liveDepth = choices[base + 6];
                            progress.length = liveDepth;
                            if (nextArm < choices[base + 2]) {
                                choices[base + 1] = nextArm;
                                instruction.length = 0;
                                instruction.push(choices[base] + 1 + nextArm * 2);
                                resumed = true;
                                break;
                            }
                            choices.length = base;
                        }
                        if (!resumed) {
                            cursor = 0;
                            nodesOut = 0;
                            liveDepth = 0;
                            status = 2;
                        }
                        break;
                    }
                }
                instructionPeak = Math.max(instructionPeak, instruction.length);
            }
            if (status === 1 || status === 3) liveDepth = 0;
            return {
                status: status === 1 ? "success" : status === 2 ? "mismatch" : "fault",
                offset: cursor, nodes: nodesOut, furthest: frontier.value, expected,
                work, liveDepth, maxDepth, ...(fault ? { fault } : {}),
                metrics: {
                    kind: "V", dispatches, calls, instructionPeak, callPeak, choicePeak,
                },
            };
        },
    };
}

type KBounce = (run: KRun) => KBounce | undefined;
type KNode = Readonly<{ entry: KBounce }>;
type KRun = {
    source: string; cursor: number; nodes: number; expected: string[];
    frontier: { value: number }; work: number; liveDepth: number; maxDepth: number;
    depthLimit: number; progress: number[]; success: KBounce[];
    mismatch: KBounce[]; choices: number[]; continuationPeak: number;
    choicePeak: number; status: 0 | 1 | 2 | 3; fault?: Fault;
};
const kSuccess: KBounce = (run) => {
    run.mismatch.pop(); return run.success.pop();
};
const kMismatch: KBounce = (run) => {
    run.success.pop(); return run.mismatch.pop();
};
const kAccept: KBounce = (run) => {
    run.liveDepth = 0; run.status = 1; return undefined;
};
const kReject: KBounce = (run) => {
    run.cursor = 0; run.nodes = 0; run.liveDepth = 0;
    run.status = 2; return undefined;
};
const kFault: KBounce = (run) => {
    run.liveDepth = 0; run.status = 3; return undefined;
};
const invoke = (run: KRun, node: KNode, ok: KBounce, bad: KBounce) => {
    run.success.push(ok);
    run.mismatch.push(bad);
    run.continuationPeak = Math.max(run.continuationPeak, run.success.length);
    return node.entry;
};

export function buildK(fixture: Fixture): Kernel {
    const deferred: Array<() => void> = [];
    let constructionUnits = 0;
    const grammar: Grammar<KNode> = {
        literal(text) {
            constructionUnits++;
            return {
                entry(run) {
                    run.work++;
                    if (run.source.startsWith(text, run.cursor)) {
                        run.cursor += text.length;
                        run.nodes++;
                        return kSuccess;
                    }
                    joinExpected(run.expected, run.cursor, JSON.stringify(text), run.frontier);
                    return kMismatch;
                },
            };
        },
        seq(...members) {
            constructionUnits += members.length + 1;
            const after: KBounce[] = [];
            for (let i = members.length - 1; i >= 0; i--) {
                after[i] = i + 1 === members.length
                    ? kSuccess
                    : (run) => invoke(run, members[i + 1], after[i + 1], kMismatch);
            }
            return {
                entry: members.length
                    ? (run) => invoke(run, members[0], after[0], kMismatch)
                    : kSuccess,
            };
        },
        choice(...arms) {
            constructionUnits += 3;
            let accept!: KBounce;
            let retry!: KBounce;
            accept = (run) => {
                run.choices.length -= 5;
                return kSuccess;
            };
            retry = (run) => {
                const base = run.choices.length - 5;
                const next = run.choices[base] + 1;
                run.cursor = run.choices[base + 1];
                run.nodes = run.choices[base + 2];
                run.liveDepth = run.choices[base + 3];
                run.progress.length = run.choices[base + 4];
                if (next < arms.length) {
                    run.choices[base] = next;
                    return invoke(run, arms[next], accept, retry);
                }
                run.choices.length = base;
                return kMismatch;
            };
            return {
                entry(run) {
                    if (!arms.length) return kMismatch;
                    run.choices.push(0, run.cursor, run.nodes, run.liveDepth, run.progress.length);
                    run.choicePeak = Math.max(run.choicePeak, run.choices.length / 5);
                    return invoke(run, arms[0], accept, retry);
                },
            };
        },
        lazy(get) {
            constructionUnits += 3;
            let target!: KNode;
            deferred.push(() => { target = get(); });
            const leaveSuccess: KBounce = (run) => {
                run.progress.pop();
                run.liveDepth--;
                return kSuccess;
            };
            const leaveMismatch: KBounce = (run) => {
                run.progress.pop();
                run.liveDepth--;
                return kMismatch;
            };
            return {
                entry(run) {
                    if (run.liveDepth >= run.depthLimit) {
                        run.fault = { kind: "Nesting", offset: run.cursor };
                        return kFault;
                    }
                    if (run.cursor <= run.progress[run.progress.length - 1]) {
                        run.fault = { kind: "Progress", offset: run.cursor };
                        return kFault;
                    }
                    run.progress.push(run.cursor);
                    run.liveDepth++;
                    run.maxDepth = Math.max(run.maxDepth, run.liveDepth);
                    return invoke(run, target, leaveSuccess, leaveMismatch);
                },
            };
        },
    };
    const root = fixture(grammar);
    for (const resolve of deferred) resolve();

    return {
        constructionUnits,
        retainedBytes: undefined,
        parse(source, depthLimit = Number.POSITIVE_INFINITY): Outcome {
            const run: KRun = {
                source,
                cursor: 0,
                nodes: 0,
                expected: [],
                frontier: { value: -1 },
                work: 0,
                liveDepth: 1,
                maxDepth: 1,
                depthLimit,
                progress: [0],
                success: [kAccept],
                mismatch: [kReject],
                choices: [],
                continuationPeak: 1,
                choicePeak: 0,
                status: 0,
            };
            let bounce: KBounce | undefined = root.entry;
            let bounces = 0;
            while (bounce) {
                bounces++;
                bounce = bounce(run);
            }
            return {
                status: run.status === 1 ? "success" : run.status === 2 ? "mismatch" : "fault",
                offset: run.cursor, nodes: run.nodes, furthest: run.frontier.value,
                expected: run.expected, work: run.work, liveDepth: run.liveDepth,
                maxDepth: run.maxDepth, ...(run.fault ? { fault: run.fault } : {}),
                metrics: {
                    kind: "K", bounces, continuationPeak: run.continuationPeak,
                    choicePeak: run.choicePeak, transientAllocations: 6,
                    executionContainers: 6,
                },
            };
        },
    };
}
