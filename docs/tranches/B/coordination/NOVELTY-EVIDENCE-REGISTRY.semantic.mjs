import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Ajv2020Module from "../../../../typescript/node_modules/ajv/dist/2020.js";

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../../..");
const SCHEMA_PATH = resolve(HERE, "NOVELTY-EVIDENCE-REGISTRY.schema.json");

export const DEFAULT_EXPECTED_ROOT =
    "/Users/mkbabb/Documents/Codex/2026-08-01/parser-novelty-n2-ietm-f0";

export const DEFAULT_TRUSTED_POLICY = Object.freeze({
    repoRoot: REPO_ROOT,
    phase: "N2",
    authority: Object.freeze({
        id: "auth.n1-a",
        branch: "codex/css-totality-combinators-20260729",
        head: "a04a7e658bee32a1fb252a4e5b4f3ce359a5947d",
        scope: Object.freeze([
            "N1_A=a04a7e658bee32a1fb252a4e5b4f3ce359a5947d",
            "N2_FAMILY=N_IETM",
            "N2_LAW=PL_BE_NET_BENEFIT",
            "ZERO_DOWNSTREAM_CREDIT",
        ]),
    }),
    executableFamilies: Object.freeze(["N_IETM"]),
    familyLaws: Object.freeze({ N_IETM: Object.freeze(["PL_BE_NET_BENEFIT"]) }),
    fatalOnlyFamilies: Object.freeze({ N_GLL: Object.freeze({ maxRows: 0, maxFixtures: 0 }) }),
    requiredCounts: Object.freeze({
        AUTHORITY: 1,
        RUN: 1,
        ARM: 1,
        BUILD: 1,
        FIXTURE: 1,
        ROW: 1,
        PRODUCT: 1,
        LAW: 1,
        HOSTILE: 1,
        RECEIPT: 1,
    }),
    registryArtifacts: Object.freeze([
        "docs/tranches/B/coordination/NOVELTY-EVIDENCE-REGISTRY.schema.json",
        "docs/tranches/B/coordination/NOVELTY-EVIDENCE-REGISTRY.semantic.mjs",
    ]),
    rawArtifacts: Object.freeze([
        "docs/tranches/B/artifacts/novelty-n1-a1-semantic-registry/raw.ndjson",
    ]),
});

const KINDS = Object.freeze([
    "AUTHORITY",
    "RUN",
    "ARM",
    "BUILD",
    "FIXTURE",
    "ROW",
    "PRODUCT",
    "LAW",
    "HOSTILE",
    "RECEIPT",
]);

const N_FAMILIES = new Set(["N_IETM", "N_DNF", "N_WRR", "N_GLL"]);
const LAW_UNITS = Object.freeze({
    PL_3X_MEDIAN: "RATIO",
    PL_2X_GEOMETRIC: "RATIO",
    PL_BE_NET_BENEFIT: "NANOSECONDS",
    PL_10X_HISTORICAL: "RATIO",
});

export class RegistrySemanticError extends Error {
    constructor(code, message, path = "$") {
        super(`${code}: ${message}`);
        this.name = "RegistrySemanticError";
        this.code = code;
        this.path = path;
    }
}

function fail(code, message, path = "$") {
    throw new RegistrySemanticError(code, message, path);
}

function sha256(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}

function sorted(values) {
    return [...values].sort((a, b) => a.localeCompare(b));
}

function sameSet(left, right) {
    const a = sorted(left);
    const b = sorted(right);
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

function rootContains(root, target) {
    const rel = relative(root, target);
    return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

export function defaultArtifactReader({ absolutePath }) {
    const stat = lstatSync(absolutePath);
    return Object.freeze({
        bytes: stat.isFile() && !stat.isSymbolicLink() ? readFileSync(absolutePath) : Buffer.alloc(0),
        isFile: stat.isFile(),
        isSymlink: stat.isSymbolicLink(),
        realPath: realpathSync(absolutePath),
    });
}

function resolveRecord(byId, id, expectedKind, missingCode, kindCode, path) {
    const record = byId.get(id);
    if (!record) fail(missingCode, `${id} does not resolve`, path);
    if (record.kind !== expectedKind) {
        fail(kindCode, `${id} resolves to ${record.kind}, expected ${expectedKind}`, path);
    }
    return record;
}

function collectArtifacts(value, path = "$", output = []) {
    if (Array.isArray(value)) {
        value.forEach((item, index) => collectArtifacts(item, `${path}[${index}]`, output));
        return output;
    }
    if (!value || typeof value !== "object") return output;
    if (
        typeof value.path === "string" &&
        Number.isInteger(value.bytes) &&
        typeof value.sha256 === "string" &&
        Object.keys(value).length === 3
    ) {
        output.push({ descriptor: value, path });
        return output;
    }
    for (const [key, child] of Object.entries(value)) collectArtifacts(child, `${path}.${key}`, output);
    return output;
}

function validateArtifacts(records, repoRoot, artifactReader) {
    const descriptors = collectArtifacts(records);
    const firstByPath = new Map();
    for (const item of descriptors) {
        const previous = firstByPath.get(item.descriptor.path);
        if (
            previous &&
            (previous.descriptor.bytes !== item.descriptor.bytes ||
                previous.descriptor.sha256 !== item.descriptor.sha256)
        ) {
            fail("E_ARTIFACT_DESCRIPTOR_CONFLICT", `${item.descriptor.path} has conflicting descriptors`, item.path);
        }
        if (!previous) firstByPath.set(item.descriptor.path, item);
    }

    for (const { descriptor, path } of firstByPath.values()) {
        if (isAbsolute(descriptor.path) || descriptor.path.split(/[\\/]/u).includes("..")) {
            fail("E_ARTIFACT_OUTSIDE", `${descriptor.path} is not a canonical repository-relative path`, `${path}.path`);
        }
        const absolutePath = resolve(repoRoot, descriptor.path);
        if (!rootContains(repoRoot, absolutePath)) {
            fail("E_ARTIFACT_OUTSIDE", `${descriptor.path} escapes the repository`, `${path}.path`);
        }
        let artifact;
        try {
            artifact = artifactReader({ absolutePath, relativePath: descriptor.path, repoRoot });
        } catch (error) {
            fail("E_ARTIFACT_MISSING", `${descriptor.path} cannot be read: ${error?.code ?? error}`, path);
        }
        if (artifact.isSymlink) fail("E_ARTIFACT_SYMLINK", `${descriptor.path} is a symbolic link`, path);
        if (!artifact.isFile) fail("E_ARTIFACT_MISSING", `${descriptor.path} is not a regular file`, path);
        const realPath = resolve(artifact.realPath);
        if (!rootContains(repoRoot, realPath) || realPath !== absolutePath) {
            fail("E_ARTIFACT_OUTSIDE", `${descriptor.path} resolves outside its canonical path`, path);
        }
        if (artifact.bytes.length !== descriptor.bytes) {
            fail("E_ARTIFACT_BYTES", `${descriptor.path} has ${artifact.bytes.length} bytes, declared ${descriptor.bytes}`, path);
        }
        const actualSha = sha256(artifact.bytes);
        if (actualSha !== descriptor.sha256) {
            fail("E_ARTIFACT_HASH", `${descriptor.path} has SHA ${actualSha}, declared ${descriptor.sha256}`, path);
        }
    }
}

function validateFixtureVectors(fixtures, repoRoot, artifactReader) {
    for (const fixture of fixtures) {
        const absolutePath = resolve(repoRoot, fixture.vector.path);
        let vector;
        try {
            const artifact = artifactReader({ absolutePath, relativePath: fixture.vector.path, repoRoot });
            vector = JSON.parse(artifact.bytes);
        } catch {
            fail("E_FIXTURE_VECTOR", `${fixture.id} vector is not readable JSON`, `$.${fixture.id}.vector`);
        }
        if (!Array.isArray(vector)) fail("E_FIXTURE_VECTOR", `${fixture.id} vector is not an array`, `$.${fixture.id}.vector`);
        if (new Set(fixture.selectedIndices).size !== fixture.selectedIndices.length) {
            fail("E_SELECTED_INDEX", `${fixture.id} repeats selected indices`, `$.${fixture.id}.selectedIndices`);
        }
        if (fixture.selectedIndices.some((index) => index >= vector.length)) {
            fail("E_SELECTED_INDEX", `${fixture.id} selects outside a ${vector.length}-entry vector`, `$.${fixture.id}.selectedIndices`);
        }
    }
}

function validateTrustedPolicy(policy, expectedRoot, artifactReader) {
    if (!policy || typeof policy !== "object") fail("E_TRUST_POLICY", "trustedPolicy is required");
    if (!expectedRoot || !isAbsolute(expectedRoot)) fail("E_TRUST_ROOT", "expectedRoot must be an absolute trusted input");
    if (typeof artifactReader !== "function") fail("E_TRUST_ARTIFACT_READER", "artifactReader is required");
    for (const key of ["repoRoot", "phase", "authority", "executableFamilies", "familyLaws", "requiredCounts", "registryArtifacts", "rawArtifacts"]) {
        if (!(key in policy)) fail("E_TRUST_POLICY", `trustedPolicy omits ${key}`);
    }
}

function validateAuthority(authorities, policy) {
    if (authorities.length !== 1) {
        fail("E_AUTHORITY_COUNT", `expected exactly one AUTHORITY, found ${authorities.length}`);
    }
    const authority = authorities[0];
    const expected = policy.authority;
    if (
        authority.id !== expected.id ||
        authority.branch !== expected.branch ||
        authority.head !== expected.head ||
        !sameSet(authority.scope, expected.scope) ||
        authority.zeroCredit !== true
    ) {
        fail("E_AUTHORITY_TRUST", "submitted authority differs from the externally pinned authority", `$.${authority.id}`);
    }
    return authority;
}

function validateKindsAndCounts(records, receipt, policy) {
    const counts = Object.fromEntries(KINDS.map((kind) => [kind, records.filter((record) => record.kind === kind).length]));
    for (const kind of KINDS) {
        if (counts[kind] !== policy.requiredCounts[kind]) {
            fail("E_PACKET_DENOMINATOR", `${kind} count is ${counts[kind]}, trusted denominator is ${policy.requiredCounts[kind]}`, `$`);
        }
        if (receipt.declaredCounts[kind] !== counts[kind]) {
            fail("E_DECLARED_COUNT", `${kind} count is ${counts[kind]}, declared ${receipt.declaredCounts[kind]}`, `$.${receipt.id}.declaredCounts.${kind}`);
        }
    }
    return counts;
}

function validateReceipt(receipt, authority, records, expectedRoot, policy) {
    if (receipt.authorityId !== authority.id) {
        fail("E_RECEIPT_AUTHORITY", `${receipt.authorityId} is not the pinned authority`, `$.${receipt.id}.authorityId`);
    }
    const recordIds = records.filter((record) => record.kind !== "RECEIPT").map((record) => record.id);
    const missing = recordIds.filter((id) => !receipt.recordIds.includes(id));
    const extra = receipt.recordIds.filter((id) => !recordIds.includes(id));
    if (missing.length) fail("E_RECORD_SET_OMISSION", `receipt omits ${missing.join(", ")}`, `$.${receipt.id}.recordIds`);
    if (extra.length) fail("E_RECORD_SET_EXTRA", `receipt contains ${extra.join(", ")}`, `$.${receipt.id}.recordIds`);
    if (receipt.root !== expectedRoot) {
        fail("E_ROOT_TRUST", `${receipt.root} differs from trusted root ${expectedRoot}`, `$.${receipt.id}.root`);
    }
    for (const run of records.filter((record) => record.kind === "RUN")) {
        if (run.root !== expectedRoot) {
            fail("E_RUN_ROOT", `${run.id} differs from trusted root ${expectedRoot}`, `$.${run.id}.root`);
        }
    }
    if (receipt.interrupted) fail("E_RECEIPT_INTERRUPTED", "interrupted root cannot become authority", `$.${receipt.id}.interrupted`);
    let present = false;
    try {
        lstatSync(expectedRoot);
        present = true;
    } catch (error) {
        if (error?.code !== "ENOENT") throw error;
    }
    if (!receipt.rootWasAbsent || present) {
        fail("E_ROOT_PRESENT", `${expectedRoot} must be absent independently of submitted evidence`, `$.${receipt.id}.root`);
    }
    const registry = receipt.registryArtifacts.map((artifact) => artifact.path);
    const raw = receipt.rawArtifacts.map((artifact) => artifact.path);
    if (registry.some((path) => raw.includes(path))) {
        fail("E_ARTIFACT_CLASS_OVERLAP", "registry and raw artifact classes overlap", `$.${receipt.id}`);
    }
    if (!sameSet(registry, policy.registryArtifacts)) {
        fail("E_REGISTRY_ARTIFACT_SET", "registry artifact inventory differs from trusted policy", `$.${receipt.id}.registryArtifacts`);
    }
    if (!sameSet(raw, policy.rawArtifacts)) {
        fail("E_RAW_ARTIFACT_SET", "raw artifact inventory differs from trusted policy", `$.${receipt.id}.rawArtifacts`);
    }
}

function validatePhases(records, policy) {
    for (const record of records) {
        if (record.phase !== policy.phase) {
            fail("E_PHASE_MISMATCH", `${record.id} is ${record.phase}, packet is ${policy.phase}`, `$.${record.id}.phase`);
        }
    }
}

function validateFamilyRoleAndLaw(arms, rows, byId, policy) {
    const rowByArm = new Map();
    for (const row of rows) {
        const armRows = rowByArm.get(row.armId) ?? [];
        armRows.push(row);
        rowByArm.set(row.armId, armRows);
    }
    for (const arm of arms) {
        if (N_FAMILIES.has(arm.family) && arm.role !== "CANDIDATE") {
            fail("E_ROLE_FAMILY", `${arm.family} must use role CANDIDATE`, `$.${arm.id}.role`);
        }
        if (arm.role === "CANDIDATE" && !N_FAMILIES.has(arm.family)) {
            fail("E_ROLE_FAMILY", `candidate role cannot bind ${arm.family}`, `$.${arm.id}.family`);
        }
        if (arm.family === "M2" && !["ACCEPTED_M2", "REBUILT_M2"].includes(arm.role)) {
            fail("E_ROLE_FAMILY", `M2 cannot use role ${arm.role}`, `$.${arm.id}.role`);
        }
        if (arm.family === "M3_SEMANTIC" && arm.role !== "SEMANTIC_ORACLE") {
            fail("E_ROLE_FAMILY", `M3_SEMANTIC cannot use role ${arm.role}`, `$.${arm.id}.role`);
        }
        if (arm.family === "HOSTILE" && !["NOOP", "AA", "BB"].includes(arm.role)) {
            fail("E_ROLE_FAMILY", `HOSTILE cannot use role ${arm.role}`, `$.${arm.id}.role`);
        }
        if (arm.family === "N_GLL") {
            const bound = policy.fatalOnlyFamilies?.N_GLL;
            const armRows = rowByArm.get(arm.id) ?? [];
            const fixtures = new Set(armRows.map((row) => row.fixtureId));
            if (!bound || armRows.length > bound.maxRows || fixtures.size > bound.maxFixtures) {
                fail("E_GLL_INACTIVE", "N_GLL exceeds externally pinned fatal-only bounds", `$.${arm.id}`);
            }
        } else if (N_FAMILIES.has(arm.family) && !policy.executableFamilies.includes(arm.family)) {
            fail("E_FAMILY_INACTIVE", `${arm.family} lacks external execution authority`, `$.${arm.id}`);
        }
        const allowedLaws = policy.familyLaws[arm.family];
        if (allowedLaws) {
            for (const row of rowByArm.get(arm.id) ?? []) {
                for (const lawId of row.lawIds) {
                    const law = byId.get(lawId);
                    if (!allowedLaws.includes(law.family)) {
                        fail("E_IETM_LAW_COMPAT", `${arm.family} cannot bind ${law.family}`, `$.${row.id}.lawIds`);
                    }
                }
            }
        }
    }
}

function validateReferences(records, byId, policy) {
    const builds = records.filter((record) => record.kind === "BUILD");
    const arms = records.filter((record) => record.kind === "ARM");
    const fixtures = records.filter((record) => record.kind === "FIXTURE");
    const rows = records.filter((record) => record.kind === "ROW");
    for (const build of builds) {
        if (build.sourceCommit !== policy.authority.head) {
            fail("E_BUILD_SOURCE", `${build.id} does not bind the pinned source head`, `$.${build.id}.sourceCommit`);
        }
    }
    for (const arm of arms) {
        resolveRecord(byId, arm.buildId, "BUILD", "E_FK_BUILD_MISSING", "E_FK_BUILD_KIND", `$.${arm.id}.buildId`);
    }
    for (const fixture of fixtures) {
        resolveRecord(byId, fixture.expectedProductId, "PRODUCT", "E_FK_EXPECTED_PRODUCT_MISSING", "E_FK_EXPECTED_PRODUCT_KIND", `$.${fixture.id}.expectedProductId`);
    }
    for (const row of rows) {
        resolveRecord(byId, row.runId, "RUN", "E_FK_RUN_MISSING", "E_FK_RUN_KIND", `$.${row.id}.runId`);
        const arm = resolveRecord(byId, row.armId, "ARM", "E_FK_ARM_MISSING", "E_FK_ARM_KIND", `$.${row.id}.armId`);
        resolveRecord(byId, row.fixtureId, "FIXTURE", "E_FK_FIXTURE_MISSING", "E_FK_FIXTURE_KIND", `$.${row.id}.fixtureId`);
        resolveRecord(byId, row.productId, "PRODUCT", "E_FK_PRODUCT_MISSING", "E_FK_PRODUCT_KIND", `$.${row.id}.productId`);
        for (const lawId of row.lawIds) {
            resolveRecord(byId, lawId, "LAW", "E_FK_LAW_MISSING", "E_FK_LAW_KIND", `$.${row.id}.lawIds`);
        }
        if (row.rawNanoseconds.length !== row.aggregateIterations) {
            fail("E_SAMPLE_COUNT", `${row.id} raw vector length differs from aggregateIterations`, `$.${row.id}.rawNanoseconds`);
        }
        if (arm.role === "CANDIDATE") {
            const names = arm.mechanismCounterNames;
            if (!names.length || !sameSet(Object.keys(row.mechanismCounters), names)) {
                fail("E_COUNTER_SCHEMA", `${row.id} counters differ from ${arm.id} declarations`, `$.${row.id}.mechanismCounters`);
            }
            if (Object.values(row.mechanismCounters).reduce((sum, value) => sum + value, 0) === 0) {
                fail("E_MECHANISM_UNREACHED", `${row.id} does not reach the candidate mechanism`, `$.${row.id}.mechanismCounters`);
            }
        }
    }
    return { arms, fixtures, rows };
}

function validateLaws(records) {
    const laws = records.filter((record) => record.kind === "LAW");
    if (laws.filter((law) => law.family === "PL_BE_NET_BENEFIT").length !== 1) {
        fail("E_PL_BE_MISSING", "packet must contain exactly one PL_BE_NET_BENEFIT law");
    }
    for (const law of laws) {
        if (law.decisionUnit !== LAW_UNITS[law.family]) {
            fail("E_LAW_UNIT", `${law.family} must use ${LAW_UNITS[law.family]}`, `$.${law.id}.decisionUnit`);
        }
    }
}

function validateNoOrphans(records, rows, arms) {
    const rowRefs = {
        RUN: new Set(rows.map((row) => row.runId)),
        ARM: new Set(rows.map((row) => row.armId)),
        FIXTURE: new Set(rows.map((row) => row.fixtureId)),
        PRODUCT: new Set(rows.map((row) => row.productId)),
        LAW: new Set(rows.flatMap((row) => row.lawIds)),
    };
    const buildRefs = new Set(arms.map((arm) => arm.buildId));
    for (const record of records) {
        if (rowRefs[record.kind] && !rowRefs[record.kind].has(record.id)) {
            fail(`E_ORPHAN_${record.kind}`, `${record.id} is not consumed by a ROW`, `$.${record.id}`);
        }
        if (record.kind === "BUILD" && !buildRefs.has(record.id)) {
            fail("E_ORPHAN_BUILD", `${record.id} is not consumed by an ARM`, `$.${record.id}`);
        }
    }
}

export function validateNoveltyRegistry({ records, schemaBytes, expectedRoot, trustedPolicy, artifactReader }) {
    validateTrustedPolicy(trustedPolicy, expectedRoot, artifactReader);
    const bytes = Buffer.isBuffer(schemaBytes) ? schemaBytes : Buffer.from(schemaBytes ?? "");
    let schema;
    try {
        schema = JSON.parse(bytes);
    } catch {
        fail("E_SCHEMA_BYTES", "schemaBytes are not valid JSON");
    }
    const schemaSha256 = sha256(bytes);
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    const validateShape = ajv.compile(schema);
    if (!validateShape(records)) {
        fail("E_SCHEMA_STRUCTURE", ajv.errorsText(validateShape.errors, { separator: "; " }));
    }
    if (records.length === 0) fail("E_REGISTRY_EMPTY", "evidence registry is empty");

    const byId = new Map();
    for (const record of records) {
        if (byId.has(record.id)) fail("E_DUPLICATE_ID", `duplicate record id ${record.id}`, `$.${record.id}`);
        byId.set(record.id, record);
        if (record.schemaSha256 !== schemaSha256) {
            fail("E_SCHEMA_SHA", `${record.id} declares ${record.schemaSha256}, expected ${schemaSha256}`, `$.${record.id}.schemaSha256`);
        }
    }

    const authorities = records.filter((record) => record.kind === "AUTHORITY");
    const receipts = records.filter((record) => record.kind === "RECEIPT");
    if (receipts.length !== 1) fail("E_RECEIPT_COUNT", `expected exactly one RECEIPT, found ${receipts.length}`);
    const authority = validateAuthority(authorities, trustedPolicy);
    const receipt = receipts[0];
    validatePhases(records, trustedPolicy);
    validateReceipt(receipt, authority, records, expectedRoot, trustedPolicy);
    validateKindsAndCounts(records, receipt, trustedPolicy);
    validateLaws(records);
    const { arms, fixtures, rows } = validateReferences(records, byId, trustedPolicy);
    validateFamilyRoleAndLaw(arms, rows, byId, trustedPolicy);
    validateNoOrphans(records, rows, arms);
    validateArtifacts(records, resolve(trustedPolicy.repoRoot), artifactReader);
    validateFixtureVectors(fixtures, resolve(trustedPolicy.repoRoot), artifactReader);

    return Object.freeze({
        status: "GREEN",
        schemaSha256,
        recordCount: records.length,
        counts: Object.freeze(Object.fromEntries(KINDS.map((kind) => [kind, records.filter((record) => record.kind === kind).length]))),
    });
}

async function main() {
    const registryPath = process.argv[2];
    if (!registryPath) fail("E_CLI_USAGE", "usage: node NOVELTY-EVIDENCE-REGISTRY.semantic.mjs <registry.json>");
    const result = validateNoveltyRegistry({
        records: JSON.parse(readFileSync(resolve(registryPath), "utf8")),
        schemaBytes: readFileSync(SCHEMA_PATH),
        expectedRoot: DEFAULT_EXPECTED_ROOT,
        trustedPolicy: DEFAULT_TRUSTED_POLICY,
        artifactReader: defaultArtifactReader,
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
    main().catch((error) => {
        const result = error instanceof RegistrySemanticError
            ? { status: "RED", code: error.code, path: error.path, message: error.message }
            : { status: "RED", code: "E_INTERNAL", message: String(error?.stack ?? error) };
        process.stderr.write(`${JSON.stringify(result)}\n`);
        process.exitCode = 1;
    });
}
