// SERVED MODEL: claude-opus-5[1m]
//
// X.P.W3.d — THE ORACLE: THE VENDORED, sha-PINNED PUBLISHED 4.0.0 TARBALL.
//
// `W3.md` §5 `.d`, in its own words: "The oracle is the **vendored, sha-pinned published 4.0.0
// tarball** — never `dist/` in the working tree (cand-O's dist-drift finding; the repo's own
// `dist/subpaths/css.js` differs from what 4.0.0 ships, which is why a source-resolved import
// cannot witness the defect)."
//
// §6 G-7 makes the pin a PRECONDITION rather than a footnote: "the vendored tarball's sha256 is
// asserted **in-test before any comparison runs**, so an unpinned oracle fails first." This module
// is built so that ordering cannot be got wrong by a caller: `loadOracle()` hashes the archive and
// THROWS before it unpacks. There is no flag to skip it and no cached-success path.
//
// WHY A TARBALL AND NOT THE UNPACKED `cand-o/vendor/value-js-4.0.0/` TREE. `.a`'s pin reads the
// unpacked tree's `css.d.ts`/`css.js` as its SHAPE oracle, and that is correct for a declaration.
// This unit is the DIFFERENTIAL, so its oracle has to be the artifact npm ships, bit for bit,
// carrying its own integrity: an unpacked directory is a copy somebody made, and the difference
// between "a copy of the published bytes" and "the published bytes" is exactly the distinction the
// dist-drift finding is about. Both are read here and `crossCheckUnpacked()` PROVES they agree, so
// the choice costs nothing and the agreement is measured rather than assumed.
//
// UNPACKING IS READ-ONLY WITH RESPECT TO THE REPOSITORY. The archive is expanded into an
// `mkdtemp` directory under the OS temp root — never into `<p2>`, never into value.js — and the
// directory is removed by `disposeOracle()`. No byte of any repository is written by this module.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const VENDOR_DIR = path.join(HERE, "..", "vendor");
export const PIN_PATH = path.join(VENDOR_DIR, "PIN.json");

/** The pin, as data. Read from the sidecar so the digest and the archive travel together. */
export const PIN = JSON.parse(readFileSync(PIN_PATH, "utf8"));

export const TARBALL_PATH = path.join(VENDOR_DIR, PIN.file);

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
export const sha512b64 = (buf) => createHash("sha512").update(buf).digest("base64");

/**
 * THE PIN ASSERTION. Called first by every consumer; returns the reading rather than a boolean so
 * a suite can print what it checked. Three independent handles on the same bytes — the byte count,
 * this seat's sha256, and the REGISTRY's own sha512 integrity — because a single digest proves the
 * file did not change while three prove it is the file npm served.
 */
export const assertPin = () => {
    if (!existsSync(TARBALL_PATH)) {
        throw new Error(
            `ORACLE ABSENT: ${TARBALL_PATH}. G-7's oracle is the vendored sha-pinned published ` +
                `4.0.0 tarball; there is no fallback to a working tree, by W3.md §5 \`.d\`.`,
        );
    }
    const bytes = readFileSync(TARBALL_PATH);
    const reading = {
        path: TARBALL_PATH,
        bytes: bytes.length,
        sha256: sha256(bytes),
        npmIntegrity: `sha512-${sha512b64(bytes)}`,
    };
    const failures = [];
    if (reading.bytes !== PIN.bytes) failures.push(`bytes ${reading.bytes} ≠ pinned ${PIN.bytes}`);
    if (reading.sha256 !== PIN.sha256) failures.push(`sha256 ${reading.sha256} ≠ pinned ${PIN.sha256}`);
    if (reading.npmIntegrity !== PIN.npmIntegrity) {
        failures.push(`npm integrity ${reading.npmIntegrity} ≠ pinned ${PIN.npmIntegrity}`);
    }
    if (failures.length > 0) {
        throw new Error(`ORACLE UNPINNED — ${failures.join(" · ")}. W3.md §6 G-7: an unpinned oracle fails first.`);
    }
    return reading;
};

/* ── unpacking ─────────────────────────────────────────────────────────────────────────────── */

let loaded = null;

/**
 * The oracle module, its declaration text, and the pin reading that licensed both.
 * `assertPin()` runs BEFORE `tar` is invoked; a failed pin means nothing is unpacked at all.
 */
export const loadOracle = async () => {
    if (loaded) return loaded;
    const pin = assertPin();

    const dir = mkdtempSync(path.join(tmpdir(), "xpw3d-oracle-"));
    execFileSync("tar", ["-xzf", TARBALL_PATH, "-C", dir], { stdio: "ignore" });

    const entry = path.join(dir, PIN.entry);
    const declaration = path.join(dir, PIN.declaration);
    if (!existsSync(entry) || !existsSync(declaration)) {
        rmSync(dir, { recursive: true, force: true });
        throw new Error(`ORACLE MALFORMED: ${PIN.entry} or ${PIN.declaration} absent from the pinned archive.`);
    }

    const module = await import(pathToFileURL(entry).href);
    const pkg = JSON.parse(readFileSync(path.join(dir, "package/package.json"), "utf8"));
    if (pkg.name !== PIN.package || pkg.version !== PIN.version) {
        rmSync(dir, { recursive: true, force: true });
        throw new Error(`ORACLE MISLABELLED: archive declares ${pkg.name}@${pkg.version}, pin declares ${PIN.package}@${PIN.version}.`);
    }

    loaded = {
        pin,
        dir,
        module,
        exports: Object.keys(module).sort(),
        entryPath: entry,
        entrySha256: sha256(readFileSync(entry)),
        declarationPath: declaration,
        declarationText: readFileSync(declaration, "utf8"),
        declarationSha256: sha256(readFileSync(declaration)),
        packageJson: pkg,
    };
    return loaded;
};

export const disposeOracle = () => {
    if (loaded) rmSync(loaded.dir, { recursive: true, force: true });
    loaded = null;
};

/**
 * The unpacked `cand-o/vendor/value-js-4.0.0/` tree `.a`'s pin reads, compared to the tarball's own
 * bytes. A difference would mean the two halves of this wave measured two different 4.0.0s, which
 * is a finding and not something to reconcile silently.
 */
export const crossCheckUnpacked = (oracle, unpackedDir) => {
    const rows = [
        ["dist/subpaths/css.js", oracle.entrySha256],
        ["dist/subpaths/css.d.ts", oracle.declarationSha256],
    ].map(([rel, tarballSha]) => {
        const at = path.join(unpackedDir, rel);
        const present = existsSync(at);
        return {
            file: rel,
            present,
            tarballSha256: tarballSha,
            unpackedSha256: present ? sha256(readFileSync(at)) : null,
            agree: present && sha256(readFileSync(at)) === tarballSha,
        };
    });
    return { rows, agree: rows.every((r) => r.agree) };
};

/**
 * A total call into the oracle. The incumbent THROWS (that is the R1 class this wave is named
 * after), so every oracle invocation is wrapped — not to hide it, but to RECORD it: `threw` is a
 * first-class field of the reading and the differential counts it.
 */
export const callOracle = (fn, ...args) => {
    try {
        return { threw: false, value: fn(...args) };
    } catch (error) {
        return {
            threw: true,
            value: undefined,
            error: error instanceof Error ? error.constructor.name : typeof error,
            message: error instanceof Error ? error.message : String(error),
        };
    }
};
