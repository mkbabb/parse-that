import {
    MISMATCH,
    State,
    fail,
    skipWhitespace,
} from "./shared.mjs";

export class Parser {
    constructor(parser) {
        this.parser = parser;
    }

    parseState(source) {
        const state = new State(source);
        try {
            this.parser(state);
        } catch (error) {
            if (error !== MISMATCH) throw error;
            state.offset = 0;
            state.isError = true;
        }
        return state;
    }

    parse(source) {
        return this.parseState(source).value;
    }

    map(project) {
        const inner = this.parser;
        return new Parser(state => {
            inner(state);
            state.value = project(state.value);
            return state;
        });
    }

    or(other) {
        const left = this.parser;
        const right = other.parser;
        return new Parser(state => {
            const offset = state.offset;
            const value = state.value;
            try {
                return left(state);
            } catch (error) {
                if (error !== MISMATCH) throw error;
                state.offset = offset;
                state.value = value;
                return right(state);
            }
        });
    }

    then(other) {
        const left = this.parser;
        const right = other.parser;
        return new Parser(state => {
            left(state);
            const first = state.value;
            right(state);
            state.value = [first, state.value];
            return state;
        });
    }

    skip(other) {
        const left = this.parser;
        const right = other.parser;
        return new Parser(state => {
            left(state);
            const value = state.value;
            try {
                right(state);
                state.value = value;
                return state;
            } catch (error) {
                state.value = value;
                throw error;
            }
        });
    }

    trim() {
        const inner = this.parser;
        return new Parser(state => {
            state.offset = skipWhitespace(state.src, state.offset);
            inner(state);
            state.offset = skipWhitespace(state.src, state.offset);
            return state;
        });
    }

    wrap(open, close) {
        return open.next(this).skip(close);
    }

    next(other) {
        const left = this.parser;
        const right = other.parser;
        return new Parser(state => {
            left(state);
            return right(state);
        });
    }

    sepBy(separator) {
        const element = this.parser;
        const sep = separator.parser;
        return new Parser(state => {
            const values = [];
            const initialOffset = state.offset;
            const initialValue = state.value;
            try {
                element(state);
                values.push(state.value);
            } catch (error) {
                if (error !== MISMATCH) throw error;
                state.offset = initialOffset;
                state.value = values;
                return state;
            }
            while (true) {
                const checkpoint = state.offset;
                const value = state.value;
                try {
                    sep(state);
                    element(state);
                    values.push(state.value);
                } catch (error) {
                    if (error !== MISMATCH) throw error;
                    state.offset = checkpoint;
                    state.value = value;
                    break;
                }
            }
            state.value = values.length === 0 ? initialValue : values;
            return state;
        });
    }

    static lazy(resolve) {
        let parser;
        return new Parser(state => (parser ??= resolve()).parser(state));
    }
}

export function string(text) {
    const length = text.length;
    return new Parser(state => {
        const offset = state.offset;
        if (!state.src.startsWith(text, offset)) fail(state, offset);
        state.offset = offset + length;
        state.value = text;
        return state;
    });
}

export function regex(expression) {
    const sticky = new RegExp(expression, expression.flags.replace(/y/g, "") + "y");
    return new Parser(state => {
        const offset = state.offset;
        sticky.lastIndex = offset;
        if (!sticky.test(state.src)) fail(state, offset);
        state.offset = sticky.lastIndex;
        state.value = state.src.substring(offset, state.offset);
        return state;
    });
}

export function dispatch(table) {
    const routes = new Int16Array(128).fill(-1);
    const parsers = [];
    const intern = parser => {
        let index = parsers.indexOf(parser);
        if (index < 0) {
            index = parsers.length;
            parsers.push(parser);
        }
        return index;
    };
    for (const [codes, parser] of Object.entries(table)) {
        const index = intern(parser);
        if (codes.length === 3 && codes[1] === "-") {
            for (
                let code = codes.charCodeAt(0);
                code <= codes.charCodeAt(2);
                code++
            ) routes[code] = index;
        } else {
            for (let at = 0; at < codes.length; at++) {
                routes[codes.charCodeAt(at)] = index;
            }
        }
    }
    return new Parser(state => {
        const code = state.src.charCodeAt(state.offset);
        const index = code < 128 ? routes[code] : -1;
        if (index < 0) fail(state, state.offset);
        return parsers[index].parser(state);
    });
}

export const api = {
    Parser,
    dispatch,
    regex,
    string,
};
