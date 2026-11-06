import { isRightGuarded } from "./recursion.js";
import { applyRelative, evidence, failure, improve, mergeEvidence, relativize, resource, TransactionJournal, } from "./state.js";
import { asOffset, offsetNumber } from "./types.js";
function prependDiagnostics(prefix, outcome) {
    if (prefix.length === 0)
        return outcome;
    return { ...outcome, diagnostics: [...prefix, ...outcome.diagnostics] };
}
function ruleKey(rule, entry) {
    return `${rule}@${entry}`;
}
function memoKey(node, entry) {
    return `${node}@${entry}`;
}
export class RunMachine {
    graph;
    source;
    options;
    #journal = new TransactionJournal();
    #choices = [];
    #heads = [];
    #events = [];
    #transitions = new Map();
    #maxSteps;
    #trace;
    #counters = {
        steps: 0,
        continuationHighWater: 0,
        memoHits: 0,
        memoMisses: 0,
        ruleHits: 0,
    };
    #nextChoice = 1;
    #nextHead = 1;
    constructor(graph, source, options) {
        this.graph = graph;
        this.source = source;
        this.options = options;
        this.#maxSteps = options.maxSteps ?? 20_000_000;
        this.#trace = options.trace ?? false;
    }
    #event(kind, detail) {
        if (this.#trace)
            this.#events.push(Object.freeze({ kind, detail }));
    }
    #step(at) {
        this.#counters.steps += 1;
        if (this.#counters.steps <= this.#maxSteps)
            return null;
        this.#event("resource", `step-budget@${at}`);
        return resource(at, "step-budget", "<step-budget>");
    }
    #recordTransition(key, previous, state) {
        const transition = `${previous}->${state}`;
        this.#transitions.set(transition, (this.#transitions.get(transition) ?? 0) + 1);
        this.#event("rule", `${key}:${transition}`);
    }
    #transition(key, next) {
        const previous = this.#journal.rule.get(key)?.state ?? "Empty";
        const state = next?.state ?? "Empty";
        this.#recordTransition(key, previous, state);
        this.#journal.setRule(key, next);
    }
    #pushChoice() {
        const id = this.#nextChoice;
        this.#nextChoice += 1;
        this.#choices.push(id);
        this.#event("choice-open", String(id));
        return id;
    }
    #popChoice(id) {
        if (this.#choices.at(-1) !== id)
            throw new Error(`Unbalanced choice ${id}`);
        this.#choices.pop();
        this.#event("choice-close", String(id));
    }
    #cleanupFrame(frame) {
        switch (frame.kind) {
            case "choice":
                this.#journal.rollback(frame.transaction);
                this.#popChoice(frame.id);
                break;
            case "many":
            case "recover":
                this.#journal.rollback(frame.transaction);
                break;
            case "memo":
                this.#journal.setMemo(frame.key, undefined);
                break;
            case "map":
            case "sequence":
            case "commit":
                break;
        }
    }
    #callInHead(head, current, rule, entry) {
        const key = ruleKey(rule.id, entry);
        let participant = head.participants.get(key);
        const cell = this.#journal.rule.get(key);
        if (cell?.state === "Done") {
            this.#counters.ruleHits += 1;
            return applyRelative(entry, cell.answer, null);
        }
        if (!participant) {
            participant = {
                key,
                rule: rule.id,
                entry,
                dependencies: new Set(),
                dependents: new Set(),
                answer: relativize(entry, {
                    kind: "failure",
                    evidence: evidence(entry, []),
                    diagnostics: [],
                    control: null,
                }),
            };
            head.participants.set(key, participant);
            this.#recordTransition(key, "Empty", "Evaluating");
            this.#recordTransition(key, "Evaluating", "Growing");
            head.fresh.push(key);
            head.freshQueued.add(key);
            this.#event("participant", `${head.id}:${key}`);
        }
        current.dependencies.add(key);
        participant.dependents.add(current.key);
        return applyRelative(entry, head.snapshot?.get(key) ?? participant.answer, null);
    }
    #ensureRoot(head, rule, entry) {
        const key = ruleKey(rule.id, entry);
        const existing = this.#journal.rule.get(key);
        if (existing?.state === "Done")
            return;
        if (head.participants.has(key))
            return;
        const participant = {
            key,
            rule: rule.id,
            entry,
            dependencies: new Set(),
            dependents: new Set(),
            answer: relativize(entry, {
                kind: "failure",
                evidence: evidence(entry, []),
                diagnostics: [],
                control: null,
            }),
        };
        head.participants.set(key, participant);
        this.#recordTransition(key, "Empty", "Evaluating");
        this.#recordTransition(key, "Evaluating", "Growing");
        head.fresh.push(key);
        head.freshQueued.add(key);
        this.#event("participant", `${head.id}:${key}`);
    }
    #enqueueDirty(head, key) {
        if (head.freshQueued.has(key) || head.dirtyQueued.has(key))
            return;
        head.dirty.push(key);
        head.dirtyQueued.add(key);
    }
    #prepopulate(head) {
        for (const ruleId of this.graph.sccs[head.scc] ?? []) {
            const rule = this.graph.rules[ruleId];
            if (!rule)
                continue;
            for (let entry = 0; entry <= this.source.length; entry += 1) {
                const exhausted = this.#step(entry);
                if (exhausted)
                    return exhausted;
                const key = ruleKey(ruleId, entry);
                if (this.#journal.rule.get(key)?.state === "Done")
                    continue;
                if (head.participants.has(key))
                    continue;
                const participant = {
                    key,
                    rule: ruleId,
                    entry,
                    dependencies: new Set(),
                    dependents: new Set(),
                    answer: relativize(entry, {
                        kind: "failure",
                        evidence: evidence(entry, []),
                        diagnostics: [],
                        control: null,
                    }),
                };
                head.participants.set(key, participant);
                this.#recordTransition(key, "Empty", "Evaluating");
                this.#recordTransition(key, "Evaluating", "Growing");
                this.#event("participant", `${head.id}:${key}`);
            }
        }
        return null;
    }
    #solveRule(rule, entry, control) {
        const key = ruleKey(rule.id, entry);
        const cached = this.#journal.rule.get(key);
        if (cached?.state === "Done") {
            this.#counters.ruleHits += 1;
            return applyRelative(entry, cached.answer, control);
        }
        const head = {
            id: this.#nextHead,
            scc: rule.scc,
            entry,
            participants: new Map(),
            fresh: [],
            dirty: [],
            freshQueued: new Set(),
            dirtyQueued: new Set(),
            simultaneous: !isRightGuarded(this.graph, rule.scc),
        };
        this.#nextHead += 1;
        this.#heads.push(head);
        this.#event("head-open", `${head.id}:${head.scc}@${entry}`);
        let aborted = null;
        if (head.simultaneous)
            aborted = this.#prepopulate(head);
        else
            this.#ensureRoot(head, rule, entry);
        try {
            if (head.simultaneous && !aborted) {
                for (;;) {
                    head.snapshot = new Map([...head.participants].map(([key, participant]) => [key, participant.answer]));
                    const improved = [];
                    for (const participant of head.participants.values()) {
                        const body = this.graph.rules[participant.rule]?.body;
                        if (body === undefined)
                            throw new Error(`Missing rule body ${participant.rule}`);
                        const candidate = this.#evaluate(body, participant.entry, null, head, participant);
                        if (candidate.kind === "resource") {
                            aborted = candidate;
                            break;
                        }
                        const before = head.snapshot.get(participant.key);
                        const better = improve(participant.entry, before, candidate);
                        if (better)
                            improved.push([participant, better]);
                    }
                    if (aborted || improved.length === 0)
                        break;
                    for (const [participant, better] of improved) {
                        participant.answer = better;
                        this.#recordTransition(participant.key, "Growing", "Growing");
                    }
                }
                delete head.snapshot;
            }
            else if (!aborted) {
                for (;;) {
                    const next = head.fresh.length > 0 ? head.fresh.pop() : head.dirty.pop();
                    if (next === undefined)
                        break;
                    head.freshQueued.delete(next);
                    head.dirtyQueued.delete(next);
                    const participant = head.participants.get(next);
                    if (!participant)
                        throw new Error(`Missing participant ${next}`);
                    for (const dependency of participant.dependencies) {
                        head.participants.get(dependency)?.dependents.delete(participant.key);
                    }
                    participant.dependencies.clear();
                    const body = this.graph.rules[participant.rule]?.body;
                    if (body === undefined)
                        throw new Error(`Missing rule body ${participant.rule}`);
                    const candidate = this.#evaluate(body, participant.entry, null, head, participant);
                    if (candidate.kind === "resource") {
                        aborted = candidate;
                        break;
                    }
                    const better = improve(participant.entry, participant.answer, candidate);
                    if (!better)
                        continue;
                    participant.answer = better;
                    this.#recordTransition(participant.key, "Growing", "Growing");
                    for (const dependent of participant.dependents) {
                        this.#enqueueDirty(head, dependent);
                    }
                }
            }
            if (aborted) {
                for (const participant of head.participants.values()) {
                    this.#recordTransition(participant.key, "Growing", "Empty");
                }
                return aborted;
            }
            for (const participant of head.participants.values()) {
                this.#recordTransition(participant.key, "Growing", "Done");
                this.#journal.setRule(participant.key, {
                    state: "Done",
                    answer: participant.answer,
                });
            }
            const done = this.#journal.rule.get(key);
            if (!done || done.state !== "Done")
                throw new Error(`Root did not terminalize: ${key}`);
            return applyRelative(entry, done.answer, control);
        }
        finally {
            if (this.#heads.at(-1) !== head)
                throw new Error(`Unbalanced head ${head.id}`);
            this.#heads.pop();
            this.#event("head-close", String(head.id));
        }
    }
    #evaluate(root, rootEntry, rootControl, head, current) {
        const frames = [];
        let nodeId = root;
        let entry = rootEntry;
        let control = rootControl;
        let outcome = null;
        const descend = (child, at, token) => {
            nodeId = child;
            entry = at;
            control = token;
            outcome = null;
        };
        const push = (frame) => {
            frames.push(frame);
            this.#counters.continuationHighWater = Math.max(this.#counters.continuationHighWater, frames.length);
        };
        for (;;) {
            if (!outcome) {
                const exhausted = this.#step(entry);
                if (exhausted) {
                    outcome = exhausted;
                }
                else {
                    const node = this.graph.nodes[nodeId];
                    if (!node) {
                        outcome = resource(entry, "invariant", `<missing-node:${nodeId}>`);
                    }
                    else {
                        switch (node.kind) {
                            case "epsilon":
                                outcome = {
                                    kind: "success",
                                    value: node.value,
                                    next: asOffset(entry),
                                    diagnostics: [],
                                    control,
                                };
                                break;
                            case "literal":
                                outcome = this.source.startsWith(node.text, entry)
                                    ? {
                                        kind: "success",
                                        value: node.text,
                                        next: asOffset(entry + node.text.length),
                                        diagnostics: [],
                                        control,
                                    }
                                    : failure(entry, JSON.stringify(node.text), control);
                                break;
                            case "map":
                                push({ kind: "map", transform: node.transform });
                                descend(node.child, entry, control);
                                break;
                            case "sequence": {
                                const first = node.children[0];
                                if (first === undefined) {
                                    outcome = {
                                        kind: "success",
                                        value: [],
                                        next: asOffset(entry),
                                        diagnostics: [],
                                        control,
                                    };
                                }
                                else {
                                    push({
                                        kind: "sequence",
                                        children: node.children,
                                        index: 0,
                                        values: [],
                                        diagnostics: [],
                                    });
                                    descend(first, entry, control);
                                }
                                break;
                            }
                            case "choice": {
                                const id = this.#pushChoice();
                                const transaction = this.#journal.begin();
                                push({
                                    kind: "choice",
                                    children: node.children,
                                    index: 0,
                                    entry,
                                    incomingControl: control,
                                    id,
                                    transaction,
                                    combined: null,
                                });
                                descend(node.children[0], entry, control);
                                break;
                            }
                            case "many": {
                                const transaction = this.#journal.begin();
                                push({
                                    kind: "many",
                                    child: node.child,
                                    cursor: entry,
                                    values: [],
                                    diagnostics: [],
                                    control,
                                    transaction,
                                });
                                descend(node.child, entry, control);
                                break;
                            }
                            case "commit":
                                push({ kind: "commit" });
                                descend(node.child, entry, control);
                                break;
                            case "recover": {
                                const transaction = this.#journal.begin();
                                push({
                                    kind: "recover",
                                    entry,
                                    fallback: node.fallback,
                                    incomingControl: control,
                                    transaction,
                                });
                                descend(node.child, entry, control);
                                break;
                            }
                            case "memo": {
                                const key = memoKey(node.id, entry);
                                const cell = this.#journal.memo.get(key);
                                if (cell?.state === "Done") {
                                    this.#counters.memoHits += 1;
                                    this.#event("memo-hit", key);
                                    outcome = applyRelative(entry, cell.answer, control);
                                }
                                else if (cell?.state === "Evaluating") {
                                    outcome = resource(entry, "invariant", "<memo-cycle>");
                                }
                                else {
                                    this.#counters.memoMisses += 1;
                                    this.#event("memo-miss", key);
                                    this.#journal.setMemo(key, { state: "Evaluating" });
                                    push({ kind: "memo", key, entry });
                                    descend(node.child, entry, control);
                                }
                                break;
                            }
                            case "call": {
                                const rule = this.graph.rules[node.rule];
                                if (!rule) {
                                    outcome = resource(entry, "invariant", `<missing-rule:${node.rule}>`);
                                }
                                else if (!rule.recursive) {
                                    descend(rule.body, entry, control);
                                }
                                else if (head && current && rule.scc === head.scc) {
                                    outcome = this.#callInHead(head, current, rule, entry);
                                    if (control !== null) {
                                        outcome = { ...outcome, control };
                                    }
                                }
                                else {
                                    outcome = this.#solveRule(rule, entry, control);
                                }
                                break;
                            }
                        }
                    }
                }
            }
            if (!outcome)
                continue;
            const frame = frames.pop();
            if (!frame)
                return outcome;
            if (outcome.kind === "resource") {
                this.#cleanupFrame(frame);
                continue;
            }
            switch (frame.kind) {
                case "map":
                    if (outcome.kind === "success") {
                        outcome = { ...outcome, value: frame.transform(outcome.value) };
                    }
                    break;
                case "sequence":
                    if (outcome.kind === "failure") {
                        outcome = prependDiagnostics(frame.diagnostics, outcome);
                        break;
                    }
                    {
                        const values = [...frame.values, outcome.value];
                        const diagnostics = [
                            ...frame.diagnostics,
                            ...outcome.diagnostics,
                        ];
                        const nextIndex = frame.index + 1;
                        const nextNode = frame.children[nextIndex];
                        if (nextNode === undefined) {
                            outcome = { ...outcome, value: values, diagnostics };
                        }
                        else {
                            push({ ...frame, index: nextIndex, values, diagnostics });
                            descend(nextNode, offsetNumber(outcome.next), outcome.control);
                        }
                    }
                    break;
                case "choice":
                    if (outcome.kind === "success") {
                        this.#journal.commit(frame.transaction);
                        this.#popChoice(frame.id);
                        if (outcome.control === frame.id)
                            outcome = { ...outcome, control: null };
                        break;
                    }
                    if (outcome.control === frame.id) {
                        this.#journal.commit(frame.transaction);
                        this.#popChoice(frame.id);
                        outcome = {
                            ...outcome,
                            evidence: {
                                ...outcome.evidence,
                                committedOwner: frame.id,
                            },
                            control: null,
                        };
                        break;
                    }
                    {
                        const combined = frame.combined
                            ? mergeEvidence(frame.combined, outcome.evidence)
                            : outcome.evidence;
                        this.#journal.rollback(frame.transaction);
                        const nextIndex = frame.index + 1;
                        const nextNode = frame.children[nextIndex];
                        if (nextNode === undefined) {
                            this.#popChoice(frame.id);
                            outcome = {
                                kind: "failure",
                                evidence: combined,
                                diagnostics: outcome.diagnostics,
                                control: frame.incomingControl,
                            };
                        }
                        else {
                            const transaction = this.#journal.begin();
                            push({
                                ...frame,
                                index: nextIndex,
                                transaction,
                                combined,
                            });
                            descend(nextNode, frame.entry, frame.incomingControl);
                        }
                    }
                    break;
                case "many":
                    if (outcome.kind === "failure") {
                        this.#journal.rollback(frame.transaction);
                        if (outcome.control !== null) {
                            outcome = prependDiagnostics(frame.diagnostics, outcome);
                        }
                        else {
                            outcome = {
                                kind: "success",
                                value: frame.values,
                                next: asOffset(frame.cursor),
                                diagnostics: frame.diagnostics,
                                control: frame.control,
                            };
                        }
                        break;
                    }
                    if (offsetNumber(outcome.next) === frame.cursor) {
                        this.#journal.rollback(frame.transaction);
                        outcome = resource(frame.cursor, "invariant", "<many-progress>");
                        break;
                    }
                    this.#journal.commit(frame.transaction);
                    {
                        const cursor = offsetNumber(outcome.next);
                        const values = [...frame.values, outcome.value];
                        const diagnostics = [...frame.diagnostics, ...outcome.diagnostics];
                        const transaction = this.#journal.begin();
                        push({
                            ...frame,
                            cursor,
                            values,
                            diagnostics,
                            control: outcome.control,
                            transaction,
                        });
                        descend(frame.child, cursor, outcome.control);
                    }
                    break;
                case "commit":
                    if (outcome.kind === "success") {
                        const target = this.#choices.at(-1);
                        if (target === undefined) {
                            outcome = resource(offsetNumber(outcome.next), "invariant", "<cut-without-choice>");
                        }
                        else if (outcome.control !== null && outcome.control !== target) {
                            outcome = resource(offsetNumber(outcome.next), "invariant", "<conflicting-cut>");
                        }
                        else {
                            outcome = { ...outcome, control: target };
                            this.#event("cut", String(target));
                        }
                    }
                    break;
                case "recover":
                    if (outcome.kind === "success") {
                        this.#journal.commit(frame.transaction);
                        break;
                    }
                    this.#journal.rollback(frame.transaction);
                    if (outcome.control !== null)
                        break;
                    {
                        const failureEvidence = outcome.evidence;
                        const at = offsetNumber(failureEvidence.offset);
                        const diagnostic = {
                            offset: failureEvidence.offset,
                            expected: [...failureEvidence.expected],
                            found: this.source.slice(at, at + 16),
                        };
                        outcome = {
                            kind: "success",
                            value: frame.fallback,
                            next: asOffset(frame.entry),
                            diagnostics: [...outcome.diagnostics, diagnostic],
                            control: frame.incomingControl,
                        };
                    }
                    break;
                case "memo":
                    this.#journal.setMemo(frame.key, {
                        state: "Done",
                        answer: relativize(frame.entry, outcome),
                    });
                    break;
            }
        }
    }
    execute(root) {
        return this.#evaluate(root, 0, null);
    }
    terminalize(force = false) {
        if (force) {
            this.#journal.abortAll();
            for (const [key, cell] of [...this.#journal.memo]) {
                if (cell.state === "Evaluating")
                    this.#journal.setMemo(key, undefined);
            }
            for (const [key, cell] of [...this.#journal.rule]) {
                if (cell.state !== "Done")
                    this.#transition(key, undefined);
            }
            this.#choices.length = 0;
            this.#heads.length = 0;
        }
        const transitionalMemoCells = [...this.#journal.memo.values()].filter(cell => cell.state === "Evaluating").length;
        const transitionalRuleCells = [...this.#journal.rule.values()].filter(cell => cell.state !== "Done").length;
        if (!force &&
            (this.#journal.length !== 0 ||
                this.#journal.depth !== 0 ||
                this.#choices.length !== 0 ||
                this.#heads.length !== 0 ||
                transitionalMemoCells !== 0 ||
                transitionalRuleCells !== 0)) {
            throw new Error("Terminal run retained nonterminal machine state");
        }
        const transitions = Object.fromEntries([...this.#transitions].sort(([left], [right]) => left.localeCompare(right)));
        return Object.freeze({
            steps: this.#counters.steps,
            continuationHighWater: this.#counters.continuationHighWater,
            journalHighWater: this.#journal.highWater,
            journalLength: this.#journal.length,
            liveTransactions: this.#journal.depth,
            liveChoices: this.#choices.length,
            liveHeads: this.#heads.length,
            transitionalMemoCells,
            transitionalRuleCells,
            memoHits: this.#counters.memoHits,
            memoMisses: this.#counters.memoMisses,
            ruleHits: this.#counters.ruleHits,
            ruleTransitions: Object.freeze(transitions),
            events: Object.freeze([...this.#events]),
        });
    }
}
