import { Parser } from "./parser.js";
import type { ParserState } from "./state.js";
import { createParserContext } from "./state.js";

const LAZY_PARSER_CACHE = new WeakMap<Function, unknown>();

export function getLazyParser<T>(fn: () => T): T {
    const cached = LAZY_PARSER_CACHE.get(fn);
    if (cached !== undefined) {
        return cached as T;
    }
    const parser = fn();
    LAZY_PARSER_CACHE.set(fn, parser);
    return parser;
}

// Closure-local lazy cache — avoids mutating function objects (megamorphic IC pollution)
export function createLazyCached<T>(fn: () => any): (state: ParserState<T>) => ParserState<T> {
    let cached: any | undefined;
    return (state: ParserState<T>) => {
        if (!cached) cached = fn();
        return cached.parser(state) as ParserState<T>;
    };
}

/**
 * Method decorator that wraps a parser-returning method in a lazy parser.
 * Defers parser construction until first invocation, then caches.
 */
export function lazy<T>(
    target: unknown,
    _propertyName: string,
    descriptor: TypedPropertyDescriptor<() => any>,
) {
    const method = descriptor.value!.bind(target)!;

    descriptor.value = function () {
        return new Parser(
            createLazyCached(method),
            createParserContext("lazy", undefined, method),
        );
    };
}
