import {
    choice,
    literal,
    map,
    parseFull,
    parsePrefix,
    sequence,
    type Offset,
    type Parser,
} from "./kernel.js";

const pair = sequence(literal("left"), literal("right"));
const pairResult = parseFull(pair, "leftright");
if (pairResult.kind === "success") {
    const inferred: readonly ["left", "right"] = pairResult.value;
    const brandedOffset: Offset = pairResult.offset;
    void inferred;
    void brandedOffset;
} else {
    const labels: readonly string[] = pairResult.expected;
    void labels;
    // @ts-expect-error failure carries no value
    void pairResult.value;
}

const mixed = choice(literal("yes"), map(literal("no"), () => false as const));
const prefix = parsePrefix(mixed, "yes-tail");
if (prefix.kind === "success") {
    const inferred: "yes" | false = prefix.value;
    void inferred;
}

declare const parser: Parser<number>;
// @ts-expect-error Parser is invariant in its value type.
const unsafe: Parser<string> = parser;
void unsafe;

// @ts-expect-error an ordinary number is not a branded UTF-16 offset.
const unbranded: Offset = 1;
void unbranded;
