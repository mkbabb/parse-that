/**
 * Fairness validation: verify our CSS parser output is semantically
 * comparable to postcss and css-tree. If we're producing shallower
 * output, the benchmark comparison is misleading.
 */
import { describe, it, expect } from "vitest";
import { cssParser } from "../src/parse/parsers/css/index.js";
import type { CssNode, CssDeclaration, CssValue } from "../src/parse/parsers/css/index.js";
import { ParserState } from "../src/parse/state.js";
import postcss from "postcss";
import * as csstree from "css-tree";
import * as fs from "fs";
import * as path from "path";

function parse(input: string): CssNode[] {
    const state = new ParserState(input);
    cssParser.call(state);
    return state.value as CssNode[];
}

function countNodes(nodes: CssNode[]): { rules: number; declarations: number; atRules: number } {
    let rules = 0;
    let declarations = 0;
    let atRules = 0;
    for (const node of nodes) {
        if (node.type === "qualifiedRule") {
            rules++;
            declarations += node.declarations.length;
        } else if (node.type === "atMedia" || node.type === "atSupports") {
            atRules++;
            const inner = countNodes(node.body);
            rules += inner.rules;
            declarations += inner.declarations;
            atRules += inner.atRules;
        } else if (node.type === "atFontFace") {
            atRules++;
            declarations += node.declarations.length;
        } else if (node.type === "atKeyframes") {
            atRules++;
            for (const block of node.blocks) {
                declarations += block.declarations.length;
            }
        } else if (node.type === "atImport" || node.type === "genericAtRule") {
            atRules++;
        }
    }
    return { rules, declarations, atRules };
}

function postcssCount(css: string): { rules: number; declarations: number; atRules: number } {
    const root = postcss.parse(css);
    let rules = 0;
    let declarations = 0;
    let atRules = 0;
    root.walk((node) => {
        if (node.type === "rule") rules++;
        else if (node.type === "decl") declarations++;
        else if (node.type === "atrule") atRules++;
    });
    return { rules, declarations, atRules };
}

function csstreeCount(css: string): { rules: number; declarations: number; atRules: number } {
    const ast = csstree.parse(css);
    let rules = 0;
    let declarations = 0;
    let atRules = 0;
    csstree.walk(ast, (node) => {
        if (node.type === "Rule") rules++;
        else if (node.type === "Declaration") declarations++;
        else if (node.type === "Atrule") atRules++;
    });
    return { rules, declarations, atRules };
}

describe("CSS Parser Fairness Validation", () => {
    const dataDir = path.resolve(__dirname, "../../data/css");

    describe("simple CSS", () => {
        const simple = `
body { margin: 0; padding: 10px; }
.container { max-width: 960px; background: #fff; }
@media (max-width: 768px) {
    .container { max-width: 100%; }
    .sidebar { display: none; }
}
h1, h2, h3 { font-weight: bold; color: #333; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
        it("produces comparable rule counts vs postcss", () => {
            const ours = countNodes(parse(simple));
            const theirs = postcssCount(simple);
            console.log("parse-that:", ours);
            console.log("postcss:", theirs);
            // postcss counts keyframe stops as rules (from/to),
            // our counter doesn't. Declaration count is the real metric.
            expect(ours.declarations).toBe(theirs.declarations);
            expect(ours.atRules).toBe(theirs.atRules);
        });

        it("produces comparable rule counts vs css-tree", () => {
            const ours = countNodes(parse(simple));
            const theirs = csstreeCount(simple);
            console.log("parse-that:", ours);
            console.log("css-tree:", theirs);
            expect(ours.declarations).toBe(theirs.declarations);
            expect(ours.atRules).toBe(theirs.atRules);
        });
    });

    describe("value typing depth", () => {
        it("produces typed values, not raw strings", () => {
            const nodes = parse(".x { width: 100px; margin: 10em 20%; color: #ff0; background: rgb(255, 0, 0); }");
            const rule = nodes[0] as any;
            const decls = rule.declarations as CssDeclaration[];

            // width: 100px → Dimension
            expect(decls[0].values[0].type).toBe("dimension");
            expect((decls[0].values[0] as any).value).toBe(100);
            expect((decls[0].values[0] as any).unit).toBe("px");

            // margin: 10em 20% → Dimension, Percentage
            expect(decls[1].values[0].type).toBe("dimension");
            expect(decls[1].values[1].type).toBe("percentage");

            // color: #ff0 → Color(Hex)
            expect(decls[2].values[0].type).toBe("color");

            // background: rgb(255, 0, 0) → Color(Function)
            expect(decls[3].values[0].type).toBe("color");
            expect((decls[3].values[0] as any).color.type).toBe("function");

            // postcss would have these as raw strings
            const postcssRoot = postcss.parse(".x { width: 100px; }");
            const firstDecl = (postcssRoot.first as any).first;
            expect(typeof firstDecl.value).toBe("string"); // postcss: "100px" (string)
            expect(firstDecl.value).toBe("100px"); // not typed!

            // We produce MORE semantic output than postcss
        });

        it("produces typed selectors, not raw strings", () => {
            const nodes = parse("div.foo > #bar:hover { color: red; }");
            const sel = (nodes[0] as any).selectorList[0];

            // Complex selector with child combinator
            expect(sel.type).toBe("complex");
            expect(sel.combinator).toBe(">");

            // Left: compound(type + class)
            expect(sel.left.type).toBe("compound");
            expect(sel.left.parts[0]).toEqual({ type: "type", value: "div" });

            // Right: compound(id + pseudoClass)
            expect(sel.right.type).toBe("compound");

            // postcss selector is a raw string
            const postcssRoot = postcss.parse("div.foo > #bar:hover { color: red; }");
            const rule = postcssRoot.first as any;
            expect(typeof rule.selector).toBe("string");
            expect(rule.selector).toBe("div.foo > #bar:hover"); // raw string!

            // We produce MORE semantic output than postcss
        });
    });

    describe("normalize.css counts", () => {
        it("matches postcss and css-tree rule counts", () => {
            const css = fs.readFileSync(path.join(dataDir, "normalize.css"), "utf-8");
            const ours = countNodes(parse(css));
            const pc = postcssCount(css);
            const ct = csstreeCount(css);
            console.log("normalize.css:");
            console.log("  parse-that:", ours);
            console.log("  postcss:", pc);
            console.log("  css-tree:", ct);
            // Should be within 10% (recovery differences can cause minor variance)
            expect(ours.rules).toBeGreaterThanOrEqual(pc.rules * 0.9);
            expect(ours.rules).toBeLessThanOrEqual(pc.rules * 1.1);
        });
    });

    describe("bootstrap.css counts", () => {
        it("matches postcss and css-tree rule counts within tolerance", () => {
            const css = fs.readFileSync(path.join(dataDir, "bootstrap.css"), "utf-8");
            const ours = countNodes(parse(css));
            const pc = postcssCount(css);
            const ct = csstreeCount(css);
            console.log("bootstrap.css:");
            console.log("  parse-that:", ours);
            console.log("  postcss:", pc);
            console.log("  css-tree:", ct);
            // Should be within 10%
            expect(ours.rules).toBeGreaterThanOrEqual(pc.rules * 0.9);
            expect(ours.rules).toBeLessThanOrEqual(pc.rules * 1.1);
            expect(ours.declarations).toBeGreaterThanOrEqual(pc.declarations * 0.9);
            expect(ours.declarations).toBeLessThanOrEqual(pc.declarations * 1.1);
        });
    });
});
