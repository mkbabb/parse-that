export const MISMATCH = Object.freeze({ kind: "Mismatch" });

export class State {
    expected;
    suggestions = [];
    secondarySpans = [];
    diagnostics = [];
    value;
    offset = 0;
    isError = false;
    furthest = -1;

    constructor(src) {
        this.src = src;
    }
}

export function fail(state, offset) {
    if (offset > state.furthest) state.furthest = offset;
    throw MISMATCH;
}

export function skipWhitespace(source, offset) {
    while (offset < source.length) {
        const code = source.charCodeAt(offset);
        if (code !== 32 && (code < 9 || code > 13)) break;
        offset++;
    }
    return offset;
}

export function immutableResult(parser, source) {
    const state = parser.parseState(source);
    return Object.freeze({
        src: state.src,
        value: state.value,
        offset: state.offset,
        isError: state.isError,
        furthest: state.furthest,
        expected: state.expected,
        suggestions: Object.freeze([...state.suggestions]),
        secondarySpans: Object.freeze([...state.secondarySpans]),
        diagnostics: Object.freeze([...state.diagnostics]),
    });
}
