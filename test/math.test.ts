import { regex, all, Parser, any, lazy, string } from "../src";
import { test, expect, describe } from "vitest";
import {
    reduceMathExpression,
    insertRandomWhitespace,
    generateMathExpression,
} from "./utils";

const digits = regex(/[0-9]/)
    .many()
    .map((val) => val.join(""));

const fractional = string(".")
    .then(digits)
    .map(([, digits]) => "." + digits);
const integral = digits;

const exponent = all(regex(/[eE]/), regex(/[-+]/).opt(), digits)
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

const number = all(numberPart, exponent)
    .trim()
    .map(([numberPart, exponent]) => {
        return parseFloat(`${numberPart}${exponent ?? ""}`);
    });

const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
const numberMatch = regex(numberRegex)
    .trim()
    .map((v) => {
        return parseFloat(v);
    });

const unary: Parser<number> = Parser.lazy(() =>
    string("-")
        .then(unary)
        .map(([operator, num]) => {
            return operator === "-" ? -num : num;
        })
        .or(numberMatch)
);

const pow: Parser<number> = Parser.lazy(() =>
    all(
        unary,
        regex(/\*\*/)
            .then(pow)
            .map(([, num]) => num)
            .opt()
    ).map(([num, pow]) => {
        return pow ? num ** pow : num;
    })
);

const multDiv: Parser<number> = Parser.lazy(() =>
    all(pow, regex(/\*|\//).then(pow).many()).map(reduceMathExpression)
);

const addSub: Parser<number> = Parser.lazy(() =>
    all(
        multDiv,
        regex(/\+|\-|/)
            .then(multDiv)
            .many()
    ).map(reduceMathExpression)
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
