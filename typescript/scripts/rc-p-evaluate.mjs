// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W4.c — G-5: THE RC-P EVALUATOR.
//
//   node scripts/rc-p-evaluate.mjs --version <V> [--value-repo <path>] [--pin <sha>] [--out <path.json>]
//
// `W4.md` §6a states the predicate this program computes, verbatim:
//
//   "RC-P(V) is TRUE if and only if all six conjuncts below evaluate TRUE for the same version V of
//    @mkbabb/value.js. KF.W3 opens if and only if RC-P(V) is TRUE, evaluated by running the six
//    commands against the registry coordinate V — never by reading a status word in any document,
//    including this one."
//
// §6 G-5's falsifier is the whole design brief:
//
//   "an evaluator that returns TRUE with any conjunct unmeasured fails; so does one that reads a
//    document's status word for any conjunct other than 5 (BAR-DISCHARGED, which is a ruling and can
//    only be read) and 6's mail leg. A conjunct implemented as 'a previous run said so' fails — each
//    command runs against the registry coordinate at evaluation time, because a release condition
//    that trusts a cached verdict is a schedule."
//
// FOUR PROPERTIES THIS FILE HOLDS, STATED SO THEY CAN BE CHECKED BY READING IT:
//
//   1. NO VERSION LITERAL. `--version` is REQUIRED and has no default. §3's prohibition: "No version
//      literal in RC-P — the predicate quantifies over V, because a predicate that names 4.1.0 is a
//      schedule wearing a gate's clothes." grep this file for a semver literal and you find none.
//
//   2. NEVER SHORT-CIRCUITS. All six conjuncts are attempted on every run, in order, and each one
//      carries TWO separate fields: `measured` (did this conjunct's own commands run in THIS process)
//      and `value` (did they pass). `value: true` requires `measured: true` — mechanically, at the
//      one assignment site, not by convention. A conjunct whose subject does not exist is
//      `measured: false, value: false` with the failing command and its exit code recorded; it is
//      never absent, and it is never inherited.
//
//   3. NO CACHE IS READ AS A VERDICT. Conjunct 2 does not read `r1-anchor-after.txt`; it runs the
//      probe. Conjunct 3 does not read `equivalence-full-surface.json`; it runs the harness. Conjunct
//      1 does not read a prior `packed-surface.json`; it packs from the registry and verifies. The
//      only document reads are conjunct 5 (a RULING — §6a's own exception) and conjunct 6's mail leg
//      (§6 G-5's other named exception), and both are marked `documentRead: true` in the output.
//
//   4. NO NARROWING. Conjunct 3 runs the differential with NO `--limit`: a limit truncates the
//      corpus, and a gate satisfied by a truncated denominator is the masking construct §3a forbids.
//
// THE REGISTRY-IDENTITY BRIDGE (conjuncts 1, 2, 4). §6a binds every conjunct to "the registry
// coordinate V", and conjunct 2's command is the probe "(unmodified)". The probe resolves its own
// repository six directories above itself and packs THAT — so pointed at a working tree it measures
// the working tree, which is not V. Rather than modify the probe (forbidden) or trust the tree
// (dishonest), this evaluator proves the tarball it hands the probe IS the registry tarball:
//
//     shasum -a 1 <npm pack @mkbabb/value.js@V>  ===  npm view @mkbabb/value.js@V dist.shasum
//
// `dist.shasum` is the registry's own sha1 over the published tarball, so equality is byte identity.
// The tarball is then unpacked into a scratch mirror and the probe is SYMLINKED — not copied, not
// edited — at exactly its six-deep path inside that mirror, so `import.meta.url`'s six-level walk
// lands on V's own package root. The probe's sha256 is recorded on every run, so "unmodified" is a
// measurement and not a promise. This is COHESION §0p's scratch-mirror idiom, applied to a probe
// instead of a harvester.
//
// WHAT THIS PROGRAM DOES NOT DO. It does not write, move or delete one byte of either repository; its
// only write is the optional `--out` JSON. It asserts no bench bar of any kind (OC-1 is ruled
// RECORDED-NOT-GATING at COHESION §0j.E and conjunct 5 reads that ruling, which is all §6a permits).
// It stamps no verb. It opens nothing.

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
    existsSync,
    mkdtempSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    symlinkSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** `<p2>` — the fresh writer root (`W4.md` §4b). */
const P2_ROOT = path.resolve(HERE, "..", "..");

const PACKAGE = "@mkbabb/value.js";

/** The probe conjunct 2 runs, UNMODIFIED, at its own repo-relative path (`W4.md` §4, execute-no-write). */
const PROBE_REL = "docs/tranches/V/megatranche/audit/probes/r1-published-totality.mjs";

const arg = (name, fallback = null) => {
    const i = process.argv.indexOf(`--${name}`);
    if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
    const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : fallback;
};

const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

/** Run a command, capture everything, never throw. The returned record IS the measurement. */
const run = (cmd, args, opts = {}) => {
    const started = Date.now();
    const r = spawnSync(cmd, args, {
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        timeout: opts.timeout ?? 15 * 60 * 1000,
        cwd: opts.cwd,
        env: opts.env ?? process.env,
    });
    const stdout = r.stdout ?? "";
    const stderr = r.stderr ?? "";
    return {
        cmd: [cmd, ...args].join(" "),
        cwd: opts.cwd ?? process.cwd(),
        exit: r.status === null ? -1 : r.status,
        signal: r.signal ?? null,
        error: r.error ? String(r.error.message ?? r.error) : null,
        ms: Date.now() - started,
        stdoutTail: stdout.split("\n").filter(Boolean).slice(-12).join("\n"),
        stderrTail: stderr.split("\n").filter(Boolean).slice(-6).join("\n"),
        stdout,
    };
};

/** Strip the raw stdout before banking: the tail is the evidence, the full stream is the workspace. */
const bankable = (c) => {
    const { stdout, ...rest } = c;
    return rest;
};

const findByExtension = (root, extension) => {
    const hits = [];
    const walk = (dir) => {
        let entries;
        try {
            entries = readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isSymbolicLink()) continue;
            if (e.isDirectory()) walk(full);
            else if (e.isFile() && e.name.endsWith(extension)) hits.push(full);
        }
    };
    walk(root);
    return hits.sort();
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────

const main = async () => {
    const version = arg("version");
    if (!version) {
        console.error(
            "rc-p-evaluate: --version <V> is REQUIRED.\n" +
                "RC-P quantifies over V; a default version would make this a schedule rather than a\n" +
                "predicate (`W4.md` §3: \"a predicate that names a version literal is a schedule wearing\n" +
                "a gate's clothes\").",
        );
        return 2;
    }

    const valueRepo = path.resolve(arg("value-repo") ?? path.resolve(P2_ROOT, "..", "value.js"));
    const fourierRepo = path.resolve(arg("fourier-repo") ?? path.resolve(valueRepo, "..", "fourier-analysis"));
    const pin = arg("pin") ?? "6aca8602"; // X.P.W3's pinned value.js commit — the universe's coordinate, not a version
    const workspace = mkdtempSync(path.join(tmpdir(), "rc-p-"));

    const conjuncts = [];
    /** The ONE assignment site. `value` cannot be true unless `measured` is true. */
    const record = (n, name, { measured, pass, reason, commands, notes, documentRead = false, extra = {} }) => {
        const c = {
            n,
            name,
            measured: Boolean(measured),
            value: Boolean(measured) && Boolean(pass),
            documentRead,
            reason: reason ?? null,
            commands: (commands ?? []).map(bankable),
            notes: notes ?? [],
            ...extra,
        };
        conjuncts.push(c);
        return c;
    };

    try {
        // ── 1 · PUBLISHED(V) ──────────────────────────────────────────────────────────────────────
        // §6a: `npm view <pkg>@<V> dist.shasum` then `npm pack <pkg>@<V>` then
        // `node scripts/ci/verify-packed-surface.mjs <tarball>`.
        // TRUE when: "the coordinate resolves at the registry AND the packed /css subpath resolves all
        // 52 frozen symbols from the installed bytes; exit 0".
        const c1cmds = [];
        let registryTarball = null;
        let registryShasum = null;

        const view = run("npm", ["view", `${PACKAGE}@${version}`, "dist.shasum"]);
        c1cmds.push(view);
        registryShasum = view.exit === 0 ? view.stdout.trim().split("\n").pop().trim() : null;

        let identity = null;
        if (registryShasum) {
            const packDir = path.join(workspace, "pack");
            mkdirSync(packDir, { recursive: true });
            const pack = run("npm", [
                "pack",
                `${PACKAGE}@${version}`,
                "--silent",
                "--pack-destination",
                packDir,
            ]);
            c1cmds.push(pack);
            if (pack.exit === 0) {
                const name = pack.stdout.trim().split("\n").pop().trim();
                const candidate = path.join(packDir, name);
                if (existsSync(candidate)) {
                    const sha1 = createHash("sha1").update(readFileSync(candidate)).digest("hex");
                    identity = { tarball: candidate, sha1, registryShasum, identical: sha1 === registryShasum };
                    if (identity.identical) registryTarball = candidate;
                }
            }
        }

        let verify = null;
        if (registryTarball) {
            verify = run("node", [path.join(valueRepo, "scripts/ci/verify-packed-surface.mjs"), registryTarball], {
                cwd: valueRepo,
            });
            c1cmds.push(verify);
        }

        record(1, "PUBLISHED(V)", {
            measured: view.exit === 0 && identity !== null && verify !== null,
            pass: view.exit === 0 && identity?.identical === true && verify?.exit === 0,
            reason:
                view.exit !== 0
                    ? `the coordinate ${PACKAGE}@${version} does not resolve at the registry (npm view exit ${view.exit})`
                    : !identity
                      ? `npm pack ${PACKAGE}@${version} produced no tarball`
                      : !identity.identical
                        ? `the packed tarball's sha1 ${identity.sha1} is not the registry's dist.shasum ${identity.registryShasum} — the bytes under test are not V's published bytes`
                        : verify.exit !== 0
                          ? `verify-packed-surface.mjs exited ${verify.exit} against V's registry tarball — the packed surface does not resolve`
                          : null,
            commands: c1cmds,
            extra: { registryIdentity: identity },
        });

        // ── 2 · TOTALITY(V) ───────────────────────────────────────────────────────────────────────
        // §6a: the probe, UNMODIFIED, against V's registry tarball. TRUE when exit 0 — 0 throws.
        const c2cmds = [];
        const probeSource = path.join(valueRepo, PROBE_REL);
        let probeDigest = null;
        let mirrorRoot = null;

        if (registryTarball && existsSync(probeSource)) {
            probeDigest = sha256(probeSource);
            mirrorRoot = path.join(workspace, "mirror");
            mkdirSync(mirrorRoot, { recursive: true });
            const untar = run("tar", ["-xzf", registryTarball, "-C", mirrorRoot]);
            c2cmds.push(untar);
            if (untar.exit === 0) {
                const pkgRoot = path.join(mirrorRoot, "package");
                mkdirSync(path.join(pkgRoot, path.dirname(PROBE_REL)), { recursive: true });
                symlinkSync(probeSource, path.join(pkgRoot, PROBE_REL));
                c2cmds.push(run("node", [PROBE_REL], { cwd: pkgRoot }));
            }
        }

        const probeRun = c2cmds[c2cmds.length - 1];
        const probeRan = Boolean(mirrorRoot) && probeRun?.cmd?.endsWith(PROBE_REL);
        record(2, "TOTALITY(V)", {
            measured: probeRan,
            pass: probeRan && probeRun.exit === 0 && /TOTAL 0 throws/.test(probeRun.stdout),
            reason: !registryTarball
                ? "no registry-identical tarball for V — conjunct 1 did not produce one, so the probe has no subject"
                : !probeRan
                  ? "the scratch mirror could not be built; the probe was not run"
                  : probeRun.exit !== 0
                    ? `the probe exited ${probeRun.exit} against V's registry bytes — totality is violated`
                    : null,
            commands: c2cmds,
            extra: {
                probe: { path: PROBE_REL, sha256: probeDigest, modified: false, mechanism: "symlinked into a scratch mirror of V's unpacked registry tarball" },
            },
        });

        // ── 3 · EQUIVALENCE(V) ────────────────────────────────────────────────────────────────────
        // §6a: X.P.W3's full-surface differential harness, V vs the sha-pinned 4.0.0 tarball.
        // TRUE when 0 MIRROR-DEFECTs and every difference is rowed with a non-empty consumer
        // direction — which is exactly the harness's own exit code (it "EXITS NON-ZERO while any
        // mirror-defect stands or any adjudicated conflict is unrowed").
        const harness = path.join(P2_ROOT, "typescript/test/css-equivalence/run-full-surface.mjs");
        const c3cmds = [];
        let mirrorDefects = null;
        if (existsSync(harness)) {
            const r = run("node", [harness, "--pinned-value-commit", pin], {
                cwd: path.join(P2_ROOT, "typescript"),
            });
            c3cmds.push(r);
            const m = /MIRROR-DEFECTS\s+(\d+)/.exec(r.stdout);
            if (m) mirrorDefects = Number(m[1]);
        }
        const c3run = c3cmds[0] ?? null;
        record(3, "EQUIVALENCE(V)", {
            measured: c3run !== null,
            pass: c3run?.exit === 0 && mirrorDefects === 0,
            reason: !c3run
                ? `the full-surface harness is absent at ${harness}`
                : c3run.exit !== 0
                  ? `the harness exited ${c3run.exit} with ${mirrorDefects ?? "an unparsed number of"} mirror-defects`
                  : null,
            commands: c3cmds,
            extra: {
                mirrorDefects,
                instrumentNote:
                    "DECLARED, and it does not soften this reading: the harness's subject side is the CANDIDATE's " +
                    "`<p2>/typescript/src/css/**` lowering read at pin " + pin + ", not V's packed bytes. The two " +
                    "coincide only once an adoption wave lands the candidate in V (OP-4/G-9). Until then a GREEN " +
                    "here would prove equivalence of the candidate, not of V, and whether that suffices for " +
                    "conjunct 3 is an OWNER RULING this evaluator does not presume. Recorded, never inferred.",
            },
        });

        // ── 4 · ADMITTED(V) ───────────────────────────────────────────────────────────────────────
        // §6a: `node scripts/wasm-admission.mjs <artifact>` — 0 function-kind imports, empty-import
        // instantiation succeeds, full import list printed and accounted. The artifact is V's.
        const admission = path.join(P2_ROOT, "typescript/scripts/wasm-admission.mjs");
        const c4cmds = [];
        let artifacts = [];
        let installRoot = null;
        if (registryTarball) {
            const consumer = path.join(workspace, "consumer");
            mkdirSync(consumer, { recursive: true });
            writeFileSync(path.join(consumer, "package.json"), '{"name":"rc-p-consumer","type":"module","private":true}\n');
            const install = run("npm", ["i", "--silent", "--no-audit", "--no-fund", registryTarball], { cwd: consumer });
            c4cmds.push(install);
            installRoot = path.join(consumer, "node_modules", PACKAGE);
            if (install.exit === 0 && existsSync(installRoot)) artifacts = findByExtension(installRoot, ".wasm");
        }
        if (artifacts.length && existsSync(admission)) {
            c4cmds.push(run("node", [admission, ...artifacts], { cwd: path.join(P2_ROOT, "typescript") }));
        }
        const admissionRun = artifacts.length ? c4cmds[c4cmds.length - 1] : null;
        record(4, "ADMITTED(V)", {
            measured: artifacts.length > 0 && admissionRun !== null,
            pass: artifacts.length > 0 && admissionRun?.exit === 0,
            reason: !registryTarball
                ? "no registry-identical tarball for V — there is nothing installed to inspect"
                : artifacts.length === 0
                  ? `V's installed bytes contain zero .wasm artifacts, so the admission has no subject — FALSE, not vacuously true`
                  : admissionRun.exit !== 0
                    ? `wasm-admission.mjs exited ${admissionRun.exit} over ${artifacts.length} artifact(s) of V`
                    : null,
            commands: c4cmds,
            extra: {
                artifactsInV: artifacts.map((a) => path.relative(installRoot ?? "/", a)),
                openQuestion:
                    "Whether a release that ships NO Wasm target satisfies ADMITTED vacuously is UNRULED. This " +
                    "evaluator reads it FALSE — a conjunct with no subject is not a conjunct that passed — and " +
                    "routes the question to the owner rather than resolving it silently in either direction.",
            },
        });

        // ── 5 · BAR-DISCHARGED ────────────────────────────────────────────────────────────────────
        // §6a: "read the dated OC-1 ruling". THE ONE CONJUNCT §6 G-5 PERMITS TO BE A DOCUMENT READ —
        // "BAR-DISCHARGED, which is a ruling and can only be read".
        const cohesion = path.join(valueRepo, "docs/tranches/X/COHESION.md");
        const threeLeg = path.join(valueRepo, "docs/tranches/X/parse-that/evidence/W3/bench-three-leg.md");
        const c5cmds = [];
        let rulingLine = null;
        if (existsSync(cohesion)) {
            const g = run("grep", ["-n", "OC-1 (OP-3)", cohesion]);
            c5cmds.push(g);
            if (g.exit === 0) rulingLine = g.stdout.trim().split("\n")[0];
        }
        const tableRecorded = existsSync(threeLeg) && statSync(threeLeg).size > 0;
        c5cmds.push(run("ls", ["-l", threeLeg]));
        record(5, "BAR-DISCHARGED", {
            measured: c5cmds.length > 0,
            pass: Boolean(rulingLine) && tableRecorded,
            documentRead: true,
            reason: !rulingLine
                ? "no dated OC-1 ruling found in COHESION.md — an unruled bar is neither a veto nor a standard, and this conjunct stays FALSE until the owner rules either shape"
                : !tableRecorded
                  ? "the OC-1 ruling conditions conjunct 5 on the three-leg table being recorded at X.P.W3; that file is absent or empty"
                  : null,
            commands: c5cmds,
            extra: { ruling: rulingLine, threeLegTable: tableRecorded ? threeLeg : null },
        });

        // ── 6 · ROUTED(V) ─────────────────────────────────────────────────────────────────────────
        // §6a: the packet exists at its in-repo path; its dated INBOX row names THAT path as the
        // delivery point and the SS-6 batch; and the direct parse-that → fourier edge is absent.
        const packet = path.join(valueRepo, "docs/tranches/X/parse-that/RELEASE-PACKET.md");
        const inbox = path.join(valueRepo, "docs/tranches/V/coordination/INBOX.md");
        const c6cmds = [];
        const packetExists = existsSync(packet);
        c6cmds.push(run("ls", [packet]));

        let rowRcp = false;
        let rowPath = false;
        let rowBatch = false;
        if (existsSync(inbox)) {
            const g1 = run("grep", ["-n", "RC-P", inbox]);
            const g2 = run("grep", ["-n", "RELEASE-PACKET", inbox]);
            const g3 = run("grep", ["-n", "SS-6", inbox]);
            c6cmds.push(g1, g2, g3);
            rowRcp = g1.exit === 0;
            rowPath = g2.exit === 0;
            rowBatch = g3.exit === 0;
        }

        const fm = path.join(fourierRepo, "package.json");
        const fw = path.join(fourierRepo, "web/package.json");
        const e1 = run("grep", ["-c", "parse-that", fm]);
        const e2 = run("grep", ["-c", "parse-that", fw]);
        c6cmds.push(e1, e2);
        const edgeAbsent = Number(e1.stdout.trim() || "0") === 0 && Number(e2.stdout.trim() || "0") === 0;

        record(6, "ROUTED(V)", {
            measured: true,
            pass: packetExists && rowRcp && rowPath && rowBatch && edgeAbsent,
            documentRead: true,
            reason: !packetExists
                ? "RELEASE-PACKET.md does not exist at its in-repo path — the packet has no delivery point"
                : !(rowRcp && rowPath && rowBatch)
                  ? `the INBOX sent-row is incomplete — RC-P ${rowRcp ? "named" : "absent"} · in-repo path ${rowPath ? "named" : "absent"} · SS-6 batch ${rowBatch ? "named" : "absent"}`
                  : !edgeAbsent
                    ? "the FORBIDDEN direct parse-that → fourier edge is present in a fourier manifest"
                    : null,
            commands: c6cmds,
            extra: { packetExists, inboxRow: { rcp: rowRcp, inRepoPath: rowPath, ss6Batch: rowBatch }, forbiddenEdgeAbsent: edgeAbsent },
        });
    } finally {
        rmSync(workspace, { recursive: true, force: true });
    }

    // ── the six-row table ────────────────────────────────────────────────────────────────────────
    const verdict = conjuncts.every((c) => c.value);
    const falseOnes = conjuncts.filter((c) => !c.value);

    const bar = "─".repeat(100);
    console.log(`\nRC-P(${version}) — the release condition, six conjuncts, evaluated at ${new Date().toISOString()}`);
    console.log(`package ${PACKAGE} · value repo ${valueRepo} · <p2> ${P2_ROOT} · universe pin ${pin}`);
    console.log(bar);
    console.log(`${"#".padEnd(3)}${"conjunct".padEnd(18)}${"MEASURED".padEnd(10)}${"VALUE".padEnd(8)}reading`);
    console.log(bar);
    for (const c of conjuncts) {
        const reading = c.value ? "TRUE" : c.reason ?? "FALSE";
        console.log(
            `${String(c.n).padEnd(3)}${c.name.padEnd(18)}${(c.measured ? "yes" : "NO").padEnd(10)}${(c.value ? "TRUE" : "FALSE").padEnd(8)}${reading}`,
        );
    }
    console.log(bar);

    if (verdict) {
        console.log(`\nRC-P(${version}) = TRUE — all six conjuncts measured and TRUE. KF.W3 may open.`);
    } else {
        console.log(
            `\nRC-P(${version}) = FALSE — ${falseOnes.length} of 6 conjuncts are FALSE: ` +
                falseOnes.map((c) => `${c.n} ${c.name}`).join(" · "),
        );
        console.log("KF.W3 does NOT open. The X·V adoption wave's re-trigger does NOT fire.");
    }

    const out = arg("out");
    if (out) {
        const abs = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out);
        writeFileSync(
            abs,
            `${JSON.stringify(
                {
                    predicate: "RC-P",
                    version,
                    evaluatedAt: new Date().toISOString(),
                    package: PACKAGE,
                    valueRepo,
                    p2Root: P2_ROOT,
                    universePin: pin,
                    verdict: verdict ? "TRUE" : "FALSE",
                    trueCount: conjuncts.filter((c) => c.value).length,
                    falseConjuncts: falseOnes.map((c) => c.n),
                    conjuncts,
                },
                null,
                2,
            )}\n`,
        );
        console.log(`\nwrote ${abs}`);
    }

    return verdict ? 0 : 1;
};

process.exit(await main());
