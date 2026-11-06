import { all, regex, string } from "../../../../typescript/src/parse/index.js";

// Each assignment compiles under strict TypeScript at the banked HEAD while
// the corresponding runtime value has a different shape. This is a type-system
// reproduction, not a proposed API.
const failedAsString: string = string("a").parse("x");
const sequenceAsTriple: [string, string, string] = all(
    string("a"),
    regex(/\s*/),
    string("b"),
).parse("ab");
const wrapAsString: string = string("a")
    .wrap(string("("), string(")"), false)
    .parse("(a)");
const trimAsString: string = string("a").trim(regex(/\s*/), false).parse(" a ");
const negativeAsString: string = string("a").not().parse("b");

void [failedAsString, sequenceAsTriple, wrapAsString, trimAsString, negativeAsString];
