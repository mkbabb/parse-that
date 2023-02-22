import { match, sequence, many, Parser, any } from "../src/that";
import { test, expect, describe } from "vitest";

const digits = many(match(/[0-9]/))
    .map((val) => {
        console.log(val);
        return val;
    })
    .map((val) => val.join(""));

const sign = match(/-/).opt();

const fractional = match(/\./).then(digits);
const integral = digits;

const exponent = sequence(match(/[eE]/), match(/[-+]/).opt(), digits)
    .map(([, exponentSign, exponent]) => {
        return `e${exponentSign ?? ""}${exponent}`;
    })
    .opt();

const numberPart = any(
    integral.then(fractional).map(([integral, [, fractional]]) => {
        return `${integral}.${fractional}`;
    }),
    integral,
    fractional,
);

const number = sequence(sign, numberPart, exponent).map(
    ([sign, numberPart, exponent]) => {
        return parseFloat(`${sign ?? ""}${numberPart}${exponent ?? ""}`);
    }
);

const numberRegex = /(-)?(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
const numberMatch = match(numberRegex).map((v) => parseFloat(v));

describe("Parse That", () => {
    test("parse a floating point number", () => {
        const nums = [
            "-123.456e+2",
            "123.456e-2",
            "123.456e2",
            "123.456e+02",
            "123.456e-02",
            "123.456e02",
            "123.456",
            "123.",
            ".456",
            "123",
        ];

        for (const num of nums) {
            const parsed2 = numberMatch.parse(num);
            const parsed1 = number.parse(num);

            expect(parsed1).toBe(parseFloat(num));
            expect(parsed2).toBe(parseFloat(num));
        }
    });
});
