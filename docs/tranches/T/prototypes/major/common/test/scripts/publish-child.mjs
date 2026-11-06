import { readFile } from "node:fs/promises";
import { publishBundleMembers, testing } from "../../scripts/pin.mjs";

const [bundle, stopAfter, receiptPath, runPath] = process.argv.slice(2);
if (!bundle || !["receipt", "run"].includes(stopAfter) || !receiptPath || !runPath) {
  throw new Error("usage: publish-child <bundle> <receipt|run> <receipt> <run>");
}

const [receiptBytes, runBytes, inputs] = await Promise.all([
  readFile(receiptPath),
  readFile(runPath),
  testing.loadInputs("pt0-parse-only"),
]);

await publishBundleMembers(bundle, receiptBytes, runBytes, inputs, {
  async onPublished(member) {
    if (member !== stopAfter) return;
    process.stdout.write(`PUBLISHED ${member}\n`);
    await new Promise(() => setInterval(() => {}, 1_000));
  },
});
