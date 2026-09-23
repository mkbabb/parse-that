import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
    disableClosureDiagnostics,
    enableClosureDiagnostics,
    Closure,
    ClosureParser,
    literal,
    type Spanned,
} from "./closure.js";
import {
    buildFixtureClosure,
    buildJsonClosure,
} from "./products.js";

describe("P3 direct closure surface", () => {
    it("matches JSON.parse over the frozen valid corpus", async () => {
        const corpus = await readFile(
            new URL(
                "../../../../../grammar/tests/json/valid.jsonl",
                import.meta.url,
            ),
            "utf8",
        );
        const parser = buildJsonClosure();
        for (const source of corpus.split("\n").filter(Boolean)) {
            const state = parser.parseState(source);
            expect(state.isError, source).toBe(false);
            expect(state.value).toEqual({
                value: JSON.parse(source),
                span: { start: 0, end: source.length },
            });
            expect(state.offset, source).toBe(source.length);
        }
    });

    it("rejects the frozen invalid corpus with authored frontiers", async () => {
        const corpus = await readFile(
            new URL(
                "../../../../../grammar/tests/json/invalid.jsonl",
                import.meta.url,
            ),
            "utf8",
        );
        enableClosureDiagnostics();
        try {
            const parser = buildJsonClosure();
            for (const source of corpus.split("\n").filter(Boolean)) {
                const state = parser.parseState(source);
                expect(state.isError, source).toBe(true);
                expect(state.offset, source).toBe(0);
                expect(state.furthest, source).toBeGreaterThanOrEqual(0);
                expect(state.expected?.length, source).toBeGreaterThan(0);
            }
        } finally {
            disableClosureDiagnostics();
        }
    });

    it("preserves exact spans and immutable successful recovery", () => {
        enableClosureDiagnostics();
        try {
            const source =
                "good: 1px;\r\nbad: @@@;\r\nnext: url(x/y);";
            const state = buildFixtureClosure().parseState(source);
            expect(state.isError).toBe(false);
            expect(state.offset).toBe(source.length);
            expect(state.value).toHaveLength(3);
            expect(state.value[1]).toEqual({
                value: { kind: "opaque" },
                span: { start: 12, end: 21 },
            });
            expect(state.diagnostics).toHaveLength(1);
            expect(state.diagnostics[0]).toMatchObject({
                offset: 12,
                furthestOffset: 17,
            });
            expect(Object.isFrozen(state.diagnostics[0])).toBe(true);
            expect(Object.isFrozen(state.diagnostics[0].expected)).toBe(true);
        } finally {
            disableClosureDiagnostics();
        }
    });

    it("returns typed nesting before host exhaustion and restores depth", () => {
        const parser = buildJsonClosure(32);
        const state = parser.parseState(
            "[".repeat(64) + "null" + "]".repeat(64),
        );
        expect(state).toMatchObject({
            offset: 0,
            isError: true,
            fault: { kind: "Nesting", limit: 32 },
            liveDepth: 0,
            maxDepth: 32,
        });
    });

    it("keeps same-FIRST recovery provenance invariant across diagnostics", () => {
        const opaque = Object.freeze({ kind: "opaque" } as const);
        type Slot = Spanned<string | typeof opaque>;
        const arms = [
            { member: 0, parser: literal("ab").spanned() },
            { member: 0, parser: literal("a").spanned() },
            { member: 1, parser: literal("b").spanned() },
            {
                member: 2,
                parser: literal("good;")
                    .recover(literal("bad;"), opaque)
                    .spanned(),
            },
            { member: 3, parser: literal("c03;").spanned() },
        ] as const;
        const grammar = new Closure(state => {
            const rootOffset = state.offset;
            const rootValue = state.value;
            const rootDiagnostics = state.diagnostics.length;
            const slots = new Array<Slot>(4);
            const used = new Uint8Array(4);
            const visited = new Set<string>();
            let usedMask = 0n;
            const search = (distinct: number): boolean => {
                if (state.offset === state.src.length && distinct === 4) {
                    state.ok([...slots]);
                    return true;
                }
                const key = `${state.offset}/${usedMask.toString(36)}`;
                if (visited.has(key)) return false;
                visited.add(key);
                for (const arm of arms) {
                    if (used[arm.member]) continue;
                    const offset = state.offset;
                    const value = state.value;
                    const diagnostics = state.diagnostics.length;
                    arm.parser.run(state);
                    if (state.isError) {
                        state.rollback(offset, value, diagnostics, false);
                        continue;
                    }
                    used[arm.member] = 1;
                    usedMask |= 1n << BigInt(arm.member);
                    slots[arm.member] = state.value as Slot;
                    if (search(distinct + 1)) return true;
                    used[arm.member] = 0;
                    usedMask &= ~(1n << BigInt(arm.member));
                    state.rollback(offset, value, diagnostics, false);
                }
                return false;
            };
            if (search(0)) return state;
            return state.rollback(
                rootOffset,
                rootValue,
                rootDiagnostics,
                true,
            );
        }) as Closure<readonly Slot[]>;
        const parser = new ClosureParser(grammar);
        const sources = [
            "abbad;c03;",
            "abc03;bad;",
            "bad;abc03;",
            "bad;c03;ab",
            "c03;abbad;",
            "c03;bad;ab",
        ];
        const offsets: number[][] = [];
        for (const diagnostics of [false, true]) {
            if (diagnostics) enableClosureDiagnostics();
            const current = sources.map(source => {
                const state = parser.parseState(source);
                expect(state.isError, source).toBe(false);
                expect(state.offset, source).toBe(source.length);
                return state.diagnostics[0].furthestOffset;
            });
            offsets.push(current);
            disableClosureDiagnostics();
        }
        expect(offsets).toEqual([
            [10, 6, 1, 1, 10, 5],
            [10, 6, 1, 1, 10, 5],
        ]);
    });

    it("rejects invalid bounds and stops nullable repetition", () => {
        expect(() => literal("x").many(-1)).toThrow(
            "repeat minimum must be a nonnegative safe integer",
        );
        expect(
            new ClosureParser(literal("").many().eof()).parseState(""),
        ).toMatchObject({
            value: [],
            offset: 0,
            isError: false,
        });
    });
});
