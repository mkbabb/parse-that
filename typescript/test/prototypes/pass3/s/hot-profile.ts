import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import {
    Parser,
    any,
    disableDiagnostics,
    string,
} from "../../../../src/parse/index.js";
import {
    choice,
    compile,
    literal,
    type Spanned,
} from "./kernel.js";

const webrefPath = process.env.P3_WEBREF_CSS;
if (!webrefPath) throw new Error("P3_WEBREF_CSS must name Webref css.json");

const names = (JSON.parse(readFileSync(webrefPath, "utf8")) as {
    properties: Array<{ name: string; legacyAliasOf?: string }>;
}).properties
    .filter(entry => !entry.legacyAliasOf && !entry.name.startsWith("--"))
    .map(entry => entry.name);

function spanned<T>(parser: Parser<T>): Parser<Spanned<T>> {
    return new Parser(state => {
        const start = state.offset;
        parser.parser(state);
        return state.isError
            ? state
            : state.ok({ value: state.value, span: { start, end: state.offset } });
    });
}

disableDiagnostics();
const closure = any(...names.map(name => spanned(string(name))));
const staged = compile(choice(...names.map(name => literal(name).spanned())));
const mode = process.env.P3_PROFILE_MODE === "closure" ? "closure" : "staged";
const parse = mode === "closure"
    ? (source: string) => closure.parseState(source)
    : (source: string) => staged.parseState(source);
let cursor = 0;
let sink: unknown;

for (let index = 0; index < 100_000; index++) {
    sink = parse(names[cursor++ % names.length]);
}
const start = performance.now();
for (let index = 0; index < 3_000_000; index++) {
    sink = parse(names[cursor++ % names.length]);
}

console.log(JSON.stringify({
    mode,
    elapsedMs: performance.now() - start,
    final: sink,
    plan: mode === "staged" ? staged.plan : undefined,
}));
