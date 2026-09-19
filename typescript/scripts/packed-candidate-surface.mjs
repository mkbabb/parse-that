// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W4.b — G-3: THE PACKED CANDIDATE, PROVEN FROM THE TARBALL.
//
//   node scripts/packed-candidate-surface.mjs --seam <SEAM-CONTRACT.md>
//        [--universe <universe-52.json>] [--package <dir>] [--subpath ./css] [--out <json>]
//
// The gate, from `docs/tranches/X/parse-that/waves/W4.md` §6 G-3 (L383-397):
//
//   "`npm pack --ignore-scripts` in the fresh root; install into a clean temp consumer; every
//    seam-contract symbol resolves FROM THE INSTALLED PATH; forbidden deep specifiers refuse."
//
//   Falsifier: "a symbol that resolves in the source tree and not in the tarball fails — which is
//   the entire reason the gate installs rather than imports. A `files` field that ships more than it
//   declares also fails; the consumer's `node_modules` is the denominator, not the repo."
//
// WHY INSTALL RATHER THAN IMPORT (L-12, cand-O's dist-drift finding, §5 X.P.W4.b): a repository's
// own build output is known to drift from what a registry ships, so a source-resolved import cannot
// witness what a consumer receives. Every reading below is taken inside a `mkdtemp` consumer whose
// `node_modules` holds the tarball and nothing else of this project. The script writes NOTHING into
// either repository except the `--out` report it is asked for; the workspace is removed in `finally`.
//
// FIVE LEGS, each measured, none inferred from another:
//
//   L1  PACK        `npm pack --ignore-scripts --json` in the package dir; the tarball is named,
//                   sized and sha256'd, and its complete entry list is recorded.
//   L2  DECLARATION every packed entry is checked against the manifest's own `files` field — the
//                   "ships more than it declares" falsifier, run as a set difference.
//   L3  INSTALL     a clean `mkdtemp` consumer, `npm install --ignore-scripts --package-lock=false`
//                   of the tarball alone, with its own npm cache. The INSTALLED manifest is re-read
//                   from `node_modules/<name>/package.json` — never the source manifest.
//   L4  RESOLVE     every seam symbol, by kind. Runtime names are read off a real dynamic `import()`
//                   of the seam subpath INSIDE the consumer. Type names are compiled against the
//                   INSTALLED `.d.ts` by a strict `tsc` consumer file — a name that type-checks in
//                   the source tree and not from `node_modules` fails here, which is the point.
//   L5  REFUSALS    the forbidden deep specifiers are imported and must throw
//                   `ERR_PACKAGE_PATH_NOT_EXPORTED`; a specifier that resolves fails the gate.
//
// §3a: "The packed-install loop specifically (G-3): a third failed install attempt is an environment
// or packaging fault to be diagnosed, never retried a fourth time." This script therefore makes
// EXACTLY ONE install attempt and reports its failure as data; the retry budget is the operator's,
// spent deliberately, never spent by a loop inside a program.

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PACKAGE = path.resolve(HERE, "..");

// The deep specifiers that must refuse. Each names a real internal shape of this candidate — the
// css source entry, its generated artifacts, the built library output, and the manifest itself — so
// a refusal is a statement about an export map and not about a missing file.
const FORBIDDEN_DEEP_SPECIFIERS = [
    "src/css/entry.mjs",
    "src/css/build/ac1.js",
    "src/css/build/ac1.d.ts",
    "dist/parse.js",
    "package.json",
];

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

/**
 * The two sources spell the same two kinds differently — `universe-52.json`'s rows carry `type`,
 * a contract table reads more naturally as `type` or `types`. Normalizing HERE, in one place, is
 * what keeps the denominator 52: read raw, the singular `type` matches neither branch and 33 rows
 * vanish silently, which is the denominator defect this gate exists to refuse in others.
 */
const normalizeKind = (raw) => {
    const kind = String(raw).trim().toLowerCase();
    if (kind === "runtime") return "runtime";
    if (kind === "type" || kind === "types") return "types";
    return null;
};

const parseArgv = (argv) => {
    const options = {
        seam: null,
        universe: null,
        package: DEFAULT_PACKAGE,
        subpath: "./css",
        out: null,
        label: null,
        // The compiler the TYPES half runs, named rather than discovered: the fresh root owns its
        // toolchain (COHESION §0l E-1) and a gate that silently picks up whatever `tsc` a PATH
        // offers has not measured what it claims.
        tsc: path.resolve(DEFAULT_PACKAGE, "..", "node_modules", "typescript", "bin", "tsc"),
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (!arg.startsWith("--")) throw new Error(`unexpected positional argument: ${arg}`);
        const key = arg.slice(2);
        if (!(key in options)) throw new Error(`unknown flag: ${arg}`);
        const value = argv[index + 1];
        if (value === undefined) throw new Error(`${arg} needs a value`);
        options[key] = (key === "package" || key === "tsc") ? path.resolve(value) : value;
        index += 1;
    }
    return options;
};

/**
 * THE SEAM'S SYMBOL UNIVERSE, and where it came from.
 *
 * The gate's own command names `SEAM-CONTRACT.md` (X.P.W4.a's file). When that document exists it
 * IS the source and nothing else is consulted. `--universe` names the artefact the contract is
 * itself generated from (X.P.W3's `universe-52.json`) and exists so the protocol can be executed
 * and measured while `.a` is still authoring in parallel — the two units are §4a-disjoint and the
 * spec runs them concurrently. Which source was read is RECORDED IN THE REPORT, with its sha256, so
 * no reader has to guess which document a resolution table was taken against.
 *
 * A `--seam` path that does not exist is an ERROR, never a silent fall-through: a gate that quietly
 * substitutes its input has stopped measuring what it names.
 */
const readSymbols = (options) => {
    if (options.seam) {
        if (!existsSync(options.seam)) {
            if (!options.universe) {
                throw new Error(
                    `--seam ${options.seam} does not exist and no --universe fallback was named`,
                );
            }
        } else {
            const text = readFileSync(options.seam, "utf8");
            // One row per frozen `/css` export: `| name | kind | signature | provider | … |`.
            const rows = [];
            for (const line of text.split("\n")) {
                if (!line.startsWith("|")) continue;
                const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
                if (cells.length < 2) continue;
                const name = cells[0].replace(/[`*]/g, "").trim();
                const kind = normalizeKind(cells[1].replace(/[`*]/g, ""));
                if (!/^[A-Za-z_$][\w$]*$/.test(name)) continue;
                if (kind === null) continue;
                rows.push({ name, kind });
            }
            if (rows.length === 0) {
                throw new Error(`--seam ${options.seam} yielded no name/kind rows`);
            }
            return {
                source: {
                    kind: "seam-contract",
                    path: path.resolve(options.seam),
                    sha256: sha256(readFileSync(options.seam)),
                },
                symbols: rows,
            };
        }
    }
    if (!options.universe) throw new Error("one of --seam or --universe is required");
    const bytes = readFileSync(options.universe);
    const universe = JSON.parse(bytes.toString("utf8"));
    const symbols = universe.rows.map((row) => {
        const kind = normalizeKind(row.kind);
        if (kind === null) throw new Error(`universe row ${row.name} carries an unknown kind: ${row.kind}`);
        return { name: row.name, kind };
    });
    return {
        source: {
            kind: "universe-52",
            path: path.resolve(options.universe),
            sha256: sha256(bytes),
            note:
                "X.P.W4.a's SEAM-CONTRACT.md was absent at this run; the 52 rows are read from the "
                + "artefact the contract is generated from (W4.md §3 item 1). Re-run with --seam "
                + "once the contract lands; the symbol set is the same 52 by construction.",
        },
        symbols,
    };
};

const run = (command, args, cwd, env = {}) => {
    const result = spawnSync(command, args, {
        cwd,
        encoding: "utf8",
        env: { ...process.env, ...env },
        stdio: ["ignore", "pipe", "pipe"],
    });
    return {
        status: result.status,
        stdout: (result.stdout ?? "").trim(),
        stderr: (result.stderr ?? "").trim(),
    };
};

/** Every file under `dir`, repository-relative, sorted — the installed denominator, listed. */
const walk = (dir, base = dir) => {
    const found = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) found.push(...walk(full, base));
        else found.push(path.relative(base, full));
    }
    return found.sort();
};

const options = parseArgv(process.argv.slice(2));
const { source: symbolSource, symbols } = readSymbols(options);
const runtimeNames = symbols.filter((s) => s.kind === "runtime").map((s) => s.name).sort();
const typeNames = symbols.filter((s) => s.kind === "types").map((s) => s.name).sort();

const manifest = JSON.parse(readFileSync(path.join(options.package, "package.json"), "utf8"));
const workspace = mkdtempSync(path.join(tmpdir(), "candidate-packed-"));
// macOS hands `mkdtemp` a `/var/...` symlink while node's own diagnostics print the `/private/var`
// realpath, so BOTH spellings have to be redacted or half the ephemeral paths survive the scrub.
// Longest first: `/var/…` is a proper suffix of `/private/var/…`, so redacting the short spelling
// first leaves a `/private` stump behind and the scrub reads as though it half-failed.
const workspaceSpellings = [...new Set([workspace, realpathSync(workspace)])]
    .sort((a, b) => b.length - a.length);

const report = {
    servedModel: "claude-opus-5[1m]",
    gate: "G-3",
    wave: "X.P.W4",
    unit: "X.P.W4.b",
    generatedAt: new Date().toISOString(),
    node: process.version,
    npm: run("npm", ["--version"], options.package).stdout,
    label: options.label,
    candidate: {
        packageDir: options.package,
        name: manifest.name,
        version: manifest.version,
        declaredFiles: manifest.files ?? null,
        declaredExports: manifest.exports ?? null,
        seamSubpath: options.subpath,
    },
    symbolSource,
    symbolCounts: { runtime: runtimeNames.length, types: typeNames.length, total: symbols.length },
    legs: {},
};

try {
    // ── L1 PACK ──────────────────────────────────────────────────────────────────────────────────
    const packDestination = path.join(workspace, "tarball");
    await mkdir(packDestination, { recursive: true });
    const packed = run(
        "npm",
        ["pack", "--ignore-scripts", "--json", "--pack-destination", packDestination],
        options.package,
        { NPM_CONFIG_CACHE: path.join(workspace, ".npm-cache") },
    );
    if (packed.status !== 0) throw new Error(`npm pack failed:\n${packed.stdout}\n${packed.stderr}`);
    const [packMeta] = JSON.parse(packed.stdout);
    const tarball = path.join(packDestination, packMeta.filename);
    const tarballBytes = readFileSync(tarball);
    report.legs.pack = {
        ok: true,
        command: "npm pack --ignore-scripts --json",
        filename: packMeta.filename,
        bytes: statSync(tarball).size,
        sha256: sha256(tarballBytes),
        npmShasum: packMeta.shasum,
        npmIntegrity: packMeta.integrity,
        entryCount: packMeta.entryCount,
        unpackedSize: packMeta.unpackedSize,
        entries: packMeta.files.map((file) => file.path).sort(),
    };

    // ── L2 DECLARATION — "a `files` field that ships more than it declares also fails" ────────────
    // npm always ships these regardless of `files`; everything else must be covered by a declared
    // pattern. The check is a set difference over the tarball's own entry list, not a re-glob.
    const ALWAYS_PACKED = /^(package\.json|readme(\.[^/]*)?|licen[cs]e(\.[^/]*)?|notice(\.[^/]*)?|changelog(\.[^/]*)?)$/i;
    const declared = (manifest.files ?? []).map((pattern) => pattern.replace(/^\.?\//, ""));
    const covers = (entry) =>
        ALWAYS_PACKED.test(entry)
        || declared.some((pattern) => entry === pattern || entry.startsWith(`${pattern}/`));
    const undeclared = report.legs.pack.entries.filter((entry) => !covers(entry));
    const declaredButAbsent = declared.filter(
        (pattern) => !report.legs.pack.entries.some(
            (entry) => entry === pattern || entry.startsWith(`${pattern}/`),
        ),
    );
    report.legs.declaration = {
        ok: undeclared.length === 0,
        declaredFiles: declared,
        undeclaredEntries: undeclared,
        declaredButAbsent,
        note:
            declaredButAbsent.length > 0
                ? "the manifest declares a path the tarball does not carry — the declaration names "
                  + "build output that was never built, so the consumer receives less than the "
                  + "manifest promises"
                : null,
    };

    // ── L3 INSTALL — one attempt, per §3a ────────────────────────────────────────────────────────
    writeFileSync(path.join(workspace, "package.json"), '{"type":"module","private":true}\n');
    const install = run(
        "npm",
        [
            "install", "--ignore-scripts", "--no-audit", "--no-fund",
            "--package-lock=false", tarball,
        ],
        workspace,
        { NPM_CONFIG_CACHE: path.join(workspace, ".npm-cache") },
    );
    const installedDir = path.join(workspace, "node_modules", manifest.name);
    report.legs.install = {
        ok: install.status === 0 && existsSync(installedDir),
        attempts: 1,
        command: "npm install --ignore-scripts --no-audit --no-fund --package-lock=false <tarball>",
        status: install.status,
        stderr: install.status === 0 ? null : install.stderr,
        installedFiles: existsSync(installedDir) ? walk(installedDir) : [],
        installedManifest: existsSync(path.join(installedDir, "package.json"))
            ? JSON.parse(readFileSync(path.join(installedDir, "package.json"), "utf8"))
            : null,
    };
    if (!report.legs.install.ok) throw new Error(`npm install of the tarball failed:\n${install.stderr}`);

    const installedExports = report.legs.install.installedManifest?.exports ?? null;
    const seamSpecifier = `${manifest.name}/${options.subpath.replace(/^\.\//, "")}`;
    const seamDeclared = Boolean(installedExports && options.subpath in installedExports);

    // ── L4 RESOLVE — runtime names from a real import, inside the consumer ────────────────────────
    const probe = path.join(workspace, "resolve-runtime.mjs");
    writeFileSync(probe, `
let names = null;
let error = null;
try {
    const module = await import(${JSON.stringify(seamSpecifier)});
    names = Object.keys(module).sort();
} catch (caught) {
    error = { code: caught?.code ?? null, message: String(caught?.message ?? caught) };
}
process.stdout.write(JSON.stringify({ names, error }) + "\\n");
`);
    const runtimeProbe = run(process.execPath, [probe], workspace);
    const runtimeResult = runtimeProbe.status === 0
        ? JSON.parse(runtimeProbe.stdout)
        : { names: null, error: { code: null, message: runtimeProbe.stderr } };
    const exportedNames = new Set(runtimeResult.names ?? []);
    const runtimeRows = runtimeNames.map((name) => ({
        name,
        kind: "runtime",
        resolved: exportedNames.has(name),
        reason: exportedNames.has(name)
            ? null
            : (runtimeResult.error?.code ?? runtimeResult.error?.message ?? "absent from the module's exports"),
    }));

    // ── L4 RESOLVE — type names against the INSTALLED `.d.ts`, compiled strictly ──────────────────
    // The value-side idiom's TYPES half, mirrored one repo upstream: a consumer file that imports
    // every frozen type by name from the installed specifier and is compiled with `strict` and
    // `skipLibCheck: false`. A declaration that resolves in the source tree and not from
    // `node_modules` — the shape `build/ac1.d.ts` has, since it re-exports through a relative path
    // that escapes the package root — fails HERE and nowhere earlier.
    const tsc = options.tsc;
    let typeRows;
    if (!seamDeclared) {
        const reason = `the installed export map declares no "${options.subpath}" subpath`;
        typeRows = typeNames.map((name) => ({ name, kind: "types", resolved: false, reason }));
        report.legs.types = { ok: false, ran: false, reason, tsc: existsSync(tsc) ? tsc : null };
    } else if (!existsSync(tsc)) {
        const reason = `tsc not found at ${tsc}; the type half could not be compiled`;
        typeRows = typeNames.map((name) => ({ name, kind: "types", resolved: false, reason }));
        report.legs.types = { ok: false, ran: false, reason, tsc: null };
    } else {
        writeFileSync(
            path.join(workspace, "consumer.ts"),
            `import type {\n${typeNames.map((name) => `    ${name},`).join("\n")}\n} from ${JSON.stringify(seamSpecifier)};\n`
            + typeNames.map((name) => `export type __check_${name} = ${name};`).join("\n")
            + "\n",
        );
        writeFileSync(path.join(workspace, "tsconfig.json"), JSON.stringify({
            compilerOptions: {
                module: "NodeNext",
                moduleResolution: "NodeNext",
                noEmit: true,
                skipLibCheck: false,
                strict: true,
                target: "ES2022",
            },
            files: ["consumer.ts"],
        }, null, 4));
        const compile = run(process.execPath, [tsc, "-p", path.join(workspace, "tsconfig.json")], workspace);
        const diagnostics = compile.status === 0 ? [] : compile.stdout.split("\n").filter(Boolean);
        const named = (name) => diagnostics.some((line) => line.includes(`'${name}'`) || line.includes(`"${name}"`));
        typeRows = typeNames.map((name) => ({
            name,
            kind: "types",
            resolved: compile.status === 0 ? true : !named(name) && diagnostics.length === 0,
            reason: compile.status === 0 ? null : (named(name) ? "named in a tsc diagnostic" : "the strict consumer compile failed"),
        }));
        report.legs.types = {
            ok: compile.status === 0,
            ran: true,
            tsc,
            status: compile.status,
            diagnostics: diagnostics.slice(0, 40),
        };
    }

    const rows = [...runtimeRows, ...typeRows].sort((a, b) => a.name.localeCompare(b.name));
    report.legs.resolve = {
        ok: rows.every((row) => row.resolved),
        seamSpecifier,
        seamSubpathDeclared: seamDeclared,
        installedExports,
        runtimeImport: runtimeResult.error
            ? { ok: false, ...runtimeResult.error }
            : { ok: true, exportedNames: runtimeResult.names },
        resolved: rows.filter((row) => row.resolved).length,
        unresolved: rows.filter((row) => !row.resolved).length,
        of: rows.length,
        rows,
    };

    // ── L5 REFUSALS ──────────────────────────────────────────────────────────────────────────────
    const refusalProbe = path.join(workspace, "refusals.mjs");
    writeFileSync(refusalProbe, `
const specifiers = ${JSON.stringify(FORBIDDEN_DEEP_SPECIFIERS.map((s) => `${manifest.name}/${s}`))};
const out = [];
for (const specifier of specifiers) {
    try {
        await import(specifier);
        out.push({ specifier, refused: false, code: null });
    } catch (error) {
        out.push({ specifier, refused: true, code: error?.code ?? null });
    }
}
process.stdout.write(JSON.stringify(out) + "\\n");
`);
    const refusals = run(process.execPath, [refusalProbe], workspace);
    const refusalRows = refusals.status === 0 ? JSON.parse(refusals.stdout) : [];
    report.legs.refusals = {
        ok: refusalRows.length === FORBIDDEN_DEEP_SPECIFIERS.length
            && refusalRows.every((row) => row.refused && row.code === "ERR_PACKAGE_PATH_NOT_EXPORTED"),
        rows: refusalRows,
        note:
            "a refusal carrying ERR_PACKAGE_PATH_NOT_EXPORTED is the export map refusing; any other "
            + "code is a missing file refusing, which is a weaker property and is recorded as such",
    };
} finally {
    // The consumer is a `mkdtemp` directory: its name is fresh on every run, so leaving it inside
    // the recorded messages would make two identical runs differ in their bytes and destroy the
    // double-run check this wave publishes every figure under. The path is REPLACED BY A TOKEN
    // everywhere it appears and preserved once, under an explicitly ephemeral key.
    report.ephemeral = { consumerRoot: workspace, removed: true };
    rmSync(workspace, { recursive: true, force: true });
}

const redact = (value) => {
    if (typeof value === "string") {
        return workspaceSpellings.reduce(
            (text, spelling) => text.split(spelling).join("<consumer>"),
            value,
        );
    }
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, redact(inner)]));
    }
    return value;
};
report.legs = redact(report.legs);

report.verdict = {
    pack: report.legs.pack?.ok === true,
    declaration: report.legs.declaration?.ok === true,
    install: report.legs.install?.ok === true,
    resolve: report.legs.resolve?.ok === true,
    refusals: report.legs.refusals?.ok === true,
};
report.verdict.G3 = Object.values(report.verdict).every(Boolean) ? "GREEN" : "RED";

if (options.out) {
    writeFileSync(path.resolve(options.out), `${JSON.stringify(report, null, 4)}\n`);
}

process.stdout.write(`${JSON.stringify({
    candidate: `${report.candidate.name}@${report.candidate.version}`,
    tarball: report.legs.pack?.filename ?? null,
    tarballSha256: report.legs.pack?.sha256 ?? null,
    entryCount: report.legs.pack?.entryCount ?? null,
    symbolSource: report.symbolSource.kind,
    seamSubpathDeclared: report.legs.resolve?.seamSubpathDeclared ?? null,
    resolved: `${report.legs.resolve?.resolved ?? 0} of ${report.legs.resolve?.of ?? 0}`,
    refusals: report.legs.refusals?.rows?.filter((row) => row.refused).length ?? 0,
    verdict: report.verdict,
}, null, 1)}\n`);

process.exit(report.verdict.G3 === "GREEN" ? 0 : 1);
