import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import { api as cursorApi } from "./cursor-runtime.mjs";
import { makeJson } from "./json-factory.mjs";
import {
    MISMATCH,
    State,
    immutableResult,
} from "./shared.mjs";
import { api as stateApi } from "./state-runtime.mjs";

const [variant, seedText] = process.argv.slice(2);
const seed = Number(seedText);
const controlModule = process.env.P6_M2_BUNDLE;
if (!controlModule) throw new Error("P6_M2_BUNDLE is required");
const controlApi = await import(pathToFileURL(controlModule).href);
const candidateApi = variant === "cursor" ? cursorApi : stateApi;
const control = controlApi.jsonParser;
const factoryControl = makeJson(controlApi);
const candidate = makeJson(candidateApi);
const fixtures = [
    '{"a":[1,true,null,"x"]}',
    '[{"b":2},false,"y",null]',
    '{"nested":{"arr":[1,2,3]},"s":"hello"}',
    '[0,{"x":[true,false]},-12.5e2,"\\u0041"]',
];

function equal(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

const equality = fixtures.map(source => {
    const expected = JSON.parse(source);
    const exact = immutableResult(control, source);
    const rebuilt = immutableResult(factoryControl, source);
    const actual = immutableResult(candidate, source);
    return {
        source,
        exactValue: equal(exact.value, expected),
        rebuiltControl: equal(rebuilt, exact),
        candidateValue: equal(actual.value, expected),
        candidatePublic: equal(actual, exact),
    };
});
if (equality.some(row =>
    !row.exactValue
    || !row.rebuiltControl
    || !row.candidateValue
    || !row.candidatePublic
)) {
    throw new Error(`equality failed: ${JSON.stringify(equality)}`);
}

const rawState = new State("a");
const rawParser = candidateApi.string("a");
const rawSuccess = variant === "cursor"
    ? rawParser.parser(rawState, 0)
    : rawParser.parser(rawState);
let rawMismatch = false;
try {
    const failed = new State("x");
    if (variant === "cursor") rawParser.parser(failed, 0);
    else rawParser.parser(failed);
} catch (error) {
    rawMismatch = error === MISMATCH;
}

let random = seed | 0;
function nextRandom() {
    random ^= random << 13;
    random ^= random >>> 17;
    random ^= random << 5;
    return random >>> 0;
}
const order = fixtures.map((_, index) => index);
for (let index = order.length - 1; index > 0; index--) {
    const other = nextRandom() % (index + 1);
    [order[index], order[other]] = [order[other], order[index]];
}

let blackhole;
function runArm(parser, iterations, rotation) {
    const start = performance.now();
    for (let iteration = 0; iteration < iterations; iteration++) {
        const at = order[(iteration + rotation) & 3];
        blackhole = immutableResult(parser, fixtures[at]);
    }
    return (performance.now() - start) * 1e6;
}

const iterations = Number(process.env.P6_ITERATIONS ?? 2_000);
for (let index = 0; index < 1_000; index++) {
    blackhole = immutableResult(control, fixtures[index & 3]);
    blackhole = immutableResult(candidate, fixtures[index & 3]);
}
const controlNs = [];
const candidateNs = [];
const batchOrder = [];
for (let batch = 0; batch < 10; batch++) {
    const controlFirst = ((batch + seed) & 1) === 0;
    const rotation = nextRandom() & 3;
    batchOrder.push(controlFirst ? "AB" : "BA");
    if (controlFirst) {
        controlNs.push(runArm(control, iterations, rotation));
        candidateNs.push(runArm(candidate, iterations, rotation));
    } else {
        candidateNs.push(runArm(candidate, iterations, rotation));
        controlNs.push(runArm(control, iterations, rotation));
    }
}
const sum = values => values.reduce((total, value) => total + value, 0);
process.stdout.write(`${JSON.stringify({
    variant,
    seed,
    iterations,
    equality,
    rawAbi: {
        success:
            variant === "cursor"
                ? rawSuccess === 1 && rawState.offset === 0
                : rawSuccess === rawState && rawState.offset === 1,
        mismatchSingleton: rawMismatch,
        legacySignaturePreserved: variant === "state",
        legacyFailureReturnPreserved: false,
    },
    order,
    batchOrder,
    controlNs,
    candidateNs,
    ratio: sum(controlNs) / sum(candidateNs),
    pid: process.pid,
    execPath: process.execPath,
    node: process.version,
    v8: process.versions.v8,
    blackhole: blackhole?.offset,
})}\n`);
