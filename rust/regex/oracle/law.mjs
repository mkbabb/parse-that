#!/usr/bin/env node
// sk-v27 LW2.RX-3, law 2: the source pattern and its printed form
// (`Hir::to_source`) give the same answer under V8 and under JavaScriptCore
// on every smoke input.
//
// Reads two answer files written by oracle.mjs (one per corpus) and compares
// them case by case. Each answer is already V8 and JSC agreeing; a case
// either one flags SPEC-AMBIGUITY is reported, never passed. Cases absent
// from the printed corpus (patterns the parser rejects) are counted.
//
// Usage: node law.mjs <source-answers.json> <printed-answers.json>
// Exit 0 when every printed case agrees with its source case, else 1.

import { readFileSync } from "node:fs";

const [sourcePath, printedPath] = process.argv.slice(2);
if (!sourcePath || !printedPath) {
  process.stderr.write("usage: node law.mjs <source-answers.json> <printed-answers.json>\n");
  process.exit(2);
}
const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const printed = JSON.parse(readFileSync(printedPath, "utf8"));

const disagree = [];
const ambiguous = [];
let agree = 0;
for (const [id, answer] of Object.entries(printed)) {
  const want = source[id];
  if (!want) {
    disagree.push({ id, reason: "no source answer" });
  } else if (want.status === "SPEC-AMBIGUITY" || answer.status === "SPEC-AMBIGUITY") {
    ambiguous.push(id);
  } else if (JSON.stringify(want) === JSON.stringify(answer)) {
    agree++;
  } else {
    disagree.push({ id, source: want, printed: answer });
  }
}
const absent = Object.keys(source).filter((id) => !(id in printed));

process.stdout.write(
  `rx3 law: ${Object.keys(printed).length} printed cases; agree ${agree}; ` +
    `disagree ${disagree.length}; spec-ambiguity ${ambiguous.length}; ` +
    `not printed (parser rejects) ${absent.length}: ${absent.join(" ")}\n`,
);
for (const d of disagree) process.stdout.write(`DISAGREE ${JSON.stringify(d)}\n`);
for (const id of ambiguous) process.stdout.write(`SPEC-AMBIGUITY ${id}\n`);
process.exit(disagree.length === 0 && ambiguous.length === 0 ? 0 : 1);
