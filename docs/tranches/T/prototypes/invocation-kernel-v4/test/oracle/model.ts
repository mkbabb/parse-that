export type Ast =
    | { readonly kind: "epsilon" }
    | { readonly kind: "literal"; readonly text: "a" | "b" }
    | { readonly kind: "reference"; readonly rule: number }
    | { readonly kind: "sequence"; readonly left: Ast; readonly right: Ast }
    | { readonly kind: "choice"; readonly left: Ast; readonly right: Ast };

export type Value = null | "a" | "b" | readonly [Value, Value];

export type Answer =
    | { readonly kind: "success"; readonly offset: number; readonly value: Value }
    | { readonly kind: "failure"; readonly offset: number; readonly expected: readonly string[] };

export type ControlCategory =
    | "nestedCut" | "siblingCut" | "foreignCut" | "cutThroughMany"
    | "recovery" | "recoveredCut" | "memoRollback" | "memoReplay"
    | "resource" | "callbackThrow" | "staleToken" | "conflictingToken";

export type ControlAnswer =
    | { readonly kind: "success"; readonly value: unknown; readonly offset: number; readonly diagnostics: readonly number[] }
    | { readonly kind: "failure"; readonly offset: number; readonly expected: readonly string[]; readonly committed: boolean; readonly diagnostics: readonly number[] }
    | { readonly kind: "resource"; readonly resource: "step-budget" | "invariant"; readonly expected: readonly string[] }
    | { readonly kind: "throw"; readonly message: string };

function failed(offset: number, expected: readonly string[]): Answer {
    return { kind: "failure", offset, expected: [...new Set(expected)].sort() };
}

function merge(left: Answer, right: Answer): Answer {
    if (left.kind === "success") return left;
    if (right.kind === "success") return right;
    if (left.offset > right.offset) return left;
    if (right.offset > left.offset) return right;
    return failed(left.offset, [...left.expected, ...right.expected]);
}

function improve(previous: Answer, candidate: Answer): Answer {
    if (candidate.kind === "success") {
        if (previous.kind === "failure" || candidate.offset > previous.offset) return candidate;
        return previous;
    }
    if (previous.kind === "success") return previous;
    if (candidate.offset > previous.offset) return candidate;
    if (candidate.offset < previous.offset) return previous;
    return failed(candidate.offset, [...previous.expected, ...candidate.expected]);
}

/** Independent finite simultaneous-relation oracle; it imports no source module. */
export function oracle(rules: readonly Ast[], input: string): Answer {
    const dependencies = rules.map(body => {
        const found = new Set<number>();
        const pending = [body];
        while (pending.length > 0) {
            const node = pending.pop();
            if (!node) continue;
            if (node.kind === "reference") found.add(node.rule);
            else if (node.kind === "sequence" || node.kind === "choice") pending.push(node.left, node.right);
        }
        return [...found];
    });
    const reachable = dependencies.map((_, root) => {
        const seen = new Set<number>();
        const pending = [...(dependencies[root] ?? [])];
        while (pending.length > 0) {
            const target = pending.pop();
            if (target === undefined || seen.has(target)) continue;
            seen.add(target);
            pending.push(...(dependencies[target] ?? []));
        }
        return seen;
    });
    const sccs: number[][] = [];
    const sccOf = Array<number>(rules.length).fill(-1);
    for (let rule = 0; rule < rules.length; rule += 1) {
        if ((sccOf[rule] ?? -1) >= 0) continue;
        const component = rules.map((_, candidate) => candidate).filter(candidate =>
            candidate === rule || (reachable[rule]?.has(candidate) && reachable[candidate]?.has(rule)));
        const scc = sccs.length;
        component.forEach(member => (sccOf[member] = scc));
        sccs.push(component);
    }
    const recursive = rules.map((_, rule) => {
        const members = sccs[sccOf[rule]!] ?? [];
        return members.length > 1 || (dependencies[rule] ?? []).includes(rule);
    });
    interface OracleParticipant { readonly rule: number; readonly entry: number; answer: Answer; }
    interface OracleHead { readonly scc: number; readonly participants: Map<string, OracleParticipant>; snapshot: ReadonlyMap<string, Answer>; }
    const cache = new Map<string, Answer>();
    const admit = (head: OracleHead, rule: number, entry: number): OracleParticipant => {
        const key = `${rule}@${entry}`;
        let participant = head.participants.get(key);
        if (!participant) {
            participant = { rule, entry, answer: failed(entry, []) };
            head.participants.set(key, participant);
        }
        return participant;
    };
    const evaluateDemand = (ast: Ast, entry: number, head?: OracleHead): Answer => {
        switch (ast.kind) {
            case "epsilon": return { kind: "success", offset: entry, value: null };
            case "literal": return input.startsWith(ast.text, entry)
                ? { kind: "success", offset: entry + 1, value: ast.text }
                : failed(entry, [JSON.stringify(ast.text)]);
            case "reference": {
                const body = rules[ast.rule];
                if (!body) throw new Error(`Oracle missing rule ${ast.rule}`);
                if (!recursive[ast.rule]) return evaluateDemand(body, entry, head);
                const key = `${ast.rule}@${entry}`;
                const done = cache.get(key);
                if (done) return done;
                if (head && sccOf[ast.rule] === head.scc) {
                    admit(head, ast.rule, entry);
                    return head.snapshot.get(key) ?? failed(entry, []);
                }
                return solveHead(ast.rule, entry);
            }
            case "sequence": {
                const left = evaluateDemand(ast.left, entry, head);
                if (left.kind === "failure") return left;
                const right = evaluateDemand(ast.right, left.offset, head);
                if (right.kind === "failure") return right;
                return { kind: "success", offset: right.offset, value: [left.value, right.value] };
            }
            case "choice": {
                const left = evaluateDemand(ast.left, entry, head);
                if (left.kind === "success") return left;
                const right = evaluateDemand(ast.right, entry, head);
                return right.kind === "success" ? right : merge(left, right);
            }
        }
    };
    const solveHead = (rootRule: number, rootEntry: number): Answer => {
        const rootKey = `${rootRule}@${rootEntry}`;
        const cached = cache.get(rootKey);
        if (cached) return cached;
        const head: OracleHead = { scc: sccOf[rootRule]!, participants: new Map(), snapshot: new Map() };
        admit(head, rootRule, rootEntry);
        const limit = Math.max(32, (sccs[head.scc]?.length ?? 1) * (input.length + 1) ** 2 * 4);
        for (let generation = 0; generation < limit; generation += 1) {
            head.snapshot = new Map([...head.participants].map(([key, participant]) => [key, participant.answer]));
            const work = [...head.participants.values()];
            const countBefore = head.participants.size;
            const candidates = work.map(participant => {
                const body = rules[participant.rule];
                if (!body) throw new Error(`Oracle missing rule ${participant.rule}`);
                return [participant, evaluateDemand(body, participant.entry, head)] as const;
            });
            let changed = head.participants.size !== countBefore;
            for (const [participant, candidate] of candidates) {
                const next = improve(participant.answer, candidate);
                if (JSON.stringify(next) !== JSON.stringify(participant.answer)) {
                    participant.answer = next;
                    changed = true;
                }
            }
            if (!changed) {
                for (const [key, participant] of head.participants) cache.set(key, participant.answer);
                return head.participants.get(rootKey)?.answer ?? failed(rootEntry, []);
            }
        }
        throw new Error(`Oracle exhausted SCC ${head.scc}`);
    };
    const rootBody = rules[0];
    if (!rootBody) throw new Error("Oracle missing root rule");
    const root = recursive[0] ? solveHead(0, 0) : evaluateDemand(rootBody, 0);
    return root.kind === "success" && root.offset !== input.length ? failed(root.offset, ["<end-of-input>"]) : root;
}

export function controlOracle(category: ControlCategory): ControlAnswer {
    const answers: Record<ControlCategory, ControlAnswer> = {
        nestedCut: { kind: "failure", offset: 1, expected: ['"x"'], committed: true, diagnostics: [] },
        siblingCut: { kind: "failure", offset: 1, expected: ['"x"'], committed: true, diagnostics: [] },
        foreignCut: { kind: "failure", offset: 2, expected: ['"x"'], committed: true, diagnostics: [] },
        cutThroughMany: { kind: "failure", offset: 1, expected: ['"b"'], committed: true, diagnostics: [] },
        recovery: { kind: "success", value: "r", offset: 0, diagnostics: [0] },
        recoveredCut: { kind: "failure", offset: 2, expected: ['"z"'], committed: false, diagnostics: [1] },
        memoRollback: { kind: "success", value: ["a", "b"], offset: 2, diagnostics: [] },
        memoReplay: { kind: "success", value: ["r", "r"], offset: 0, diagnostics: [0, 0] },
        resource: { kind: "resource", resource: "step-budget", expected: ["<step-budget>"] },
        callbackThrow: { kind: "throw", message: "oracle-boom" },
        staleToken: { kind: "resource", resource: "invariant", expected: ["<cut-without-choice>"] },
        conflictingToken: { kind: "resource", resource: "invariant", expected: ["<conflicting-cut>"] },
    };
    return answers[category];
}
