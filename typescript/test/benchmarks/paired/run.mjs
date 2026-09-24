// Parser-core paired driver (X.P.W7 .p, gate P-5): candidate 2.x vs 0.8.2.
// node test/benchmarks/paired/run.mjs <candidate dist/parse.js> <baseline dist/parse.js> [reps=3] [rounds=11] [entries,comma,separated]
// One fresh process per cell; arm order alternates within a cell and is
// reversed between reps; os.loadavg() is recorded before and after every
// cell; a cell whose baseline passes spread >= 1.6x is set aside and re-run
// (never averaged in), and every set-aside cell is counted.
import { execFileSync } from "node:child_process";
import { loadavg } from "node:os";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { ENTRIES } from "./entries.mjs";

const [candPath, basePath, repsArg, roundsArg, only] = process.argv.slice(2);
const reps = Number(repsArg ?? 3), rounds = Number(roundsArg ?? 11);
const names = only ? only.split(",") : Object.keys(ENTRIES);
const cellPath = fileURLToPath(new URL("./cell.mjs", import.meta.url));
const load = () => loadavg().map((x) => x.toFixed(2)).join(" ");

const cells = [];
let setAside = 0;
for (let rep = 0; rep < reps; rep++) {
    const order = rep % 2;
    const ordered = rep % 2 === 0 ? names : [...names].reverse();
    for (const entry of ordered) {
        for (let attempt = 0; attempt < 4; attempt++) {
            const before = load();
            const out = execFileSync(process.execPath,
                ["--expose-gc", cellPath, entry, resolve(candPath), resolve(basePath), String(rounds), String(order)],
                { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 26 });
            const cell = { rep, order, ...JSON.parse(out.trim().split("\n").pop()), loadBefore: before, loadAfter: load() };
            if (cell.baseSpread >= 1.6) { setAside++; cell.setAside = true; cells.push(cell); continue; }
            cells.push(cell);
            break;
        }
    }
}
const kept = cells.filter((c) => !c.setAside);
const summary = {};
for (const entry of names) {
    const rs = kept.filter((c) => c.entry === entry).map((c) => c.ratio).sort((a, b) => a - b);
    summary[entry] = { cells: rs.length, worst: rs[rs.length - 1], median: rs[rs.length >> 1],
        allAtOrBelow1: rs.every((x) => x <= 1.0), mismatches: kept.filter((c) => c.entry === entry).reduce((a, c) => a + c.mismatches, 0) };
}
console.log(JSON.stringify({ node: process.version, reps, rounds, setAside, summary, cells }, null, 1));
