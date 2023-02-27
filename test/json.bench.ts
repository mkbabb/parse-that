import { Parser, regex, all, any, string, lazy } from "../src";
import { test, expect, describe, it, bench } from "vitest";
import fs from "fs";

import { jsonValue } from "./json.test";
import { JSONParser } from "./ebnf.test";

bench("should parse a JSON file", () => {
    const input = fs.readFileSync("data/data.json", "utf-8");
    const result = jsonValue.parse(input);

    expect(result).toEqual(JSON.parse(input));
});

bench("should parse a JSON file using EEBNF", () => {
    const input = fs.readFileSync("data/data.json", "utf-8");
    const result = jsonValue.parse(input);

    expect(result).toEqual(JSON.parse(input));
});
