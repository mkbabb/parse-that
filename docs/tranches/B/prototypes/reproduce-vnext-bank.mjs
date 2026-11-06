import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { stat } from "node:fs/promises";

import * as esm from "../../../../typescript/dist/parse.js";
import * as core from "../../../../typescript/dist/core.js";

const require = createRequire(import.meta.url);
const cjs = require("../../../../typescript/dist/parse.cjs");

const observations = {};

function diagnostics() {
    esm.enableDiagnostics();
    esm.clearCollectedDiagnostics();
}

// PT-GLOBAL-DIAGNOSTICS
diagnostics();
const recovered = esm.string("a").recover(esm.regex(/./), "sentinel");
recovered.parse("x");
const afterOne = esm.getCollectedDiagnostics().length;
recovered.parse("y");
const afterTwo = esm.getCollectedDiagnostics().length;
observations.globalDiagnostics = { afterOne, afterTwo };
assert.deepEqual(observations.globalDiagnostics, { afterOne: 1, afterTwo: 2 });

// PT-RAW-CROSS-SOURCE-MEMO
esm.resetPackrat();
const memoizedWord = esm.memoize(esm.regex(/[a-z]+/));
const first = new esm.ParserState("hello");
memoizedWord.parser(first);
const second = new esm.ParserState("world");
memoizedWord.parser(second);
observations.rawMemo = { first: first.value, second: second.value };
assert.deepEqual(observations.rawMemo, { first: "hello", second: "hello" });

// PT-NESTED-RECOVERY-ROLLBACK
diagnostics();
const innerRecovery = esm.string("inner").recover(esm.string("x"), "inner-sentinel");
const failingSync = innerRecovery.next(esm.string("z"));
const outerRecovery = esm.string("outer").recover(failingSync, "outer-sentinel");
const nestedState = outerRecovery.parseState("xy");
const nestedDiagnostics = [...esm.getCollectedDiagnostics()];
observations.nestedRollback = {
    failed: nestedState.isError,
    count: nestedDiagnostics.length,
    expected: nestedDiagnostics.map((item) => item.expected),
};
assert.equal(nestedState.isError, true);
assert.equal(nestedDiagnostics.length, 1);
assert.deepEqual(nestedDiagnostics[0].expected, ['"outer"']);

// PT-STATE-RESULT-DIVERGENCE
diagnostics();
const sequence = esm.string("a").then(esm.string("b"));
const returnedState = sequence.parseState("aX");
const observer = sequence.state;
const publicResult = sequence.parse("aX");
observations.stateResult = {
    returned: {
        offset: returnedState.offset,
        value: returnedState.value,
        isError: returnedState.isError,
    },
    observer: {
        offset: observer?.offset,
        value: observer?.value,
        isError: observer?.isError,
    },
    publicResult,
};
assert.notDeepEqual(observations.stateResult.returned, observations.stateResult.observer);

// PT-COMBINATOR-RUNTIME-TYPE-DIVERGENCE
const droppedEmpty = esm.all(esm.string("a"), esm.regex(/\s*/), esm.string("b")).parse("ab");
const wrapped = esm.string("a").wrap(esm.string("("), esm.string(")"), false).parse("(a)");
const trimmed = esm.string("a").trim(esm.regex(/\s*/), false).parse(" a ");
const negative = esm.string("a").not().parse("b");
observations.runtimeShapes = { droppedEmpty, wrapped, trimmed, negative };
assert.deepEqual(droppedEmpty, ["a", "b"]);
assert.deepEqual(wrapped, ["(", "a", ")"]);
assert.deepEqual(trimmed, [" ", "a", " "]);
assert.equal(negative, undefined);

// PT-NONASCII-DISPATCH
const nonAscii = esm.dispatch({ é: esm.string("é") }).parse("é");
observations.nonAsciiDispatch = nonAscii;
assert.equal(nonAscii, undefined);

// PT-EOF-DIAGNOSTIC
diagnostics();
const eofState = esm.regex(/a/).parseState("");
observations.eofDiagnostic = {
    isError: eofState.isError,
    furthest: eofState.furthest,
    expected: eofState.expected,
};
assert.equal(eofState.isError, true);
assert.equal(eofState.expected, undefined);

// PT-LOADER-IDENTITY and same-condition root/core identity.
observations.loaderIdentity = {
    esmVsCjs: esm.Parser === cjs.Parser,
    esmRootVsCore: esm.Parser === core.Parser,
};
assert.equal(observations.loaderIdentity.esmVsCjs, false);
assert.equal(observations.loaderIdentity.esmRootVsCore, true);

// PT-CORE-SCC-AND-BUNDLE: record the transitive shared chunk emitted by Vite.
const sharedChunk = new URL(
    "../../../../typescript/dist/packrat-entry-CS1td-8B.js",
    import.meta.url,
);
observations.esmPackratSharedBytes = (await stat(sharedChunk)).size;
assert.ok(observations.esmPackratSharedBytes >= 40_000);

esm.disableDiagnostics();
console.log(JSON.stringify(observations, null, 2));
