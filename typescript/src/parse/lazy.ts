import type { ParserFunction } from "./parser.js";
import type { ParserState } from "./state.js";
import { createParserContext } from "./state.js";

// Forward reference — set by parser.ts to avoid circular import at module init
let _Parser: any;
export function _setParserClass(cls: any) {
    _Parser = cls;
}

export function getLazyParser<T>(
    fn: (() => any) & { parser?: any },
): any {
    if (fn.parser) {
        return fn.parser;
    }
    return (fn.parser = fn());
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
        return new _Parser(
            createLazyCached(method),
            createParserContext("lazy", undefined, method),
        );
    };
}
