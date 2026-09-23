// SERVED MODEL: claude-opus-5[1m]
/**
 * X.P.W3.m — THE ANCHOR PROBE'S CANDIDATE-SIDE FORM (`--at <css surface>`).
 *
 * `COHESION.md` §0v rules the third OP-2 artefact by name: `r1-anchor-after.txt` is banked "over the
 * CANDIDATE's nine entries (the anchor probe pointed at the candidate adapter — an
 * `--at typescript/src/css` form — never at value.js's own root, which measures the incumbent: A-1)".
 *
 * The value.js probe `docs/tranches/V/megatranche/audit/probes/r1-published-totality.mjs` is
 * `execute, no write` (`W3.md` §4; R-E) and **modifying it voids G-2**. So the `--at` form is a NEW
 * program on the candidate side, and it does not re-type the probe's corpus: it READS the probe's
 * own source and lifts `FNS`, `NAMES`, `BODIES` and the ten seed strings out of it, so the two
 * readings are over the SAME 172 inputs by construction. If the probe's corpus ever moves, this
 * program HALTS rather than reporting a comparison that is no longer one.
 *
 *   node typescript/scripts/r1-anchor-candidate.mjs --at typescript/src/css [--probe <path>]
 *
 * It measures BOTH lowerings, because the candidate's totality claim is a dual-target claim
 * (`W3.md` §6 G-5) and a JS-only reading would leave half the shipped surface unwitnessed.
 *
 * Exit code is the assertion, as in the probe: zero throws and zero `undefined` returns → 0.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const P2_ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..", "..");
const VALUE_JS_ROOT = "/Users/mkbabb/Programming/value.js";
const PROBE = path.join(
    VALUE_JS_ROOT,
    "docs/tranches/V/megatranche/audit/probes/r1-published-totality.mjs",
);

const opt = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
    const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : fallback;
};

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/**
 * Lift one array literal out of the probe's source. The probe writes plain double-quoted string
 * arrays with no trailing commas, so the literal IS JSON; parsing it rather than eval'ing it keeps
 * this program from executing a byte of a file it is forbidden to modify.
 */
const lift = (src, prefix, what) => {
    const m = new RegExp(`${prefix}\\s*(\\[[\\s\\S]*?\\])\\s*[;)]`).exec(src);
    if (!m) throw new Error(`anchor-candidate: the probe no longer declares ${what} — HALT (the two readings would not be over one corpus)`);
    return JSON.parse(m[1]);
};

const main = async () => {
    const at = opt("at", "typescript/src/css");
    const probePath = opt("probe", PROBE);
    const probeSrc = readFileSync(probePath, "utf8");

    const FNS = lift(probeSrc, "const FNS\\s*=", "FNS");
    const NAMES = lift(probeSrc, "const NAMES\\s*=", "NAMES");
    const BODIES = lift(probeSrc, "const BODIES\\s*=", "BODIES");
    const SEED = lift(probeSrc, "const corpus = new Set\\(", "the seed corpus");

    const corpus = new Set(SEED);
    for (const n of NAMES) for (const b of BODIES) corpus.add(n + b);

    // `--at` names the candidate's css surface relative to the fresh root (`typescript/src/css`),
    // never relative to value.js — A-1 is exactly the confusion this argument exists to prevent.
    const entryPath = path.join(path.isAbsolute(at) ? at : path.join(P2_ROOT, at), "entry.mjs");
    const entry = await import(pathToFileURL(entryPath).href);
    const surfaces = await entry.loadPublicSurfaces();

    const rule = (n = 80) => "─".repeat(n);
    console.log(`X.P.W3.m — R1 ANCHOR, CANDIDATE SIDE (--at ${at})\n${rule()}`);
    console.log(`probe      ${path.relative(VALUE_JS_ROOT, probePath)} — sha256 ${sha256(probeSrc)}`);
    console.log(`           corpus LIFTED from it: ${FNS.length} entries × ${corpus.size} inputs = ${FNS.length * corpus.size} calls per lowering`);
    console.log(`candidate  ${path.relative(P2_ROOT, entryPath)} — sha256 ${sha256(readFileSync(entryPath, "utf8"))}`);
    console.log(`unrealized ${entry.UNREALIZED_ENTRIES.length === 0 ? "NONE — all nine frozen parsers are published" : entry.UNREALIZED_ENTRIES.join(", ")}`);

    let failed = 0;
    const report = {};
    for (const [lowering, surface] of Object.entries(surfaces)) {
        console.log(`\n${lowering} lowering\n${rule()}`);
        const crashes = [];
        const undefineds = [];
        let calls = 0;
        for (const fn of FNS) {
            const f = surface[fn];
            if (typeof f !== "function") {
                console.log(`SKIP ${fn.padEnd(24)} — not exported`);
                continue;
            }
            let n = 0;
            let u = 0;
            for (const input of corpus) {
                calls += 1;
                try {
                    const got = f(input);
                    if (got === undefined) {
                        u += 1;
                        undefineds.push({ fn, input });
                    }
                } catch (e) {
                    n += 1;
                    crashes.push({ fn, input, msg: String(e).split("\n")[0] });
                }
            }
            console.log(`${n || u ? "RED " : "ok  "} ${fn.padEnd(24)} ${String(n).padStart(4)}/${corpus.size} throw${u ? ` · ${u} undefined` : ""}`);
        }
        const modes = [...new Set(crashes.map((c) => c.msg))];
        console.log(`\nTOTAL ${crashes.length} throws / ${calls} calls`);
        console.log(`DISTINCT FAILURE MODES: ${modes.length}`);
        for (const m of modes) console.log(`  ${crashes.filter((c) => c.msg === m).length}x  ${m}`);
        console.log(`UNDEFINED RETURNS: ${undefineds.length}`);
        report[lowering] = { calls, throws: crashes.length, undefined: undefineds.length, modes };
        if (crashes.length > 0 || undefineds.length > 0) failed = 1;
    }

    console.log(`\n${rule()}`);
    for (const [lowering, r] of Object.entries(report)) {
        console.log(`${lowering.padEnd(5)} ${r.throws} throws · ${r.undefined} undefined / ${r.calls} calls`);
    }
    console.log(
        failed
            ? "\nRED — a ParseResult-returning parser must not throw and must not return undefined."
            : "\nGREEN — every public parser of the candidate surface is total, in BOTH lowerings.",
    );
    return failed;
};

process.exit(await main());
