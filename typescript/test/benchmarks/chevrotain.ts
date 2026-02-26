// Chevrotain JSON parser with value building (EmbeddedActionsParser)
// Based on: https://github.com/Chevrotain/chevrotain/blob/master/examples/grammars/json/json.js

import {
    createToken,
    Lexer as ChevrotainLexer,
    EmbeddedActionsParser,
} from "chevrotain";

// Tokens
const True = createToken({ name: "True", pattern: "true" });
const False = createToken({ name: "False", pattern: "false" });
const Null = createToken({ name: "Null", pattern: "null" });
const LCurly = createToken({ name: "LCurly", pattern: "{" });
const RCurly = createToken({ name: "RCurly", pattern: "}" });
const LSquare = createToken({ name: "LSquare", pattern: "[" });
const RSquare = createToken({ name: "RSquare", pattern: "]" });
const Comma = createToken({ name: "Comma", pattern: "," });
const Colon = createToken({ name: "Colon", pattern: ":" });
const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
});
const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
});
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t\n\r]+/,
    group: ChevrotainLexer.SKIPPED,
});

const jsonTokens = [
    WhiteSpace,
    StringLiteral,
    NumberLiteral,
    Comma,
    Colon,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    True,
    False,
    Null,
];

const ChevJsonLexer = new ChevrotainLexer(jsonTokens, {
    positionTracking: "onlyOffset",
});

// Value-building parser using EmbeddedActionsParser
class ChevrotainJsonParser extends EmbeddedActionsParser {
    constructor() {
        super(jsonTokens, { outputCst: false });
        this.performSelfAnalysis();
    }

    json = this.RULE("json", () => {
        return this.SUBRULE(this.value);
    });

    object = this.RULE("object", () => {
        const obj: Record<string, any> = {};
        this.CONSUME(LCurly);
        this.OPTION(() => {
            const first = this.SUBRULE(this.objectItem);
            obj[first[0]] = first[1];
            this.MANY(() => {
                this.CONSUME(Comma);
                const item = this.SUBRULE2(this.objectItem);
                obj[item[0]] = item[1];
            });
        });
        this.CONSUME(RCurly);
        return obj;
    });

    objectItem = this.RULE("objectItem", () => {
        const img = this.CONSUME(StringLiteral).image;
        this.CONSUME(Colon);
        const val = this.SUBRULE(this.value);
        return this.ACTION(() => [JSON.parse(img), val] as [string, any]);
    });

    array = this.RULE("array", () => {
        const arr: any[] = [];
        this.CONSUME(LSquare);
        this.OPTION(() => {
            arr.push(this.SUBRULE(this.value));
            this.MANY(() => {
                this.CONSUME(Comma);
                arr.push(this.SUBRULE2(this.value));
            });
        });
        this.CONSUME(RSquare);
        return arr;
    });

    value = this.RULE("value", () => {
        return this.OR(
            this.c1 ||
                (this.c1 = [
                    {
                        ALT: () => {
                            const img = this.CONSUME(StringLiteral).image;
                            return this.ACTION(() => JSON.parse(img));
                        },
                    },
                    {
                        ALT: () =>
                            Number(this.CONSUME(NumberLiteral).image),
                    },
                    { ALT: () => this.SUBRULE(this.object) },
                    { ALT: () => this.SUBRULE(this.array) },
                    {
                        ALT: () => {
                            this.CONSUME(True);
                            return true;
                        },
                    },
                    {
                        ALT: () => {
                            this.CONSUME(False);
                            return false;
                        },
                    },
                    {
                        ALT: () => {
                            this.CONSUME(Null);
                            return null;
                        },
                    },
                ]),
        );
    });

    // Cache for alternatives
    private c1: any;
}

const parserInstance = new ChevrotainJsonParser();

export function parse(text: string) {
    const lexResult = ChevJsonLexer.tokenize(text);
    if (lexResult.errors.length > 0) {
        throw Error("Lexing errors detected");
    }

    parserInstance.input = lexResult.tokens;
    const value = parserInstance.json();

    if (parserInstance.errors.length > 0) {
        throw Error("Parsing Errors detected");
    }
    return value;
}
