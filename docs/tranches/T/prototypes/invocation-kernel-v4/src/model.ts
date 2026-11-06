import type { MemoOptions, Parser, Rule } from "./types.js";

declare const NODE_ID: unique symbol;
declare const RULE_ID: unique symbol;

export type NodeId = number & { readonly [NODE_ID]: "node" };
export type RuleId = number & { readonly [RULE_ID]: "rule" };

export const nodeId = (value: number): NodeId => value as NodeId;
export const ruleId = (value: number): RuleId => value as RuleId;
export const idNumber = (value: NodeId | RuleId): number => value as number;

/** Values cross the kernel as borrowed immutable-by-contract references. */
export type BorrowedValue = unknown;
export type MapCallback = (value: BorrowedValue) => BorrowedValue;

export const enum Effect {
    None = 0,
    Diagnostic = 1 << 0,
    Recover = 1 << 1,
    Cut = 1 << 2,
    RuleDependent = 1 << 3,
}

interface DraftBase {
    readonly id: NodeId;
}

export type DraftNode =
    | (DraftBase & { readonly kind: "epsilon"; readonly value: BorrowedValue })
    | (DraftBase & { readonly kind: "literal"; readonly text: string })
    | (DraftBase & { readonly kind: "sequence"; readonly children: readonly NodeId[] })
    | (DraftBase & { readonly kind: "choice"; readonly children: readonly NodeId[] })
    | (DraftBase & { readonly kind: "map"; readonly child: NodeId; readonly callback: MapCallback })
    | (DraftBase & { readonly kind: "many"; readonly child: NodeId })
    | (DraftBase & { readonly kind: "commit"; readonly child: NodeId })
    | (DraftBase & { readonly kind: "recover"; readonly child: NodeId; readonly fallback: BorrowedValue })
    | (DraftBase & { readonly kind: "memo"; readonly child: NodeId; readonly policy: "reject" | "replay" })
    | (DraftBase & { readonly kind: "call"; readonly rule: RuleId });

export type SealedNode = DraftNode;

export interface DraftRule {
    readonly id: RuleId;
    readonly name: string;
    readonly callNode: NodeId;
    body?: NodeId;
}

export interface SealedRule {
    readonly id: RuleId;
    readonly name: string;
    readonly callNode: NodeId;
    readonly body: NodeId;
    readonly dependencies: readonly RuleId[];
    readonly reverseDependencies: readonly RuleId[];
    readonly scc: number;
    readonly recursive: boolean;
    readonly effects: Effect;
    readonly nullable: boolean;
    readonly minimumGuaranteedConsumption: number | null;
}

export interface SealedScc {
    readonly id: number;
    readonly rules: readonly RuleId[];
    readonly rightGuarded: boolean;
}

export interface SealedGraph {
    readonly nodes: readonly SealedNode[];
    readonly rules: readonly SealedRule[];
    readonly sccs: readonly SealedScc[];
    readonly nodeEffects: readonly Effect[];
    readonly nodeNullable: readonly boolean[];
    readonly nodeMinimumGuaranteedConsumption: readonly (number | null)[];
    readonly reachableNodes: readonly NodeId[];
    readonly reachableRules: readonly RuleId[];
    readonly inspection: string;
}

export interface ParserBinding {
    readonly owner: object;
    readonly node: NodeId;
}

export interface AcquiredParser {
    readonly graph: SealedGraph;
    readonly node: NodeId;
}

export type ParserFactory = <T>(binding: ParserBinding, rule?: RuleId) => Parser<T> | Rule<T>;

export interface DraftGrammar {
    readonly owner: object;
    readonly nodes: DraftNode[];
    readonly rules: DraftRule[];
    readonly root: NodeId;
}

export type DraftNodeInput = DraftNode extends infer Candidate
    ? Candidate extends { readonly id: NodeId }
        ? Omit<Candidate, "id">
        : never
    : never;

export function childNodes(node: DraftNode): readonly NodeId[] {
    switch (node.kind) {
        case "sequence":
        case "choice":
            return node.children;
        case "map":
        case "many":
        case "commit":
        case "recover":
        case "memo":
            return [node.child];
        case "epsilon":
        case "literal":
        case "call":
            return [];
    }
}

export function memoPolicy(options: MemoOptions | undefined): "reject" | "replay" {
    return options?.effects ?? "reject";
}
