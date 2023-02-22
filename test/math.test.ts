import { match, all, many, Parser, any, lazy, whitespace } from "../src/that";
import { test, expect, describe } from "vitest";

const digits = many(match(/[0-9]/))
    .map((val) => {
        return val;
    })
    .map((val) => val.join(""));

const sign = match(/-/).opt();

const fractional = match(/\./).then(digits);
const integral = digits;

const exponent = all(match(/[eE]/), match(/[-+]/).opt(), digits)
    .map(([, exponentSign, exponent]) => {
        return `e${exponentSign ?? ""}${exponent}`;
    })
    .opt();

const numberPart = any(
    integral.then(fractional).map(([integral, [, fractional]]) => {
        return `${integral}.${fractional}`;
    }),
    integral,
    fractional
);

const number = all(sign, numberPart, exponent).map(([sign, numberPart, exponent]) => {
    return parseFloat(`${sign ?? ""}${numberPart}${exponent ?? ""}`);
});

const numberRegex = /(\d+)?(\.\d+)?([eE][-+]?\d+)?/;
const numberMatch = match(numberRegex).map((v) => parseFloat(v));

const evaluateMathOperator = (operator: string, a: number, b: number) => {
    switch (operator) {
        case "+":
            return a + b;
        case "-":
            return a - b;
        case "*":
            return a * b;
        case "/":
            return a / b;
    }
};

const reduceMathExpression = ([num, rest]) =>
    rest.reduce((acc, [operator, val]) => {
        return evaluateMathOperator(operator, acc, val);
    }, num);

const unary: Parser<number> = lazy(() =>
    match(/\+|\-/)
        .then(unary)
        .map(([operator, num]) => {
            return operator === "-" ? -num : num;
        })
        .or(number)
);

const pow: Parser<number> = lazy(() =>
    all(
        unary.trim(whitespace),
        match(/\*\*/)
            .then(pow)
            .map(([, num]) => num)
            .opt()
    ).map(([num, pow]) => {
        return pow ? num ** pow : num;
    })
);

const multDiv: Parser<number> = lazy(() =>
    all(pow, many(match(/\*|\//).then(pow))).map(reduceMathExpression)
);

const addSub: Parser<number> = lazy(() =>
    all(multDiv, many(match(/\+|\-|/).then(multDiv))).map(reduceMathExpression)
);

const expression = addSub;

describe("Math", () => {
    test("parse a floating point number", () => {
        const nums = [
            "123.456e-2",
            "123.456e+2",
            "123.456e2",
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

    test("Parse math expressions", () => {
        const operators = ["+", "-", "*", "/"];
        const length = 1000;
        const nums = Array.from({ length }, () => Math.random() * length).map(String);

        // Generate random expressions
        const getExpression = () =>
            Array.from({ length: length }, () => {
                return nums[Math.floor(Math.random() * nums.length)];
            }).reduce((acc, expr) => {
                const operator =
                    operators[Math.floor(Math.random() * operators.length)];

                return `${acc} ${operator} ${expr}`;
            });

        for (let i = 0; i < 100; i++) {
            const expr = getExpression();
            const parsed = expression.parse(expr);

            expect(parsed).toBe(eval(expr));
        }
    });
});
