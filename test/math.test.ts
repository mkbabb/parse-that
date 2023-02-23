import { match, sequence, many, Parser, any, lazy, string } from "../src/that";
import { test, expect, describe } from "vitest";
import {
    reduceMathExpression,
    insertRandomWhitespace,
    generateMathExpression,
} from "./utils";

const digits = many(match(/[0-9]/)).map((val) => val.join(""));

const fractional = string(".")
    .then(digits)
    .map(([, digits]) => "." + digits);
const integral = digits;

const exponent = sequence(match(/[eE]/), match(/[-+]/).opt(), digits)
    .map(([, exponentSign, exponent]) => {
        return `e${exponentSign ?? ""}${exponent}`;
    })
    .opt();

const numberPart = any(
    integral.then(fractional).map(([integral, fractional]) => {
        return `${integral}${fractional}`;
    }),
    integral,
    fractional
);

const number = sequence(numberPart, exponent)
    .trim()
    .map(([numberPart, exponent]) => {
        return parseFloat(`${numberPart}${exponent ?? ""}`);
    });

const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
const numberMatch = match(numberRegex)
    .trim()
    .map((v) => {
        return parseFloat(v);
    });

const unary: Parser<number> = lazy(() =>
    string("-")
        .then(unary)
        .map(([operator, num]) => {
            return operator === "-" ? -num : num;
        })
        .or(numberMatch)
);

const pow: Parser<number> = lazy(() =>
    sequence(
        unary,
        match(/\*\*/)
            .then(pow)
            .map(([, num]) => num)
            .opt()
    ).map(([num, pow]) => {
        return pow ? num ** pow : num;
    })
);

const multDiv: Parser<number> = lazy(() =>
    sequence(pow, many(match(/\*|\//).then(pow))).map(reduceMathExpression)
);

const addSub: Parser<number> = lazy(() =>
    sequence(multDiv, many(match(/\+|\-|/).then(multDiv))).map(reduceMathExpression)
);

const expression = addSub;

describe("Math Functions", () => {
    test("parse a floating point number", () => {
        const nums = [
            "123.",
            "123.456e-2",
            "123.456e+2",
            "123.456e2",
            "123.456",
            "123.",
            ".456",
            "1",
        ];

        for (let num of nums) {
            num = insertRandomWhitespace(num);

            const parsed1 = number.parse(num);
            const parsed2 = numberMatch.parse(num);

            expect(parsed1).toBe(parseFloat(num));
            expect(parsed2).toBe(parseFloat(num));
        }
    });

    test("Parse math expressions", () => {
        for (let i = 0; i < 100; i++) {
            const expr = insertRandomWhitespace(generateMathExpression());
            const parsed = expression.parse(expr);

            expect(parsed).toBe(eval(expr));
        }
    });
});
