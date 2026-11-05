import { describe, it, expect } from "vitest";
import fs from "fs";

// ../data/ is gitignored (local benchmark fixtures); absent in CI, the suite skips.
const dataPath = "../data/json/data.json";
const hasData = fs.existsSync(dataPath);
const input = hasData ? fs.readFileSync(dataPath, "utf8") : "";
const expected = hasData ? JSON.parse(input) : undefined;

describe.skipIf(!hasData)("Benchmark parser validation", () => {
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
