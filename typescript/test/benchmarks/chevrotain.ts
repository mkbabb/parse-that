// Taken directly from Chevrotain's example page, modernized for ESM:
// https://github.com/Chevrotain/chevrotain/tree/gh-pages/performance/jsonParsers/chevrotain

import { createToken, Lexer, CstParser } from "chevrotain";

// ----------------- Lexer -----------------

const True = createToken({ name: "True", pattern: /true/ });
const False = createToken({ name: "False", pattern: /false/ });
const Null = createToken({ name: "Null", pattern: /null/ });
const LCurly = createToken({ name: "LCurly", pattern: /{/ });
const RCurly = createToken({ name: "RCurly", pattern: /}/ });
const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
const RSquare = createToken({ name: "RSquare", pattern: /]/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const Colon = createToken({ name: "Colon", pattern: /:/ });
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
    group: Lexer.SKIPPED,
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

const ChevJsonLexer = new Lexer(jsonTokens, { positionTracking: "onlyOffset" });

// ----------------- Parser -----------------

class ChevrotainJsonParser extends CstParser {
    constructor() {
        super(jsonTokens, { nodeLocationTracking: "none" });
        this.performSelfAnalysis();
    }

    json = this.RULE("json", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.object) },
            { ALT: () => this.SUBRULE(this.array) },
        ]);
    });

    object = this.RULE("object", () => {
        this.CONSUME(LCurly);
        this.OPTION(() => {
            this.SUBRULE(this.objectItem);
            this.MANY(() => {
                this.CONSUME(Comma);
                this.SUBRULE2(this.objectItem);
            });
        });
        this.CONSUME(RCurly);
    });

    objectItem = this.RULE("objectItem", () => {
        this.CONSUME(StringLiteral);
        this.CONSUME(Colon);
        this.SUBRULE(this.value);
    });

    array = this.RULE("array", () => {
        this.CONSUME(LSquare);
        this.OPTION(() => {
            this.SUBRULE(this.value);
            this.MANY(() => {
                this.CONSUME(Comma);
                this.SUBRULE2(this.value);
            });
        });
        this.CONSUME(RSquare);
    });

    value = this.RULE("value", () => {
        this.OR([
            { ALT: () => this.CONSUME(StringLiteral) },
            { ALT: () => this.CONSUME(NumberLiteral) },
            { ALT: () => this.SUBRULE(this.object) },
            { ALT: () => this.SUBRULE(this.array) },
            { ALT: () => this.CONSUME(True) },
            { ALT: () => this.CONSUME(False) },
            { ALT: () => this.CONSUME(Null) },
        ]);
    });
}

// Singleton instance — Chevrotain recommends reusing the parser instance.
const parserInstance = new ChevrotainJsonParser();

export function parse(text: string) {
    const lexResult = ChevJsonLexer.tokenize(text);
    if (lexResult.errors.length > 0) {
        throw Error("Lexing errors detected");
    }

    parserInstance.input = lexResult.tokens;
    parserInstance.json();

    if (parserInstance.errors.length > 0) {
        throw Error("Parsing Errors detected");
    }
}
