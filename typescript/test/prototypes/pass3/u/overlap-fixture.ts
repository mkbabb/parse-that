import {
    choice,
    literal,
    type Spanned,
} from "../s/kernel.js";
import {
    compileUnordered,
    required,
    type CompiledUnordered,
} from "./unordered.js";

export const OPAQUE = Object.freeze({ kind: "opaque" }) as Readonly<{
    kind: "opaque";
}>;
export type OverlapSlot =
    | Spanned<string>
    | Spanned<typeof OPAQUE>;
export type OverlapSlots = readonly OverlapSlot[];
export type OverlapSpec =
    | Readonly<{ kind: "choice"; member: number; texts: readonly string[] }>
    | Readonly<{ kind: "literal"; member: number; text: string }>
    | Readonly<{
        kind: "recovery";
        member: number;
        expected: string;
        source: string;
    }>;

export function overlapSpecs(count: number): readonly OverlapSpec[] {
    if (!Number.isSafeInteger(count) || count < 4) {
        throw new RangeError("overlap fixture requires at least four members");
    }
    return [
        { kind: "choice", member: 0, texts: ["ab", "a"] },
        { kind: "literal", member: 1, text: "b" },
        {
            kind: "recovery",
            member: 2,
            expected: "good;",
            source: "oops;",
        },
        ...Array.from({ length: count - 3 }, (_, offset) => {
            const member = offset + 3;
            const first = String.fromCharCode(99 + (offset & 3));
            return {
                kind: "literal" as const,
                member,
                text: `${first}${member.toString(36).padStart(2, "0")};`,
            };
        }),
    ];
}

export function overlapSources(count: number): readonly string[] {
    const components = [
        "ab",
        "oops;",
        ...overlapSpecs(count)
            .filter((spec): spec is Extract<OverlapSpec, {
                kind: "literal";
            }> => spec.kind === "literal" && spec.member > 1)
            .map(spec => spec.text),
    ];
    const pivot = Math.max(1, components.length >> 1);
    return [
        components.join(""),
        [...components].reverse().join(""),
        [...components.slice(pivot), ...components.slice(0, pivot)].join(""),
    ];
}

export function makeOverlapCandidate(
    count: number,
): CompiledUnordered<OverlapSlot[]> {
    const members = overlapSpecs(count).map(spec => {
        if (spec.kind === "choice") {
            return required(choice(
                ...spec.texts.map(text => literal(text)),
            ).spanned());
        }
        if (spec.kind === "recovery") {
            return required(
                literal(spec.expected)
                    .recover(literal(spec.source), OPAQUE)
                    .spanned(),
            );
        }
        return required(literal(spec.text).spanned());
    });
    return compileUnordered(
        "all",
        members,
        "D",
    ) as unknown as CompiledUnordered<OverlapSlot[]>;
}
