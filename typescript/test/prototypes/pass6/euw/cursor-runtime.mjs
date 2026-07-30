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
            state.offset = this.parser(state, 0);
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
        return new Parser((state, offset) => {
            const end = inner(state, offset);
            state.value = project(state.value);
            return end;
        });
    }

    or(other) {
        const left = this.parser;
        const right = other.parser;
        return new Parser((state, offset) => {
            const value = state.value;
            try {
                return left(state, offset);
            } catch (error) {
                if (error !== MISMATCH) throw error;
                state.value = value;
                return right(state, offset);
            }
        });
    }

    then(other) {
        const left = this.parser;
        const right = other.parser;
        return new Parser((state, offset) => {
            const middle = left(state, offset);
            const first = state.value;
            const end = right(state, middle);
            state.value = [first, state.value];
            return end;
        });
    }

    skip(other) {
        const left = this.parser;
        const right = other.parser;
        return new Parser((state, offset) => {
            const middle = left(state, offset);
            const value = state.value;
            try {
                const end = right(state, middle);
                state.value = value;
                return end;
            } catch (error) {
                state.value = value;
                throw error;
            }
        });
    }

    trim() {
        const inner = this.parser;
        return new Parser((state, offset) => {
            const start = skipWhitespace(state.src, offset);
            const end = inner(state, start);
            return skipWhitespace(state.src, end);
        });
    }

    wrap(open, close) {
        return open.next(this).skip(close);
    }

    next(other) {
        const left = this.parser;
        const right = other.parser;
        return new Parser((state, offset) => right(state, left(state, offset)));
    }

    sepBy(separator) {
        const element = this.parser;
        const sep = separator.parser;
        return new Parser((state, offset) => {
            const values = [];
            const initial = state.value;
            let cursor = offset;
            try {
                cursor = element(state, cursor);
                values.push(state.value);
            } catch (error) {
                if (error !== MISMATCH) throw error;
                state.value = values;
                return offset;
            }
            while (true) {
                const checkpoint = cursor;
                const value = state.value;
                try {
                    cursor = sep(state, cursor);
                    cursor = element(state, cursor);
                    values.push(state.value);
                } catch (error) {
                    if (error !== MISMATCH) throw error;
                    state.value = value;
                    cursor = checkpoint;
                    break;
                }
            }
            state.value = values.length === 0 ? initial : values;
            return cursor;
        });
    }

    static lazy(resolve) {
        let parser;
        return new Parser((state, offset) =>
            (parser ??= resolve()).parser(state, offset)
        );
    }
}

export function string(text) {
    const length = text.length;
    return new Parser((state, offset) => {
        if (!state.src.startsWith(text, offset)) fail(state, offset);
        state.value = text;
        return offset + length;
    });
}

export function regex(expression) {
    const sticky = new RegExp(expression, expression.flags.replace(/y/g, "") + "y");
    return new Parser((state, offset) => {
        sticky.lastIndex = offset;
        if (!sticky.test(state.src)) fail(state, offset);
        const end = sticky.lastIndex;
        state.value = state.src.substring(offset, end);
        return end;
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
    return new Parser((state, offset) => {
        const code = state.src.charCodeAt(offset);
        const index = code < 128 ? routes[code] : -1;
        if (index < 0) fail(state, offset);
        return parsers[index].parser(state, offset);
    });
}

export const api = {
    Parser,
    dispatch,
    regex,
    string,
};
