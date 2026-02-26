// Taken directly from Chevrotain's example page at:
// https://github.com/Chevrotain/chevrotain/tree/gh-pages/performance/jsonParsers/chevrotain

// ----------------- Lexer -----------------
import { createToken, Lexer as ChevrotainLexer, CstParser as ChevrotainCSTParser } from "chevrotain";

var True = createToken({name: "True", pattern: "true"});
var False = createToken({name: "False", pattern: "false"});
var Null = createToken({name: "Null", pattern: "null"});
var LCurly = createToken({name: "LCurly", pattern: "{"});
var RCurly = createToken({name: "RCurly", pattern: "}"});
var LSquare = createToken({name: "LSquare", pattern: "["});
var RSquare = createToken({name: "RSquare", pattern: "]"});
var Comma = createToken({name: "Comma", pattern: ","});
var Colon = createToken({name: "Colon", pattern: ":"});

var stringLiteralPattern = /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
var StringLiteral = createToken({name: "StringLiteral", pattern: stringLiteralPattern});
var NumberLiteral = createToken({name: "NumberLiteral", pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/});
var WhiteSpace = createToken({name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: ChevrotainLexer.SKIPPED});

var jsonTokens = [WhiteSpace, StringLiteral, NumberLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null];
// Tracking only the offset provides a small speed boost.
var ChevJsonLexer = new ChevrotainLexer(jsonTokens, {positionTracking: "onlyOffset"});


// ----------------- parser -----------------

// https://chevrotain.io/docs/guide/performance.html#using-a-singleton-parser
// (Do not create a new Parser instance for each new input.)
// ChevrotainCSTParser imported above

function ChevrotainJsonParser(options) {
    ChevrotainCSTParser.call(this, jsonTokens, options);
    const $ = this;

    $.RULE("json", function () {
        $.OR([
            {ALT: function () { $.SUBRULE($.object) }},
            {ALT: function () { $.SUBRULE($.array) }}
        ]);
    });

    $.RULE("object", function () {
        $.CONSUME(LCurly);
        $.OPTION(function () {
            $.SUBRULE($.objectItem);
            $.MANY(function () {
                $.CONSUME(Comma);
                $.SUBRULE2($.objectItem);
            });
        });
        $.CONSUME(RCurly);
    });

    $.RULE("objectItem", function () {
        $.CONSUME(StringLiteral);
        $.CONSUME(Colon);
        $.SUBRULE($.value);
    });

    $.RULE("array", function () {
        $.CONSUME(LSquare);
        $.OPTION(function () {
            $.SUBRULE($.value);
            $.MANY(function () {
                $.CONSUME(Comma);
                $.SUBRULE2($.value);
            });
        });
        $.CONSUME(RSquare);
    });

    $.RULE("value", function () {
        // https://chevrotain.io/docs/guide/performance.html#caching-arrays-of-alternatives
        // See "Avoid reinitializing large arrays of alternatives." section
        $.OR($.c1 || ($.c1  = [
            { ALT: function () { $.CONSUME(StringLiteral) }},
            { ALT: function () { $.CONSUME(NumberLiteral) }},
            { ALT: function () { $.SUBRULE($.object) }},
            { ALT: function () { $.SUBRULE($.array) }},
            { ALT: function () { $.CONSUME(True) }},
            { ALT: function () { $.CONSUME(False) }},
            { ALT: function () { $.CONSUME(Null) }}
        ]));
    });

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    this.performSelfAnalysis();
}

ChevrotainJsonParser.prototype = Object.create(ChevrotainCSTParser.prototype);
ChevrotainJsonParser.prototype.constructor = ChevrotainJsonParser;

// ----------------- wrapping it all together -----------------
var chevrotainJsonParserInstance
export function parse(text) {
    var lexResult = ChevJsonLexer.tokenize(text);
    if (lexResult.errors.length > 0) {
        throw Error("Lexing errors detected")
    }

    // It is recommended to only initialize a Chevrotain Parser once
    // and reset it's state instead of re-initializing it
    if (chevrotainJsonParserInstance === undefined) {
        chevrotainJsonParserInstance = new ChevrotainJsonParser({outputCst:false})
    }

    // setting a new input will RESET the parser instance's state.
    chevrotainJsonParserInstance.input = lexResult.tokens;

    // any top level rule may be used as an entry point
    var value = chevrotainJsonParserInstance.json();

    if (chevrotainJsonParserInstance.errors.length > 0) {
        throw Error("Parsing Errors detected")
    }
    return {
        value: value, // this is a pure grammar, the value will always be <undefined>
        lexErrors: lexResult.errors,
        parseErrors: chevrotainJsonParserInstance.errors
    };
}
