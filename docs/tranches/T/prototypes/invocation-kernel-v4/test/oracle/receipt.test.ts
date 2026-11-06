import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { generateReceipt, type OracleReceipt } from "./adapter.js";

if (process.env.PT_V4_RECEIPT_CHILD === "1") {
    process.stdout.write(`${JSON.stringify(generateReceipt())}\n`);
} else {
    test("V4-R12 independent structural/control receipt is exact and stable in two fresh processes", () => {
        const file = fileURLToPath(import.meta.url);
        const run = (): OracleReceipt => JSON.parse(execFileSync(process.execPath, [file], {
            encoding: "utf8",
            env: { ...process.env, PT_V4_RECEIPT_CHILD: "1" },
            maxBuffer: 16 * 1024 * 1024,
        }));
        const first = run();
        const second = run();
        assert.deepEqual(first, second);
        assert.deepEqual(first.structural, { grammars: 13_025, inputs: 127, comparisons: 1_654_175 });
        assert.equal(first.generated.cases, 10_000);
        assert.equal(first.generated.discarded, 0);
        assert.equal(first.discrepancies, 0);
        assert.equal(first.exhaustion, 0);
        assert(Object.values(first.generated.categories).every(count => count > 0));
        assert(Object.values(first.control.categories).every(count => count > 0));
        for (const digest of [first.corpusSha256, first.oracleResultSha256, first.vmResultSha256]) {
            assert.match(digest, /^[0-9a-f]{64}$/);
        }
        assert.equal(first.vmResultSha256, first.oracleResultSha256);
    });
}
