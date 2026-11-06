import {
    VisibleChoices,
    clearControl,
    commitFailure,
    type ChoiceFrame,
    type ManyFrame,
    type RecoverFrame,
} from "./control.js";
import { DebugRecorder, verifyDebugReport } from "./debug.js";
import { TransactionJournal, type MemoAddress } from "./journal.js";
import {
    abort as abortHead,
    accept as acceptParticipant,
    createHead,
    nextWork,
    participantCount,
    publishAndClose,
    read as readParticipant,
    rootAnswer,
    type Head,
    type Participant,
} from "./lr.js";
import { idNumber, type MapCallback, type NodeId, type SealedGraph } from "./model.js";
import {
    applyRelative,
    evidence,
    mergeEvidence,
    mismatch,
    prependDiagnostics,
    relativize,
    resource,
    type Failure,
    type Outcome,
    type Success,
} from "./outcome.js";
import { openInvocation } from "./parser.js";
import {
    offsetNumber,
    sourceOffset,
    utf16Offset,
    type DebugCensus,
    type DebugReport,
    type Diagnostic,
    type ParseOptions,
    type ParseResult,
    type Parser,
    type Utf16Offset,
} from "./types.js";

type Frame =
    | { readonly kind: "map"; readonly callback: MapCallback }
    | {
          readonly kind: "sequence";
          readonly children: readonly NodeId[];
          readonly index: number;
          readonly values: readonly unknown[];
          readonly diagnostics: readonly Diagnostic[];
      }
    | ChoiceFrame
    | ManyFrame
    | { readonly kind: "commit" }
    | RecoverFrame
    | { readonly kind: "memo"; readonly address: MemoAddress }
    | {
          readonly kind: "head-return";
          readonly head: Head;
          readonly parentHead: Head | undefined;
          readonly parentParticipant: Participant | undefined;
          readonly control: number | null;
      }
    | { readonly kind: "participant-return"; readonly head: Head; readonly participant: Participant };

interface Counters {
    nextHead: number;
    nextCallback: number;
}

function activeMemoCount(active: ReadonlyMap<NodeId, ReadonlySet<Utf16Offset>>): number {
    let count = 0;
    for (const row of active.values()) count += row.size;
    return count;
}

function memoActive(active: ReadonlyMap<NodeId, ReadonlySet<Utf16Offset>>, address: MemoAddress): boolean {
    return active.get(address.node)?.has(address.offset) ?? false;
}

function addMemo(active: Map<NodeId, Set<Utf16Offset>>, address: MemoAddress): void {
    let row = active.get(address.node);
    if (!row) {
        row = new Set();
        active.set(address.node, row);
    }
    row.add(address.offset);
}

function deleteMemo(active: Map<NodeId, Set<Utf16Offset>>, address: MemoAddress): void {
    const row = active.get(address.node);
    row?.delete(address.offset);
    if (row?.size === 0) active.delete(address.node);
}

function publicResult<T>(outcome: Outcome, debug: DebugReport): ParseResult<T> {
    if (outcome.kind === "success") {
        return {
            kind: "success",
            value: outcome.value as T,
            offset: outcome.next,
            diagnostics: Object.freeze([...outcome.diagnostics]),
            debug,
        };
    }
    if (outcome.kind === "resource") {
        return {
            kind: "resource",
            resource: outcome.resource,
            offset: outcome.evidence.offset,
            expected: Object.freeze([...outcome.evidence.expected]),
            diagnostics: Object.freeze([...outcome.diagnostics]),
            debug,
        };
    }
    return {
        kind: "failure",
        offset: outcome.evidence.offset,
        expected: Object.freeze([...outcome.evidence.expected]),
        committed: outcome.control !== null || outcome.evidence.committedOwner !== null,
        diagnostics: Object.freeze([...outcome.diagnostics]),
        debug,
    };
}

function run<T>(
    parser: Parser<T>,
    source: string,
    full: boolean,
    options: ParseOptions,
): ParseResult<T> {
    if (typeof source !== "string") throw new TypeError("source must be a string");
    const maxSteps = options.maxSteps ?? 20_000_000;
    if (!Number.isSafeInteger(maxSteps) || maxSteps <= 0) {
        throw new RangeError("maxSteps must be a positive safe integer");
    }
    const { graph, node: root } = openInvocation(parser);
    const debug = new DebugRecorder(options.trace ?? false);
    const journal = new TransactionJournal(debug);
    const choices = new VisibleChoices(debug);
    const activeMemo = new Map<NodeId, Set<Utf16Offset>>();
    const heads: Head[] = [];
    const frames: Frame[] = [];
    const counters: Counters = { nextHead: 1, nextCallback: 1 };
    let currentHead: Head | undefined;
    let currentParticipant: Participant | undefined;
    let nodeId = root;
    let entry = sourceOffset(0, source);
    let control: number | null = null;
    let outcome: Outcome | null = null;

    const push = (frame: Frame): void => {
        frames.push(frame);
        debug.continuationHighWater = Math.max(debug.continuationHighWater, frames.length);
    };
    const descend = (child: NodeId, at: Utf16Offset, token: number | null): void => {
        nodeId = child;
        entry = at;
        control = token;
        outcome = null;
    };
    const popHead = (head: Head): void => {
        if (heads.at(-1) !== head) throw new Error(`Unbalanced head ${head.id}`);
        heads.pop();
    };
    const schedule = (head: Head): void => {
        const participant = nextWork(head, debug);
        if (!participant) {
            const answer = rootAnswer(head);
            publishAndClose(head, journal, debug);
            popHead(head);
            outcome = answer;
            return;
        }
        const rule = graph.rules[idNumber(participant.rule)];
        if (!rule) {
            outcome = resource(participant.entry, "invariant", `<missing-rule:${idNumber(participant.rule)}>`);
            return;
        }
        currentHead = head;
        currentParticipant = participant;
        push({ kind: "participant-return", head, participant });
        descend(rule.body, participant.entry, null);
    };
    const abortOneHead = (head: Head, reason: string): void => {
        if (heads.at(-1) === head) {
            abortHead(head, debug, reason);
            heads.pop();
        }
    };
    const cleanupFrame = (frame: Frame, reason: string): void => {
        switch (frame.kind) {
            case "choice":
                journal.rollback(frame.transaction);
                choices.abort(frame.owner);
                break;
            case "many":
            case "recover":
                journal.rollback(frame.transaction);
                break;
            case "memo":
                deleteMemo(activeMemo, frame.address);
                break;
            case "participant-return":
                abortOneHead(frame.head, reason);
                break;
            case "head-return":
                currentHead = frame.parentHead;
                currentParticipant = frame.parentParticipant;
                break;
            case "map":
            case "sequence":
            case "commit":
                break;
        }
    };
    const census = (): DebugCensus => ({
        liveFrames: frames.length,
        liveChoices: choices.depth,
        liveTransactions: journal.depth,
        liveHeads: heads.length,
        liveParticipants: heads.reduce((sum, head) => sum + participantCount(head), 0),
        journalEntries: journal.length,
        nonterminalMemoCells: activeMemoCount(activeMemo),
        nonterminalRuleCells: 0,
        memoDoneCells: journal.memoDoneCells,
        ruleDoneCells: journal.ruleDoneCells,
    });
    const terminalReport = (): DebugReport => {
        const report = debug.report(census());
        if (!verifyDebugReport(report)) throw new Error("Terminal debug proof did not balance");
        return report;
    };

    try {
        for (;;) {
            if (!outcome) {
                debug.steps += 1;
                if (debug.steps > maxSteps) {
                    debug.emit({ kind: "resource", reason: "step-budget" });
                    outcome = resource(entry, "step-budget", "<step-budget>");
                } else {
                    const node = graph.nodes[idNumber(nodeId)];
                    if (!node) {
                        outcome = resource(entry, "invariant", `<missing-node:${idNumber(nodeId)}>`);
                    } else {
                        switch (node.kind) {
                            case "epsilon":
                                outcome = { kind: "success", value: node.value, next: entry, diagnostics: [], control };
                                break;
                            case "literal":
                                outcome = source.startsWith(node.text, offsetNumber(entry))
                                    ? { kind: "success", value: node.text, next: sourceOffset(offsetNumber(entry) + node.text.length, source), diagnostics: [], control }
                                    : mismatch(entry, JSON.stringify(node.text), control);
                                break;
                            case "map":
                                push({ kind: "map", callback: node.callback });
                                descend(node.child, entry, control);
                                break;
                            case "sequence": {
                                const first = node.children[0];
                                if (first === undefined) {
                                    outcome = { kind: "success", value: [], next: entry, diagnostics: [], control };
                                } else {
                                    push({ kind: "sequence", children: node.children, index: 0, values: [], diagnostics: [] });
                                    descend(first, entry, control);
                                }
                                break;
                            }
                            case "choice": {
                                const owner = choices.open();
                                const transaction = journal.begin();
                                push({ kind: "choice", children: node.children, index: 0, entry, incomingControl: control, owner, transaction, combined: null });
                                descend(node.children[0] as NodeId, entry, control);
                                break;
                            }
                            case "many": {
                                const transaction = journal.begin();
                                push({ kind: "many", child: node.child, cursor: entry, values: [], diagnostics: [], control, transaction });
                                descend(node.child, entry, control);
                                break;
                            }
                            case "commit":
                                push({ kind: "commit" });
                                descend(node.child, entry, control);
                                break;
                            case "recover": {
                                const transaction = journal.begin();
                                push({ kind: "recover", entry, fallback: node.fallback, incomingControl: control, transaction });
                                descend(node.child, entry, control);
                                break;
                            }
                            case "memo": {
                                const address = { node: node.id, offset: entry };
                                const cell = journal.memo(address);
                                if (cell) {
                                    debug.memoHits += 1;
                                    outcome = applyRelative(entry, cell.answer, control);
                                } else if (memoActive(activeMemo, address)) {
                                    outcome = resource(entry, "invariant", "<memo-cycle>");
                                } else {
                                    debug.memoMisses += 1;
                                    addMemo(activeMemo, address);
                                    push({ kind: "memo", address });
                                    descend(node.child, entry, control);
                                }
                                break;
                            }
                            case "call": {
                                const rule = graph.rules[idNumber(node.rule)];
                                if (!rule) {
                                    outcome = resource(entry, "invariant", `<missing-rule:${idNumber(node.rule)}>`);
                                    break;
                                }
                                if (!rule.recursive) {
                                    descend(rule.body, entry, control);
                                    break;
                                }
                                const address = { rule: rule.id, offset: entry };
                                const cell = journal.rule(address);
                                if (cell) {
                                    debug.ruleHits += 1;
                                    outcome = applyRelative(entry, cell.answer, control);
                                    break;
                                }
                                if (currentHead && currentParticipant && currentHead.scc === rule.scc) {
                                    outcome = readParticipant(currentHead, currentParticipant, rule.id, entry, debug);
                                    if (control !== null) outcome = { ...outcome, control };
                                    break;
                                }
                                const head = createHead(counters.nextHead++, graph, rule, entry, debug);
                                heads.push(head);
                                push({ kind: "head-return", head, parentHead: currentHead, parentParticipant: currentParticipant, control });
                                currentHead = head;
                                currentParticipant = undefined;
                                schedule(head);
                                break;
                            }
                        }
                    }
                }
            }

            if (!outcome) continue;
            const frame = frames.pop();
            if (!frame) break;
            if (outcome.kind === "resource") {
                cleanupFrame(frame, outcome.resource);
                continue;
            }

            switch (frame.kind) {
                case "map":
                    if (outcome.kind === "success") {
                        const callback = counters.nextCallback++;
                        debug.emit({ kind: "callback-open", id: callback });
                        try {
                            const value = frame.callback(outcome.value);
                            debug.emit({ kind: "callback-close", id: callback });
                            outcome = { ...outcome, value };
                        } catch (error) {
                            debug.emit({ kind: "callback-abort", id: callback, reason: "throw" });
                            throw error;
                        }
                    }
                    break;
                case "sequence":
                    if (outcome.kind === "failure") {
                        outcome = prependDiagnostics(frame.diagnostics, outcome);
                    } else {
                        const values: unknown[] = [...frame.values, outcome.value];
                        const diagnostics: Diagnostic[] = [...frame.diagnostics, ...outcome.diagnostics];
                        const index = frame.index + 1;
                        const child = frame.children[index];
                        if (child === undefined) {
                            outcome = { ...outcome, value: values, diagnostics };
                        } else {
                            push({ ...frame, index, values, diagnostics });
                            descend(child, outcome.next, outcome.control);
                        }
                    }
                    break;
                case "choice": {
                    const disposition = choices.disposition(outcome, frame.owner);
                    if (disposition === "stale") {
                        journal.rollback(frame.transaction);
                        choices.abort(frame.owner);
                        const at = outcome.kind === "success" ? outcome.next : outcome.evidence.offset;
                        outcome = resource(at, "invariant", "<stale-cut>");
                    } else if (disposition === "accept" || disposition === "owned-success" || disposition === "foreign") {
                        journal.commit(frame.transaction);
                        choices.close(frame.owner);
                        if (disposition === "owned-success") outcome = clearControl(outcome as Success);
                    } else if (disposition === "owned-failure") {
                        journal.commit(frame.transaction);
                        choices.close(frame.owner);
                        outcome = commitFailure(outcome as Failure, frame.owner);
                    } else {
                        const failed = outcome as Failure;
                        const combined = frame.combined ? mergeEvidence(frame.combined, failed.evidence) : failed.evidence;
                        journal.rollback(frame.transaction);
                        const index = frame.index + 1;
                        const child = frame.children[index];
                        if (child === undefined) {
                            choices.close(frame.owner);
                            outcome = { kind: "failure", evidence: combined, diagnostics: failed.diagnostics, control: frame.incomingControl };
                        } else {
                            const transaction = journal.begin();
                            push({ ...frame, index, transaction, combined });
                            descend(child, frame.entry, frame.incomingControl);
                        }
                    }
                    break;
                }
                case "many":
                    if (outcome.kind === "failure") {
                        journal.rollback(frame.transaction);
                        if (outcome.control !== null) {
                            if (!choices.live(outcome.control)) outcome = resource(outcome.evidence.offset, "invariant", "<stale-cut>");
                            else outcome = prependDiagnostics(frame.diagnostics, outcome);
                        } else {
                            outcome = { kind: "success", value: frame.values, next: frame.cursor, diagnostics: frame.diagnostics, control: frame.control };
                        }
                    } else if (outcome.next === frame.cursor) {
                        journal.rollback(frame.transaction);
                        outcome = resource(frame.cursor, "invariant", "<many-progress>");
                    } else if (outcome.control !== null && !choices.live(outcome.control)) {
                        journal.rollback(frame.transaction);
                        outcome = resource(outcome.next, "invariant", "<stale-cut>");
                    } else {
                        journal.commit(frame.transaction);
                        const transaction = journal.begin();
                        const values = [...frame.values, outcome.value];
                        const diagnostics = [...frame.diagnostics, ...outcome.diagnostics];
                        push({ ...frame, cursor: outcome.next, values, diagnostics, control: outcome.control, transaction });
                        descend(frame.child, outcome.next, outcome.control);
                    }
                    break;
                case "commit":
                    if (outcome.kind === "success") {
                        const target = choices.targetCommit(outcome);
                        if (target.owner === undefined) {
                            outcome = resource(outcome.next, "invariant", "<cut-without-choice>");
                        } else if (target.conflict) {
                            outcome = resource(outcome.next, "invariant", "<conflicting-cut>");
                        } else {
                            outcome = { ...outcome, control: target.owner };
                            debug.emit({ kind: "cut-set", owner: target.owner });
                        }
                    }
                    break;
                case "recover":
                    if (outcome.kind === "success") {
                        journal.commit(frame.transaction);
                    } else {
                        journal.rollback(frame.transaction);
                        if (outcome.control !== null) {
                            if (!choices.live(outcome.control)) outcome = resource(outcome.evidence.offset, "invariant", "<stale-cut>");
                        } else {
                            const at = offsetNumber(outcome.evidence.offset);
                            const diagnostic: Diagnostic = {
                                offset: outcome.evidence.offset,
                                expected: [...outcome.evidence.expected],
                                found: source.slice(at, at + 16),
                            };
                            outcome = {
                                kind: "success",
                                value: frame.fallback,
                                next: frame.entry,
                                diagnostics: [...outcome.diagnostics, diagnostic],
                                control: frame.incomingControl,
                            };
                        }
                    }
                    break;
                case "memo":
                    deleteMemo(activeMemo, frame.address);
                    journal.publishMemo(frame.address, relativize(frame.address.offset, outcome));
                    break;
                case "participant-return":
                    acceptParticipant(frame.head, frame.participant, outcome, debug);
                    schedule(frame.head);
                    break;
                case "head-return":
                    currentHead = frame.parentHead;
                    currentParticipant = frame.parentParticipant;
                    outcome = { ...outcome, control: frame.control };
                    break;
            }
        }

        if (!outcome) throw new Error("Dispatch loop terminated without an outcome");
        if (outcome.kind !== "resource" && outcome.control !== null && !choices.live(outcome.control)) {
            const at = outcome.kind === "success" ? outcome.next : outcome.evidence.offset;
            outcome = resource(at, "invariant", "<stale-cut>");
        }
        if (full && outcome.kind === "success" && offsetNumber(outcome.next) !== source.length) {
            outcome = {
                kind: "failure",
                evidence: evidence(outcome.next, ["<end-of-input>"]),
                diagnostics: outcome.diagnostics,
                control: outcome.control,
            };
        }
        const report = terminalReport();
        options.onDebug?.(report);
        return publicResult(outcome, report);
    } catch (original) {
        while (frames.length > 0) {
            const frame = frames.pop();
            if (!frame) continue;
            try { cleanupFrame(frame, "throw"); } catch { /* preserve the parser callback error */ }
        }
        while (heads.length > 0) {
            const head = heads.at(-1) as Head;
            try { abortHead(head, debug, "throw"); } catch { /* preserve original */ }
            heads.pop();
        }
        try { journal.abortAll(); } catch { /* preserve original */ }
        try { choices.abortRemaining(); } catch { /* preserve original */ }
        activeMemo.clear();
        const report = terminalReport();
        try { options.onDebug?.(report); } catch { /* observer never replaces an active parser callback throw */ }
        throw original;
    }
}

export function parsePrefix<T>(parser: Parser<T>, source: string, options: ParseOptions = {}): ParseResult<T> {
    return run(parser, source, false, options);
}

export function parseFull<T>(parser: Parser<T>, source: string, options: ParseOptions = {}): ParseResult<T> {
    return run(parser, source, true, options);
}
