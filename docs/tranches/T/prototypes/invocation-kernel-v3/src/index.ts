import { bindingOf, GrammarBuilder } from "./graph.js";
import { RunMachine } from "./machine.js";
import type { Failure, Outcome } from "./state.js";
import { evidence } from "./state.js";
import type {
    DebugReport,
    ParseOptions,
    ParseResult,
    Parser,
} from "./types.js";
import { asOffset, offsetNumber, reveal } from "./types.js";

export { GrammarBuilder } from "./graph.js";
export type {
    DebugEvent,
    DebugReport,
    Diagnostic,
    MemoOptions,
    Offset,
    ParseOptions,
    ParseResult,
    Parser,
    Rule,
} from "./types.js";

export function createGrammar(): GrammarBuilder {
    return new GrammarBuilder();
}

function publicResult<T>(outcome: Outcome, debug: DebugReport): ParseResult<T> {
    if (outcome.kind === "success") {
        return {
            kind: "success",
            value: reveal<T>(outcome.value),
            offset: outcome.next,
            diagnostics: [...outcome.diagnostics],
            debug,
        };
    }
    if (outcome.kind === "resource") {
        return {
            kind: "resource",
            resource: outcome.resource,
            offset: outcome.evidence.offset,
            expected: [...outcome.evidence.expected],
            diagnostics: [...outcome.diagnostics],
            debug,
        };
    }
    return {
        kind: "failure",
        offset: outcome.evidence.offset,
        expected: [...outcome.evidence.expected],
        committed: outcome.control !== null || outcome.evidence.committedOwner !== null,
        diagnostics: [...outcome.diagnostics],
        debug,
    };
}

function execute<T>(
    parser: Parser<T>,
    source: string,
    full: boolean,
    options: ParseOptions,
): ParseResult<T> {
    const { graph, node } = bindingOf(parser);
    const machine = new RunMachine(graph, source, options);
    let outcome: Outcome;
    try {
        outcome = machine.execute(node);
        if (
            full &&
            outcome.kind === "success" &&
            offsetNumber(outcome.next) !== source.length
        ) {
            const failed: Failure = {
                kind: "failure",
                evidence: evidence(offsetNumber(outcome.next), ["<end-of-input>"]),
                diagnostics: outcome.diagnostics,
                control: outcome.control,
            };
            outcome = failed;
        }
    } catch (error) {
        const debug = machine.terminalize(true);
        options.onDebug?.(debug);
        throw error;
    }
    const debug = machine.terminalize();
    options.onDebug?.(debug);
    return publicResult<T>(outcome, debug);
}

export function parsePrefix<T>(
    parser: Parser<T>,
    source: string,
    options: ParseOptions = {},
): ParseResult<T> {
    return execute(parser, source, false, options);
}

export function parseFull<T>(
    parser: Parser<T>,
    source: string,
    options: ParseOptions = {},
): ParseResult<T> {
    return execute(parser, source, true, options);
}

/** Public helper used only to prove UTF-16 branding at declaration boundaries. */
export const utf16Offset = asOffset;
