import { bindingOf, GrammarBuilder } from "./graph.js";
import { RunMachine } from "./machine.js";
import { evidence } from "./state.js";
import { asOffset, offsetNumber, reveal } from "./types.js";
export { GrammarBuilder } from "./graph.js";
export function createGrammar() {
    return new GrammarBuilder();
}
function publicResult(outcome, debug) {
    if (outcome.kind === "success") {
        return {
            kind: "success",
            value: reveal(outcome.value),
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
function execute(parser, source, full, options) {
    const { graph, node } = bindingOf(parser);
    const machine = new RunMachine(graph, source, options);
    let outcome;
    try {
        outcome = machine.execute(node);
        if (full &&
            outcome.kind === "success" &&
            offsetNumber(outcome.next) !== source.length) {
            const failed = {
                kind: "failure",
                evidence: evidence(offsetNumber(outcome.next), ["<end-of-input>"]),
                diagnostics: outcome.diagnostics,
                control: outcome.control,
            };
            outcome = failed;
        }
    }
    catch (error) {
        const debug = machine.terminalize(true);
        options.onDebug?.(debug);
        throw error;
    }
    const debug = machine.terminalize();
    options.onDebug?.(debug);
    return publicResult(outcome, debug);
}
export function parsePrefix(parser, source, options = {}) {
    return execute(parser, source, false, options);
}
export function parseFull(parser, source, options = {}) {
    return execute(parser, source, true, options);
}
/** Public helper used only to prove UTF-16 branding at declaration boundaries. */
export const utf16Offset = asOffset;
