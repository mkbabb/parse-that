// Subpath entry: "@mkbabb/parse-that/utils" (A.W3).
//
// Whitespace/comment skip primitives plus the json/csv domain-parser showcases
// and the string utility parsers. The utility tier a consumer reaches for when
// it wants the batteries-included helpers, not just the bare combinator core.
export { skipWhitespace, skipBlockComments } from "./utils.js";
export { jsonParser } from "./parsers/json.js";
export type { JsonValue } from "./parsers/json.js";
export { csvParser } from "./parsers/csv.js";
export {
    escapedString,
    quotedString,
    numberParser,
} from "./parsers/utils.js";
