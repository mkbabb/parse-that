import { createGrammar, parseFull } from "../src/index.js";
const grammar = createGrammar();
const count = 10_000;
const cells = Array.from({ length: count }, () => grammar.memo(grammar.literal("a")));
const parser = grammar.seal(grammar.choice(grammar.sequence(...cells), grammar.literal("z")));
const before = process.memoryUsage();
const result = parseFull(parser, "a".repeat(count));
const after = process.memoryUsage();
if (result.kind !== "success")
    throw new Error(JSON.stringify(result));
process.stdout.write(`${JSON.stringify({
    inputCodeUnits: count,
    memoAddresses: count,
    journalHighWater: result.debug.journalHighWater,
    journalAfter: result.debug.journalLength,
    continuations: result.debug.continuationHighWater,
    liveTransactions: result.debug.liveTransactions,
    liveHeads: result.debug.liveHeads,
    transitionalCells: result.debug.transitionalMemoCells + result.debug.transitionalRuleCells,
    heapDeltaBytes: after.heapUsed - before.heapUsed,
}, null, 2)}\n`);
