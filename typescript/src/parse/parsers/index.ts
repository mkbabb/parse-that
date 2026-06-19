// Domain-parser showcases over the combinator core. The CSS grammar that once
// lived here moved to value.js (the constellation's one canonical CSS grammar,
// D2/D3); parse-that is pure primitives now — json/csv remain as the terse,
// spec-grade combinator examples.
export { jsonParser } from "./json.js";
export type { JsonValue } from "./json.js";
export { csvParser } from "./csv.js";
export { escapedString, quotedString, numberParser } from "./utils.js";
