// SERVED MODEL: claude-opus-5-5
//
// X.P.W5.c — the WPT cases, READ from the vendored files rather than retyped.
//
// `wpt/` holds nine files of web-platform-tests `css/css-color/parsing/`, byte-for-byte at WPT commit
// `5a5b2b591b39c59d5bca77819db305474dcfd18a` (BSD-3-Clause, `wpt/LICENSE.md`); `WPT_FILES` pins
// each file's sha256 and `loadWptCases` refuses a drifted byte. Each file's inline <script> is
// executed with the harness functions it calls replaced by recorders, so every loop and template
// literal the file writes (`for (const colorSpace of [...])`) yields exactly the cases a browser
// runs — no case is chosen by this repository's author.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const WPT_COMMIT = "5a5b2b591b39c59d5bca77819db305474dcfd18a";

export const WPT_FILES = Object.freeze({
    "color-computed-color-mix-function.html": "1debdd503c4f993513d5bb69a06e0ec60b604689de5e14c4ab4e38ab68f6e9ac",
    "color-valid-color-mix-function.html": "c63d31ca4b0974eb4aa0df19b1ab1861cb684f8c8ddf8a23397b6db59a35fb4c",
    "color-invalid-color-mix-function.html": "d014f48789e8191e16ee422b368d857093687168d9aef93a6232144b0132912b",
    "color-valid.html": "55f5c21fd5075067a120e3162fc68dee1e6ccc8d74c4d6b65d07479f27e7a003",
    "color-invalid.html": "1d054297913aec9c6612ffb34b39577216ed484fd01e4b37deb2634ac0707baf",
    "color-valid-rgb.html": "564532655424b00493bf1d45ae0b8e6af4c4c5a949892916c7cd7b0dd3c834c0",
    "color-valid-hsl.html": "fa0c7b62ac048c22f3007ec2cb15c976b338e59bda7a9090b4ca7f0cfb1e8827",
    "color-invalid-rgb.html": "1552dc83ca7868ca92ce852d48202b77e407d17981a6f41032db42e3c640dc74",
    "color-invalid-hsl.html": "226a9cf581fb22d70b2d0b7e27de9330b5e9b8886c20a07a3af19da3d7d525b9",
});

/** The harness functions the nine files call, each recorded as `{ file, kind, input, expected }`. */
const RECORDERS = ["fuzzy_test_computed_color", "fuzzy_test_valid_color", "test_valid_value", "test_invalid_value", "test_computed_value"];

/**
 * Every case of one vendored file. `test_valid_value` / `test_invalid_value` take the PROPERTY
 * first (`"color"`); the two fuzzy colour helpers take the specified value first.
 */
export function loadWptCases(file) {
    const bytes = readFileSync(path.join(HERE, "wpt", file));
    const sha = createHash("sha256").update(bytes).digest("hex");
    if (sha !== WPT_FILES[file]) throw new Error(`HALT: wpt/${file} drifted from its pin (${sha})`);
    const scripts = [...bytes.toString("utf8").matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const cases = [];
    const record = (kind) => (...args) => {
        const [input, expected] = kind.startsWith("test_") ? [args[1], args[2]] : [args[0], args[1]];
        cases.push({ file, kind, input, expected });
    };
    for (const body of scripts) {
        // eslint-disable-next-line no-new-func -- the pinned WPT script, run against recorders only
        new Function(...RECORDERS, body)(...RECORDERS.map(record));
    }
    return cases;
}
