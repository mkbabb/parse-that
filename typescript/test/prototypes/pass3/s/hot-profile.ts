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
import { StagedParser } from "./run-state.js";

const webrefPath = process.env.P3_WEBREF_CSS;
if (!webrefPath) throw new Error("P3_WEBREF_CSS must name Webref css.json");

const names = (JSON.parse(readFileSync(webrefPath, "utf8")) as {
    properties: Array<{ name: string; legacyAliasOf?: string }>;
}).properties
    .filter(entry => !entry.legacyAliasOf && !entry.name.startsWith("--"))
    .map(entry => entry.name)
    .sort((left, right) =>
        right.length - left.length || left.localeCompare(right)
    );
const shape = process.env.P3_PROFILE_SHAPE === "recovery"
    ? "recovery"
    : process.env.P3_PROFILE_SHAPE === "sequence"
        ? "sequence"
        : "terminal";
const opaque = Object.freeze({ kind: "opaque", source: "bad;" } as const);

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
const closureDeclaration: Parser<unknown> = all(
    closureTerminal,
    spanned(string(":")),
);
const stagedDeclaration = sequence(stagedTerminal, literal(":").spanned());
const closure = (shape === "terminal"
    ? closureTerminal
    : shape === "recovery"
        ? closureDeclaration.recover(string("bad;"), opaque)
        : closureDeclaration) as unknown as Parser<unknown>;
const staged = (shape === "terminal"
    ? compile(stagedTerminal)
    : shape === "recovery"
        ? compile(stagedDeclaration.recover(literal("bad;"), opaque))
        : compile(stagedDeclaration)) as unknown as Compiled<unknown>;
const stagedBoundary = new StagedParser<unknown>(staged.parser);
const sources = names.map((name, index) =>
    shape === "recovery" && index % 10 === 0
        ? "bad;"
        : shape === "terminal"
            ? name
            : `${name}:`
);
const mode = process.env.P3_PROFILE_MODE === "closure" ? "closure" : "staged";
const parse = mode === "closure"
    ? (source: string) => closure.parseState(source)
    : (source: string) => stagedBoundary.parseState(source);
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
