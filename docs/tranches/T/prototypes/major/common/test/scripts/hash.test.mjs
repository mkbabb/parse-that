import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, rename, rm, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  assertNoSourceEscapes,
  canonical,
  command,
  dirtyLedger,
  executable,
  gitCommand,
  gitTool,
  guarded,
  indexLedger,
  inside,
  ledger,
  nul,
  parsePorcelainV2,
  rawGitAuthority,
  runtimeClosure,
  rustAuthority,
  sha256,
} from "../../scripts/hash.mjs";
import { twoCensus } from "../../scripts/pin.mjs";

function git(root, ...args) {
  return gitCommand(args, root);
}

async function repository(t, name = "repo") {
  const base = await mkdtemp(join(tmpdir(), `pt0-${name}-`));
  t.after(() => rm(base, { recursive: true, force: true }));
  git(base, "init", "-q");
  git(base, "config", "user.email", "pt0@example.invalid");
  git(base, "config", "user.name", "PT-0 test");
  git(base, "config", "commit.gpgsign", "false");
  return base;
}

async function commit(root, path, bytes = "base") {
  await writeFile(join(root, path), bytes);
  git(root, "add", "--", path);
  git(root, "commit", "-qm", "fixture");
}

test("canonical encoding is independent of object insertion order", () => {
  assert.equal(canonical({ b: 2, a: 1 }), canonical({ a: 1, b: 2 }));
});

test("NUL records preserve empty, whitespace, and newline fields and reject truncation", () => {
  assert.deepEqual(nul(Buffer.from("a b\0\0line\nname\0")).map(String), ["a b", "", "line\nname"]);
  assert.deepEqual(nul(Buffer.alloc(0)), []);
  assert.throws(() => nul(Buffer.from("missing")), /terminal NUL/);
});

test("ledger sorts files, hashes symlink targets, and self-excludes output directories", async (t) => {
  const root = await repository(t, "ledger");
  await mkdir(join(root, "receipts"));
  await mkdir(join(root, "target"));
  await writeFile(join(root, "z-source"), "one");
  await writeFile(join(root, "a-source"), "two");
  await writeFile(join(root, "receipts", "pins.json"), "output");
  await writeFile(join(root, "target", "legitimate-source"), "three");
  await symlink("z-source", join(root, "link"));
  const actual = await ledger(root, ["."], ["receipts"]);
  assert.deepEqual(actual.entries.map(({ path, kind }) => ({ path, kind })), [
    { path: "a-source", kind: "file" },
    { path: "link", kind: "symlink" },
    { path: "target/legitimate-source", kind: "file" },
    { path: "z-source", kind: "file" },
  ]);
  assert.equal(actual.entries[1].sha256, sha256(Buffer.from("z-source")));
  assert.equal(actual.entries[3].sha256, sha256(Buffer.from("one")));
});

test("porcelain-v2 rename parsing preserves exact destination and source names", async (t) => {
  const root = await repository(t, "rename");
  await commit(root, "old\nname", "one");
  await rename(join(root, "old\nname"), join(root, "new\tname"));
  git(root, "add", "-A");
  const bytes = git(root, "status", "--porcelain=v2", "-z", "--untracked-files=all");
  const records = parsePorcelainV2(bytes);
  assert.equal(records.length, 1);
  assert.deepEqual(
    { type: records[0].type, path: records[0].path, source: records[0].source, score: records[0].score },
    { type: "rename_or_copy", path: "new\tname", source: "old\nname", score: "R100" },
  );
  const dirty = await dirtyLedger(root);
  assert.deepEqual(dirty.content.entries.map(({ path, kind }) => ({ path, kind })), [
    { path: "new\tname", kind: "file" },
    { path: "old\nname", kind: "missing" },
  ]);
});

test("index and dirty ledgers independently bind staged and working-tree bytes", async (t) => {
  const root = await repository(t, "planes");
  await commit(root, "tracked", "base");
  await writeFile(join(root, "tracked"), "staged");
  git(root, "add", "tracked");
  const staged = indexLedger(root).receipt;
  await writeFile(join(root, "tracked"), "worktree");
  assert.equal(indexLedger(root).receipt.sha256, staged.sha256);
  const dirty = await dirtyLedger(root);
  assert.equal(dirty.content.entries[0].sha256, sha256(Buffer.from("worktree")));
  git(root, "add", "tracked");
  assert.notEqual(indexLedger(root).receipt.sha256, staged.sha256);
});

test("submodule entries bind gitlink, checked-out HEAD, and nested dirty content", async (t) => {
  const base = await mkdtemp(join(tmpdir(), "pt0-submodule-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  const child = join(base, "child");
  const parent = join(base, "parent");
  await mkdir(child);
  await mkdir(parent);
  for (const root of [child, parent]) {
    git(root, "init", "-q");
    git(root, "config", "user.email", "pt0@example.invalid");
    git(root, "config", "user.name", "PT-0 test");
    git(root, "config", "commit.gpgsign", "false");
  }
  await commit(child, "source", "child");
  await commit(parent, "seed", "parent");
  git(parent, "-c", "protocol.file.allow=always", "submodule", "add", "-q", "../child", "vendor/module");
  git(parent, "commit", "-qam", "add submodule");
  const clean = await ledger(parent, ["vendor/module"]);
  assert.equal(clean.entries[0].kind, "submodule");
  assert.equal(clean.entries[0].index_oid, clean.entries[0].head);
  assert.equal(clean.entries[0].dirty.status.records.length, 0);
  await writeFile(join(parent, "vendor/module/source"), "dirty child");
  const dirty = await ledger(parent, ["vendor/module"]);
  assert.equal(dirty.entries[0].dirty.content.entries[0].sha256, sha256(Buffer.from("dirty child")));
});

test("root and symlink guards reject workspace-source escape", async (t) => {
  const root = await repository(t, "escape");
  await writeFile(join(root, "source"), "inside");
  await symlink("source", join(root, "inside-link"));
  await assert.doesNotReject(assertNoSourceEscapes(root));
  await symlink("../workspace-source", join(root, "outside-link"));
  await assert.rejects(assertNoSourceEscapes(root), /source link escapes crater/);
  assert.equal(inside("/tmp/crater", "/tmp/crater/package/index.mjs"), true);
  assert.equal(inside("/tmp/crater", "/tmp/workspace/source.mjs"), false);
});

test("guarded commands reject lockfile mutation", async (t) => {
  const root = await repository(t, "lock");
  await mkdir(join(root, "package"));
  await writeFile(join(root, "lock"), "before");
  await assert.rejects(
    guarded(root, ["lock"], process.execPath, ["-e", "require('fs').writeFileSync('../lock','after')"], join(root, "package")),
    /changed a lockfile/,
  );
});

test("guarded commands reject write-and-restore lockfile ABA mutation", async (t) => {
  const root = await repository(t, "lock-aba");
  await writeFile(join(root, "lock"), "original");
  await assert.rejects(
    guarded(root, ["lock"], process.execPath, [
      "-e",
      "const fs=require('fs'); const p='lock'; const x=fs.readFileSync(p); fs.writeFileSync(p,'changed'); fs.writeFileSync(p,x)",
    ]),
    /changed a lockfile/,
  );
});

test("guarded commands reject a pre-existing source link before execution", async (t) => {
  const root = await repository(t, "guard-escape");
  await writeFile(join(root, "lock"), "same");
  await symlink("../workspace-source", join(root, "source-link"));
  await assert.rejects(
    guarded(root, ["lock"], process.execPath, ["-e", "require('fs').writeFileSync('ran','yes')"]),
    /source link escapes crater/,
  );
});

test("guarded commands deny direct reads from a declared workspace source root", async (t) => {
  const base = await mkdtemp(join(tmpdir(), "pt0-read-guard-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  const crater = join(base, "crater");
  const workspace = join(base, "workspace");
  await mkdir(crater);
  await mkdir(workspace);
  await writeFile(join(crater, "lock"), "same");
  await writeFile(join(workspace, "source"), "forbidden");
  await assert.rejects(
    guarded(
      crater,
      ["lock"],
      process.execPath,
      ["-e", `require('fs').readFileSync(${JSON.stringify(join(workspace, "source"))})`],
      crater,
      { forbiddenReadRoots: [workspace] },
    ),
    /exited|sandbox unavailable/,
  );
});

test("two-census transaction rejects any unequal source census", async () => {
  let generation = 0;
  await assert.rejects(twoCensus(async () => ({ generation: generation++ })), /operand drift between consecutive/);
});

test("version output executes the exact payload whose bytes are hashed", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "pt0-payload-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const payload = join(root, "payload");
  const wrapper = join(root, "fixture-tool");
  await writeFile(payload, "#!/bin/sh\nprintf 'PAYLOAD\\n'\n");
  await writeFile(wrapper, "#!/bin/sh\nprintf 'WRAPPER\\n'\n");
  await Promise.all([chmod(payload, 0o700), chmod(wrapper, 0o700)]);

  const previousPath = process.env.PATH;
  process.env.PATH = `${root}:${previousPath}`;
  try {
    const captured = await executable("fixture-tool", ["--version"], root, payload);
    assert.equal(captured.version.text, "PAYLOAD");
    assert.equal(captured.executable.sha256, sha256(await readFile(payload)));
  } finally {
    process.env.PATH = previousPath;
  }
});

test("child commands receive only the owned minimal environment", () => {
  const bytes = command(process.execPath, ["-e", "process.stdout.write(JSON.stringify(process.env))"], process.cwd());
  assert.deepEqual(JSON.parse(bytes), {
    LANG: "C",
    LC_ALL: "C",
    TZ: "UTC",
    __CF_USER_TEXT_ENCODING: `0x${process.getuid().toString(16).toUpperCase()}:0x0:0x0`,
  });
});

test("redirected Git authorities are rejected rather than inherited", async (t) => {
  const root = await repository(t, "redirected-authority");
  const previous = process.env.GIT_INDEX_FILE;
  process.env.GIT_INDEX_FILE = join(root, "alternate-index");
  try {
    assert.throws(() => gitCommand(["rev-parse", "--git-path", "index"], root), /redirected Git authority/);
  } finally {
    if (previous === undefined) delete process.env.GIT_INDEX_FILE;
    else process.env.GIT_INDEX_FILE = previous;
  }
});

test("effective Git authority binds resolver, dispatcher, developer root, and implementation", async () => {
  const tool = await gitTool(process.cwd());
  assert.equal(tool.invocation.argument, "-arm64");
  assert.equal(tool.invocation.selected_arch, "arm64");
  assert.match(tool.authority.developer.root, /\/Contents\/Developer$/);
  assert.notEqual(tool.authority.dispatcher.sha256, tool.executable.sha256);
  assert.equal(tool.authority.resolver.name, "xcode-select");
  assert.equal(tool.authority.resolver.version.text, tool.authority.developer.root);
  assert.match(tool.authority.resolver.executable.sha256, /^[0-9a-f]{64}$/);
  assert.match(tool.authority.resolver.runtime.sha256, /^[0-9a-f]{64}$/);
  assert.equal(tool.authority.dispatcher.name, "git-dispatcher");
  assert.match(tool.authority.dispatcher.executable.sha256, /^[0-9a-f]{64}$/);
  assert.match(tool.authority.dispatcher.runtime.sha256, /^[0-9a-f]{64}$/);
  assert.equal(tool.authority.dispatcher.version.text, tool.version.text);
  assert.match(tool.authority.developer.version_plist.sha256, /^[0-9a-f]{64}$/);
});

test("Git census leaves stale-stat index and raw authority bytes plus metadata unchanged", async (t) => {
  const root = await repository(t, "stale-stat");
  await commit(root, "tracked", "same");
  const before = await rawGitAuthority(root);
  const future = new Date(Date.now() + 5_000);
  await utimes(join(root, "tracked"), future, future);
  gitCommand(["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignore-submodules=none"], root);
  const after = await rawGitAuthority(root);
  assert.deepEqual(after, before);
});

test("Node runtime closure contains exact libnode and only Apple-ARM-capable non-system Mach-O", async () => {
  const closure = await runtimeClosure(process.execPath, process.cwd());
  assert.equal(closure.files.some(({ path }) => path.endsWith("/libnode.147.dylib")), true);
  assert.equal(
    closure.files.every(({ architectures }) => architectures.includes("arm64") || architectures.includes("arm64e")),
    true,
  );
  assert.equal(closure.system_images.length > 0, true);
  assert.match(closure.sha256, /^[0-9a-f]{64}$/);
});

test("repository Rust selection binds direct tools, rustc driver, sysroot, and components", async () => {
  const authority = await rustAuthority(process.cwd());
  assert.match(authority.toolchain.selection_sha256, /^[0-9a-f]{64}$/);
  assert.match(authority.resolver.executable.sha256, /^[0-9a-f]{64}$/);
  assert.equal(authority.rustc.runtime.files.some(({ path }) => path.includes("librustc_driver-")), true);
  assert.equal(authority.sysroot.components.some((name) => name.startsWith("rustc-")), true);
  assert.equal(authority.sysroot.manifests.entries.length > 0, true);
  assert.equal(authority.rustc.executable.architectures.includes("arm64"), true);
  assert.equal(authority.cargo.executable.architectures.includes("arm64"), true);
});
