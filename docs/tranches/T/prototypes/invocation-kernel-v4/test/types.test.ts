import assert from "node:assert/strict";
import test from "node:test";
import { utf16Offset, type Parser, type Utf16Offset } from "@parse-that/invocation-kernel-v4-prototype";

test("V4-R10 checked UTF-16 coordinates reject invalid values and normalize negative zero", () => {
    for (const value of [-1, -0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => utf16Offset(value), RangeError);
    }
    assert.equal(Object.is(utf16Offset(-0), -0), false);
    assert.equal(utf16Offset(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
});

if (false) {
    const numberParser = null as unknown as Parser<number>;
    // @ts-expect-error Parser is invariant.
    const stringParser: Parser<string> = numberParser;
    void stringParser;
    // @ts-expect-error ordinary numbers are not checked UTF-16 offsets.
    const offset: Utf16Offset = 1;
    void offset;
}
