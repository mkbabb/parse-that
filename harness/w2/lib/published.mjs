// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W2.g — THE THIRD DIFFERENTIAL CELL: the published `@mkbabb/value.js@4.0.0` `/css` subpath,
// VENDORED AND SHA-PINNED, exactly as W1's instruments consume it.
//
// The pin is asserted BEFORE the import, not after: an engine loaded and then checked has already
// been measured. `W2.md` §4's last paragraph is the rule — "the working tree's dist is NEVER the
// comparison subject (the dist-drift finding stands)" — so this module knows exactly one path and
// refuses to be pointed at another by anything but the declared env override, which is recorded in
// the substrate receipt when used.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { VALUE_JS_ROOT } from "./contract.mjs";

export const PUBLISHED_PIN = "8b5381305ea26236326f06a38559247b2089a5be7fa78abe43640d0556320c42";

export const PUBLISHED_CSS =
    process.env.PUBLISHED_CSS ||
    `${VALUE_JS_ROOT}/docs/tranches/V/megatranche/prototypes/css-parser/cand-o/vendor/value-js-4.0.0/dist/subpaths/css.js`;

/** The nine public parsers `r1-published-totality.mjs:34-36` names, in its order. */
export const PUBLISHED_FNS = [
    "parseCssColor", "parseCssScalar", "parseCssValue", "parseCssValues",
    "parseKeyframeSelector", "parseStylesheet", "parseTimingFunction",
    "parseAnimationTimeline", "parseAnimationRange",
];

export function publishedPin() {
    if (!existsSync(PUBLISHED_CSS)) {
        return { path: PUBLISHED_CSS, present: false, sha256: null, bytes: 0, matches: false };
    }
    const bytes = readFileSync(PUBLISHED_CSS);
    const digest = createHash("sha256").update(bytes).digest("hex");
    return {
        path: PUBLISHED_CSS,
        present: true,
        sha256: digest,
        bytes: statSync(PUBLISHED_CSS).size,
        matches: digest === PUBLISHED_PIN,
        overridden: Boolean(process.env.PUBLISHED_CSS),
    };
}

export async function loadPublished() {
    const pin = publishedPin();
    if (!pin.present) throw new Error(`HALT: the vendored 4.0.0 is ABSENT at ${PUBLISHED_CSS}`);
    if (!pin.matches) {
        throw new Error(
            `HALT: the vendored 4.0.0 does not match the pin — measured ${pin.sha256}, pinned ${PUBLISHED_PIN}. ` +
                "A third cell that is not the shipped bytes measures nothing anybody installs.",
        );
    }
    const mod = await import(pathToFileURL(PUBLISHED_CSS).href);
    return { mod, pin };
}

/** The production names of `ALGEBRA.md` §9 mapped to the incumbent's entries for the slice. */
export const PROD_TO_PUBLISHED = {
    "P:color": "parseCssColor",
    "P:timing-function": "parseTimingFunction",
    "P:stylesheet": "parseStylesheet",
};

/**
 * Run one input through the third cell and record the OBSERVATION, never a judgement: `ok`,
 * the diagnostics as the incumbent shapes them, or the throw. A throw is a datum here (R1 is the
 * incumbent's shipping crash) and never an exception the harness propagates.
 */
export function observe(mod, prod, src) {
    const fnName = PROD_TO_PUBLISHED[prod];
    const fn = mod[fnName];
    if (typeof fn !== "function") return { cell: "published-4.0.0", prod, threw: false, missing: fnName };
    try {
        const r = fn(src);
        return {
            cell: "published-4.0.0",
            prod,
            threw: false,
            ok: Boolean(r && r.ok),
            value: r && r.ok ? r.value : undefined,
            diagnostics: r && !r.ok ? r.diagnostics : [],
        };
    } catch (e) {
        return { cell: "published-4.0.0", prod, threw: true, message: String(e).split("\n")[0] };
    }
}
