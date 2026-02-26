import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const input = fs.readFileSync(path.resolve(__dirname, "../../data/json/data.json"), "utf8");
const expected = JSON.parse(input);

describe("Benchmark parser validation", () => {
    it("nearley produces correct output", async () => {
        const { parse } = await import("./benchmarks/nearley");
        const result = parse(input);
        expect(result).toEqual(expected);
    });

    it("ohm-js produces correct output", async () => {
        const { parse } = await import("./benchmarks/ohm");
        const result = parse(input);
        expect(result).toEqual(expected);
    });

    it("chevrotain produces correct output", async () => {
        const { parse } = await import("./benchmarks/chevrotain");
        const result = parse(input);
        expect(result).toEqual(expected);
    });

    it("peggy produces correct output", async () => {
        const { parse } = await import("./benchmarks/peggy");
        const result = parse(input);
        expect(result).toEqual(expected);
    });

    it("parsimmon produces correct output", async () => {
        const { json } = await import("./benchmarks/parsimmon");
        const result = json.tryParse(input);
        expect(result).toEqual(expected);
    });
});
