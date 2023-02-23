import { match, sequence, many, Parser, any, lazy, string } from "../src/that";
import { test, expect, describe } from "vitest";

const insertRandomWhitespace = (str: string) => {
    const whitespaceChars = [" ", "\t", "\n"];

    return str
        .split(" ")
        .map((word) => {
            if (Math.random() > 0.5) {
                return word;
            } else {
                const ws = whitespaceChars[
                    Math.floor(Math.random() * whitespaceChars.length)
                ].repeat(Math.floor(Math.random() * 12));

                return ws + word + ws;
            }
        })
        .join("");
};

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
        const operators = ["+", "-", "*", "/"];
        const length = 10000;

        const nums = Array.from({ length }, () => Math.random() * 100).map(String);

        const getExpression = () =>
            Array.from({ length: length }, () => {
                return nums[Math.floor(Math.random() * nums.length)];
            }).reduce((acc, expr) => {
                const operator =
                    operators[Math.floor(Math.random() * operators.length)];
                return `${acc} ${operator} ${expr}`;
            });

        for (let i = 0; i < 100; i++) {
            const expr = insertRandomWhitespace(getExpression());
            const parsed = expression.parse(expr);

            expect(parsed).toBe(eval(expr));
        }
    });
});
