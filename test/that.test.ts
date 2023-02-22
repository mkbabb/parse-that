import { match, sequence, many, Parser } from "../src/that";
import { test, expect, describe } from "vitest";

describe("Parse That", () => {
    test("parse a floating point number", () => {
        const digits = many(match(/[0-9]/))
            .map((val) => {
                console.log(val);
                return val;
            })
            .map((val) => val.join(""));

        const sign = match(/-/).opt();

        const integral = digits;
        const fractional = match(/\./).then(digits);

        const exponent = sequence(match(/[eE]/), match(/[-+]/).opt(), digits)
            .map(([, exponentSign, exponent]) => {
                return `e${exponentSign ?? ""}${exponent}`;
            })
            .opt();

        const number = sequence(sign, integral, fractional, exponent).map(
            ([sign, integral, [, fractional], exponent]) => {
                return parseFloat(
                    `${sign ?? ""}${integral}.${fractional}${exponent ?? ""}`
                );
            }
        );

        const num = number.parse("123.456e+2");

        expect(num).toBe(12345.6);
    });
});
