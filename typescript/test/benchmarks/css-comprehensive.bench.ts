import { bench, describe } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { cssParser } from "../../src/parse/parsers/css.js";
import { ParserState } from "../../src/parse/state.js";
import postcss from "postcss";
import * as csstree from "css-tree";

const dataDir = path.resolve(__dirname, "../../../data/css");
const datasets: Record<string, string> = {};

for (const file of ["normalize.css", "bootstrap.css"]) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        datasets[file] = fs.readFileSync(filePath, "utf-8");
    }
}

for (const [name, data] of Object.entries(datasets)) {
    describe(`CSS: ${name} (${(data.length / 1024).toFixed(0)} KB)`, () => {
        bench("parse-that", () => {
            const state = new ParserState(data);
            cssParser.call(state);
        });

        bench("postcss (L1)", () => {
            postcss.parse(data);
        });

        bench("css-tree (L1-L2)", () => {
            csstree.parse(data);
        });
    });
}
