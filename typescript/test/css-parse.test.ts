import { describe, it, expect } from "vitest";
import { cssParser } from "../src/parse/parsers/css/index.js";
import type {
    CssNode,
    CssSelector,
    CssValue,
    CssDeclaration,
    CssColor,
    CssAtMedia,
    CssAtSupports,
    MediaQuery,
    MediaCondition,
    MediaFeature,
    SupportsCondition,
    Specificity,
} from "../src/parse/parsers/css/index.js";
import { specificity } from "../src/parse/parsers/css/index.js";
import { ParserState } from "../src/parse/state.js";
import * as fs from "fs";
import * as path from "path";

function parse(input: string): CssNode[] {
    const state = new ParserState(input);
    cssParser.call(state);
    return state.value as CssNode[];
}

describe("CSS Parser", () => {
    describe("basic rules", () => {
        it("parses a simple rule", () => {
            const nodes = parse("body { margin: 0; }");
            expect(nodes).toHaveLength(1);
            expect(nodes[0].type).toBe("qualifiedRule");
            const rule = nodes[0] as any;
            expect(rule.selectorList).toHaveLength(1);
            expect(rule.selectorList[0]).toEqual({ type: "type", value: "body" });
            expect(rule.declarations).toHaveLength(1);
            expect(rule.declarations[0].property).toBe("margin");
        });

        it("parses multiple declarations", () => {
            const nodes = parse(".box { width: 100px; height: 50%; color: red; }");
            const rule = nodes[0] as any;
            expect(rule.declarations).toHaveLength(3);
            expect(rule.declarations[0].property).toBe("width");
            expect(rule.declarations[0].values[0]).toEqual({
                type: "dimension", value: 100, unit: "px",
            });
            expect(rule.declarations[1].values[0]).toEqual({
                type: "percentage", value: 50,
            });
            expect(rule.declarations[2].values[0]).toEqual({
                type: "ident", value: "red",
            });
        });

        it("parses multiple rules", () => {
            const nodes = parse("body { margin: 0; } .container { max-width: 960px; }");
            expect(nodes).toHaveLength(2);
        });
    });

    describe("selectors", () => {
        it("parses class selector", () => {
            const nodes = parse(".foo { color: blue; }");
            const rule = nodes[0] as any;
            expect(rule.selectorList[0]).toEqual({ type: "class", value: ".foo" });
        });

        it("parses id selector", () => {
            const nodes = parse("#main { padding: 10px; }");
            const rule = nodes[0] as any;
            expect(rule.selectorList[0]).toEqual({ type: "id", value: "#main" });
        });

        it("parses compound selector", () => {
            const nodes = parse("div.foo#bar { color: red; }");
            const rule = nodes[0] as any;
            expect(rule.selectorList[0].type).toBe("compound");
            expect(rule.selectorList[0].parts).toHaveLength(3);
        });

        it("parses descendant combinator", () => {
            const nodes = parse("div p { color: red; }");
            const rule = nodes[0] as any;
            expect(rule.selectorList[0].type).toBe("complex");
            expect(rule.selectorList[0].left).toEqual({ type: "type", value: "div" });
            expect(rule.selectorList[0].right).toEqual({ type: "type", value: "p" });
        });

        it("parses child combinator", () => {
            const nodes = parse("ul > li { list-style: none; }");
            const rule = nodes[0] as any;
            expect(rule.selectorList[0].type).toBe("complex");
            expect(rule.selectorList[0].combinator).toBe(">");
        });

        it("parses selector list", () => {
            const nodes = parse("h1, h2, h3 { font-weight: bold; }");
            const rule = nodes[0] as any;
            expect(rule.selectorList).toHaveLength(3);
        });

        it("parses pseudo class", () => {
            const nodes = parse("a:hover { color: blue; }");
            const rule = nodes[0] as any;
            const sel = rule.selectorList[0];
            expect(sel.type).toBe("compound");
            expect(sel.parts[1]).toEqual({ type: "pseudoClass", value: "hover" });
        });

        it("parses pseudo element", () => {
            const nodes = parse("p::before { content: ''; }");
            const rule = nodes[0] as any;
            const sel = rule.selectorList[0];
            expect(sel.type).toBe("compound");
            expect(sel.parts[1]).toEqual({ type: "pseudoElement", value: "before" });
        });

        it("parses attribute selector", () => {
            const nodes = parse('[data-value="test"] { display: none; }');
            const rule = nodes[0] as any;
            const sel = rule.selectorList[0];
            expect(sel.type).toBe("attribute");
            expect(sel.name).toBe("data-value");
            expect(sel.matcher).toBe("=");
        });

        it("parses universal selector", () => {
            const nodes = parse("* { box-sizing: border-box; }");
            const rule = nodes[0] as any;
            expect(rule.selectorList[0]).toEqual({ type: "universal" });
        });
    });

    describe("values", () => {
        it("parses dimension values", () => {
            const nodes = parse(".x { margin: 10px 2em 1.5rem 0; }");
            const vals = (nodes[0] as any).declarations[0].values;
            expect(vals).toHaveLength(4);
            expect(vals[0]).toEqual({ type: "dimension", value: 10, unit: "px" });
            expect(vals[1]).toEqual({ type: "dimension", value: 2, unit: "em" });
            expect(vals[2]).toEqual({ type: "dimension", value: 1.5, unit: "rem" });
            expect(vals[3]).toEqual({ type: "number", value: 0 });
        });

        it("parses hex color", () => {
            const nodes = parse(".x { color: #ff0000; }");
            const val = (nodes[0] as any).declarations[0].values[0];
            expect(val.type).toBe("color");
            expect(val.color).toEqual({ type: "hex", value: "#ff0000" });
        });

        it("parses rgb function", () => {
            const nodes = parse(".x { color: rgb(255, 0, 0); }");
            const val = (nodes[0] as any).declarations[0].values[0];
            expect(val.type).toBe("color");
            expect(val.color.type).toBe("function");
            expect(val.color.name).toBe("rgb");
        });

        it("parses calc function", () => {
            const nodes = parse(".x { width: calc(100% - 20px); }");
            const val = (nodes[0] as any).declarations[0].values[0];
            expect(val.type).toBe("function");
            expect(val.name).toBe("calc");
        });

        it("parses var function", () => {
            const nodes = parse(".x { color: var(--main-color); }");
            const val = (nodes[0] as any).declarations[0].values[0];
            expect(val.type).toBe("function");
            expect(val.name).toBe("var");
            expect(val.args[0]).toEqual({ type: "ident", value: "--main-color" });
        });

        it("parses string value", () => {
            const nodes = parse('.x { content: "hello"; }');
            const val = (nodes[0] as any).declarations[0].values[0];
            expect(val.type).toBe("string");
            expect(val.value).toBe('"hello"');
        });

        it("parses negative dimension", () => {
            const nodes = parse(".x { margin: -10px; }");
            const val = (nodes[0] as any).declarations[0].values[0];
            expect(val).toEqual({ type: "dimension", value: -10, unit: "px" });
        });
    });

    describe("at-rules", () => {
        it("parses @media", () => {
            const nodes = parse("@media (max-width: 768px) { .foo { display: none; } }");
            expect(nodes).toHaveLength(1);
            expect(nodes[0].type).toBe("atMedia");
            const rule = nodes[0] as CssAtMedia;
            expect(rule.queries).toHaveLength(1);
            expect(rule.queries[0].conditions).toHaveLength(1);
            const cond = rule.queries[0].conditions[0] as MediaCondition & { type: "feature" };
            expect(cond.type).toBe("feature");
            expect(cond.feature.type).toBe("plain");
            expect((cond.feature as any).name).toBe("max-width");
            expect(rule.body).toHaveLength(1);
        });

        it("parses @keyframes", () => {
            const nodes = parse(
                "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }",
            );
            expect(nodes[0].type).toBe("atKeyframes");
            const kf = nodes[0] as any;
            expect(kf.name).toBe("spin");
            expect(kf.blocks).toHaveLength(2);
            expect(kf.blocks[0].stops[0]).toEqual({ type: "from" });
            expect(kf.blocks[1].stops[0]).toEqual({ type: "to" });
        });

        it("parses @font-face", () => {
            const nodes = parse(
                "@font-face { font-family: 'Open Sans'; src: url('open-sans.woff2'); }",
            );
            expect(nodes[0].type).toBe("atFontFace");
            const ff = nodes[0] as any;
            expect(ff.declarations).toHaveLength(2);
            expect(ff.declarations[0].property).toBe("font-family");
        });

        it("parses @import", () => {
            const nodes = parse("@import url('reset.css');");
            expect(nodes[0].type).toBe("atImport");
        });

        it("parses nested @media", () => {
            const nodes = parse(
                "@media screen { @media (min-width: 640px) { .sm { display: block; } } }",
            );
            expect(nodes[0].type).toBe("atMedia");
            const body = (nodes[0] as any).body;
            expect(body).toHaveLength(1);
            expect(body[0].type).toBe("atMedia");
        });
    });

    describe("comments", () => {
        it("parses standalone comment", () => {
            const nodes = parse("/* hello */ .foo { color: red; }");
            expect(nodes).toHaveLength(2);
            expect(nodes[0].type).toBe("comment");
            expect((nodes[0] as any).value).toBe("/* hello */");
        });
    });

    describe("edge cases", () => {
        it("handles empty stylesheet", () => {
            expect(parse("")).toHaveLength(0);
        });

        it("handles whitespace only", () => {
            expect(parse("   \n\t  ")).toHaveLength(0);
        });

        it("parses custom property", () => {
            const nodes = parse(":root { --main-color: #ff0000; }");
            const decl = (nodes[0] as any).declarations[0];
            expect(decl.property).toBe("--main-color");
        });
    });

    describe("media queries (L1.75)", () => {
        it("parses media type only", () => {
            const nodes = parse("@media screen { .foo { color: red; } }");
            const rule = nodes[0] as CssAtMedia;
            expect(rule.queries).toHaveLength(1);
            expect(rule.queries[0].mediaType).toBe("screen");
            expect(rule.queries[0].modifier).toBeNull();
        });

        it("parses not modifier", () => {
            const nodes = parse("@media not print { .foo { color: red; } }");
            const rule = nodes[0] as CssAtMedia;
            expect(rule.queries[0].modifier).toBe("not");
            expect(rule.queries[0].mediaType).toBe("print");
        });

        it("parses media type with condition", () => {
            const nodes = parse("@media screen and (min-width: 768px) { .foo { display: block; } }");
            const rule = nodes[0] as CssAtMedia;
            expect(rule.queries[0].mediaType).toBe("screen");
            expect(rule.queries[0].conditions).toHaveLength(1);
            const cond = rule.queries[0].conditions[0];
            expect(cond.type).toBe("feature");
        });

        it("parses condition-only media query", () => {
            const nodes = parse("@media (max-width: 768px) { .foo { display: none; } }");
            const rule = nodes[0] as CssAtMedia;
            expect(rule.queries[0].mediaType).toBeNull();
            expect(rule.queries[0].conditions).toHaveLength(1);
        });

        it("parses multiple media queries", () => {
            const nodes = parse("@media screen, print { .foo { color: red; } }");
            const rule = nodes[0] as CssAtMedia;
            expect(rule.queries).toHaveLength(2);
            expect(rule.queries[0].mediaType).toBe("screen");
            expect(rule.queries[1].mediaType).toBe("print");
        });

        it("parses and-chained conditions", () => {
            const nodes = parse("@media (min-width: 768px) and (max-width: 1024px) { .foo { color: red; } }");
            const rule = nodes[0] as CssAtMedia;
            const cond = rule.queries[0].conditions[0];
            expect(cond.type).toBe("and");
            if (cond.type === "and") {
                expect(cond.conditions).toHaveLength(2);
            }
        });

        it("parses bare feature name", () => {
            const nodes = parse("@media (color) { .foo { color: red; } }");
            const rule = nodes[0] as CssAtMedia;
            const cond = rule.queries[0].conditions[0];
            expect(cond.type).toBe("feature");
            if (cond.type === "feature") {
                expect(cond.feature.type).toBe("plain");
                expect(cond.feature.name).toBe("color");
                if (cond.feature.type === "plain") {
                    expect(cond.feature.value).toBeNull();
                }
            }
        });

        it("parses range syntax", () => {
            const nodes = parse("@media (width >= 768px) { .foo { color: red; } }");
            const rule = nodes[0] as CssAtMedia;
            const cond = rule.queries[0].conditions[0];
            expect(cond.type).toBe("feature");
            if (cond.type === "feature") {
                expect(cond.feature.type).toBe("range");
                if (cond.feature.type === "range") {
                    expect(cond.feature.name).toBe("width");
                    expect(cond.feature.op).toBe(">=");
                }
            }
        });
    });

    describe("supports conditions (L1.75)", () => {
        it("parses declaration test", () => {
            const nodes = parse("@supports (display: grid) { .foo { display: grid; } }");
            const rule = nodes[0] as CssAtSupports;
            expect(rule.condition.type).toBe("declaration");
            if (rule.condition.type === "declaration") {
                expect(rule.condition.property).toBe("display");
            }
        });

        it("parses not condition", () => {
            const nodes = parse("@supports not (display: grid) { .foo { display: flex; } }");
            const rule = nodes[0] as CssAtSupports;
            expect(rule.condition.type).toBe("not");
        });

        it("parses and chain", () => {
            const nodes = parse("@supports (display: grid) and (gap: 1em) { .foo { color: red; } }");
            const rule = nodes[0] as CssAtSupports;
            expect(rule.condition.type).toBe("and");
            if (rule.condition.type === "and") {
                expect(rule.condition.conditions).toHaveLength(2);
            }
        });

        it("parses or chain", () => {
            const nodes = parse("@supports (display: grid) or (display: flex) { .foo { color: red; } }");
            const rule = nodes[0] as CssAtSupports;
            expect(rule.condition.type).toBe("or");
            if (rule.condition.type === "or") {
                expect(rule.condition.conditions).toHaveLength(2);
            }
        });
    });

    describe("specificity (L1.75)", () => {
        it("id selector", () => {
            expect(specificity({ type: "id", value: "#foo" })).toEqual([1, 0, 0]);
        });

        it("class selector", () => {
            expect(specificity({ type: "class", value: ".foo" })).toEqual([0, 1, 0]);
        });

        it("type selector", () => {
            expect(specificity({ type: "type", value: "div" })).toEqual([0, 0, 1]);
        });

        it("universal selector", () => {
            expect(specificity({ type: "universal" })).toEqual([0, 0, 0]);
        });

        it("compound selector", () => {
            expect(specificity({
                type: "compound",
                parts: [
                    { type: "type", value: "div" },
                    { type: "class", value: ".foo" },
                    { type: "id", value: "#bar" },
                ],
            })).toEqual([1, 1, 1]);
        });

        it("complex selector", () => {
            expect(specificity({
                type: "complex",
                left: { type: "type", value: "div" },
                combinator: " ",
                right: { type: "class", value: ".foo" },
            })).toEqual([0, 1, 1]);
        });

        it(":where() has zero specificity", () => {
            expect(specificity({
                type: "pseudoFunction",
                name: "where",
                args: [{ type: "id", value: "#foo" }],
            })).toEqual([0, 0, 0]);
        });

        it(":is() uses most specific argument", () => {
            expect(specificity({
                type: "pseudoFunction",
                name: "is",
                args: [
                    { type: "class", value: ".foo" },
                    { type: "id", value: "#bar" },
                ],
            })).toEqual([1, 0, 0]);
        });
    });

    describe("benchmark files", () => {
        const dataDir = path.resolve(__dirname, "../../data/css");

        it("parses normalize.css", () => {
            const css = fs.readFileSync(path.join(dataDir, "normalize.css"), "utf-8");
            const nodes = parse(css);
            expect(nodes.length).toBeGreaterThan(20);
        });

        it("parses bootstrap.css", () => {
            const css = fs.readFileSync(path.join(dataDir, "bootstrap.css"), "utf-8");
            const nodes = parse(css);
            expect(nodes.length).toBeGreaterThan(100);
        });
    });
});
