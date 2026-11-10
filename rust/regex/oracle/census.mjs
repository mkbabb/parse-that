#!/usr/bin/env node
// sk-v27 LW1.RX-3: the lookaround census.
//
// Reads regex leaves from two kinds of source and writes one TSV row per
// distinct (pattern, flags) leaf:
//   --bbnf <dir-or-file>...  BBNF grammars, parsed by bbnf-lang's own parser
//                           (`BBNFToASTWithImports`); every `regex` node is a
//                           leaf. `--resolve-from <dir>` names the package
//                           root that provides `@mkbabb/bbnf-lang`.
//   --list <file>            one leaf per line, raw (`\d+`) or literal (`/\d+/i`).
//
// Each leaf must compile on the host engine (V8); a leaf that does not is
// reported as INVALID. Classification reads the pattern source of a valid
// JS regex: outside a class, an unescaped `(?=`, `(?!`, `(?<=` or `(?<!` is a
// lookaround, `\1`-`\9` or `\k<` is a backreference, a `?` after a quantifier
// is lazy. Inside a well-formed pattern these spellings are unambiguous, so
// the scan reads tokens; it does not parse the pattern.
//
// Usage:
//   node census.mjs --name value.js --resolve-from ~/Programming/value.js \
//     --bbnf ~/Programming/value.js/src/css/grammar \
//     --name sk-v24 --list skv24-56.txt --out LOOKAROUND-CENSUS.tsv

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

function classify(source, flags) {
  const c = { la_pos: 0, la_neg: 0, lb_pos: 0, lb_neg: 0, backref: 0, lazy: 0 };
  const vmode = flags.includes("v");
  let depth = 0; // class nesting (v mode nests classes)
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === "\\") {
      const n = source[i + 1];
      if (depth === 0 && ((n >= "1" && n <= "9") || (n === "k" && source[i + 2] === "<"))) c.backref++;
      i++;
      continue;
    }
    if (depth > 0) {
      if (ch === "[" && vmode) depth++;
      else if (ch === "]") depth--;
      continue;
    }
    if (ch === "[") {
      depth = 1;
      continue;
    }
    if (ch === "(" && source[i + 1] === "?") {
      const a = source[i + 2];
      const b = source[i + 3];
      if (a === "=") c.la_pos++;
      else if (a === "!") c.la_neg++;
      else if (a === "<" && b === "=") c.lb_pos++;
      else if (a === "<" && b === "!") c.lb_neg++;
      continue;
    }
    if (ch === "?" && i > 0) {
      const p = source[i - 1];
      const escaped = i > 1 && source[i - 2] === "\\";
      if (!escaped && (p === "*" || p === "+" || p === "?" || p === "}") && source[i - 2] !== "(") c.lazy++;
    }
  }
  return c;
}

function bbnfFiles(path) {
  const st = statSync(path);
  if (st.isFile()) return [path];
  return readdirSync(path)
    .filter((f) => f.endsWith(".bbnf"))
    .sort()
    .map((f) => join(path, f));
}

function walk(node, out) {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node) || node instanceof Map) {
    for (const n of node.values()) walk(n, out);
    return;
  }
  if (node.type === "regex" && node.value instanceof RegExp) {
    out.push({ source: node.value.source, flags: node.value.flags });
    return;
  }
  for (const k of Object.keys(node)) if (k !== "parser") walk(node[k], out);
}

function leavesFromBbnf(paths, resolveFrom) {
  const req = createRequire(join(resolve(resolveFrom), "package.json"));
  const bbnf = req("@mkbabb/bbnf-lang");
  const out = [];
  for (const p of paths.flatMap(bbnfFiles)) {
    const parsed = bbnf.BBNFToASTWithImports(readFileSync(p, "utf8"));
    if (parsed.length < 2) throw new Error(`bbnf-lang could not parse ${p}`);
    const before = out.length;
    walk(parsed[1].rules, out);
    for (let k = before; k < out.length; k++) out[k].origin = p;
  }
  return out;
}

function leavesFromList(path) {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => {
      const m = /^\/(.*)\/([dgimsuvy]*)$/.exec(l);
      return m ? { source: m[1], flags: m[2], origin: path } : { source: l, flags: "", origin: path };
    });
}

// Argument groups: each --name opens a corpus; --bbnf / --list feed it.
const argv = process.argv.slice(2);
const corpora = [];
let resolveFrom = process.cwd();
let outPath = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--name") corpora.push({ name: argv[++i], bbnf: [], list: [] });
  else if (a === "--bbnf") corpora.at(-1).bbnf.push(argv[++i]);
  else if (a === "--list") corpora.at(-1).list.push(argv[++i]);
  else if (a === "--resolve-from") resolveFrom = argv[++i];
  else if (a === "--out") outPath = argv[++i];
  else throw new Error(`unknown argument ${a}`);
}

const header = ["corpus", "n", "pattern", "flags", "valid", "la_pos", "la_neg", "lb_pos", "lb_neg", "backref", "lazy", "lookaround"];
const rows = [header.join("\t")];
const summary = [];
for (const corpus of corpora) {
  const raw = [...leavesFromBbnf(corpus.bbnf, resolveFrom), ...corpus.list.flatMap(leavesFromList)];
  const seen = new Map();
  for (const l of raw) {
    const key = `/${l.source}/${l.flags}`;
    if (!seen.has(key)) seen.set(key, l);
  }
  const distinct = [...seen.values()].sort((x, y) => (x.source + "/" + x.flags < y.source + "/" + y.flags ? -1 : 1));
  const tally = { leaves: distinct.length, raw: raw.length, invalid: 0, lookaround: 0, la_pos: 0, la_neg: 0, lb_pos: 0, lb_neg: 0, backref: 0, lazy: 0 };
  distinct.forEach((l, n) => {
    let valid = true;
    try {
      new RegExp(l.source, l.flags);
    } catch {
      valid = false;
      tally.invalid++;
    }
    const c = classify(l.source, l.flags);
    const look = c.la_pos + c.la_neg + c.lb_pos + c.lb_neg > 0;
    if (look) tally.lookaround++;
    for (const k of ["la_pos", "la_neg", "lb_pos", "lb_neg", "backref", "lazy"]) if (c[k] > 0) tally[k]++;
    // The pattern column is the raw source; a TSV cell cannot hold a raw tab
    // or newline, and no leaf in either corpus has one.
    if (/[\t\n\r]/.test(l.source)) throw new Error(`leaf with a raw tab or newline: ${JSON.stringify(l.source)}`);
    rows.push([corpus.name, n + 1, l.source, l.flags, valid ? 1 : 0, c.la_pos, c.la_neg, c.lb_pos, c.lb_neg, c.backref, c.lazy, look ? 1 : 0].join("\t"));
  });
  summary.push({ corpus: corpus.name, ...tally });
}

const tsv = rows.join("\n") + "\n";
if (outPath) writeFileSync(outPath, tsv);
else process.stdout.write(tsv);
for (const s of summary) {
  process.stderr.write(
    `census ${s.corpus}: ${s.leaves} distinct leaves (${s.raw} raw), invalid ${s.invalid}, ` +
      `lookaround ${s.lookaround} (la+ ${s.la_pos}, la- ${s.la_neg}, lb+ ${s.lb_pos}, lb- ${s.lb_neg}), ` +
      `backref ${s.backref}, lazy ${s.lazy}\n`,
  );
}
