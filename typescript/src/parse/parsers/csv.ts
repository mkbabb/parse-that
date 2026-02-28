/**
 * Combinator CSV parser — built from parse-that primitives.
 * Handles double-quoted, single-quoted, and unquoted fields.
 */
import { regex, any, string, Parser } from "../index.js";

const delim = string(",").trim();
const doubleQuotes = string('"');
const singleQuotes = string("'");

const token = any(
    regex(/[^"]+/).wrap(doubleQuotes, doubleQuotes),
    regex(/[^']+/).wrap(singleQuotes, singleQuotes),
    regex(/[^,]+/)
);

const line = token.sepBy(delim).trim();

/** Combinator CSV parser — returns array of rows, each an array of string fields. */
export const csvParser = line.many();
