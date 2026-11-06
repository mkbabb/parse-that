import { createGrammar, parseFull, parsePrefix, } from "../src/index.js";
const grammar = createGrammar();
const pair = grammar.sequence(grammar.literal("left"), grammar.literal("right"));
const parser = grammar.seal(pair);
const result = parseFull(parser, "leftright");
if (result.kind === "success") {
    const value = result.value;
    const branded = result.offset;
    void value;
    void branded;
}
else if (result.kind === "failure") {
    const labels = result.expected;
    void labels;
    // @ts-expect-error failure has no value
    void result.value;
}
const other = createGrammar();
const mixed = other.choice(other.literal("yes"), other.map(other.literal("no"), () => false));
const prefix = parsePrefix(other.seal(mixed), "yes-tail");
if (prefix.kind === "success") {
    const value = prefix.value;
    void value;
}
if (false) {
    const numbers = null;
    // @ts-expect-error Parser is invariant in its value.
    const strings = numbers;
    void strings;
}
// @ts-expect-error ordinary numbers are not UTF-16 offsets.
const offset = 1;
void offset;
const astral = createGrammar();
const astralResult = parseFull(astral.seal(astral.literal("😀")), "😀");
if (astralResult.kind === "success") {
    const coordinate = astralResult.offset;
    void coordinate;
}
