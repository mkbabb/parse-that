import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import {
    all,
    Parser,
    any,
    disableDiagnostics,
    string,
} from "../../../../src/parse/index.js";
import {
    choice,
    compile,
    literal,
    sequence,
    type Compiled,
    type Spanned,
} from "./kernel.js";

const webrefPath = process.env.P3_WEBREF_CSS;
if (!webrefPath) throw new Error("P3_WEBREF_CSS must name Webref css.json");

const names = (JSON.parse(readFileSync(webrefPath, "utf8")) as {
    properties: Array<{ name: string; legacyAliasOf?: string }>;
}).properties
    .filter(entry => !entry.legacyAliasOf && !entry.name.startsWith("--"))
    .map(entry => entry.name);
const shape = process.env.P3_PROFILE_SHAPE === "sequence"
    ? "sequence"
    : "terminal";

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
const closureTerminal = any(...names.map(name => spanned(string(name))));
const stagedTerminal = choice(...names.map(name => literal(name).spanned()));
const closure = (shape === "sequence"
    ? all(closureTerminal, spanned(string(":")))
    : closureTerminal) as unknown as Parser<unknown>;
const staged = (shape === "sequence"
    ? compile(sequence(stagedTerminal, literal(":").spanned()))
    : compile(stagedTerminal)) as unknown as Compiled<unknown>;
const sources = names.map(name => shape === "sequence" ? `${name}:` : name);
const mode = process.env.P3_PROFILE_MODE === "closure" ? "closure" : "staged";
const parse = mode === "closure"
    ? (source: string) => closure.parseState(source)
    : (source: string) => staged.parseState(source);
let cursor = 0;
let sink: unknown;

for (let index = 0; index < 100_000; index++) {
    sink = parse(sources[cursor++ % sources.length]);
}
const start = performance.now();
for (let index = 0; index < 3_000_000; index++) {
    sink = parse(sources[cursor++ % sources.length]);
}

console.log(JSON.stringify({
    mode,
    shape,
    elapsedMs: performance.now() - start,
    final: sink,
    plan: mode === "staged" ? staged.plan : undefined,
}));
