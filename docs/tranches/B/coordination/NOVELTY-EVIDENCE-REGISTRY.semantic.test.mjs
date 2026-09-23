import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
    DEFAULT_EXPECTED_ROOT,
    DEFAULT_RAW_SCHEMA_PATH,
    DEFAULT_TRUSTED_POLICY,
    RegistrySemanticError,
    defaultArtifactReader,
    validateNoveltyRegistry,
} from "./NOVELTY-EVIDENCE-REGISTRY.semantic.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = resolve(HERE, "NOVELTY-EVIDENCE-REGISTRY.baseline.json");
const MUTANTS_PATH = resolve(HERE, "NOVELTY-EVIDENCE-REGISTRY.mutants.json");
const RESULTS_PATH = resolve(HERE, "NOVELTY-EVIDENCE-REGISTRY.results.json");
const VALIDATOR_PATH = resolve(HERE, "NOVELTY-EVIDENCE-REGISTRY.semantic.mjs");
const TEST_PATH = resolve(HERE, "NOVELTY-EVIDENCE-REGISTRY.semantic.test.mjs");
const SCHEMA_PATH = resolve(HERE, "NOVELTY-EVIDENCE-REGISTRY.schema.json");
const SCHEMA_BYTES = readFileSync(SCHEMA_PATH);
const RAW_SCHEMA_BYTES = readFileSync(DEFAULT_RAW_SCHEMA_PATH);
const RAW_PATH = "docs/tranches/B/artifacts/novelty-n1-a1-semantic-registry/raw.ndjson";

// Test literals are deliberately not imported from the validator or submitted evidence.
const EXPECTED = Object.freeze({
    empty_registry: "E_REGISTRY_EMPTY",
    duplicate_ids: "E_DUPLICATE_ID",
    dangling_build_fk: "E_FK_BUILD_MISSING",
    dangling_expected_product_fk: "E_FK_EXPECTED_PRODUCT_MISSING",
    dangling_run_fk: "E_FK_RUN_MISSING",
    dangling_arm_fk: "E_FK_ARM_MISSING",
    dangling_fixture_fk: "E_FK_FIXTURE_MISSING",
    dangling_product_fk: "E_FK_PRODUCT_MISSING",
    dangling_law_fk: "E_FK_LAW_MISSING",
    wrong_kind_run_target: "E_FK_RUN_KIND",
    authority_trust_drift: "E_AUTHORITY_TRUST",
    authority_identity_drift: "E_AUTHORITY_TRUST",
    receipt_authority_drift: "E_RECEIPT_AUTHORITY",
    trusted_root_mismatch: "E_ROOT_TRUST",
    run_root_mismatch: "E_RUN_ROOT",
    record_set_omission: "E_RECORD_SET_OMISSION",
    record_set_extra: "E_RECORD_SET_EXTRA",
    phase_mismatch: "E_PHASE_MISMATCH",
    build_source_drift: "E_BUILD_SOURCE",
    role_family_mismatch: "E_ROLE_FAMILY",
    pl_be_ratio_unit: "E_LAW_UNIT",
    ietm_pl3_membership: "E_IETM_LAW_COMPAT",
    ietm_pl2_membership: "E_IETM_LAW_COMPAT",
    missing_pl_be: "E_PL_BE_MISSING",
    orphan_receipt: "E_RECEIPT_COUNT",
    orphan_run_record: "E_ORPHAN_RUN",
    extra_undeclared_record: "E_RECORD_SET_OMISSION",
    declared_count_mismatch: "E_DECLARED_COUNT",
    schema_sha_drift: "E_SCHEMA_SHA",
    missing_authority: "E_AUTHORITY_COUNT",
    inactive_dnf_family: "E_FAMILY_INACTIVE",
    inactive_wrr_family: "E_FAMILY_INACTIVE",
    inactive_gll_family: "E_GLL_INACTIVE",
    registry_inventory_orphan: "E_REGISTRY_ARTIFACT_SET",
    raw_inventory_orphan: "E_RAW_ARTIFACT_SET",
    artifact_class_overlap: "E_ARTIFACT_CLASS_OVERLAP",
    artifact_descriptor_conflict: "E_ARTIFACT_DESCRIPTOR_CONFLICT",
    artifact_path_traversal: "E_ARTIFACT_OUTSIDE",
    artifact_symlink: "E_ARTIFACT_SYMLINK",
    orphan_raw: "E_ARTIFACT_MISSING",
    orphan_artifact: "E_ARTIFACT_MISSING",
    leaf_artifact_hash_bypass: "E_ARTIFACT_HASH",
    zero_route_counter: "E_MECHANISM_UNREACHED",
    counter_schema_drift: "E_COUNTER_SCHEMA",
    sample_count_mismatch: "E_SAMPLE_COUNT",
    selected_index_out_of_range: "E_SELECTED_INDEX",
    selected_index_duplicate: "E_SELECTED_INDEX",
    receipt_interrupted: "E_RECEIPT_INTERRUPTED",
    product_cross_swap: "E_ROW_FIXTURE_PRODUCT",
    raw_timing_drift: "E_RAW_TIMING",
    raw_registry_counter_drift: "E_RAW_COUNTER",
    raw_row_id_drift: "E_RAW_ROW_ID",
    raw_arm_id_drift: "E_RAW_ARM_ID",
    raw_run_id_drift: "E_RAW_RUN_ID",
    raw_fixture_id_drift: "E_RAW_FIXTURE_ID",
    raw_product_id_drift: "E_RAW_PRODUCT_ID",
    raw_duplicate_row: "E_RAW_ROW_DUPLICATE",
    raw_omitted_row: "E_RAW_ROW_MISSING",
    raw_extra_row: "E_RAW_ROW_EXTRA",
    raw_malformed_json: "E_RAW_JSON",
    raw_schema_violation: "E_RAW_SCHEMA",
    raw_aggregate_drift: "E_RAW_AGGREGATE",
    raw_sample_count_drift: "E_RAW_SAMPLE_COUNT",
    raw_counter_drift: "E_RAW_COUNTER",
    raw_counter_name_duplicate: "E_RAW_COUNTER_SCHEMA",
    raw_selected_indices_drift: "E_RAW_SELECTED_INDICES",
    raw_fixture_vector_drift: "E_RAW_FIXTURE_VECTOR",
    raw_fixture_bytes_drift: "E_RAW_FIXTURE_BYTES",
    raw_file_unused: "E_RAW_FILE_UNUSED",
    artifact_dot_segment: "E_ARTIFACT_PATH_CANONICAL",
    artifact_double_separator: "E_ARTIFACT_PATH_CANONICAL",
    unbound_sink_substitution: "E_RAW_SINK_DESCRIPTOR",
    raw_law_drift: "E_RAW_LAWS",
    unbound_warmup_drift: "E_RAW_WARMUP",
    unbound_cold_drift: "E_RAW_COLD",
    raw_gc_descriptor_drift: "E_RAW_GC_DESCRIPTOR",
    raw_deopt_descriptor_drift: "E_RAW_DEOPT_DESCRIPTOR",
    raw_ic_descriptor_drift: "E_RAW_IC_DESCRIPTOR",
    raw_allocation_descriptor_drift: "E_RAW_ALLOCATION_DESCRIPTOR",
    raw_sink_descriptor_drift: "E_RAW_SINK_DESCRIPTOR",
    raw_run_root_drift: "E_RAW_RUN_ROOT",
    unbound_run_pid_drift: "E_RAW_RUN_PID",
    unbound_run_process_start_drift: "E_RAW_RUN_PROCESS_START",
    unbound_run_seed_drift: "E_RAW_RUN_SEED",
    unbound_run_order_drift: "E_RAW_RUN_ORDER",
    unbound_run_node_drift: "E_RAW_RUN_NODE",
    unbound_run_v8_drift: "E_RAW_RUN_V8",
    raw_run_environment_drift: "E_RAW_RUN_ENVIRONMENT",
    raw_run_compile_cache_drift: "E_RAW_RUN_COMPILE_CACHE",
    raw_command_count_drift: "E_RAW_COMMAND_COUNT",
    raw_command_argv_drift: "E_RAW_COMMAND_ARGV",
    raw_command_cwd_drift: "E_RAW_COMMAND_CWD",
    unbound_command_exit_drift: "E_RAW_COMMAND_EXIT",
    raw_command_stdout_drift: "E_RAW_COMMAND_STDOUT",
    raw_command_stderr_drift: "E_RAW_COMMAND_STDERR",
    large_adjacent_counter_drift: "E_RAW_COUNTER",
    noncanonical_counter: "E_RAW_SCHEMA",
    duplicate_raw_top_key: "E_RAW_DUPLICATE_KEY",
    duplicate_raw_escaped_top_key: "E_RAW_DUPLICATE_KEY",
    duplicate_raw_counter_key: "E_RAW_DUPLICATE_KEY",
    duplicate_raw_cold_key: "E_RAW_DUPLICATE_KEY",
    duplicate_raw_command_key: "E_RAW_DUPLICATE_KEY",
    raw_pid_fractional_round: "E_RAW_NUMBER_LEXEME",
    raw_pid_exponent_alias: "E_RAW_NUMBER_LEXEME",
    raw_seed_negative_zero: "E_RAW_NUMBER_LEXEME",
    raw_warmup_underflow: "E_RAW_NUMBER_LEXEME",
    raw_aggregate_fractional_round: "E_RAW_NUMBER_LEXEME",
    raw_selected_index_fractional_round: "E_RAW_NUMBER_LEXEME",
    raw_artifact_bytes_fractional_round: "E_RAW_NUMBER_LEXEME",
    raw_command_exit_negative_zero: "E_RAW_NUMBER_LEXEME",
    raw_pid_above_safe: "E_RAW_NUMBER_RANGE",
    raw_command_exit_below_safe: "E_RAW_NUMBER_RANGE",
    raw_pid_overflow_exponent: "E_RAW_NUMBER_LEXEME",
    raw_unicode_unpaired_high: "E_RAW_UNICODE_SCALAR",
    raw_unicode_unpaired_low: "E_RAW_UNICODE_SCALAR",
    raw_unicode_high_non_low: "E_RAW_UNICODE_SCALAR",
    raw_unicode_reversed_pair: "E_RAW_UNICODE_SCALAR",
    raw_invalid_utf8: "E_RAW_ENCODING",
    raw_pid_plus: "E_RAW_JSON",
    raw_pid_leading_zero: "E_RAW_JSON",
    raw_pid_zero: "E_RAW_SCHEMA",
    raw_seed_negative: "E_RAW_SCHEMA",
    registry_pid_fractional_round: "E_REGISTRY_NUMBER_LEXEME",
    registry_pid_exponent_alias: "E_REGISTRY_NUMBER_LEXEME",
    registry_seed_negative_zero: "E_REGISTRY_NUMBER_LEXEME",
    registry_pid_above_safe: "E_REGISTRY_NUMBER_RANGE",
    registry_duplicate_key: "E_REGISTRY_DUPLICATE_KEY",
    registry_unicode_unpaired_high: "E_REGISTRY_UNICODE_SCALAR",
    registry_invalid_utf8: "E_REGISTRY_ENCODING",
    registry_malformed_json: "E_REGISTRY_JSON",
});

function sha256Bytes(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}

function sha256File(path) {
    return sha256Bytes(readFileSync(path));
}

function record(records, id) {
    const found = records.find((item) => item.id === id);
    if (!found) throw new Error(`mutation setup cannot find ${id}`);
    return found;
}

function declareRecord(records, policy, id, kind) {
    const receipt = record(records, "receipt.ietm");
    receipt.recordIds.push(id);
    receipt.declaredCounts[kind] += 1;
    policy.requiredCounts[kind] += 1;
}

function rawEntryForRow(records, row) {
    const fixture = record(records, row.fixtureId);
    const run = record(records, row.runId);
    return {
        version: "parse-that-novelty-raw-row-v3",
        rowId: row.id,
        runId: row.runId,
        run: {
            root: run.root,
            pid: run.pid,
            processStart: run.processStart,
            seed: run.seed,
            order: run.order,
            node: run.node,
            v8: run.v8,
            environment: structuredClone(run.environment),
            compileCacheCanary: run.compileCacheCanary,
            commands: structuredClone(run.commands),
        },
        armId: row.armId,
        fixtureId: row.fixtureId,
        fixtureBytesPath: fixture.bytes.path,
        fixtureVectorPath: fixture.vector.path,
        selectedIndices: structuredClone(fixture.selectedIndices),
        productId: row.productId,
        lawIds: structuredClone(row.lawIds),
        rawNanoseconds: structuredClone(row.rawNanoseconds),
        warmupIterations: row.warmupIterations,
        aggregateIterations: row.aggregateIterations,
        coldSubintervals: structuredClone(row.coldSubintervals),
        mechanismCounters: Object.entries(row.mechanismCounters).map(([name, value]) => ({ name, value })),
        gcBytes: structuredClone(row.gcBytes),
        deoptBytes: structuredClone(row.deoptBytes),
        icBytes: structuredClone(row.icBytes),
        allocationBytes: structuredClone(row.allocationBytes),
        sink: structuredClone(row.sink),
    };
}

function valueAtPath(value, path) {
    return path.reduce((parent, key) => parent[key], value);
}

function setAtPath(value, path, replacement) {
    const parent = valueAtPath(value, path.slice(0, -1));
    parent[path.at(-1)] = structuredClone(replacement);
}

function replaceUniqueToken(encoded, sentinel, token, id) {
    const quoted = JSON.stringify(sentinel);
    const first = encoded.indexOf(quoted);
    if (first < 0 || first !== encoded.lastIndexOf(quoted)) {
        throw new Error(`${id}: token sentinel must occur exactly once`);
    }
    return `${encoded.slice(0, first)}${token}${encoded.slice(first + quoted.length)}`;
}

function encodeWithRawToken(entry, path, token, id) {
    const clone = structuredClone(entry);
    const sentinel = `__N1_A4_RAW_TOKEN_${id}__`;
    setAtPath(clone, path, sentinel);
    return replaceUniqueToken(JSON.stringify(clone), sentinel, token, id);
}

function encodeWithRegistryToken(records, recordId, path, token, id) {
    const clone = structuredClone(records);
    const sentinel = `__N1_A4_REGISTRY_TOKEN_${id}__`;
    setAtPath(record(clone, recordId), path, sentinel);
    return replaceUniqueToken(JSON.stringify(clone), sentinel, token, id);
}

function addSecondProductFixtureRow(records, policy) {
    const product = structuredClone(record(records, "product.ietm"));
    product.id = "product.other";
    records.push(product);
    declareRecord(records, policy, product.id, "PRODUCT");

    const fixture = structuredClone(record(records, "fixture.ietm"));
    fixture.id = "fixture.other";
    fixture.expectedProductId = product.id;
    records.push(fixture);
    declareRecord(records, policy, fixture.id, "FIXTURE");

    const row = structuredClone(record(records, "row.ietm"));
    row.id = "row.other";
    row.fixtureId = fixture.id;
    row.productId = product.id;
    records.push(row);
    declareRecord(records, policy, row.id, "ROW");
    return row;
}

function encodeRaw(entries) {
    return Buffer.from(`${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
}

function mutationContext(baseline, mutant) {
    let records = structuredClone(baseline);
    let registryBytes;
    const trustedPolicy = structuredClone(DEFAULT_TRUSTED_POLICY);
    let artifactReader = defaultArtifactReader;
    let expectedRoot = DEFAULT_EXPECTED_ROOT;
    const replaceRawBytes = (bytes) => {
        const receipt = record(records, "receipt.ietm");
        const descriptor = receipt.rawArtifacts.find((artifact) => artifact.path === RAW_PATH);
        descriptor.bytes = bytes.length;
        descriptor.sha256 = sha256Bytes(bytes);
        const base = artifactReader;
        artifactReader = (request) => request.relativePath === RAW_PATH
            ? { ...base(request), bytes }
            : base(request);
    };
    const replaceRawEntries = (entries) => replaceRawBytes(encodeRaw(entries));
    switch (mutant.op) {
        case "empty":
            records = [];
            break;
        case "duplicate":
            records.push(structuredClone(record(records, mutant.recordId)));
            break;
        case "set":
            record(records, mutant.recordId)[mutant.field] = mutant.value;
            break;
        case "setNested":
            setAtPath(record(records, mutant.recordId), mutant.path, mutant.value);
            break;
        case "copyNested":
            setAtPath(
                record(records, mutant.recordId),
                mutant.path,
                valueAtPath(record(records, mutant.sourceRecordId), mutant.sourcePath),
            );
            break;
        case "duplicateRunCommand":
            record(records, "run.ietm").commands.push(structuredClone(record(records, "run.ietm").commands[0]));
            break;
        case "renameAuthority": {
            const authority = record(records, "auth.n1-a");
            authority.id = mutant.value;
            const receipt = record(records, "receipt.ietm");
            receipt.authorityId = mutant.value;
            receipt.recordIds = receipt.recordIds.map((id) => id === "auth.n1-a" ? mutant.value : id);
            break;
        }
        case "addLawAndRebind": {
            const law = structuredClone(record(records, "law.be"));
            law.id = mutant.newId;
            law.family = mutant.family;
            law.decisionUnit = "RATIO";
            records.push(law);
            record(records, "row.ietm").lawIds = [mutant.newId];
            declareRecord(records, trustedPolicy, mutant.newId, "LAW");
            break;
        }
        case "replaceLawFamily":
            record(records, "law.be").family = mutant.family;
            record(records, "law.be").decisionUnit = "RATIO";
            break;
        case "deleteKind":
            records = records.filter((item) => item.kind !== mutant.kind);
            break;
        case "clone": {
            const copy = structuredClone(record(records, mutant.recordId));
            copy.id = mutant.newId;
            records.push(copy);
            break;
        }
        case "cloneDeclareAndTrust": {
            const source = record(records, mutant.recordId);
            const copy = structuredClone(source);
            copy.id = mutant.newId;
            records.push(copy);
            declareRecord(records, trustedPolicy, mutant.newId, source.kind);
            break;
        }
        case "removeRecordId":
            record(records, "receipt.ietm").recordIds = record(records, "receipt.ietm").recordIds.filter((id) => id !== mutant.value);
            break;
        case "addRecordId":
            record(records, "receipt.ietm").recordIds.push(mutant.value);
            break;
        case "setDeclaredCount":
            record(records, "receipt.ietm").declaredCounts[mutant.kind] = mutant.value;
            break;
        case "setSchemaSha":
            record(records, mutant.recordId).schemaSha256 = mutant.value;
            break;
        case "setArmFamily":
            record(records, "arm.ietm").family = mutant.family;
            break;
        case "setRegistryPath":
            record(records, "receipt.ietm").registryArtifacts[mutant.index].path = mutant.value;
            break;
        case "setRawPath":
            record(records, "receipt.ietm").rawArtifacts[0].path = mutant.value;
            break;
        case "copyRegistryToRaw":
            record(records, "receipt.ietm").rawArtifacts[0] = structuredClone(record(records, "receipt.ietm").registryArtifacts[mutant.index]);
            break;
        case "setArmArtifactBytes":
            record(records, "arm.ietm").artifact.bytes = mutant.value;
            break;
        case "setArmArtifactPath":
            record(records, "arm.ietm").artifact.path = mutant.value;
            break;
        case "readerSymlink": {
            const base = artifactReader;
            artifactReader = (request) => request.relativePath === mutant.path
                ? { ...base(request), isSymlink: true }
                : base(request);
            break;
        }
        case "readerMissing": {
            const base = artifactReader;
            artifactReader = (request) => {
                if (request.relativePath === mutant.path) {
                    const error = new Error("hostile missing artifact");
                    error.code = "ENOENT";
                    throw error;
                }
                return base(request);
            };
            break;
        }
        case "setFixtureHash":
            record(records, "fixture.ietm").bytes.sha256 = mutant.value;
            record(records, "row.ietm").allocationBytes.sha256 = mutant.value;
            break;
        case "setCounter":
            record(records, "row.ietm").mechanismCounters[mutant.name] = mutant.value;
            break;
        case "replaceCounters":
            record(records, "row.ietm").mechanismCounters = mutant.value;
            break;
        case "crossSwapProducts": {
            const second = addSecondProductFixtureRow(records, trustedPolicy);
            record(records, "row.ietm").productId = "product.other";
            second.productId = "product.ietm";
            replaceRawEntries([
                rawEntryForRow(records, record(records, "row.ietm")),
                rawEntryForRow(records, second),
            ]);
            break;
        }
        case "setRawField": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            entry[mutant.field] = structuredClone(mutant.value);
            replaceRawEntries([entry]);
            break;
        }
        case "setRawNested": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            setAtPath(entry, mutant.path, mutant.value);
            replaceRawEntries([entry]);
            break;
        }
        case "copyRawNested": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            setAtPath(entry, mutant.path, valueAtPath(entry, mutant.sourcePath));
            replaceRawEntries([entry]);
            break;
        }
        case "setRawCounter": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            entry.mechanismCounters[0].value = mutant.value;
            replaceRawEntries([entry]);
            break;
        }
        case "adjacentCounter": {
            record(records, "row.ietm").mechanismCounters.memoReuse = mutant.registryValue;
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            entry.mechanismCounters[0].value = mutant.rawValue;
            replaceRawEntries([entry]);
            break;
        }
        case "duplicateRawCounter": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            entry.mechanismCounters.push(structuredClone(entry.mechanismCounters[0]));
            replaceRawEntries([entry]);
            break;
        }
        case "duplicateRawRow": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            replaceRawEntries([entry, entry]);
            break;
        }
        case "omitSecondRawRow":
            addSecondProductFixtureRow(records, trustedPolicy);
            replaceRawEntries([rawEntryForRow(records, record(records, "row.ietm"))]);
            break;
        case "extraRawRow": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            replaceRawEntries([entry, { ...structuredClone(entry), rowId: "row.extra" }]);
            break;
        }
        case "malformedRaw":
            replaceRawBytes(Buffer.from("{\n"));
            break;
        case "duplicateRawKey": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            const encoded = JSON.stringify(entry);
            const replacements = {
                top: ['"rowId":"row.ietm"', '"rowId":"row.ietm","rowId":"row.ietm"'],
                escapedTop: ['"rowId":"row.ietm"', '"rowId":"row.ietm","row\\u0049d":"row.ietm"'],
                counter: ['"name":"memoReuse","value":"1"', '"name":"memoReuse","value":"1","value":"1"'],
                cold: ['"startupNs":"1"', '"startupNs":"1","startupNs":"1"'],
                command: ['"exitCode":0', '"exitCode":0,"exitCode":0'],
            };
            const [needle, replacement] = replacements[mutant.location] ?? [];
            const duplicate = encoded.replace(needle, replacement);
            if (!needle || duplicate === encoded) throw new Error(`duplicate key setup failed for ${mutant.location}`);
            replaceRawBytes(Buffer.from(`${duplicate}\n`));
            break;
        }
        case "replaceRawToken": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            const encoded = encodeWithRawToken(entry, mutant.path, mutant.token, mutant.id);
            replaceRawBytes(Buffer.from(`${encoded}\n`));
            break;
        }
        case "invalidRawUtf8":
            replaceRawBytes(Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xed, 0xa0, 0x80, 0x22, 0x7d, 0x0a]));
            break;
        case "replaceRegistryToken":
            registryBytes = Buffer.from(encodeWithRegistryToken(records, mutant.recordId, mutant.path, mutant.token, mutant.id));
            break;
        case "duplicateRegistryKey": {
            const encoded = JSON.stringify(records);
            const needle = '"pid":1,';
            if (encoded.indexOf(needle) < 0 || encoded.indexOf(needle) !== encoded.lastIndexOf(needle)) {
                throw new Error("registry duplicate-key setup did not resolve one PID token");
            }
            registryBytes = Buffer.from(encoded.replace(needle, '"pid":1,"pid":1,'));
            break;
        }
        case "invalidRegistryUtf8":
            registryBytes = Buffer.from([0x5b, 0x22, 0xed, 0xa0, 0x80, 0x22, 0x5d]);
            break;
        case "malformedRegistry":
            registryBytes = Buffer.from("[{");
            break;
        case "invalidRawSchema": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            delete entry.armId;
            replaceRawEntries([entry]);
            break;
        }
        case "rawAggregateDrift": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            entry.aggregateIterations = 2;
            entry.rawNanoseconds = ["1", "1"];
            replaceRawEntries([entry]);
            break;
        }
        case "rawSampleCountDrift": {
            const entry = rawEntryForRow(records, record(records, "row.ietm"));
            entry.aggregateIterations = 2;
            replaceRawEntries([entry]);
            break;
        }
        case "unusedRawFile": {
            const path = "docs/tranches/B/artifacts/novelty-n1-a1-semantic-registry/unused.ndjson";
            const bytes = Buffer.alloc(0);
            record(records, "receipt.ietm").rawArtifacts.push({ path, bytes: 0, sha256: sha256Bytes(bytes) });
            trustedPolicy.rawArtifacts.push(path);
            const base = artifactReader;
            artifactReader = (request) => request.relativePath === path
                ? { bytes, isFile: true, isSymlink: false, realPath: request.absolutePath }
                : base(request);
            break;
        }
        default:
            throw new Error(`unknown mutation op ${mutant.op}`);
    }
    return {
        registryBytes: registryBytes ?? Buffer.from(JSON.stringify(records)),
        records,
        trustedPolicy,
        artifactReader,
        expectedRoot,
    };
}

function validate(context) {
    return validateNoveltyRegistry({
        registryBytes: context.registryBytes ?? Buffer.from(JSON.stringify(context.records)),
        schemaBytes: SCHEMA_BYTES,
        rawSchemaBytes: RAW_SCHEMA_BYTES,
        expectedRoot: context.expectedRoot,
        trustedPolicy: context.trustedPolicy,
        artifactReader: context.artifactReader,
    });
}

function expectGreen(id, context) {
    const result = validate(context);
    if (result.status !== "GREEN") throw new Error(`${id} did not return GREEN`);
    return { id, status: result.status, recordCount: result.recordCount };
}

function expectRed(mutant, context) {
    const expectedCode = EXPECTED[mutant.id];
    if (!expectedCode) throw new Error(`no independent expectation for ${mutant.id}`);
    try {
        validate(context);
    } catch (error) {
        if (!(error instanceof RegistrySemanticError)) throw error;
        if (error.code !== expectedCode) {
            throw new Error(`${mutant.id}: expected ${expectedCode}, received ${error.code}`);
        }
        return { id: mutant.id, status: "RED", expectedCode, actualCode: error.code, path: error.path };
    }
    throw new Error(`${mutant.id}: validator accepted hostile registry`);
}

export function runHostiles() {
    const baselineBytes = readFileSync(BASELINE_PATH);
    const baseline = JSON.parse(baselineBytes);
    const mutants = JSON.parse(readFileSync(MUTANTS_PATH, "utf8"));
    const unknown = mutants.map((mutant) => mutant.id).filter((id) => !(id in EXPECTED));
    const missing = Object.keys(EXPECTED).filter((id) => !mutants.some((mutant) => mutant.id === id));
    if (unknown.length || missing.length) {
        throw new Error(`expectation/mutant census mismatch: unknown=${unknown.join(",")} missing=${missing.join(",")}`);
    }

    const baselineContext = {
        registryBytes: baselineBytes,
        records: baseline,
        trustedPolicy: structuredClone(DEFAULT_TRUSTED_POLICY),
        artifactReader: defaultArtifactReader,
        expectedRoot: DEFAULT_EXPECTED_ROOT,
    };
    const makeControl = ({ id, pid = 1, seed = 0, exitCode = 0, processStart, escaped }) => {
        const records = structuredClone(baseline);
        const run = record(records, "run.ietm");
        run.pid = pid;
        run.seed = seed;
        run.commands[0].exitCode = exitCode;
        if (processStart !== undefined) run.processStart = processStart;
        const entry = rawEntryForRow(records, record(records, "row.ietm"));
        let encoded = JSON.stringify(entry);
        if (escaped) {
            const literal = JSON.stringify(processStart).slice(1, -1);
            if (!encoded.includes(literal)) throw new Error(`${id}: Unicode control literal is absent`);
            encoded = encoded.replace(literal, escaped);
        }
        const bytes = Buffer.from(`${encoded}\n`);
        const descriptor = record(records, "receipt.ietm").rawArtifacts.find((artifact) => artifact.path === RAW_PATH);
        descriptor.bytes = bytes.length;
        descriptor.sha256 = sha256Bytes(bytes);
        const reader = (request) => request.relativePath === RAW_PATH
            ? { ...defaultArtifactReader(request), bytes }
            : defaultArtifactReader(request);
        return {
            id,
            context: {
                ...baselineContext,
                registryBytes: Buffer.from(JSON.stringify(records)),
                records,
                artifactReader: reader,
            },
        };
    };
    const controlInputs = [
        makeControl({ id: "baseline_safe_integer_boundaries", pid: Number.MAX_SAFE_INTEGER, seed: Number.MAX_SAFE_INTEGER, exitCode: Number.MIN_SAFE_INTEGER }),
        makeControl({ id: "baseline_literal_astral_scalar", processStart: "💜" }),
        makeControl({ id: "baseline_escaped_scalar_pair", processStart: "💜", escaped: "\\uD83D\\uDC9C" }),
        makeControl({ id: "baseline_escaped_low_boundary_pair", processStart: "𐀀", escaped: "\\uD800\\uDC00" }),
        makeControl({ id: "baseline_escaped_high_boundary_pair", processStart: "􏿿", escaped: "\\uDBFF\\uDFFF" }),
    ];
    const distinctScopeRecords = structuredClone(baseline);
    const distinctScopePolicy = structuredClone(DEFAULT_TRUSTED_POLICY);
    const distinctScope = ["é", "e\u0301", "ZERO_DOWNSTREAM_CREDIT", "N2_LAW=PL_BE_NET_BENEFIT"];
    record(distinctScopeRecords, "auth.n1-a").scope = structuredClone(distinctScope);
    distinctScopePolicy.authority.scope = [...distinctScope].reverse();
    const controls = [
        expectGreen("baseline", baselineContext),
        expectGreen("baseline_reversed_order", {
            ...baselineContext,
            registryBytes: Buffer.from(JSON.stringify([...baseline].reverse())),
            records: [...baseline].reverse(),
        }),
        expectGreen("baseline_code_unit_distinct_scope", {
            ...baselineContext,
            registryBytes: Buffer.from(JSON.stringify(distinctScopeRecords)),
            records: distinctScopeRecords,
            trustedPolicy: distinctScopePolicy,
        }),
        ...controlInputs.map(({ id, context }) => expectGreen(id, context)),
    ];
    const hostileResults = mutants.map((mutant) => expectRed(mutant, mutationContext(baseline, mutant)));
    return {
        status: "GREEN",
        controls,
        hostileCount: hostileResults.length,
        hostiles: hostileResults,
        inputs: {
            baselineSha256: sha256File(BASELINE_PATH),
            mutantsSha256: sha256File(MUTANTS_PATH),
            validatorSha256: sha256File(VALIDATOR_PATH),
            validatorTestSha256: sha256File(TEST_PATH),
            schemaSha256: sha256File(SCHEMA_PATH),
            rawSchemaSha256: sha256File(DEFAULT_RAW_SCHEMA_PATH),
            trustedPolicySha256: sha256Bytes(Buffer.from(JSON.stringify(DEFAULT_TRUSTED_POLICY))),
            expectedRoot: DEFAULT_EXPECTED_ROOT,
        },
    };
}

function main() {
    const result = runHostiles();
    const output = `${JSON.stringify(result, null, 2)}\n`;
    if (process.argv.includes("--write-results")) writeFileSync(RESULTS_PATH, output);
    process.stdout.write(output);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
