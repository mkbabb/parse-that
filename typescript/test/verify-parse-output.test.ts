import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { JSONParser as BBNFParser } from "./benchmarks/bbnf";
import { JSONParser as HandParser } from "./benchmarks/parse-that";

const dataDir = path.resolve(__dirname, "../../data/json");
const files = ["data.json", "apache-builds.json", "twitter.json"];

describe("Parse correctness — all parsers produce JSON.parse output", () => {
    for (const file of files) {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) continue;
        const input = fs.readFileSync(filePath, "utf-8");
        const expected = JSON.parse(input);

        it(`BBNF correctly parses ${file}`, () => {
            const origLog = console.log;
            console.log = () => {};
            const state = BBNFParser.parseState(input);
            console.log = origLog;
            expect(state.isError).toBe(false);
            expect(state.offset).toBe(input.length);
            expect(state.value).toEqual(expected);
        });

        it(`hand-written correctly parses ${file}`, () => {
            const origLog = console.log;
            console.log = () => {};
            const state = HandParser.parseState(input);
            console.log = origLog;
            expect(state.isError).toBe(false);
            expect(state.offset).toBe(input.length);
            expect(state.value).toEqual(expected);
        });
    }
});
