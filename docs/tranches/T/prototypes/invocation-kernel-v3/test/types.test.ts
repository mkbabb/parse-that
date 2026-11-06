import {
    createGrammar,
    parseFull,
    parsePrefix,
    type Offset,
    type Parser,
} from "../src/index.js";

const grammar = createGrammar();
const pair = grammar.sequence(grammar.literal("left"), grammar.literal("right"));
const parser = grammar.seal(pair);
const result = parseFull(parser, "leftright");
if (result.kind === "success") {
    const value: readonly ["left", "right"] = result.value;
    const branded: Offset = result.offset;
    void value;
    void branded;
} else if (result.kind === "failure") {
    const labels: readonly string[] = result.expected;
    void labels;
    // @ts-expect-error failure has no value
    void result.value;
}

const other = createGrammar();
const mixed = other.choice(
    other.literal("yes"),
    other.map(other.literal("no"), () => false as const),
);
const prefix = parsePrefix(other.seal(mixed), "yes-tail");
if (prefix.kind === "success") {
    const value: "yes" | false = prefix.value;
    void value;
}

if (false) {
    const numbers = null as unknown as Parser<number>;
    // @ts-expect-error Parser is invariant in its value.
    const strings: Parser<string> = numbers;
    void strings;
}

// @ts-expect-error ordinary numbers are not UTF-16 offsets.
const offset: Offset = 1;
void offset;

const astral = createGrammar();
const astralResult = parseFull(astral.seal(astral.literal("😀")), "😀");
if (astralResult.kind === "success") {
    const coordinate: Offset = astralResult.offset;
    void coordinate;
}
