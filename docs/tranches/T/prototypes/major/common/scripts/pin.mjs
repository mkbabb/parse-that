#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  unlink,
} from "node:fs/promises";
import { arch, hostname, platform } from "node:os";
import { basename, dirname, isAbsolute, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applePlatform,
  canonical,
  dirtyLedger,
  gitCommand,
  gitTool,
  indexLedger,
  ledger,
  lockLedger,
  nativeTool,
  rawGitAuthority,
  requireInside,
  rustAuthority,
  sha256,
} from "./hash.mjs";

const common = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parseThat = resolve(common, "../../../../../..");
const runsRoot = resolve(common, "runs");
const configPath = resolve(common, "pins.config.json");
const leasePath = resolve(
  parseThat,
  "../bbnf-lang/restart/skinny/tranches/sk-v25/waves/PT-0/evidence/R6-SOURCE-LEASE.json",
);

const repositoryRoots = [
  ["parse-that", "."],
  ["bbnf-lang", "../bbnf-lang"],
  ["keyframes.js", "../keyframes.js"],
  ["glass-ui", "../glass-ui"],
];

const profileDefinitions = {
  "pt0-parse-only": {
    schema_version: 1,
    contract: "PT-0.W0",
    name: "pt0-parse-only",
    scope: "PT-0.W0.parse-only",
    gate_status: "RED",
    platform: "darwin",
    arch: "arm64",
    repository_allowlist: ["parse-that"],
    tool_allowlist: ["git", "node", "rustc", "cargo"],
  },
};

const profilePaths = {
  "pt0-parse-only": resolve(common, "profiles/pt0-parse-only.json"),
};

function git(root, ...args) {
  return gitCommand(args, root).toString("utf8").trim();
}

function optionalGit(root, ...args) {
  try {
    return git(root, ...args);
  } catch {
    return null;
  }
}

function validateRelative(path, label) {
  if (
    typeof path !== "string" ||
    path.length === 0 ||
    path.includes("\0") ||
    isAbsolute(path) ||
    normalize(path) !== path ||
    path === ".." ||
    path.startsWith(`..${sep}`)
  ) {
    throw new Error(`${label} must be a normalized repository-relative path: ${path}`);
  }
}

function sameArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function exactRecord(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const actual = Object.keys(value);
  const expected = [...keys];
  const unknown = actual.filter((key) => !expected.includes(key));
  const missing = expected.filter((key) => !actual.includes(key));
  if (unknown.length > 0) throw new Error(`${label} has unknown key: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`${label} has missing key: ${missing.join(", ")}`);
}

function requiredString(value, label) {
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
}

function requiredInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer`);
}

function requiredHash(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label} must be SHA-256`);
}

export function validateLease(lease, now = new Date()) {
  exactRecord(
    lease,
    [
      "schema_version",
      "contract",
      "repository",
      "scope",
      "holder",
      "starts_at",
      "expires_at",
      "acknowledgement_sha256",
      "status",
    ],
    "lease",
  );
  if (lease.schema_version !== 1 || lease.contract !== "PT-0.W0-R6-SOURCE-LEASE") {
    throw new Error("lease contract mismatch");
  }
  if (lease.repository !== "parse-that" || lease.scope !== "all source and build-input bytes") {
    throw new Error("lease scope mismatch");
  }
  requiredString(lease.holder, "lease holder");
  requiredHash(lease.acknowledgement_sha256, "lease acknowledgement");
  if (lease.status !== "ACTIVE") throw new Error("lease is not active");
  const starts = Date.parse(lease.starts_at);
  const expires = Date.parse(lease.expires_at);
  if (!Number.isFinite(starts) || !Number.isFinite(expires) || starts > now.getTime() || expires <= now.getTime()) {
    throw new Error("lease is not active in its bounded window");
  }
}

async function loadLease() {
  const bytes = await containedRegularFile(dirname(leasePath), leasePath, "R6 source lease");
  const value = parseCanonical(bytes, "R6 source lease");
  validateLease(value);
  return {
    path: basename(leasePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    starts_at: value.starts_at,
    expires_at: value.expires_at,
    acknowledgement_sha256: value.acknowledgement_sha256,
  };
}

async function assertLeaseCurrent(binding) {
  const actual = await loadLease();
  if (canonical(actual) !== canonical(binding)) throw new Error("R6 source lease changed during capture");
}

export function validateConfig(config) {
  if (config.schema_version !== 3 || config.contract !== "PT-0.W0") {
    throw new Error("unsupported PT-0 pin configuration");
  }
  if (!Array.isArray(config.repositories)) throw new Error("pin configuration has no repository catalog");
  const expectedIds = repositoryRoots.map(([id]) => id);
  if (!sameArray(config.repositories.map(({ id }) => id), expectedIds)) {
    throw new Error(`pin configuration must use the exact repository catalog: ${expectedIds.join(", ")}`);
  }

  const permittedOutputs = [
    "docs/tranches/T/prototypes/major/common/receipts",
    "docs/tranches/T/prototypes/major/common/runs",
  ];
  for (let index = 0; index < config.repositories.length; index += 1) {
    const repository = config.repositories[index];
    const [expectedId, expectedRoot] = repositoryRoots[index];
    if (repository.id !== expectedId || repository.relative_path !== expectedRoot) {
      throw new Error(`repository ${expectedId} must use exact root ${expectedRoot}`);
    }
    if (repository.package_json !== undefined) {
      validateRelative(repository.package_json.path, "package manifest");
      if (!repository.package_json.name || !repository.package_json.version) {
        throw new Error(`repository ${repository.id} has an incomplete package coordinate`);
      }
    }
    if (!Array.isArray(repository.operands) || repository.operands.length === 0) {
      throw new Error(`repository ${repository.id} has no named operands`);
    }
    const operandIds = new Set();
    for (const operand of repository.operands) {
      if (!operand.id || operandIds.has(operand.id)) throw new Error(`duplicate operand id: ${operand.id}`);
      operandIds.add(operand.id);
      if (!Array.isArray(operand.roots) || operand.roots.length === 0) {
        throw new Error(`operand ${repository.id}/${operand.id} has no roots`);
      }
      for (const path of operand.roots) validateRelative(path, "operand root");
    }
    for (const path of repository.lockfiles ?? []) validateRelative(path, "lockfile");
    for (const path of repository.content_excludes ?? []) validateRelative(path, "content exclusion");
    for (const path of repository.output_excludes ?? []) validateRelative(path, "output exclusion");
    if (repository.id === "parse-that") {
      if (!sameArray(repository.output_excludes, permittedOutputs)) {
        throw new Error("parse-that must self-exclude exactly the common receipts and runs roots");
      }
    } else if (!sameArray(repository.output_excludes ?? [], [])) {
      throw new Error(`repository ${repository.id} cannot declare evidence output exclusions`);
    }
  }
}

export function validateProfile(profile, profileName) {
  const expected = profileDefinitions[profileName];
  if (expected === undefined) throw new Error(`unknown evidence profile: ${profileName}`);
  if (canonical(profile) !== canonical(expected)) {
    throw new Error(`profile ${profileName} does not match its exact allowlist`);
  }
}

async function containedRegularFile(root, path, label) {
  const boundary = resolve(root);
  if ((await realpath(boundary)) !== boundary) throw new Error(`${label} root has symlinked ancestry`);
  const target = requireInside(boundary, resolve(boundary, path));
  const offset = relative(boundary, target);
  let current = boundary;
  const components = offset === "" ? [] : offset.split(sep);
  for (let index = 0; index < components.length; index += 1) {
    current = resolve(current, components[index]);
    const metadata = await lstat(current);
    if (metadata.isSymbolicLink()) throw new Error(`${label} has symlinked ancestry`);
    const final = index === components.length - 1;
    if (final ? !metadata.isFile() : !metadata.isDirectory()) {
      throw new Error(`${label} is not a contained regular file`);
    }
  }
  if ((await realpath(target)) !== target) throw new Error(`${label} escapes its declared root`);
  return readFile(target);
}

async function loadInputs(profileName) {
  const selectedPath = profilePaths[profileName];
  if (selectedPath === undefined) throw new Error(`unknown evidence profile: ${profileName}`);
  const [configBytes, profileBytes] = await Promise.all([
    containedRegularFile(common, configPath, "pin configuration"),
    containedRegularFile(common, selectedPath, "evidence profile"),
  ]);
  const config = JSON.parse(configBytes);
  const profile = JSON.parse(profileBytes);
  validateConfig(config);
  validateProfile(profile, profileName);
  return {
    config: { bytes: configBytes, value: config, sha256: sha256(configBytes) },
    profile: { path: selectedPath, bytes: profileBytes, value: profile, sha256: sha256(profileBytes) },
  };
}

async function assertInputsCurrent(inputs) {
  const [currentConfig, currentProfile] = await Promise.all([
    containedRegularFile(common, configPath, "pin configuration"),
    containedRegularFile(common, inputs.profile.path, "evidence profile"),
  ]);
  if (!currentConfig.equals(inputs.config.bytes) || !currentProfile.equals(inputs.profile.bytes)) {
    throw new Error("configuration or profile changed during capture");
  }
}

async function repositoryRoot(workspace, specification) {
  const parent = await realpath(resolve(workspace, ".."));
  const candidate = requireInside(parent, resolve(workspace, specification.relative_path));
  const root = await realpath(candidate);
  requireInside(parent, root);
  const top = await realpath(git(root, "rev-parse", "--show-toplevel"));
  if (top !== root) throw new Error(`declared repository root is not a Git toplevel: ${specification.id}`);
  return root;
}

function requirePresent(result, label) {
  const missing = result.entries.filter(({ kind }) => kind === "missing").map(({ path }) => path);
  if (missing.length > 0) throw new Error(`missing declared ${label}: ${missing.join(", ")}`);
}

async function packagePin(root, expected) {
  if (expected === undefined) return undefined;
  const bytes = await containedRegularFile(root, expected.path, `package manifest ${expected.path}`);
  const manifest = JSON.parse(bytes);
  if (manifest.name !== expected.name || manifest.version !== expected.version) {
    throw new Error(`package coordinate drifted at ${expected.path}: expected ${expected.name}@${expected.version}`);
  }
  return {
    path: expected.path,
    name: manifest.name,
    version: manifest.version,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function repository(workspace, specification) {
  const root = await repositoryRoot(workspace, specification);
  const authority = await rawGitAuthority(root);
  const excludes = specification.output_excludes ?? [];
  const contentExcludes = [...excludes, ...(specification.content_excludes ?? [])];
  const index = indexLedger(root, excludes);
  const operands = [];
  for (const operand of specification.operands) {
    const content = await ledger(root, operand.roots, contentExcludes, index.records);
    requirePresent(content, `operand ${specification.id}/${operand.id}`);
    operands.push({ id: operand.id, roots: operand.roots, content });
  }
  const result = {
    id: specification.id,
    head: git(root, "rev-parse", "HEAD"),
    head_tree: git(root, "rev-parse", "HEAD^{tree}"),
    branch: optionalGit(root, "symbolic-ref", "--quiet", "--short", "HEAD"),
    ...(specification.package_json === undefined
      ? {}
      : { package: await packagePin(root, specification.package_json) }),
    index: index.receipt,
    dirty: await dirtyLedger(root, excludes, index.records),
    content_excludes: specification.content_excludes ?? [],
    operands,
    lockfiles: await lockLedger(root, specification.lockfiles ?? [], index.records),
    authority,
  };
  if (canonical(await rawGitAuthority(root)) !== canonical(authority)) {
    throw new Error(`raw Git authority changed during repository census: ${specification.id}`);
  }
  return result;
}

async function toolchain(workspace, names) {
  const rust = await rustAuthority(workspace);
  const captures = {
    git: () => gitTool(workspace),
    node: () => nativeTool("node", process.execPath, ["--version"], workspace),
    rustc: () => rust.rustc,
    cargo: () => rust.cargo,
  };
  return { rust, tools: await Promise.all(names.map((name) => captures[name]())) };
}

function profileBinding(inputs) {
  const profile = inputs.profile.value;
  return {
    name: profile.name,
    scope: profile.scope,
    bytes: inputs.profile.bytes.length,
    sha256: inputs.profile.sha256,
    repository_allowlist: profile.repository_allowlist,
    tool_allowlist: profile.tool_allowlist,
  };
}

async function snapshotWithInputs(inputs) {
  const specifications = new Map(inputs.config.value.repositories.map((entry) => [entry.id, entry]));
  const repositories = [];
  for (const id of inputs.profile.value.repository_allowlist) {
    repositories.push(await repository(parseThat, specifications.get(id)));
  }
  const capturedTools = await toolchain(parseThat, inputs.profile.value.tool_allowlist);
  const receipt = {
    schema_version: 4,
    contract: "PT-0.W0",
    capture_status: "GREEN",
    gate_status: "RED",
    profile: profileBinding(inputs),
    config: { bytes: inputs.config.bytes.length, sha256: inputs.config.sha256 },
    machine: applePlatform(parseThat),
    repositories,
    rust: {
      resolver: capturedTools.rust.resolver,
      toolchain: capturedTools.rust.toolchain,
      sysroot: capturedTools.rust.sysroot,
    },
    tools: capturedTools.tools,
  };
  const text = canonical(receipt);
  if (text.includes(parseThat) || text.includes(resolve(parseThat, ".."))) {
    throw new Error("stable pin receipt contains an absolute workspace path");
  }
  return receipt;
}

export async function snapshot(profileName = "pt0-parse-only") {
  return snapshotWithInputs(await loadInputs(profileName));
}

export class DriftError extends Error {
  constructor(first, second) {
    super("operand drift between consecutive pin censuses");
    this.name = "DriftError";
    this.first = first;
    this.second = second;
  }
}

export async function twoCensus(census) {
  const first = await census();
  const second = await census();
  if (canonical(first) !== canonical(second)) throw new DriftError(first, second);
  return first;
}

async function stableCapture(inputs) {
  const authority = await rawGitAuthority(parseThat);
  const receipt = await twoCensus(() => snapshotWithInputs(inputs));
  await assertInputsCurrent(inputs);
  if (canonical(await rawGitAuthority(parseThat)) !== canonical(authority)) {
    throw new Error("raw Git authority changed during the complete capture census");
  }
  return receipt;
}

function summary(receipt) {
  return {
    sha256: sha256(Buffer.from(`${canonical(receipt)}\n`)),
    config_sha256: receipt.config.sha256,
    profile_sha256: receipt.profile.sha256,
    repositories: receipt.repositories.map((item) => ({
      id: item.id,
      head: item.head,
      index_sha256: item.index.sha256,
      dirty_status_sha256: item.dirty.status.sha256,
      dirty_content_sha256: item.dirty.content.sha256,
      lockfiles_sha256: item.lockfiles.sha256,
      operands: item.operands.map((operand) => ({
        id: operand.id,
        entries: operand.content.entries.length,
        sha256: operand.content.sha256,
      })),
    })),
    tools: receipt.tools.map((tool) => ({
      name: tool.name,
      executable_sha256: tool.executable.sha256,
      version_sha256: tool.version.sha256,
      ...(tool.invocation === undefined
        ? {}
        : {
            launcher_sha256: tool.invocation.launcher.sha256,
            selected_arch: tool.invocation.selected_arch,
            translated: tool.invocation.translated,
          }),
    })),
  };
}

function hostFields() {
  return { platform: platform(), arch: arch() };
}

function assertHost(profile) {
  const actual = hostFields();
  if (actual.platform !== profile.platform || actual.arch !== profile.arch) {
    throw new Error(
      `profile ${profile.name} requires ${profile.platform}/${profile.arch}, got ${actual.platform}/${actual.arch}`,
    );
  }
}

export async function assertNoSymlinkAncestry(root, candidate) {
  const boundary = resolve(root);
  const target = requireInside(boundary, resolve(candidate));
  if ((await realpath(boundary)) !== boundary) {
    throw new Error(`output root has symlinked ancestry: ${boundary}`);
  }
  const offset = relative(boundary, target);
  let current = boundary;
  for (const component of offset === "" ? [] : offset.split(sep)) {
    current = resolve(current, component);
    let metadata;
    try {
      metadata = await lstat(current);
    } catch (error) {
      if (error?.code === "ENOENT") return target;
      throw error;
    }
    if (metadata.isSymbolicLink()) throw new Error(`output ancestry contains a symlink: ${current}`);
  }
  return target;
}

async function syncDirectory(path, onSync) {
  const handle = await open(path, "r");
  try {
    await handle.sync();
    onSync?.("directory", path);
  } finally {
    await handle.close();
  }
}

export async function createExclusiveDirectory(parent, path, { onSync } = {}) {
  const directory = await assertNoSymlinkAncestry(parent, path);
  if (dirname(directory) !== resolve(parent)) throw new Error("bundle must be a direct child of its output root");
  await mkdir(directory, { mode: 0o700 });
  await syncDirectory(directory, onSync);
  await syncDirectory(resolve(parent), onSync);
  return directory;
}

export async function durableCreate(path, bytes, { onSync } = {}) {
  const parent = dirname(path);
  await assertNoSymlinkAncestry(parent, path);
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    onSync?.("file", temporary);
  } finally {
    await handle.close();
  }
  try {
    await link(temporary, path);
    await unlink(temporary);
    await syncDirectory(parent, onSync);
  } catch (error) {
    await unlink(temporary).catch((cleanupError) => {
      if (cleanupError?.code !== "ENOENT") throw cleanupError;
    });
    throw error;
  }
}

function canonicalBytes(value) {
  return Buffer.from(`${canonical(value)}\n`);
}

function parseCanonical(bytes, label) {
  const value = JSON.parse(bytes);
  if (!canonicalBytes(value).equals(bytes)) throw new Error(`${label} is not canonically encoded`);
  return value;
}

function member(file, bytes) {
  return { file, bytes: bytes.length, sha256: sha256(bytes) };
}

const fixtureLeaseBinding = Object.freeze({
  path: "R6-SOURCE-LEASE.json",
  bytes: 1,
  sha256: "0".repeat(64),
  starts_at: "2026-07-22T00:00:00.000Z",
  expires_at: "2026-07-22T01:00:00.000Z",
  acknowledgement_sha256: "1".repeat(64),
});

function completionSeal(receiptBytes, runBytes, inputs, lease) {
  const profile = inputs.profile.value;
  return {
    schema_version: 2,
    contract: "PT-0.W0",
    scope: profile.scope,
    profile: profile.name,
    capture_status: "GREEN",
    gate_status: "RED",
    platform: profile.platform,
    arch: profile.arch,
    config: { bytes: inputs.config.bytes.length, sha256: inputs.config.sha256 },
    lease,
    profile_input: { bytes: inputs.profile.bytes.length, sha256: inputs.profile.sha256 },
    members: {
      receipt: member("receipt.json", receiptBytes),
      run: member("run.json", runBytes),
    },
  };
}

export async function publishBundleMembers(
  bundle,
  receiptBytes,
  runBytes,
  inputs,
  { failAfter, lease = fixtureLeaseBinding, onPublished, onSync } = {},
) {
  await durableCreate(resolve(bundle, "receipt.json"), receiptBytes, { onSync });
  await onPublished?.("receipt");
  if (failAfter === "receipt") throw new Error("injected failure after receipt");
  await durableCreate(resolve(bundle, "run.json"), runBytes, { onSync });
  await onPublished?.("run");
  if (failAfter === "run") throw new Error("injected failure after run");
  const sealBytes = canonicalBytes(completionSeal(receiptBytes, runBytes, inputs, lease));
  await durableCreate(resolve(bundle, "complete.json"), sealBytes, { onSync });
  return sealBytes;
}

async function regularMember(path, label) {
  const metadata = await lstat(path);
  if (metadata.isSymbolicLink() || !metadata.isFile()) throw new Error(`${label} is not a regular file`);
  return readFile(path);
}

export async function readCompletedBundle(bundle) {
  try {
    await lstat(resolve(bundle, "complete.json"));
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error("completion seal missing");
    throw error;
  }
  const names = (await readdir(bundle)).sort();
  if (!sameArray(names, ["complete.json", "receipt.json", "run.json"])) {
    throw new Error("completion bundle has missing or unexpected members");
  }
  const [receiptBytes, runBytes, sealBytes] = await Promise.all([
    regularMember(resolve(bundle, "receipt.json"), "receipt member"),
    regularMember(resolve(bundle, "run.json"), "run member"),
    regularMember(resolve(bundle, "complete.json"), "completion seal"),
  ]);
  const receipt = parseCanonical(receiptBytes, "receipt member");
  const run = parseCanonical(runBytes, "run member");
  const seal = parseCanonical(sealBytes, "completion seal");
  for (const [name, bytes] of [
    ["receipt", receiptBytes],
    ["run", runBytes],
  ]) {
    const expected = seal.members?.[name];
    const file = `${name}.json`;
    if (
      expected?.file !== file ||
      expected.bytes !== bytes.length ||
      expected.sha256 !== sha256(bytes)
    ) {
      throw new Error(`${name} member does not match completion seal`);
    }
  }
  return { receipt, receiptBytes, run, runBytes, seal, sealBytes };
}

function assertField(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label} mismatch: expected ${expected}, got ${actual}`);
}

function requiredBoolean(value, label) {
  if (typeof value !== "boolean") throw new Error(`${label} must be a boolean`);
}

function requiredArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
}

function validateHashBinding(value, label) {
  exactRecord(value, ["bytes", "sha256"], label);
  requiredInteger(value.bytes, `${label}.bytes`);
  requiredHash(value.sha256, `${label}.sha256`);
}

function validateCodeSignature(value, label) {
  exactRecord(value, ["cdhash", "identifier", "team"], label);
  for (const key of ["cdhash", "identifier", "team"]) {
    if (value[key] !== null) requiredString(value[key], `${label}.${key}`);
  }
}

function validateExecutableIdentity(value, label, dependencies = false) {
  exactRecord(
    value,
    dependencies
      ? ["path", "bytes", "sha256", "architectures", "code_signature", "dependencies"]
      : ["path", "bytes", "sha256", "architectures", "code_signature"],
    label,
  );
  requiredString(value.path, `${label}.path`);
  requiredInteger(value.bytes, `${label}.bytes`);
  requiredHash(value.sha256, `${label}.sha256`);
  requiredArray(value.architectures, `${label}.architectures`);
  value.architectures.forEach((item, index) => requiredString(item, `${label}.architectures[${index}]`));
  validateCodeSignature(value.code_signature, `${label}.code_signature`);
  if (dependencies) {
    requiredArray(value.dependencies, `${label}.dependencies`);
    value.dependencies.forEach((item, index) => requiredString(item, `${label}.dependencies[${index}]`));
  }
}

function validateRuntime(value, label) {
  exactRecord(value, ["policy", "files", "system_images", "sha256"], label);
  if (value.policy !== "darwin-non-system-macho-v1") throw new Error(`${label}.policy mismatch`);
  requiredArray(value.files, `${label}.files`);
  value.files.forEach((item, index) => validateExecutableIdentity(item, `${label}.files[${index}]`, true));
  requiredArray(value.system_images, `${label}.system_images`);
  value.system_images.forEach((item, index) => {
    const nested = `${label}.system_images[${index}]`;
    exactRecord(item, ["install_name", "architecture", "uuid"], nested);
    requiredString(item.install_name, `${nested}.install_name`);
    if (!["arm64", "arm64e"].includes(item.architecture)) throw new Error(`${nested}.architecture mismatch`);
    if (!/^[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}$/.test(item.uuid)) {
      throw new Error(`${nested}.uuid mismatch`);
    }
  });
  requiredHash(value.sha256, `${label}.sha256`);
  const body = { policy: value.policy, files: value.files, system_images: value.system_images };
  assertField(value.sha256, sha256(Buffer.from(canonical(body))), `${label}.content hash`);
}

function validateVersion(value, label) {
  exactRecord(value, ["text", "bytes", "sha256"], label);
  requiredString(value.text, `${label}.text`);
  requiredInteger(value.bytes, `${label}.bytes`);
  requiredHash(value.sha256, `${label}.sha256`);
}

function validateTool(value, label) {
  const git = value?.name === "git";
  exactRecord(
    value,
    git
      ? ["name", "authority", "invocation", "executable", "runtime", "version"]
      : ["name", "executable", "runtime", "version"],
    `${label} tool`,
  );
  requiredString(value.name, `${label}.name`);
  validateExecutableIdentity(value.executable, `${label}.executable`);
  validateRuntime(value.runtime, `${label}.runtime`);
  validateVersion(value.version, `${label}.version`);
  if (!git) return;
  exactRecord(value.authority, ["resolver", "dispatcher", "developer"], `${label}.authority`);
  validateTool(value.authority.resolver, `${label}.authority.resolver`);
  validateTool(value.authority.dispatcher, `${label}.authority.dispatcher`);
  exactRecord(value.authority.developer, ["root", "version", "version_plist"], `${label}.authority.developer`);
  requiredString(value.authority.developer.root, `${label}.authority.developer.root`);
  requiredString(value.authority.developer.version, `${label}.authority.developer.version`);
  validateHashBinding(value.authority.developer.version_plist, `${label}.authority.developer.version_plist`);
  exactRecord(
    value.invocation,
    ["launcher", "argument", "selected_arch", "process_arch", "translated"],
    `${label}.invocation`,
  );
  validateHashBinding(value.invocation.launcher, `${label}.invocation.launcher`);
  for (const key of ["argument", "selected_arch", "process_arch"]) {
    requiredString(value.invocation[key], `${label}.invocation.${key}`);
  }
  requiredBoolean(value.invocation.translated, `${label}.invocation.translated`);
}

function validateContentEntry(value, label) {
  const common = ["path", "kind"];
  if (value?.kind === "missing") exactRecord(value, common, label);
  else if (["file", "symlink"].includes(value?.kind)) {
    exactRecord(value, [...common, "mode", "bytes", "sha256"], label);
    requiredInteger(value.mode, `${label}.mode`);
    requiredInteger(value.bytes, `${label}.bytes`);
    requiredHash(value.sha256, `${label}.sha256`);
  } else if (value?.kind === "directory") {
    exactRecord(value, [...common, "mode"], label);
    requiredInteger(value.mode, `${label}.mode`);
  } else if (value?.kind === "submodule") {
    const initialized = Object.hasOwn(value, "head");
    exactRecord(
      value,
      initialized ? [...common, "index_oid", "head", "index", "dirty"] : [...common, "index_oid", "checkout"],
      label,
    );
    requiredString(value.index_oid, `${label}.index_oid`);
    if (initialized) {
      requiredString(value.head, `${label}.head`);
      validateIndex(value.index, `${label}.index`);
      validateDirty(value.dirty, `${label}.dirty`);
    } else requiredString(value.checkout, `${label}.checkout`);
  } else throw new Error(`${label}.kind mismatch`);
  requiredString(value.path, `${label}.path`);
}

function validateLedger(value, label) {
  exactRecord(value, ["entries", "sha256"], label);
  requiredArray(value.entries, `${label}.entries`);
  value.entries.forEach((item, index) => validateContentEntry(item, `${label}.entries[${index}]`));
  requiredHash(value.sha256, `${label}.sha256`);
  assertField(value.sha256, sha256(Buffer.from(canonical(value.entries))), `${label}.content hash`);
}

function validateIndex(value, label) {
  exactRecord(value, ["format", "entries", "bytes", "sha256"], label);
  requiredString(value.format, `${label}.format`);
  requiredInteger(value.entries, `${label}.entries`);
  requiredInteger(value.bytes, `${label}.bytes`);
  requiredHash(value.sha256, `${label}.sha256`);
}

function validateStatusRecord(value, label) {
  const keys = {
    ordinary: ["type", "xy", "submodule", "head_mode", "index_mode", "worktree_mode", "head_oid", "index_oid", "path"],
    rename_or_copy: ["type", "xy", "submodule", "head_mode", "index_mode", "worktree_mode", "head_oid", "index_oid", "score", "path", "source"],
    unmerged: ["type", "xy", "submodule", "stage1_mode", "stage2_mode", "stage3_mode", "worktree_mode", "stage1_oid", "stage2_oid", "stage3_oid", "path"],
    untracked: ["type", "path"],
  }[value?.type];
  if (keys === undefined) throw new Error(`${label}.type mismatch`);
  exactRecord(value, keys, label);
  keys.forEach((key) => requiredString(value[key], `${label}.${key}`));
}

function validateDirty(value, label) {
  exactRecord(value, ["status", "content"], label);
  exactRecord(value.status, ["format", "records", "bytes", "sha256"], `${label}.status`);
  requiredString(value.status.format, `${label}.status.format`);
  requiredArray(value.status.records, `${label}.status.records`);
  value.status.records.forEach((item, index) => validateStatusRecord(item, `${label}.status.records[${index}]`));
  requiredInteger(value.status.bytes, `${label}.status.bytes`);
  requiredHash(value.status.sha256, `${label}.status.sha256`);
  validateLedger(value.content, `${label}.content`);
}

function validateRawFile(value, label) {
  exactRecord(value, ["bytes", "sha256", "device", "inode", "mode", "size", "mtime_ns", "ctime_ns"], label);
  requiredInteger(value.bytes, `${label}.bytes`);
  requiredHash(value.sha256, `${label}.sha256`);
  for (const key of ["device", "inode", "mode", "size", "mtime_ns", "ctime_ns"]) {
    requiredString(value[key], `${label}.${key}`);
  }
}

function validateMachine(value, label) {
  exactRecord(value, ["execution_arch", "process_arch", "translated", "operating_system", "kernel", "system_tail", "analyzers"], label);
  requiredString(value.execution_arch, `${label}.execution_arch`);
  requiredString(value.process_arch, `${label}.process_arch`);
  requiredBoolean(value.translated, `${label}.translated`);
  exactRecord(value.operating_system, ["product", "build"], `${label}.operating_system`);
  requiredString(value.operating_system.product, `${label}.operating_system.product`);
  requiredString(value.operating_system.build, `${label}.operating_system.build`);
  exactRecord(value.kernel, ["release", "version"], `${label}.kernel`);
  requiredString(value.kernel.release, `${label}.kernel.release`);
  requiredString(value.kernel.version, `${label}.kernel.version`);
  exactRecord(value.system_tail, ["shared_cache_identity", "code_signing_identity"], `${label}.system_tail`);
  requiredString(value.system_tail.shared_cache_identity, `${label}.system_tail.shared_cache_identity`);
  requiredString(value.system_tail.code_signing_identity, `${label}.system_tail.code_signing_identity`);
  const analyzerNames = ["arch", "codesign", "dyld_info", "lipo", "otool", "sw_vers", "sysctl", "uname"];
  exactRecord(value.analyzers, analyzerNames, `${label}.analyzers`);
  analyzerNames.forEach((name) => validateHashBinding(value.analyzers[name], `${label}.analyzers.${name}`));
}

function validateRust(value, label) {
  exactRecord(value, ["resolver", "toolchain", "sysroot"], label);
  validateTool(value.resolver, `${label}.resolver`);
  exactRecord(value.toolchain, ["active", "selection_bytes", "selection_sha256"], `${label}.toolchain`);
  requiredString(value.toolchain.active, `${label}.toolchain.active`);
  requiredInteger(value.toolchain.selection_bytes, `${label}.toolchain.selection_bytes`);
  requiredHash(value.toolchain.selection_sha256, `${label}.toolchain.selection_sha256`);
  exactRecord(value.sysroot, ["toolchain", "components", "manifests", "sha256"], `${label}.sysroot`);
  requiredString(value.sysroot.toolchain, `${label}.sysroot.toolchain`);
  requiredArray(value.sysroot.components, `${label}.sysroot.components`);
  value.sysroot.components.forEach((item, index) => requiredString(item, `${label}.sysroot.components[${index}]`));
  validateLedger(value.sysroot.manifests, `${label}.sysroot.manifests`);
  requiredHash(value.sysroot.sha256, `${label}.sysroot.sha256`);
  const body = { components: value.sysroot.components, manifests: value.sysroot.manifests };
  assertField(value.sysroot.sha256, sha256(Buffer.from(canonical(body))), `${label}.sysroot.content hash`);
}

function validateRepository(value, label) {
  exactRecord(
    value,
    ["id", "head", "head_tree", "branch", "package", "index", "dirty", "content_excludes", "operands", "lockfiles", "authority"],
    label,
  );
  for (const key of ["id", "head", "head_tree"]) requiredString(value[key], `${label}.${key}`);
  if (value.branch !== null) requiredString(value.branch, `${label}.branch`);
  exactRecord(value.package, ["path", "name", "version", "bytes", "sha256"], `${label}.package`);
  for (const key of ["path", "name", "version"]) requiredString(value.package[key], `${label}.package.${key}`);
  requiredInteger(value.package.bytes, `${label}.package.bytes`);
  requiredHash(value.package.sha256, `${label}.package.sha256`);
  validateIndex(value.index, `${label}.index`);
  validateDirty(value.dirty, `${label}.dirty`);
  requiredArray(value.content_excludes, `${label}.content_excludes`);
  value.content_excludes.forEach((item, index) => requiredString(item, `${label}.content_excludes[${index}]`));
  requiredArray(value.operands, `${label}.operands`);
  value.operands.forEach((item, index) => {
    const nested = `${label}.operands[${index}]`;
    exactRecord(item, ["id", "roots", "content"], nested);
    requiredString(item.id, `${nested}.id`);
    requiredArray(item.roots, `${nested}.roots`);
    item.roots.forEach((root, rootIndex) => requiredString(root, `${nested}.roots[${rootIndex}]`));
    validateLedger(item.content, `${nested}.content`);
  });
  validateLedger(value.lockfiles, `${label}.lockfiles`);
  exactRecord(value.authority, ["index", "config", "head", "worktree_config"], `${label}.authority`);
  for (const name of ["index", "config", "head"]) validateRawFile(value.authority[name], `${label}.authority.${name}`);
  if (value.authority.worktree_config !== null) validateRawFile(value.authority.worktree_config, `${label}.authority.worktree_config`);
}

function validateReceiptSchema(value) {
  exactRecord(
    value,
    ["schema_version", "contract", "capture_status", "gate_status", "profile", "config", "machine", "repositories", "rust", "tools"],
    "receipt",
  );
  requiredInteger(value.schema_version, "receipt.schema_version");
  for (const key of ["contract", "capture_status", "gate_status"]) requiredString(value[key], `receipt.${key}`);
  exactRecord(value.profile, ["name", "scope", "bytes", "sha256", "repository_allowlist", "tool_allowlist"], "receipt.profile");
  for (const key of ["name", "scope"]) requiredString(value.profile[key], `receipt.profile.${key}`);
  requiredInteger(value.profile.bytes, "receipt.profile.bytes");
  requiredHash(value.profile.sha256, "receipt.profile.sha256");
  for (const key of ["repository_allowlist", "tool_allowlist"]) {
    requiredArray(value.profile[key], `receipt.profile.${key}`);
    value.profile[key].forEach((item, index) => requiredString(item, `receipt.profile.${key}[${index}]`));
  }
  validateHashBinding(value.config, "receipt.config");
  validateMachine(value.machine, "receipt.machine");
  requiredArray(value.repositories, "receipt.repositories");
  value.repositories.forEach((item, index) => validateRepository(item, `receipt.repositories[${index}]`));
  validateRust(value.rust, "receipt.rust");
  requiredArray(value.tools, "receipt.tools");
  value.tools.forEach((item, index) => validateTool(item, `receipt.tools[${index}]`));
}

function validateLeaseBinding(value, label) {
  exactRecord(value, ["path", "bytes", "sha256", "starts_at", "expires_at", "acknowledgement_sha256"], label);
  requiredString(value.path, `${label}.path`);
  requiredInteger(value.bytes, `${label}.bytes`);
  requiredHash(value.sha256, `${label}.sha256`);
  requiredString(value.starts_at, `${label}.starts_at`);
  requiredString(value.expires_at, `${label}.expires_at`);
  requiredHash(value.acknowledgement_sha256, `${label}.acknowledgement_sha256`);
}

function validateRunSchema(value) {
  exactRecord(
    value,
    ["schema_version", "contract", "scope", "profile", "capture_status", "gate_status", "captured_at", "host", "platform", "arch", "workspace", "receipt_sha256", "config_sha256", "lease", "profile_sha256"],
    "run",
  );
  requiredInteger(value.schema_version, "run.schema_version");
  for (const key of ["contract", "scope", "profile", "capture_status", "gate_status", "captured_at", "host", "platform", "arch", "workspace"]) {
    requiredString(value[key], `run.${key}`);
  }
  for (const key of ["receipt_sha256", "config_sha256", "profile_sha256"]) requiredHash(value[key], `run.${key}`);
  validateLeaseBinding(value.lease, "run.lease");
}

function validateMemberSchema(value, label) {
  exactRecord(value, ["file", "bytes", "sha256"], `${label} member`);
  requiredString(value.file, `${label}.file`);
  requiredInteger(value.bytes, `${label}.bytes`);
  requiredHash(value.sha256, `${label}.sha256`);
}

function validateSealSchema(value) {
  exactRecord(
    value,
    ["schema_version", "contract", "scope", "profile", "capture_status", "gate_status", "platform", "arch", "config", "lease", "profile_input", "members"],
    "seal",
  );
  requiredInteger(value.schema_version, "seal.schema_version");
  for (const key of ["contract", "scope", "profile", "capture_status", "gate_status", "platform", "arch"]) {
    requiredString(value[key], `seal.${key}`);
  }
  validateHashBinding(value.config, "seal.config");
  validateLeaseBinding(value.lease, "seal.lease");
  validateHashBinding(value.profile_input, "seal.profile_input");
  exactRecord(value.members, ["receipt", "run"], "seal.members");
  validateMemberSchema(value.members.receipt, "receipt");
  validateMemberSchema(value.members.run, "run");
}

export function assertBundleContract(bundle, inputs) {
  const { receipt, receiptBytes, run, runBytes, seal } = bundle;
  const profile = inputs.profile.value;
  validateReceiptSchema(receipt);
  validateRunSchema(run);
  validateSealSchema(seal);
  for (const [record, label] of [
    [receipt, "receipt"],
    [run, "run"],
  ]) {
    assertField(record.schema_version, 4, `${label} schema_version`);
    assertField(record.contract, "PT-0.W0", `${label} contract`);
    assertField(record.capture_status, "GREEN", `${label} capture_status`);
    assertField(record.gate_status, "RED", `${label} gate_status`);
  }
  assertField(receipt.profile?.name, profile.name, "receipt profile");
  assertField(receipt.profile?.scope, profile.scope, "receipt scope");
  assertField(receipt.profile?.bytes, inputs.profile.bytes.length, "receipt profile bytes");
  assertField(receipt.profile?.sha256, inputs.profile.sha256, "receipt profile hash");
  assertField(receipt.config?.bytes, inputs.config.bytes.length, "receipt config bytes");
  assertField(receipt.config?.sha256, inputs.config.sha256, "receipt config hash");
  if (!sameArray(receipt.profile?.repository_allowlist, profile.repository_allowlist)) {
    throw new Error("receipt repository allowlist mismatch");
  }
  if (!sameArray(receipt.profile?.tool_allowlist, profile.tool_allowlist)) {
    throw new Error("receipt tool allowlist mismatch");
  }
  if (!sameArray(receipt.repositories?.map(({ id }) => id), profile.repository_allowlist)) {
    throw new Error("receipt repository payload mismatch");
  }
  if (!sameArray(receipt.tools?.map(({ name }) => name), profile.tool_allowlist)) {
    throw new Error("receipt tool payload mismatch");
  }
  assertField(run.scope, profile.scope, "run scope");
  assertField(run.profile, profile.name, "run profile");
  assertField(run.platform, profile.platform, "run platform");
  assertField(run.arch, profile.arch, "run arch");
  assertField(run.receipt_sha256, sha256(receiptBytes), "run receipt hash");
  assertField(run.config_sha256, inputs.config.sha256, "run config hash");
  assertField(run.profile_sha256, inputs.profile.sha256, "run profile hash");
  if (Object.hasOwn(run, "census")) throw new Error("run must not duplicate the receipt census");
  if (canonical(seal) !== canonical(completionSeal(receiptBytes, runBytes, inputs, run.lease))) {
    throw new Error("seal differs from its canonical constructor");
  }
}

function runRecord(profile, fields) {
  return {
    schema_version: 4,
    contract: "PT-0.W0",
    scope: profile.scope,
    profile: profile.name,
    capture_status: fields.capture_status,
    gate_status: "RED",
    captured_at: new Date().toISOString(),
    host: hostname(),
    platform: platform(),
    arch: arch(),
    workspace: parseThat,
    ...fields,
  };
}

async function validateBundlePath(profileName, bundle) {
  const path = requireInside(runsRoot, resolve(bundle));
  if (dirname(path) !== runsRoot || !basename(path).startsWith(`${profileName}-r6-`)) {
    throw new Error(`bundle must be one unique ${profileName}-r6-* directory directly beneath common/runs`);
  }
  await assertNoSymlinkAncestry(runsRoot, path);
  return path;
}

async function capture(profileName, bundlePath) {
  const inputs = await loadInputs(profileName);
  const profile = inputs.profile.value;
  assertHost(profile);
  const lease = await loadLease();
  const bundle = await validateBundlePath(profileName, bundlePath);
  await createExclusiveDirectory(runsRoot, bundle);

  let receipt;
  try {
    receipt = await stableCapture(inputs);
  } catch (error) {
    const details =
      error instanceof DriftError
        ? {
            capture_status: "RED",
            error: error.message,
            first: summary(error.first),
            second: summary(error.second),
          }
        : { capture_status: "RED", error: error.message };
    details.lease = lease;
    await durableCreate(resolve(bundle, "run.json"), canonicalBytes(runRecord(profile, details)));
    throw error;
  }

  const receiptBytes = canonicalBytes(receipt);
  const receiptDigest = sha256(receiptBytes);
  const run = runRecord(profile, {
    capture_status: "GREEN",
    receipt_sha256: receiptDigest,
    config_sha256: inputs.config.sha256,
    lease,
    profile_sha256: inputs.profile.sha256,
  });
  const runBytes = canonicalBytes(run);
  const sealBytes = await publishBundleMembers(bundle, receiptBytes, runBytes, inputs, { lease });
  const recensus = await stableCapture(inputs);
  if (canonical(recensus) !== canonical(receipt)) throw new Error("post-seal source recensus drifted");
  await assertLeaseCurrent(lease);
  process.stdout.write(
    `${sha256(sealBytes)}  ${relative(parseThat, resolve(bundle, "complete.json"))}  recensus=${sha256(receiptBytes)}\n`,
  );
}

async function verify(profileName, bundlePath) {
  const inputs = await loadInputs(profileName);
  const profile = inputs.profile.value;
  assertHost(profile);
  const bundlePathResolved = await validateBundlePath(profileName, bundlePath);
  const metadata = await lstat(bundlePathResolved);
  if (metadata.isSymbolicLink() || !metadata.isDirectory()) throw new Error("bundle is not a real directory");
  const bundle = await readCompletedBundle(bundlePathResolved);
  assertBundleContract(bundle, inputs);
  const actual = await stableCapture(inputs);
  if (canonical(actual) !== canonical(bundle.receipt)) throw new Error("PT-0 profile receipt drifted");
  process.stdout.write(`PT-0 parse-only bundle verified: ${sha256(bundle.sealBytes)}\n`);
}

export function options(arguments_, action) {
  if (!["capture", "verify"].includes(action)) throw new Error("action must be capture or verify");
  const values = { profile: undefined, bundle: undefined };
  for (let index = 0; index < arguments_.length; index += 1) {
    const name = arguments_[index];
    if (!["--profile", "--bundle"].includes(name)) throw new Error(`unknown option: ${name}`);
    const key = name.slice(2);
    if (values[key] !== undefined) throw new Error(`duplicate option: ${name}`);
    const value = arguments_[index + 1];
    if (value === undefined) throw new Error(`missing value for option: ${name}`);
    values[key] = key === "bundle" ? resolve(value) : value;
    index += 1;
  }
  if (values.profile === undefined || values.bundle === undefined) {
    throw new Error(`${action} requires exactly --profile and --bundle`);
  }
  if (profileDefinitions[values.profile] === undefined) {
    throw new Error(`unknown evidence profile: ${values.profile}`);
  }
  return values;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const action = process.argv[2];
  try {
    const values = options(process.argv.slice(3), action);
    if (action === "capture") await capture(values.profile, values.bundle);
    else await verify(values.profile, values.bundle);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

export const testing = {
  canonicalBytes,
  completionSeal,
  containedRegularFile,
  configPath,
  loadInputs,
  leaseBinding: fixtureLeaseBinding,
  leasePath,
  parseThat,
  profileDefinitions,
  runsRoot,
  validateBundlePath,
};
