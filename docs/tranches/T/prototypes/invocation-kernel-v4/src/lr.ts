import { DebugRecorder } from "./debug.js";
import { idNumber, type RuleId, type SealedGraph, type SealedRule } from "./model.js";
import {
    applyRelative,
    improve,
    seed,
    type Failure,
    type RelativeAnswer,
    type Success,
} from "./outcome.js";
import { TransactionJournal, type RuleAddress } from "./journal.js";
import type { Utf16Offset } from "./types.js";

export type ParticipantPhase = "Evaluating" | "Growing";

export interface Participant {
    readonly rule: RuleId;
    readonly entry: Utf16Offset;
    readonly dependencies: Set<Participant>;
    readonly dependents: Set<Participant>;
    phase: ParticipantPhase;
    answer: RelativeAnswer;
}

export interface Head {
    readonly id: number;
    readonly scc: number;
    readonly root: RuleAddress;
    readonly mode: "simultaneous" | "consuming";
    readonly participants: Map<RuleId, Map<Utf16Offset, Participant>>;
    readonly fresh: Participant[];
    readonly dirty: Participant[];
    readonly freshQueued: Set<Participant>;
    readonly dirtyQueued: Set<Participant>;
    generation: number;
    snapshot?: ReadonlyMap<RuleId, ReadonlyMap<Utf16Offset, RelativeAnswer>>;
    generationWork?: readonly Participant[];
    generationIndex: number;
    candidates: Map<Participant, Success | Failure>;
    admittedSinceSnapshot: boolean;
}

function address(participant: Participant): import("./types.js").DebugAddress {
    return { domain: "participant", id: idNumber(participant.rule), offset: participant.entry };
}

function find(head: Head, rule: RuleId, entry: Utf16Offset): Participant | undefined {
    return head.participants.get(rule)?.get(entry);
}

function add(head: Head, participant: Participant): void {
    let row = head.participants.get(participant.rule);
    if (!row) {
        row = new Map();
        head.participants.set(participant.rule, row);
    }
    row.set(participant.entry, participant);
}

export function participantCount(head: Head): number {
    let count = 0;
    for (const row of head.participants.values()) count += row.size;
    return count;
}

export function createHead(
    id: number,
    graph: SealedGraph,
    rule: SealedRule,
    entry: Utf16Offset,
    debug: DebugRecorder,
): Head {
    const mode = graph.sccs[rule.scc]?.rightGuarded ? "consuming" : "simultaneous";
    const head: Head = {
        id,
        scc: rule.scc,
        root: { rule: rule.id, offset: entry },
        mode,
        participants: new Map(),
        fresh: [],
        dirty: [],
        freshQueued: new Set(),
        dirtyQueued: new Set(),
        generation: 0,
        generationIndex: 0,
        candidates: new Map(),
        admittedSinceSnapshot: false,
    };
    debug.emit({ kind: "head-open", id });
    if (mode === "simultaneous") debug.simultaneousHeads += 1;
    else debug.consumingHeads += 1;
    admit(head, rule.id, entry, debug);
    return head;
}

export function admit(head: Head, rule: RuleId, entry: Utf16Offset, debug: DebugRecorder): Participant {
    const existing = find(head, rule, entry);
    if (existing) return existing;
    const participant: Participant = {
        rule,
        entry,
        dependencies: new Set(),
        dependents: new Set(),
        phase: "Evaluating",
        answer: seed(entry),
    };
    add(head, participant);
    head.fresh.push(participant);
    head.freshQueued.add(participant);
    head.admittedSinceSnapshot = true;
    debug.emit({ kind: "participant-admit", address: address(participant), generation: head.generation });
    return participant;
}

export function read(
    head: Head,
    current: Participant,
    rule: RuleId,
    entry: Utf16Offset,
    debug: DebugRecorder,
): Success | Failure {
    const target = admit(head, rule, entry, debug);
    current.dependencies.add(target);
    target.dependents.add(current);
    const answer = head.mode === "simultaneous"
        ? head.snapshot?.get(rule)?.get(entry) ?? seed(entry)
        : target.answer;
    return applyRelative(entry, answer, null);
}

function clearDependencies(participant: Participant): void {
    for (const dependency of participant.dependencies) dependency.dependents.delete(participant);
    participant.dependencies.clear();
}

function beginSimultaneousGeneration(head: Head): void {
    const snapshot = new Map<RuleId, ReadonlyMap<Utf16Offset, RelativeAnswer>>();
    const work: Participant[] = [];
    for (const [rule, row] of head.participants) {
        const copy = new Map<Utf16Offset, RelativeAnswer>();
        for (const [entry, participant] of row) {
            copy.set(entry, participant.answer);
            work.push(participant);
        }
        snapshot.set(rule, copy);
    }
    head.snapshot = snapshot;
    head.generationWork = Object.freeze(work);
    head.generationIndex = 0;
    head.candidates.clear();
    head.admittedSinceSnapshot = false;
    head.generation += 1;
}

function prepare(participant: Participant, head: Head, debug: DebugRecorder): Participant {
    clearDependencies(participant);
    if (participant.phase === "Evaluating") {
        participant.phase = "Growing";
        debug.emit({ kind: "participant-grow", address: address(participant), generation: head.generation, reason: "phase" });
    }
    return participant;
}

export function nextWork(head: Head, debug: DebugRecorder): Participant | null {
    if (head.mode === "consuming") {
        const next = head.fresh.length > 0 ? head.fresh.pop() : head.dirty.pop();
        if (!next) return null;
        head.freshQueued.delete(next);
        head.dirtyQueued.delete(next);
        return prepare(next, head, debug);
    }
    for (;;) {
        if (!head.generationWork) beginSimultaneousGeneration(head);
        const work = head.generationWork as readonly Participant[];
        const next = work[head.generationIndex];
        if (next) {
            head.generationIndex += 1;
            return prepare(next, head, debug);
        }
        let changed = head.admittedSinceSnapshot;
        for (const [participant, candidate] of head.candidates) {
            const before = head.snapshot?.get(participant.rule)?.get(participant.entry) ?? participant.answer;
            const better = improve(participant.entry, before, candidate);
            if (better) {
                participant.answer = better;
                changed = true;
                debug.emit({ kind: "participant-grow", address: address(participant), generation: head.generation, reason: "improvement" });
            }
        }
        delete head.snapshot;
        delete head.generationWork;
        head.candidates.clear();
        if (!changed) return null;
    }
}

function enqueueDirty(head: Head, participant: Participant): void {
    if (head.freshQueued.has(participant) || head.dirtyQueued.has(participant)) return;
    head.dirty.push(participant);
    head.dirtyQueued.add(participant);
}

export function accept(
    head: Head,
    participant: Participant,
    candidate: Success | Failure,
    debug: DebugRecorder,
): void {
    if (head.mode === "simultaneous") {
        head.candidates.set(participant, candidate);
        return;
    }
    const better = improve(participant.entry, participant.answer, candidate);
    if (!better) return;
    participant.answer = better;
    debug.emit({ kind: "participant-grow", address: address(participant), generation: head.generation, reason: "improvement" });
    for (const dependent of participant.dependents) enqueueDirty(head, dependent);
}

export function rootAnswer(head: Head): Success | Failure {
    const participant = find(head, head.root.rule, head.root.offset);
    if (!participant) throw new Error("Head root participant is missing");
    return applyRelative(head.root.offset, participant.answer, null);
}

export function publishAndClose(head: Head, journal: TransactionJournal, debug: DebugRecorder): void {
    for (const row of head.participants.values()) {
        for (const participant of row.values()) {
            journal.publishRule({ rule: participant.rule, offset: participant.entry }, participant.answer);
            debug.emit({ kind: "participant-close", address: address(participant), generation: head.generation });
        }
    }
    head.participants.clear();
    head.fresh.length = 0;
    head.dirty.length = 0;
    head.freshQueued.clear();
    head.dirtyQueued.clear();
    debug.emit({ kind: "head-close", id: head.id });
}

export function abort(head: Head, debug: DebugRecorder, reason: string): void {
    for (const row of head.participants.values()) {
        for (const participant of row.values()) {
            debug.emit({ kind: "participant-abort", address: address(participant), generation: head.generation, reason });
        }
    }
    head.participants.clear();
    head.fresh.length = 0;
    head.dirty.length = 0;
    head.freshQueued.clear();
    head.dirtyQueued.clear();
    delete head.snapshot;
    delete head.generationWork;
    debug.emit({ kind: "head-abort", id: head.id, reason });
}
