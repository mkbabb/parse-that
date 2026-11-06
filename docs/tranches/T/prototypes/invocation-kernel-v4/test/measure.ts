import { createGrammar, parseFull } from "@parse-that/invocation-kernel-v4-prototype";

const grammar = createGrammar();
const count = 10_000;
const cells = Array.from({ length: count }, () => grammar.memo(grammar.literal("a")));
const parser = grammar.seal(grammar.choice(grammar.sequence(...cells), grammar.literal("z")));
const before = process.memoryUsage();
const started = process.hrtime.bigint();
const result = parseFull(parser, "a".repeat(count));
const elapsedNs = process.hrtime.bigint() - started;
const after = process.memoryUsage();
if (result.kind !== "success") throw new Error(JSON.stringify(result));
process.stdout.write(`${JSON.stringify({
    inputCodeUnits: count,
    elapsedNs: elapsedNs.toString(),
    heapDeltaBytes: after.heapUsed - before.heapUsed,
    journalHighWater: result.debug.journalHighWater,
    journalAfter: result.debug.census.journalEntries,
    continuationHighWater: result.debug.continuationHighWater,
    memoDoneCells: result.debug.census.memoDoneCells,
}, null, 2)}\n`);
