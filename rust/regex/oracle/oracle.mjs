#!/usr/bin/env node
// sk-v27 LW1.RX-1: the regex oracle driver.
//
// Runs `exec.js` over a corpus on two JavaScript engines, V8 (node) and
// JavaScriptCore, `--reps` times each. Every run is its own subprocess, and
// each one goes through the machine guard (`~/.claude/guard/guarded --light`)
// when the guard is present.
//
// Verdicts:
//   - SELF: every engine returns byte-identical results on every rep. A
//     self-disagreement is a harness defect and fails the run (exit 1).
//   - CROSS: per case, V8 against JSC. A disagreement is SPEC-AMBIGUITY, not
//     a failure: it is listed and that case carries no oracle answer.
//
// JSC comes from bun when bun is installed, otherwise from the system
// JavaScriptCore framework's `jsc` shell (same engine, no bun runtime).
//
// The driver is named oracle.mjs, not run.mjs: the guard classes any
// `run.mjs` as a browser run, and no browser is involved here.
//
// Usage: node oracle.mjs [--corpus smoke.json] [--reps 2] [--out <dir>]
// Writes <out>/<corpus>-receipt.json and <out>/<corpus>-answers.json.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function flag(name, fallback) {
  const i = process.argv.indexOf(name);
  return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

const corpusPath = resolve(flag("--corpus", join(here, "smoke.json")));
const reps = Number(flag("--reps", "2"));
const outDir = resolve(flag("--out", join(homedir(), ".dev-logs/bbnf-lockstep/rx/oracle")));
const execJs = join(here, "exec.js");
const guard = join(homedir(), ".claude/guard/guarded");
const JSC_FRAMEWORK = "/System/Library/Frameworks/JavaScriptCore.framework";
const systemJsc = join(JSC_FRAMEWORK, "Versions/Current/Helpers/jsc");

function which(cmd) {
  const r = spawnSync("/usr/bin/which", [cmd], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

function plistVersion() {
  const r = spawnSync(
    "/usr/bin/plutil",
    ["-extract", "CFBundleVersion", "raw", join(JSC_FRAMEWORK, "Resources/Info.plist")],
    { encoding: "utf8" },
  );
  return r.status === 0 ? r.stdout.trim() : null;
}

const bun = which("bun");
const engines = [
  { name: "v8", argv: [process.execPath, execJs, corpusPath], version: `node ${process.version} / v8 ${process.versions.v8}` },
  bun
    ? { name: "jsc", argv: [bun, execJs, corpusPath], version: `bun ${spawnSync(bun, ["--version"], { encoding: "utf8" }).stdout.trim()}` }
    : { name: "jsc", argv: [systemJsc, execJs, "--", corpusPath], version: `system JavaScriptCore.framework ${plistVersion()} (bun absent)` },
];

function runOnce(engine) {
  const argv = existsSync(guard) ? [guard, "--light", "--timeout", "5", "--", ...engine.argv] : engine.argv;
  const t0 = process.hrtime.bigint();
  const r = spawnSync(argv[0], argv.slice(1), { encoding: "utf8", maxBuffer: 64 << 20 });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  if (r.status !== 0) {
    return { ok: false, ms, error: `exit ${r.status}: ${(r.stderr || "").slice(0, 400)}` };
  }
  // The guard may print its own lines; the engine's document is the last JSON line.
  const line = r.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop();
  return { ok: true, ms, doc: JSON.parse(line) };
}

const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
const receipt = {
  unit: "LW1.RX-1",
  corpus: corpus.name,
  corpusPath,
  cases: corpus.cases.length,
  reps,
  guarded: existsSync(guard),
  startedAt: new Date().toISOString(),
  engines: {},
  self: {},
  crossAgree: 0,
  specAmbiguity: [],
};

const byEngine = {};
let selfOk = true;
for (const engine of engines) {
  const runs = [];
  for (let k = 0; k < reps; k++) runs.push(runOnce(engine));
  receipt.engines[engine.name] = { version: engine.version, ms: runs.map((r) => r.ms) };
  const failed = runs.find((r) => !r.ok);
  if (failed) {
    receipt.self[engine.name] = { consistent: false, error: failed.error };
    selfOk = false;
    continue;
  }
  const first = JSON.stringify(runs[0].doc.results);
  const consistent = runs.every((r) => JSON.stringify(r.doc.results) === first);
  receipt.self[engine.name] = { consistent };
  if (!consistent) selfOk = false;
  byEngine[engine.name] = runs[0].doc.results;
}

const answers = {};
if (byEngine.v8 && byEngine.jsc) {
  for (let i = 0; i < corpus.cases.length; i++) {
    const a = byEngine.v8[i];
    const b = byEngine.jsc[i];
    if (JSON.stringify(a) === JSON.stringify(b)) {
      receipt.crossAgree++;
      answers[a.id] = a;
    } else {
      receipt.specAmbiguity.push({ id: a.id, v8: a, jsc: b });
      answers[a.id] = { id: a.id, status: "SPEC-AMBIGUITY" };
    }
  }
}

receipt.verdict = selfOk && byEngine.v8 && byEngine.jsc ? "SELF-CONSISTENT" : "HARNESS-RED";
receipt.finishedAt = new Date().toISOString();
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `${corpus.name}-receipt.json`), JSON.stringify(receipt, null, 2) + "\n");
writeFileSync(join(outDir, `${corpus.name}-answers.json`), JSON.stringify(answers, null, 2) + "\n");
process.stdout.write(
  `oracle ${receipt.verdict}: ${receipt.cases} cases x ${reps} reps; ` +
    `self v8=${receipt.self.v8?.consistent} jsc=${receipt.self.jsc?.consistent}; ` +
    `cross agree ${receipt.crossAgree}/${receipt.cases}; spec-ambiguity ${receipt.specAmbiguity.length}\n` +
    `receipt ${join(outDir, `${corpus.name}-receipt.json`)}\n`,
);
process.exit(receipt.verdict === "SELF-CONSISTENT" ? 0 : 1);
