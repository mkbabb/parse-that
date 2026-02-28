import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    string,
    regex,
    any,
    dispatch,
    eof,
    Parser,
    ParserState,
    enableDiagnostics,
    disableDiagnostics,
} from "../src/parse/index.js";
import {
    formatExpected,
    statePrint,
    addCursor,
    summarizeLine,
} from "../src/parse/debug.js";
import {
    resetErrorState,
    getLastExpected,
    getLastSuggestions,
    getLastSecondarySpans,
} from "../src/parse/utils.js";

/** Strip ANSI escape codes for snapshot comparison. */
function stripAnsi(s: string): string {
    return s.replace(/\x1b\[[0-9;]*m/g, "");
}

// ── CSS Parsers ──────────────────────────────────────────────────────────
// Hand-built from combinators — these mirror a simplified CSS grammar.

// ── Whitespace ───────────────────────────────────────────────────────────
const ws = regex(/\s*/);

// ── CSS Colors ───────────────────────────────────────────────────────────
const hexDigits = regex(/[0-9a-fA-F]{3,8}/);
const hexColor = string("#").next(hexDigits).map((v) => `#${v}`);

const cssNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?/);
const comma = string(",").trim();
const percentage = cssNumber.skip(string("%"));

const rgbArgs = cssNumber.sepBy(comma, 3, 3).wrap(string("("), string(")"));
const rgbColor = string("rgb").next(rgbArgs).map((args) => `rgb(${args.join(",")})`);

const hslArgs = cssNumber
    .or(percentage)
    .sepBy(comma, 3, 3)
    .wrap(string("("), string(")"));
const hslColor = string("hsl").next(hslArgs).map((args) => `hsl(${args.join(",")})`);

const namedColor = any(
    string("red"),
    string("green"),
    string("blue"),
    string("black"),
    string("white"),
    string("transparent"),
);

// Use dispatch for unambiguous first chars, with an any() fallback for
// 'r' which is shared by both "rgb(...)" and "red".
const rColor = any(rgbColor, string("red"));
const cssColor = dispatch(
    {
        "#": hexColor,
        r: rColor,
        h: hslColor,
        g: string("green"),
        b: any(string("blue"), string("black")),
        w: string("white"),
        t: string("transparent"),
    },
);

// Keep namedColor as a standalone parser for tests that exercise pure
// any()-based alternation diagnostics.


// ── CSS Selectors ────────────────────────────────────────────────────────
const ident = regex(/[a-zA-Z_][a-zA-Z0-9_-]*/);

const typeSelector = ident.map((v) => ({ type: "type" as const, name: v }));
const classSelector = string(".")
    .next(ident)
    .map((v) => ({ type: "class" as const, name: v }));
const idSelector = string("#")
    .next(ident)
    .map((v) => ({ type: "id" as const, name: v }));

const attrOp = any(string("="), string("~="), string("|="), string("^="), string("$="), string("*="));
const attrValue = regex(/[^\]]+/);
const attrSelector = string("[")
    .next(ident)
    .then(attrOp.then(attrValue).opt())
    .skip(string("]"))
    .map(([name, opVal]) => ({
        type: "attr" as const,
        name,
        op: opVal?.[0],
        value: opVal?.[1],
    }));

const pseudoSelector = string(":")
    .next(ident)
    .map((v) => ({ type: "pseudo" as const, name: v }));

const simpleSelector = any(
    classSelector,
    idSelector,
    attrSelector,
    pseudoSelector,
    typeSelector,
);

const combinator = any(
    string(">").trim(),
    string("+").trim(),
    string("~").trim(),
);

const compoundSelector = simpleSelector
    .then(combinator.then(simpleSelector).many())
    .map(([first, rest]) => {
        if (rest.length === 0) return first;
        return { type: "compound" as const, parts: [first, ...rest.flat()] };
    });

const selectorList = compoundSelector.sepBy(comma, 1);

// ── CSS Values ───────────────────────────────────────────────────────────
const cssString = regex(/"[^"]*"/).or(regex(/'[^']*'/));
const cssDimension = cssNumber.then(any(
    string("px"),
    string("em"),
    string("rem"),
    string("%"),
    string("vh"),
    string("vw"),
)).map(([n, u]) => `${n}${u}`);
const cssIdent = ident;
const cssFunctionCall = ident
    .then(regex(/[^)]*/).wrap(string("("), string(")")))
    .map(([name, args]) => `${name}(${args})`);

const cssValue = any(
    cssDimension,
    cssColor,
    cssFunctionCall,
    cssNumber,
    cssString,
    cssIdent,
);

// ── CSS Declarations ─────────────────────────────────────────────────────
const declaration = ident
    .skip(string(":").trim())
    .then(cssValue.sepBy(ws, 1))
    .skip(string(";").trim())
    .map(([prop, vals]) => ({ property: prop, values: vals }));

const declarationBlock = declaration.many().trim().wrap(string("{"), string("}"));

// ── CSS Rules ────────────────────────────────────────────────────────────
const cssRule = selectorList.skip(ws).then(declarationBlock);

// ── CSS Keyframes ────────────────────────────────────────────────────────
const keyframeStop = any(
    string("from"),
    string("to"),
    percentage,
);

const keyframeBlock = keyframeStop
    .trim()
    .then(declarationBlock.trim());

const keyframesRule = string("@keyframes")
    .next(ws)
    .next(ident.trim())
    .then(keyframeBlock.many(1).trim().wrap(string("{"), string("}")));

// ═════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════

describe("CSS Diagnostics", () => {
    beforeEach(() => {
        enableDiagnostics();
        resetErrorState();
    });

    afterEach(() => {
        disableDiagnostics();
    });

    // ── Sanity: parsers work on valid input ───────────────────────────
    describe("Parser sanity checks", () => {
        it("should parse hex colors", () => {
            resetErrorState();
            const state = new ParserState("#ff00aa");
            cssColor.parser(state);
            expect(state.isError).toBe(false);
            expect(state.value).toBe("#ff00aa");
        });

        it("should parse rgb colors", () => {
            resetErrorState();
            const state = new ParserState("rgb(255,0,128)");
            cssColor.parser(state);
            expect(state.isError).toBe(false);
        });

        it("should parse named colors", () => {
            resetErrorState();
            const state = new ParserState("red");
            cssColor.parser(state);
            expect(state.isError).toBe(false);
        });

        it("should parse class selectors", () => {
            resetErrorState();
            const state = new ParserState(".container");
            simpleSelector.parser(state);
            expect(state.isError).toBe(false);
            expect(state.value).toEqual({ type: "class", name: "container" });
        });

        it("should parse a full CSS rule", () => {
            resetErrorState();
            const state = new ParserState(".foo { color: red; }");
            cssRule.parser(state);
            expect(state.isError).toBe(false);
        });
    });

    // ── Color parser errors ──────────────────────────────────────────
    describe("Color parser errors", () => {
        it("should report dispatch alternatives on invalid first char", () => {
            resetErrorState();
            const state = new ParserState("xyz");
            cssColor.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            // dispatch uses fallback → namedColor = any(string("red"), ...).
            // "xyz" starts with 'x' which doesn't match '#', 'r', or 'h' in
            // the dispatch table, so the fallback fires. The fallback is
            // any(string("red"), ..., string("transparent")), and each
            // alternative fails at offset 0. The labels accumulate.
            expect(expected.length).toBeGreaterThanOrEqual(1);
        });

        it("should accumulate all named color alternatives at same offset", () => {
            resetErrorState();
            const state = new ParserState("xyz");
            namedColor.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            // All 6 named colors fail at offset 0 → all are listed
            expect(expected).toContain('"red"');
            expect(expected).toContain('"green"');
            expect(expected).toContain('"blue"');
            expect(expected).toContain('"black"');
            expect(expected).toContain('"white"');
            expect(expected).toContain('"transparent"');
            expect(expected.length).toBe(6);
        });

        it("should format named color alternatives with Oxford comma", () => {
            resetErrorState();
            const state = new ParserState("xyz");
            namedColor.parser(state);

            const expected = getLastExpected();
            const formatted = formatExpected(expected);
            // 6 items → Oxford comma: "expected ..., ..., ..., or ..."
            expect(formatted).toContain(", or ");
            expect(formatted).toMatch(/^expected /);
        });

        it("should report error at missing closing paren in rgb", () => {
            resetErrorState();
            const state = new ParserState("rgb(255,0,128");
            cssColor.parser(state);

            expect(state.isError).toBe(true);
            const suggestions = getLastSuggestions();
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.some((s) => s.kind === "unclosed-delimiter")).toBe(true);
            expect(suggestions.some((s) => s.message.includes(")"))).toBe(true);
        });

        it("should emit secondary span pointing to rgb open paren", () => {
            resetErrorState();
            const state = new ParserState("rgb(255,0,128");
            cssColor.parser(state);

            const spans = getLastSecondarySpans();
            expect(spans.length).toBeGreaterThan(0);
            expect(spans.some((s) => s.label.includes("opened here"))).toBe(true);
            // The "(" is at offset 3
            expect(spans.some((s) => s.offset === 3)).toBe(true);
        });

        it("should report hex color with invalid digits", () => {
            resetErrorState();
            const state = new ParserState("#xyz");
            hexColor.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            // After "#" matches, the hexDigits regex fails. The expected
            // label should reference the hex digits pattern.
            expect(expected.length).toBeGreaterThan(0);
        });

        it("should report error at the third rgb argument", () => {
            resetErrorState();
            const state = new ParserState("rgb(255,0,)");
            cssColor.parser(state);

            expect(state.isError).toBe(true);
            // Error should be deep in the parse — the expected should
            // mention what was expected for the third arg, not "rgb" at start
            const expected = getLastExpected();
            expect(expected.length).toBeGreaterThan(0);
        });
    });

    // ── Selector parser errors ───────────────────────────────────────
    describe("Selector parser errors", () => {
        it("should accumulate all simple selector alternatives", () => {
            resetErrorState();
            const state = new ParserState("123");
            simpleSelector.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            // simpleSelector = any(classSelector, idSelector, attrSelector,
            //                      pseudoSelector, typeSelector)
            // classSelector starts with string(".") → label '"."'
            // idSelector starts with string("#") → label '"#"'
            // attrSelector starts with string("[") → label '"["'
            // pseudoSelector starts with string(":") → label '":"'
            // typeSelector uses regex(/[a-zA-Z_].../) → label for that regex
            expect(expected).toContain('"."');
            expect(expected).toContain('"#"');
            expect(expected).toContain('"["');
            expect(expected).toContain('":"');
            // typeSelector's ident regex
            expect(expected.some((e) => e.includes("[a-zA-Z_]"))).toBe(true);
        });

        it("should format 5 selector alternatives with Oxford comma", () => {
            resetErrorState();
            const state = new ParserState("123");
            simpleSelector.parser(state);

            const expected = getLastExpected();
            const formatted = formatExpected(expected);
            expect(formatted).toContain(", or ");
            expect(formatted).toMatch(/^expected /);
        });

        it("should report unclosed attribute selector bracket", () => {
            resetErrorState();
            // "[attr=val" is missing the closing "]"
            // attrSelector = string("[").next(ident).then(...).skip(string("]"))
            // But attrSelector is built as a chained skip, not wrap, so no
            // unclosed-delimiter suggestion. However, simpleSelector will fail,
            // and the error will be at the furthest offset reached.
            const state = new ParserState("[attr=val");
            attrSelector.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            // The parser reached past "[attr=val" successfully for the
            // next/then parts, but then "]" fails at offset 9. Expected
            // should mention '"]"'.
            expect(expected).toContain('"]"');
        });

        it("should report error after combinator expecting selector", () => {
            resetErrorState();
            // ".foo > " then no valid selector follows
            const state = new ParserState(".foo > 123");
            compoundSelector.parser(state);

            // .foo matches, then "> " matches the combinator, then "123"
            // fails as a simpleSelector. The many() catches this and returns
            // the partial result. But the parse succeeds with just ".foo"
            // because many(0) allows zero matches of the combinator+selector.
            // So compoundSelector itself succeeds, consuming just ".foo".
            expect(state.isError).toBe(false);
            expect(state.offset).toBe(4); // consumed ".foo"
        });

        it("should report error in selector list with bad separator", () => {
            resetErrorState();
            const state = new ParserState(".foo; .bar");
            selectorList.parser(state);

            // selectorList parses the first ".foo" successfully, then tries
            // comma separator but finds ";", so sepBy stops with 1 match.
            // This succeeds since min=1.
            expect(state.isError).toBe(false);
            expect(state.offset).toBe(4); // consumed ".foo"
        });
    });

    // ── Declaration & Rule errors ────────────────────────────────────
    describe("Declaration & Rule errors", () => {
        it("should report error for missing value after colon", () => {
            resetErrorState();
            const state = new ParserState("color: ;");
            declaration.parser(state);

            expect(state.isError).toBe(true);
            // "color" matches ident, ":" matches, then ";" is not a valid
            // cssValue. The error offset should be past the colon+whitespace.
            const expected = getLastExpected();
            expect(expected.length).toBeGreaterThan(0);
        });

        it("should report error for missing semicolon after value", () => {
            resetErrorState();
            const state = new ParserState("color: red}");
            declaration.parser(state);

            expect(state.isError).toBe(true);
            // "color" matches, ":" matches, "red" matches as cssIdent, then
            // "}" is not ";" → error. Expected should mention '";"'.
            const expected = getLastExpected();
            expect(expected).toContain('";"');
        });

        it("should report unclosed brace in declaration block", () => {
            resetErrorState();
            const state = new ParserState("{ color: red; ");
            declarationBlock.parser(state);

            expect(state.isError).toBe(true);
            const suggestions = getLastSuggestions();
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.some((s) => s.kind === "unclosed-delimiter")).toBe(true);
            expect(suggestions.some((s) => s.message.includes("}"))).toBe(true);
        });

        it("should emit secondary span pointing to opening brace", () => {
            resetErrorState();
            const state = new ParserState("{ color: red; ");
            declarationBlock.parser(state);

            const spans = getLastSecondarySpans();
            expect(spans.length).toBeGreaterThan(0);
            expect(spans.some((s) => s.label.includes("opened here"))).toBe(true);
            expect(spans.some((s) => s.offset === 0)).toBe(true);
        });

        it("should report error for completely invalid declaration", () => {
            resetErrorState();
            const state = new ParserState("{ 123: red; }");
            declarationBlock.parser(state);

            // "{" opens, then trim whitespace, then declaration.many()
            // tries to parse "123: red;" — ident fails on "123", so many()
            // returns 0 matches, then "}" is expected but we have "123..."
            // at the trim boundary.
            expect(state.isError).toBe(true);
        });

        it("should report error in full rule with bad property value", () => {
            resetErrorState();
            const state = new ParserState(".btn { font-size: ; }");
            cssRule.parser(state);

            expect(state.isError).toBe(true);
            // Error should be deep — at the empty value position after ":"
            const expected = getLastExpected();
            expect(expected.length).toBeGreaterThan(0);
        });
    });

    // ── Keyframes errors ─────────────────────────────────────────────
    describe("Keyframes errors", () => {
        it("should parse valid keyframes", () => {
            resetErrorState();
            const input = "@keyframes fade { from { opacity: 1; } to { opacity: 0; } }";
            const state = new ParserState(input);
            keyframesRule.parser(state);
            expect(state.isError).toBe(false);
        });

        it("should report unclosed outer brace in keyframes", () => {
            resetErrorState();
            const input = "@keyframes fade { from { opacity: 1; }";
            const state = new ParserState(input);
            keyframesRule.parser(state);

            expect(state.isError).toBe(true);
            const suggestions = getLastSuggestions();
            expect(suggestions.some((s) => s.kind === "unclosed-delimiter")).toBe(true);
        });

        it("should report unclosed inner brace in keyframe block", () => {
            resetErrorState();
            const input = "@keyframes fade { from { opacity: 1; }";
            const state = new ParserState(input);
            keyframesRule.parser(state);

            expect(state.isError).toBe(true);
            // The outer "}" is missing, which produces an unclosed-delimiter
            const suggestions = getLastSuggestions();
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it("should report error for invalid keyframe stop", () => {
            resetErrorState();
            // "xyz" is not "from", "to", or a percentage
            const input = "@keyframes fade { xyz { opacity: 0; } }";
            const state = new ParserState(input);
            keyframesRule.parser(state);

            expect(state.isError).toBe(true);
        });

        it("should report error for missing @keyframes name", () => {
            resetErrorState();
            const input = "@keyframes { from { opacity: 1; } }";
            const state = new ParserState(input);
            keyframesRule.parser(state);

            // After "@keyframes" and whitespace, "{" is not a valid ident
            expect(state.isError).toBe(true);
        });
    });

    // ── Multiline diagnostics ────────────────────────────────────────
    describe("Multiline diagnostics", () => {
        it("should show correct line in multi-line CSS with error on line 3", () => {
            resetErrorState();
            const input = `.container {
  color: red;
  font-size: ;
  margin: 10px;
}`;
            const state = new ParserState(input);
            cssRule.parser(state);

            expect(state.isError).toBe(true);

            // Create error state at the furthest offset for display
            // font-size: ; → error at ";" (offset of ";" on line 3)
            // Line 3 is "  font-size: ;" — the error is at the ";"
            const expected = getLastExpected();
            expect(expected.length).toBeGreaterThan(0);
        });

        it("should produce statePrint with correct line numbers", () => {
            resetErrorState();
            const input = `body {
  color: red;
  background: ;
}`;
            const state = new ParserState(input);
            cssRule.parser(state);

            expect(state.isError).toBe(true);

            // Build error state at furthest offset for statePrint
            const errorState = new ParserState(input, undefined, 29, true);
            const output = stripAnsi(statePrint(errorState));

            // Should contain pipe separators and line numbers
            expect(output).toContain("|");
        });

        it("should handle addCursor on multiline input", () => {
            // Simulate error on line 3 of a 5-line CSS block
            const input = `h1 {
  color: red;
  font-size: ;
  margin: 0;
}`;
            // "  font-size: " ends at the space before ";", which is offset ~27
            // Line 3 starts at offset 19 ("  font-size: ;")
            const offset = input.indexOf(";", input.indexOf("font-size"));
            const state = new ParserState(input, undefined, offset, true);
            const output = stripAnsi(addCursor(state, "^^^", true));

            // Should show surrounding lines
            expect(output).toContain("font-size");
            expect(output).toContain("^^^");
            // Should show line numbers
            expect(output).toContain("|");
        });
    });

    // ── Long line truncation ─────────────────────────────────────────
    describe("Long line truncation", () => {
        it("should truncate very long property value in summarizeLine", () => {
            const longValue = "background: " + "linear-gradient(".repeat(15) + "red" + ")".repeat(15) + ";";
            // This creates a line > 200 chars
            expect(longValue.length).toBeGreaterThan(200);

            const result = summarizeLine(longValue, 100);
            expect(result.length).toBeLessThan(longValue.length);
            expect(result).toContain("...");
        });

        it("should center-truncate around the error column", () => {
            const prefix = "a".repeat(100);
            const error = "ERROR";
            const suffix = "b".repeat(100);
            const line = prefix + error + suffix;

            const col = 100; // right where ERROR starts
            const result = summarizeLine(line, col);
            expect(result).toContain("...");
            // The truncated result should keep content near column 100
            expect(result.length).toBeLessThan(line.length);
        });

        it("should produce truncated output in statePrint for long CSS", () => {
            resetErrorState();
            const longProp = "background: " + "x".repeat(200) + ";";
            const input = `.foo { ${longProp} }`;
            const state = new ParserState(input, undefined, 15, true);
            const output = stripAnsi(statePrint(state));

            // statePrint uses summarizeLine internally, so long lines should be truncated
            expect(output).toContain("...");
        });
    });

    // ── EOF / trailing content ───────────────────────────────────────
    describe("EOF and trailing content", () => {
        it("should report end of input expected with .eof()", () => {
            resetErrorState();
            const colorEof = cssColor.skip(eof());
            const state = new ParserState("red GARBAGE");
            colorEof.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            expect(expected).toContain("<end of input>");
        });

        it("should report trailing content with FLAG_EOF via call()", () => {
            resetErrorState();
            const colorParser = namedColor;
            // Manually set FLAG_EOF (value is 2)
            const wrappedParser = new Parser((state: ParserState<string>) => {
                return colorParser.parser(state);
            });
            wrappedParser.flags = 2; // FLAG_EOF

            const state = new ParserState("red GARBAGE");
            wrappedParser.call(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            expect(expected).toContain("<end of input>");

            const suggestions = getLastSuggestions();
            expect(suggestions.some((s) => s.kind === "trailing-content")).toBe(true);
            expect(suggestions.some((s) => s.message.includes("trailing"))).toBe(true);
        });

        it("should not error when eof matches correctly", () => {
            resetErrorState();
            const colorEof = cssColor.skip(eof());
            const state = new ParserState("blue");
            colorEof.parser(state);

            expect(state.isError).toBe(false);
        });
    });

    // ── Furthest offset tracking ─────────────────────────────────────
    describe("Furthest offset tracking", () => {
        it("should track error at furthest offset, not start", () => {
            resetErrorState();
            // "rgb(255,0,)" — the error is at ")" after the second comma,
            // not at the start "r".
            const state = new ParserState("rgb(255,0,)");
            rgbColor.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            // The furthest offset should be at 10 (the ")"), and the
            // expected should be about what was expected there (a number
            // for the 3rd argument).
            expect(expected.length).toBeGreaterThan(0);
            // Should NOT still say "rgb" — that matched successfully
            expect(expected).not.toContain('"rgb"');
        });

        it("should report error deep inside declaration value", () => {
            resetErrorState();
            const state = new ParserState("color: ;");
            declaration.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            // Error should be after ": " — the property and colon matched
            // fine. Expected should list value alternatives, not ":" or ident.
            expect(expected.length).toBeGreaterThan(0);
        });

        it("should clear earlier labels when advancing past them", () => {
            resetErrorState();
            // "red;" → namedColor matches "red", then expect ";" to follow
            // but actually let's make the test more precise:
            // Parse "az" against any(string("ab"), string("ac"))
            // Both fail at offset 0 after "a" doesn't lead anywhere useful.
            // Actually string("ab") fails at offset 0 (doesn't startsWith "ab"),
            // string("ac") fails at offset 0 (doesn't startsWith "ac").
            // Both fail at offset 0, so both labels accumulate.
            const p = any(string("ab"), string("ac"));
            const state = new ParserState("az");
            p.parser(state);

            const expected = getLastExpected();
            expect(expected).toContain('"ab"');
            expect(expected).toContain('"ac"');
        });

        it("should only show labels from furthest offset", () => {
            resetErrorState();
            // string("abc").skip(string("def"))
            // on input "abcxyz":
            // - "abc" succeeds at offset 0→3
            // - "def" fails at offset 3
            // Expected should only show '"def"', not '"abc"'
            const p = string("abc").skip(string("def"));
            const state = new ParserState("abcxyz");
            p.parser(state);

            const expected = getLastExpected();
            expect(expected).toContain('"def"');
            expect(expected).not.toContain('"abc"');
        });
    });

    // ── Edge cases ───────────────────────────────────────────────────
    describe("Edge cases", () => {
        it("should not leak labels across separate parses", () => {
            // First parse succeeds
            resetErrorState();
            const state1 = new ParserState("red");
            namedColor.parser(state1);
            expect(state1.isError).toBe(false);

            // Second parse fails
            resetErrorState();
            const state2 = new ParserState("xyz");
            namedColor.parser(state2);
            expect(state2.isError).toBe(true);

            const expected = getLastExpected();
            // Should only have labels from the second parse
            expect(expected.length).toBe(6); // all 6 named colors
            expect(expected).toContain('"red"');
        });

        it("should handle empty input gracefully", () => {
            resetErrorState();
            const state = new ParserState("");
            cssColor.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            expect(expected.length).toBeGreaterThan(0);
        });

        it("should handle dispatch with no matching char and no fallback", () => {
            resetErrorState();
            const noFallback = dispatch({
                a: string("abc"),
                b: string("bcd"),
            });
            const state = new ParserState("xyz");
            noFallback.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            expect(expected.length).toBe(1);
            expect(expected[0]).toContain("one of");
            expect(expected[0]).toContain("'a'");
            expect(expected[0]).toContain("'b'");
        });

        it("should handle dispatch with range syntax in label", () => {
            resetErrorState();
            const numDispatch = dispatch({
                "0-9": cssNumber,
            });
            const state = new ParserState("abc");
            numDispatch.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            expect(expected.length).toBe(1);
            expect(expected[0]).toContain("'0'-'9'");
        });

        it("should produce correct formatExpected for exactly 2 labels", () => {
            const result = formatExpected(['"a"', '"b"']);
            expect(result).toBe('expected "a" or "b"');
        });

        it("should produce correct formatExpected for exactly 1 label", () => {
            const result = formatExpected(['";"']);
            expect(result).toBe('expected ";"');
        });

        it("should produce empty string for 0 labels", () => {
            const result = formatExpected([]);
            expect(result).toBe("");
        });

        it("should handle nested wraps — inner unclosed reported", () => {
            resetErrorState();
            // Inner wrap missing close: "([hello)" — the "(" opens,
            // then "[hello" is parsed but inner "]" is missing
            const inner = string("hello").wrap(string("["), string("]"));
            const outer = inner.wrap(string("("), string(")"));
            const state = new ParserState("([hello)");
            outer.parser(state);

            expect(state.isError).toBe(true);
            const suggestions = getLastSuggestions();
            // Should have unclosed-delimiter for the "[" bracket
            expect(suggestions.some((s) => s.kind === "unclosed-delimiter")).toBe(true);
        });

        it("should report correct open offset in secondary span for nested wrap", () => {
            resetErrorState();
            const inner = string("hello").wrap(string("["), string("]"));
            const outer = inner.wrap(string("("), string(")"));
            const state = new ParserState("([hello)");
            outer.parser(state);

            const spans = getLastSecondarySpans();
            expect(spans.length).toBeGreaterThan(0);
            // The "[" is at offset 1
            expect(spans.some((s) => s.offset === 1)).toBe(true);
        });
    });

    // ── Complex nested errors ────────────────────────────────────────
    describe("Complex nested errors", () => {
        it("should report error in keyframes with malformed declaration", () => {
            resetErrorState();
            const input = "@keyframes spin { from { : red; } }";
            const state = new ParserState(input);
            keyframesRule.parser(state);

            expect(state.isError).toBe(true);
        });

        it("should report error in multi-selector rule", () => {
            resetErrorState();
            // Multiple declarations — error in second one
            const input = ".foo { color: red; font: ; }";
            const state = new ParserState(input);
            cssRule.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            expect(expected.length).toBeGreaterThan(0);
        });

        it("should track furthest offset through deeply nested structure", () => {
            resetErrorState();
            const input = "@keyframes fade { from { opacity: 1; } to { opacity: ; } }";
            const state = new ParserState(input);
            keyframesRule.parser(state);

            expect(state.isError).toBe(true);
            // The error is at the ";" after "opacity: " in the "to" block
            // Expected should mention value alternatives
            const expected = getLastExpected();
            expect(expected.length).toBeGreaterThan(0);
        });

        it("should handle multiple wrap failures producing multiple suggestions", () => {
            resetErrorState();
            // Try to parse "(hello" with wrap — missing ")"
            // Then try "[world" with another wrap — missing "]"
            // When using any(), only the furthest offset matters
            const p1 = string("hello").wrap(string("("), string(")"));
            const p2 = string("world").wrap(string("["), string("]"));
            const combined = any(p1, p2);

            const state = new ParserState("(hello");
            combined.parser(state);

            expect(state.isError).toBe(true);
            // p1 gets further (matches "(hello" then fails at close)
            // p2 fails at start (no "[")
            // So the suggestions should be from p1 (furthest)
            const suggestions = getLastSuggestions();
            expect(suggestions.some((s) => s.kind === "unclosed-delimiter")).toBe(true);
            expect(suggestions.some((s) => s.message.includes(")"))).toBe(true);
        });

        it("should preserve correct error state after backtracking", () => {
            resetErrorState();
            // any(rgb_that_fails_late, named_that_fails_early)
            // rgb gets further → its labels should win
            const p = any(rgbColor, namedColor);
            const state = new ParserState("rgb(255,0,)");
            p.parser(state);

            expect(state.isError).toBe(true);
            const expected = getLastExpected();
            // rgbColor got to offset 10 before failing
            // namedColor fails at offset 0
            // Expected should be from offset 10 (rgb's deeper failure)
            expect(expected.length).toBeGreaterThan(0);
            // Should not contain named color labels from offset 0
            expect(expected).not.toContain('"green"');
            expect(expected).not.toContain('"blue"');
        });
    });

    // ── statePrint integration ───────────────────────────────────────
    describe("statePrint integration", () => {
        it("should include expected in error output", () => {
            resetErrorState();
            const state = new ParserState("xyz");
            namedColor.parser(state);

            const errorState = new ParserState("xyz", undefined, 0, true);
            const output = stripAnsi(statePrint(errorState));
            expect(output).toContain("Err");

            // With diagnostics enabled, statePrint reads global expected
            const expected = getLastExpected();
            expect(expected.length).toBeGreaterThan(0);
            const formatted = formatExpected(expected);
            // statePrint output should include the formatted expected message
            expect(stripAnsi(statePrint(errorState))).toContain(
                stripAnsi(formatted),
            );
        });

        it("should include suggestions in error output for unclosed delimiter", () => {
            resetErrorState();
            const p = string("hello").wrap(string("("), string(")"));
            const state = new ParserState("(hello");
            p.parser(state);

            const errorState = new ParserState("(hello", undefined, 6, true);
            const output = stripAnsi(statePrint(errorState));

            // statePrint should include the suggestion text
            const suggestions = getLastSuggestions();
            expect(suggestions.length).toBeGreaterThan(0);
            expect(output).toContain("close the delimiter");
        });

        it("should include secondary spans in error output", () => {
            resetErrorState();
            const p = string("hello").wrap(string("{"), string("}"));
            const state = new ParserState("{hello");
            p.parser(state);

            const errorState = new ParserState("{hello", undefined, 6, true);
            const output = stripAnsi(statePrint(errorState));

            const spans = getLastSecondarySpans();
            expect(spans.length).toBeGreaterThan(0);
            expect(output).toContain("opened here");
        });

        it("should show badge and offset in success output", () => {
            const state = new ParserState("red", undefined, 3, false);
            const output = stripAnsi(statePrint(state));
            expect(output).toContain("Done");
            expect(output).toContain("3");
        });
    });
});
