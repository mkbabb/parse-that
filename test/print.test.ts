import { Parser, regex, all, any, string, lazy } from "../src/parse/parse";
import { test, expect, describe, it, bench } from "vitest";
import { parserPrint } from "../src/parse/debug";

const comma = string(",").trim();

const a = string("this is a really long string");
const b = string("b");
const c = regex(/vibes/);
const d = string("true")
    .map((v) => v)
    .or(string("false"))
    .or(string("null"));

const them = all(a, b, c, d).many();
const those = any(them, string("ok,").skip(string("no")).then(string("vibes")));

const wrapped = those.wrap(string("{{"), string("}}")).sepBy(comma);

const inner = string("this is a really long string");
const mijn = Parser.lazy(() => any(inner, string("b"), mijn));

describe("Printer", () => {
    it("should print vibes", () => {
        const s = parserPrint(wrapped);
        console.log(s);
    });

    it("should print lazy", () => {
        const s = parserPrint(mijn);
        console.log(s);
    });
});
