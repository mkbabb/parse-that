import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
    string,
    regex,
    any,
    ParserState,
    enableDiagnostics,
    disableDiagnostics,
    clearCollectedDiagnostics,
    getCollectedDiagnostics,
} from "../src/parse/index.js";
import { formatDiagnostic, formatAllDiagnostics } from "../src/parse/debug.js";
import { resetErrorState } from "../src/parse/utils.js";

/** Strip ANSI escape codes for snapshot comparison. */
function stripAnsi(s: string): string {
    return s.replace(/\x1b\[[0-9;]*m/g, "");
}

// ── CSS Parsers with Error Recovery ─────────────────────────────────────

const ws = regex(/\s*/);
const wsRequired = regex(/\s+/);

const ident = regex(/[a-zA-Z_][a-zA-Z0-9_-]*/);
const cssNumber = regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?/);

// ── CSS Selectors ──────────────────────────────────────────────────────
const classSelector = string(".").next(ident);
const idSelector = string("#").next(ident);
const typeSelector = ident;
const pseudoSelector = string(":").next(ident);

const simpleSelector = any(classSelector, idSelector, pseudoSelector, typeSelector);
const selectorList = simpleSelector.sepBy(regex(/\s*,\s*/), 1);

// ── CSS Values ─────────────────────────────────────────────────────────
const cssString = regex(/"[^"]*"/).or(regex(/'[^']*'/));
const cssDimension = cssNumber.then(any(
    string("px"), string("em"), string("rem"), string("%"),
    string("vh"), string("vw"), string("vmin"), string("vmax"),
    string("s"), string("ms"), string("deg"),
)).map(([n, u]) => `${n}${u}`);

const cssFunctionCall = ident
    .then(regex(/[^)]*/).wrap(string("("), string(")")))
    .map(([name, args]) => `${name}(${args})`);

const cssValue = any(cssDimension, cssFunctionCall, cssNumber, cssString, ident);
const cssValueList = cssValue.sepBy(ws, 1);

// ── CSS Declarations (with recovery) ───────────────────────────────────

// Sync parser: skip to next ; (not consuming } which marks block end)
const declSync = regex(/[^;{}]*;/);

const declaration = ident
    .skip(string(":").trim())
    .then(cssValueList)
    .skip(string(";").trim())
    .map(([prop, vals]) => ({ property: prop, values: vals }));

// Sentinel value for recovered declarations
const RECOVERED_DECL = { property: "__recovered__", values: [] as string[] };

// Declaration with recovery — on failure, skip to next ";"
// Trim leading whitespace so recovery can continue after ";" sync
const recoveredDeclaration = declaration.trim().recover(declSync, RECOVERED_DECL);

// ── CSS Rules (with recovery) ──────────────────────────────────────────
const declarationBlock = recoveredDeclaration.many().trim().wrap(string("{"), string("}"));

// Sync parser for rules: skip to next "}" (inclusive)
const ruleSync = regex(/[^}]*}/);

const cssRule = selectorList.skip(ws).then(declarationBlock);

type CSSRule = [string[], ({ property: string; values: string[] })[]];
const RECOVERED_RULE: CSSRule = [["__recovered__"], []];

const recoveredRule = cssRule.recover(ruleSync, RECOVERED_RULE);

// ── Comment handling ───────────────────────────────────────────────────
const comment = regex(/\/\*[^]*?\*\//);
const ignorable = any(wsRequired, comment);

// ── Full stylesheet ────────────────────────────────────────────────────
const stylesheet = ignorable.many().next(
    recoveredRule.skip(ignorable.many()).many()
);

// ═════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════

describe("CSS Error Recovery Demo", () => {
    beforeEach(() => {
        enableDiagnostics();
        resetErrorState();
        clearCollectedDiagnostics();
    });

    afterEach(() => {
        disableDiagnostics();
    });

    // ── Basic recover() combinator tests ────────────────────────────────

    describe("recover() combinator basics", () => {
        it("should return normal result on success", () => {
            const p = string("hello").recover(regex(/[^;]*;/), "RECOVERED");
            const state = new ParserState("hello");
            p.parser(state);
            expect(state.isError).toBe(false);
            expect(state.value).toBe("hello");
            expect(getCollectedDiagnostics().length).toBe(0);
        });

        it("should return sentinel and collect diagnostic on failure", () => {
            const sync = regex(/[^;]*;/);
            const p = string("hello").recover(sync, "RECOVERED");
            const state = new ParserState("xyz123;");
            p.parser(state);
            expect(state.isError).toBe(false);
            expect(state.value).toBe("RECOVERED");
            expect(getCollectedDiagnostics().length).toBe(1);
        });

        it("should give up if sync also fails", () => {
            const sync = regex(/[^;]*;/);
            const p = string("hello").recover(sync, "RECOVERED");
            // No semicolon to sync to → sync fails → original error propagates
            const state = new ParserState("xyz");
            p.parser(state);
            expect(state.isError).toBe(true);
        });
    });

    describe("recover() with declaration parser", () => {
        it("should recover from a missing value and continue", () => {
            const input = "color: ; font-size: 16px;";
            const result = recoveredDeclaration.many();
            const state = new ParserState(input);
            result.parser(state);

            expect(state.isError).toBe(false);
            const decls = state.value as any[];
            // First decl should be recovered, second should be normal
            expect(decls.length).toBe(2);
            expect(decls[0].property).toBe("__recovered__");
            expect(decls[1].property).toBe("font-size");
            expect(getCollectedDiagnostics().length).toBe(1);
        });

        it("should recover from a missing colon", () => {
            const input = "width 100%; max-width: 960px;";
            const result = recoveredDeclaration.many();
            const state = new ParserState(input);
            result.parser(state);

            expect(state.isError).toBe(false);
            const decls = state.value as any[];
            expect(decls.length).toBe(2);
            expect(decls[0].property).toBe("__recovered__");
            expect(decls[1].property).toBe("max-width");
            expect(getCollectedDiagnostics().length).toBe(1);
        });

        it("should recover from multiple bad declarations", () => {
            const input = "color: ; width 100%; font-size: 16px;";
            const result = recoveredDeclaration.many();
            const state = new ParserState(input);
            result.parser(state);

            expect(state.isError).toBe(false);
            const decls = state.value as any[];
            expect(decls.length).toBe(3);
            expect(decls[0].property).toBe("__recovered__");
            expect(decls[1].property).toBe("__recovered__");
            expect(decls[2].property).toBe("font-size");
            expect(getCollectedDiagnostics().length).toBe(2);
        });
    });

    // ── Complex CSS file test ───────────────────────────────────────────

    describe("Complex CSS file with multiple errors", () => {
        const cssPath = resolve(process.cwd(), "../grammar/tests/css/complex-errors.css");
        let cssContent: string;

        beforeEach(() => {
            cssContent = readFileSync(cssPath, "utf-8");
        });

        it("should parse the complex CSS file and collect multiple diagnostics", () => {
            const state = new ParserState(cssContent);
            stylesheet.parser(state);

            const diagnostics = getCollectedDiagnostics();
            // We expect at least 3 diagnostics from the intentional errors
            expect(diagnostics.length).toBeGreaterThanOrEqual(3);

            // Print diagnostics to stderr for visual inspection
            if (diagnostics.length > 0) {
                const output = formatAllDiagnostics(diagnostics, cssContent);
                console.error("\n" + output + "\n");
            }
        });

        it("should still parse the valid .success rule at the end", () => {
            const state = new ParserState(cssContent);
            stylesheet.parser(state);

            const rules = state.value as CSSRule[];
            // Filter out recovered rules
            const validRules = rules.filter(
                (r: CSSRule) => r[0][0] !== "__recovered__"
            );
            expect(validRules.length).toBeGreaterThan(0);

            // Find the .success rule
            const successRule = validRules.find(
                (r: CSSRule) => r[0].includes("success")
            );
            expect(successRule).toBeDefined();
        });

        it("diagnostics should have correct line numbers", () => {
            const state = new ParserState(cssContent);
            stylesheet.parser(state);

            const diagnostics = getCollectedDiagnostics();
            for (const d of diagnostics) {
                expect(d.line).toBeGreaterThan(0);
                expect(d.column).toBeGreaterThanOrEqual(0);
            }
        });

        it("individual diagnostics should format correctly", () => {
            const state = new ParserState(cssContent);
            stylesheet.parser(state);

            const diagnostics = getCollectedDiagnostics();
            expect(diagnostics.length).toBeGreaterThan(0);
            for (const d of diagnostics) {
                const formatted = stripAnsi(formatDiagnostic(d, cssContent));
                expect(formatted).toContain("Err");
                expect(formatted).toContain("|");
            }
        });
    });

    // ── formatDiagnostic / formatAllDiagnostics ─────────────────────────

    describe("Diagnostic formatting", () => {
        it("formatAllDiagnostics should include summary line", () => {
            const sync = regex(/[^;]*;/);
            const p = string("hello").recover(sync, "RECOVERED");

            let state = new ParserState("xyz;");
            p.parser(state);
            state = new ParserState("abc;");
            p.parser(state);

            const diagnostics = getCollectedDiagnostics();
            expect(diagnostics.length).toBe(2);

            const output = stripAnsi(formatAllDiagnostics(diagnostics, "xyz; abc;"));
            expect(output).toContain("2 errors found");
        });

        it("formatAllDiagnostics should return empty for no diagnostics", () => {
            expect(formatAllDiagnostics([], "")).toBe("");
        });

        it("single error should say '1 error found'", () => {
            const sync = regex(/[^;]*;/);
            const p = string("hello").recover(sync, "RECOVERED");
            const state = new ParserState("xyz;");
            p.parser(state);

            const diagnostics = getCollectedDiagnostics();
            const output = stripAnsi(formatAllDiagnostics(diagnostics, "xyz;"));
            expect(output).toContain("1 error found");
        });
    });
});
