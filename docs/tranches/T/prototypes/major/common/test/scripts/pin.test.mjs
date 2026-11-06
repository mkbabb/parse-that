import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { sha256 } from "../../scripts/hash.mjs";
import {
  assertBundleContract,
  assertNoSymlinkAncestry,
  createExclusiveDirectory,
  durableCreate,
  options,
  publishBundleMembers,
  readCompletedBundle,
  snapshot,
  testing,
  validateConfig,
  validateLease,
  validateProfile,
} from "../../scripts/pin.mjs";

const liveSnapshot = snapshot("pt0-parse-only");
const liveInputs = testing.loadInputs("pt0-parse-only");

async function temporary(t, name) {
  const root = await mkdtemp(join(await realpath(tmpdir()), `pt0-r6-${name}-`));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function runFor(receiptBytes, inputs, overrides = {}) {
  const profile = inputs.profile.value;
  return {
    schema_version: 4,
    contract: "PT-0.W0",
    scope: profile.scope,
    profile: profile.name,
    capture_status: "GREEN",
    gate_status: "RED",
    captured_at: "2026-07-22T00:00:00.000Z",
    host: "fixture",
    platform: profile.platform,
    arch: profile.arch,
    workspace: "/fixture",
    receipt_sha256: sha256(receiptBytes),
    config_sha256: inputs.config.sha256,
    lease: testing.leaseBinding,
    profile_sha256: inputs.profile.sha256,
    ...overrides,
  };
}

async function fixtureBundle(t, name, runOverrides = {}) {
  const root = await temporary(t, name);
  const bundle = join(root, "bundle");
  await mkdir(bundle);
  const [receipt, inputs] = await Promise.all([liveSnapshot, liveInputs]);
  const receiptBytes = testing.canonicalBytes(receipt);
  const runBytes = testing.canonicalBytes(runFor(receiptBytes, inputs, runOverrides));
  await publishBundleMembers(bundle, receiptBytes, runBytes, inputs);
  return { bundle, inputs, receiptBytes, runBytes };
}

test("parse-only profile has exact scope, statuses, repository, platform, and tools", async () => {
  const receipt = await liveSnapshot;
  assert.equal(receipt.capture_status, "GREEN");
  assert.equal(receipt.gate_status, "RED");
  assert.equal(receipt.profile.name, "pt0-parse-only");
  assert.equal(receipt.profile.scope, "PT-0.W0.parse-only");
  assert.deepEqual(receipt.repositories.map(({ id }) => id), ["parse-that"]);
  assert.deepEqual(receipt.tools.map(({ name }) => name), ["git", "node", "rustc", "cargo"]);
  assert.equal(receipt.tools.some(({ name }) => name === "npm"), false);
  const git = receipt.tools[0];
  assert.equal(git.invocation.argument, "-arm64");
  assert.equal(git.invocation.selected_arch, "arm64");
  assert.equal(git.invocation.process_arch, "arm64");
  assert.equal(git.invocation.translated, false);
  assert.match(git.invocation.launcher.sha256, /^[0-9a-f]{64}$/);
  assert.equal(process.platform, "darwin");
  assert.equal(process.arch, "arm64");
  assert.equal(JSON.stringify(receipt).includes(testing.parseThat), false);
});

test("configuration and profile bytes are cross-bound to exact allowlists", async () => {
  const [receipt, inputs] = await Promise.all([liveSnapshot, liveInputs]);
  assert.equal(receipt.config.sha256, inputs.config.sha256);
  assert.equal(receipt.profile.sha256, inputs.profile.sha256);
  assert.deepEqual(receipt.profile.repository_allowlist, ["parse-that"]);
  assert.deepEqual(receipt.profile.tool_allowlist, ["git", "node", "rustc", "cargo"]);
  assert.deepEqual(
    inputs.config.value.repositories.find(({ id }) => id === "parse-that").output_excludes,
    [
      "docs/tranches/T/prototypes/major/common/receipts",
      "docs/tranches/T/prototypes/major/common/runs",
    ],
  );
});

test("CLI accepts only one named profile and one bundle", () => {
  const bundle = join(testing.runsRoot, "pt0-parse-only-r6-unit");
  assert.deepEqual(options(["--profile", "pt0-parse-only", "--bundle", bundle], "capture"), {
    profile: "pt0-parse-only",
    bundle,
  });
  assert.throws(() => options([], "capture"), /requires exactly --profile and --bundle/);
  assert.throws(
    () => options(["--config", "arbitrary.json", "--profile", "pt0-parse-only", "--bundle", bundle], "capture"),
    /unknown option: --config/,
  );
  assert.throws(
    () => options(["--profile", "arbitrary", "--bundle", bundle], "capture"),
    /unknown evidence profile/,
  );
});

test("R6 bundle path rejects R5 and unrelated prefixes", async () => {
  const r6 = join(testing.runsRoot, "pt0-parse-only-r6-unit");
  await assert.doesNotReject(testing.validateBundlePath("pt0-parse-only", r6));
  await assert.rejects(
    testing.validateBundlePath("pt0-parse-only", join(testing.runsRoot, "pt0-parse-only-r5-unit")),
    /r6-\*/,
  );
  await assert.rejects(
    testing.validateBundlePath("pt0-parse-only", join(testing.runsRoot, "other-r6-unit")),
    /r6-\*/,
  );
});

test("arbitrary configuration cannot add or disguise a Value repository", async () => {
  const inputs = await liveInputs;
  const extra = structuredClone(inputs.config.value);
  extra.repositories.push({ id: "innocent", relative_path: "../value.js", operands: [] });
  assert.throws(() => validateConfig(extra), /exact repository catalog/);

  const disguised = structuredClone(inputs.config.value);
  disguised.repositories[0].relative_path = "../value.js";
  assert.throws(() => validateConfig(disguised), /must use exact root/);
});

test("governed inputs reject a symlink at any contained path component", async (t) => {
  const root = await temporary(t, "input-link");
  const outside = await temporary(t, "input-outside");
  await writeFile(join(outside, "input.json"), "{}\n");
  await symlink(outside, join(root, "redirect"));
  await assert.rejects(
    testing.containedRegularFile(root, join(root, "redirect", "input.json"), "fixture input"),
    /symlinked ancestry/,
  );
  await symlink(join(outside, "input.json"), join(root, "input-link.json"));
  await assert.rejects(
    testing.containedRegularFile(root, join(root, "input-link.json"), "fixture input"),
    /symlinked ancestry/,
  );
  await mkdir(join(root, "directory-input"));
  await assert.rejects(
    testing.containedRegularFile(root, join(root, "directory-input"), "fixture input"),
    /not a contained regular file/,
  );
  await mkdir(join(root, "real"));
  await writeFile(join(root, "real", "input.json"), "{}\n");
  await assert.doesNotReject(
    testing.containedRegularFile(root, join(root, "real", "input.json"), "fixture input"),
  );
});

test("profile validation rejects repository, tool, status, and platform drift", () => {
  const exact = structuredClone(testing.profileDefinitions["pt0-parse-only"]);
  assert.doesNotThrow(() => validateProfile(exact, "pt0-parse-only"));
  for (const mutate of [
    (profile) => profile.repository_allowlist.push("value.js"),
    (profile) => profile.tool_allowlist.push("npm"),
    (profile) => (profile.gate_status = "GREEN"),
    (profile) => (profile.arch = "x64"),
  ]) {
    const changed = structuredClone(exact);
    mutate(changed);
    assert.throws(() => validateProfile(changed, "pt0-parse-only"), /does not match its exact allowlist/);
  }
});

test("symlinked output ancestry is rejected before creation", async (t) => {
  const root = await temporary(t, "symlink");
  const outside = await temporary(t, "outside");
  await symlink(outside, join(root, "redirect"));
  await assert.rejects(assertNoSymlinkAncestry(root, join(root, "redirect", "bundle")), /contains a symlink/);
  await assert.doesNotReject(assertNoSymlinkAncestry(root, join(root, "new-bundle")));
});

test("concurrent bundle creation has exactly one winner", async (t) => {
  const root = await temporary(t, "race");
  const bundle = join(root, "bundle");
  const results = await Promise.allSettled([
    createExclusiveDirectory(root, bundle),
    createExclusiveDirectory(root, bundle),
  ]);
  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  const rejected = results.find(({ status }) => status === "rejected");
  assert.equal(rejected.reason.code, "EEXIST");
});

test("durable no-replace creation synchronizes file and directory", async (t) => {
  const root = await temporary(t, "durability");
  const output = join(root, "member.json");
  const events = [];
  await durableCreate(output, "first\n", { onSync: (kind) => events.push(kind) });
  assert.deepEqual(events, ["file", "directory"]);
  await assert.rejects(durableCreate(output, "replacement\n"), (error) => error?.code === "EEXIST");
  assert.equal(await readFile(output, "utf8"), "first\n");
});

test("injected member failures never publish a completion seal", async (t) => {
  const [receipt, inputs] = await Promise.all([liveSnapshot, liveInputs]);
  const receiptBytes = testing.canonicalBytes(receipt);
  const runBytes = testing.canonicalBytes(runFor(receiptBytes, inputs));
  for (const failAfter of ["receipt", "run"]) {
    const root = await temporary(t, `fault-${failAfter}`);
    const bundle = join(root, "bundle");
    await mkdir(bundle);
    await assert.rejects(
      publishBundleMembers(bundle, receiptBytes, runBytes, inputs, { failAfter }),
      new RegExp(`injected failure after ${failAfter}`),
    );
    await assert.rejects(readCompletedBundle(bundle), /completion seal missing/);
  }
});

async function killPublication(t, stage) {
  const root = await temporary(t, `kill-${stage}`);
  const bundle = join(root, "bundle");
  await mkdir(bundle);
  const [receipt, inputs] = await Promise.all([liveSnapshot, liveInputs]);
  const receiptPath = join(root, "receipt.fixture");
  const runPath = join(root, "run.fixture");
  await Promise.all([
    writeFile(receiptPath, testing.canonicalBytes(receipt)),
    writeFile(runPath, testing.canonicalBytes(runFor(testing.canonicalBytes(receipt), inputs))),
  ]);
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("./publish-child.mjs", import.meta.url)), bundle, stage, receiptPath, runPath],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let stderr = "";
  child.stderr.on("data", (bytes) => (stderr += bytes));
  await new Promise((resolveReady, rejectReady) => {
    let stdout = "";
    child.stdout.on("data", (bytes) => {
      stdout += bytes;
      if (stdout.includes(`PUBLISHED ${stage}\n`)) resolveReady();
    });
    child.once("exit", (code, signal) => rejectReady(new Error(`child exited before witness: ${code}/${signal}: ${stderr}`)));
  });
  const exited = once(child, "exit");
  child.kill("SIGKILL");
  const [code, signal] = await exited;
  assert.equal(code, null);
  assert.equal(signal, "SIGKILL");
  await assert.rejects(readCompletedBundle(bundle), /completion seal missing/);
  assert.deepEqual(
    (await readdir(bundle)).sort(),
    stage === "receipt" ? ["receipt.json"] : ["receipt.json", "run.json"],
  );
}

test("child interruption after receipt publication cannot verify", async (t) => {
  await killPublication(t, "receipt");
});

test("child interruption after run publication cannot verify", async (t) => {
  await killPublication(t, "run");
});

test("completed bundle verifies every member and all cross-hashes", async (t) => {
  const fixture = await fixtureBundle(t, "complete");
  const bundle = await readCompletedBundle(fixture.bundle);
  assert.doesNotThrow(() => assertBundleContract(bundle, fixture.inputs));
  assert.equal(bundle.seal.members.receipt.sha256, sha256(fixture.receiptBytes));
  assert.equal(bundle.seal.members.run.sha256, sha256(fixture.runBytes));
});

test("run records cannot duplicate or falsify the receipt census", async (t) => {
  const fixture = await fixtureBundle(t, "duplicate-census", { census: { sha256: "0".repeat(64) } });
  const bundle = await readCompletedBundle(fixture.bundle);
  assert.throws(() => assertBundleContract(bundle, fixture.inputs), /run has unknown key: census/);
});

test("missing and mismatched members are rejected", async (t) => {
  const missing = await fixtureBundle(t, "missing");
  await rm(join(missing.bundle, "receipt.json"));
  await assert.rejects(readCompletedBundle(missing.bundle), /missing or unexpected members/);

  const mismatched = await fixtureBundle(t, "mismatch");
  const changed = testing.canonicalBytes({ changed: true });
  await writeFile(join(mismatched.bundle, "run.json"), changed);
  await assert.rejects(readCompletedBundle(mismatched.bundle), /run member does not match completion seal/);
});

test("status, profile, platform, and payload cross-hash mismatches are rejected", async (t) => {
  for (const [name, overrides, pattern] of [
    ["status", { capture_status: "RED" }, /run capture_status mismatch/],
    ["profile", { profile: "arbitrary" }, /run profile mismatch/],
    ["platform", { platform: "linux" }, /run platform mismatch/],
    ["payload", { receipt_sha256: "0".repeat(64) }, /run receipt hash mismatch/],
  ]) {
    const fixture = await fixtureBundle(t, name, overrides);
    const bundle = await readCompletedBundle(fixture.bundle);
    assert.throws(() => assertBundleContract(bundle, fixture.inputs), pattern);
  }
});

test("receipt, run, seal, member, and tool records reject unknown keys", async (t) => {
  for (const [name, mutate, pattern] of [
    ["receipt", (bundle) => (bundle.receipt.unknown = true), /receipt.*unknown key/],
    ["run", (bundle) => (bundle.run.unknown = true), /run.*unknown key/],
    ["seal", (bundle) => (bundle.seal.unknown = true), /seal.*unknown key/],
    ["member", (bundle) => (bundle.seal.members.receipt.unknown = true), /member.*unknown key/],
    ["tool", (bundle) => (bundle.receipt.tools[0].unknown = true), /tool.*unknown key/],
  ]) {
    const fixture = await fixtureBundle(t, `unknown-${name}`);
    const bundle = await readCompletedBundle(fixture.bundle);
    mutate(bundle);
    assert.throws(() => assertBundleContract(bundle, fixture.inputs), pattern);
  }
});

test("receipt, run, seal, member, and tool records reject deleted required fields", async (t) => {
  for (const [name, mutate, pattern] of [
    ["receipt", (bundle) => delete bundle.receipt.tools, /receipt.*missing key/],
    ["run", (bundle) => delete bundle.run.captured_at, /run.*missing key/],
    ["seal", (bundle) => delete bundle.seal.members, /seal.*missing key/],
    ["member", (bundle) => delete bundle.seal.members.receipt.bytes, /member.*missing key/],
    ["tool", (bundle) => delete bundle.receipt.tools[0].version, /tool.*missing key/],
  ]) {
    const fixture = await fixtureBundle(t, `missing-${name}`);
    const bundle = await readCompletedBundle(fixture.bundle);
    mutate(bundle);
    assert.throws(() => assertBundleContract(bundle, fixture.inputs), pattern);
  }
});

test("cooperative source lease has a closed schema and bounded active window", () => {
  const now = new Date("2026-07-22T16:00:00.000Z");
  const lease = {
    schema_version: 1,
    contract: "PT-0.W0-R6-SOURCE-LEASE",
    repository: "parse-that",
    scope: "all source and build-input bytes",
    holder: "pt0-r6-author",
    starts_at: "2026-07-22T15:55:00.000Z",
    expires_at: "2026-07-22T16:25:00.000Z",
    acknowledgement_sha256: "a".repeat(64),
    status: "ACTIVE",
  };
  assert.doesNotThrow(() => validateLease(lease, now));
  assert.throws(() => validateLease({ ...lease, unknown: true }, now), /lease.*unknown key/);
  assert.throws(() => validateLease({ ...lease, expires_at: "2026-07-22T15:59:59.000Z" }, now), /not active/);
});
