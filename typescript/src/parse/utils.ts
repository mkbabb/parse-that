import type { ParserState } from "./state.js";

let lastFurthestOffset = -1;
let lastState: ParserState<unknown> | undefined;

export function mergeErrorState(state: ParserState<unknown>, parserName?: string) {
    if (state.offset > lastFurthestOffset) {
        lastFurthestOffset = state.offset;
        lastState = state;
        // Reset expected list when we advance to a new furthest position
        if (parserName) {
            state.expected = [parserName];
        } else {
            state.expected = undefined;
        }
    } else if (state.offset === lastFurthestOffset && parserName) {
        // Same position — accumulate expected alternatives
        const target = lastState ?? state;
        if (target.expected) {
            if (!target.expected.includes(parserName)) {
                target.expected.push(parserName);
            }
        } else {
            target.expected = [parserName];
        }
    }
    return lastState;
}

export function resetErrorState() {
    lastState = undefined;
    lastFurthestOffset = -1;
}

export function getLastState() {
    return lastState;
}

export function getLastFurthestOffset() {
    return lastFurthestOffset;
}
