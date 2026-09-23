import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const worker = fileURLToPath(new URL("./worker.mjs", import.meta.url));
const rows = [];
for (const variant of ["cursor", "state"]) {
    for (let processIndex = 0; processIndex < 7; processIndex++) {
        const seed = 0x5eed0000 + processIndex * 0x9e37;
        const result = spawnSync(
            process.execPath,
            [worker, variant, String(seed)],
            {
                encoding: "utf8",
                env: process.env,
            },
        );
        if (result.status !== 0) {
            throw new Error(result.stderr || result.stdout);
        }
        rows.push(JSON.parse(result.stdout));
    }
}
const byVariant = Object.fromEntries(
    ["cursor", "state"].map(variant => {
        const variantRows = rows.filter(row => row.variant === variant);
        const ratios = variantRows.map(row => row.ratio);
        return [
            variant,
            {
                ratios,
                rawGreen: ratios.every(ratio => ratio >= 10),
                min: Math.min(...ratios),
                max: Math.max(...ratios),
            },
        ];
    }),
);
const output = {
    schema: "parse-that.p6-euw-clean-break-preflight.v1",
    control: {
        commit: "de36d57dccdd20068b8c11a78f6e83d42e7d681f",
        bundle: process.env.P6_M2_BUNDLE,
    },
    rows,
    byVariant,
    bootstrap: "WITHHELD_UNLESS_EVERY_RAW_RATIO_CLEARS_10X",
};
const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (process.env.P6_OUTPUT) writeFileSync(process.env.P6_OUTPUT, serialized);
process.stdout.write(serialized);
