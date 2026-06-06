import { describe, it, expect } from "vitest";
import * as root from "../src/parse/index.js";
import { parseSingleValue, parseFunctionArgs, ParserState } from "../src/parse/index.js";

// §1.5 — the single-value reader (parseSingleValue / parseFunctionArgs) must be
// reachable from the package root, the producer half of value.js's
// cssParser-adoption transposition (value.js could not adopt a reader it could
// not import). Additive expose, no behavioural change.

describe("package-root expose of the single-value reader (§1.5)", () => {
    it("resolves parseSingleValue / parseFunctionArgs from the root", () => {
        expect(typeof root.parseSingleValue).toBe("function");
        expect(typeof root.parseFunctionArgs).toBe("function");
    });

    it("parseSingleValue reads a dimension", () => {
        const st = new ParserState("12px");
        const v = parseSingleValue(st);
        expect(v).toEqual({ type: "dimension", value: 12, unit: "px" });
    });

    it("parseSingleValue reads a percentage", () => {
        const st = new ParserState("50%");
        expect(parseSingleValue(st)).toEqual({ type: "percentage", value: 50 });
    });

    it("parseSingleValue reads a function with parseFunctionArgs", () => {
        const st = new ParserState("translateX(20px)");
        const v = parseSingleValue(st);
        expect(v).toEqual({
            type: "function",
            name: "translateX",
            args: [{ type: "dimension", value: 20, unit: "px" }],
        });
    });
});
