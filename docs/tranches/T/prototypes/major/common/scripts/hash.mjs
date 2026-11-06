import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { lstat, readFile, readdir, readlink, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const ownedEnvironment = Object.freeze({
  LANG: "C",
  LC_ALL: "C",
  TZ: "UTC",
  __CF_USER_TEXT_ENCODING: `0x${process.getuid().toString(16).toUpperCase()}:0x0:0x0`,
});

function execute(commandName, args, cwd, environment = {}) {
  const result = spawnSync(commandName, args, {
    cwd,
    encoding: null,
    env: { ...ownedEnvironment, ...environment },
    maxBuffer: 1024 * 1024 * 256,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = result.stderr?.toString("utf8").trim();
    throw new Error(
      `${commandName} ${args.join(" ")} exited ${result.status}${stderr ? `: ${stderr}` : ""}`,
    );
  }
  return { stdout: result.stdout ?? Buffer.alloc(0), stderr: result.stderr ?? Buffer.alloc(0) };
}

export function command(commandName, args, cwd, environment = {}) {
  return execute(commandName, args, cwd, environment).stdout;
}

const arm64Launcher = realpathSync("/usr/bin/arch");
const xcodeResolver = realpathSync("/usr/bin/xcode-select");
const gitDispatcher = realpathSync("/usr/bin/git");
const arm64LauncherBytes = readFileSync(arm64Launcher);
const developerRoot = realpathSync(
  command(arm64Launcher, ["-arm64", xcodeResolver, "-p"], process.cwd()).toString("utf8").trim(),
);
const gitPayload = realpathSync(resolve(developerRoot, "usr/bin/git"));
const gitPayloadBytes = readFileSync(gitPayload);

const gitEnvironment = Object.freeze({
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_TERMINAL_PROMPT: "0",
});

const redirectedGitAuthorities = [
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_CONFIG",
  "GIT_DIR",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
  "GIT_WORK_TREE",
];

function assertNoRedirectedGitAuthority() {
  const redirected = redirectedGitAuthorities.filter((name) => process.env[name] !== undefined);
  if (redirected.length > 0) throw new Error(`redirected Git authority is forbidden: ${redirected.join(", ")}`);
}

function unchanged(path, before, label) {
  if (!readFileSync(path).equals(before)) throw new Error(`${label} changed during capture`);
}

export function gitCommand(args, cwd) {
  assertNoRedirectedGitAuthority();
  return command(arm64Launcher, ["-arm64", gitPayload, ...args], cwd, gitEnvironment);
}

function pathIdentity(path) {
  const target = realpathSync(path);
  const bytes = readFileSync(target);
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

function appleCommand(path, args, cwd, environment = {}) {
  return command(arm64Launcher, ["-arm64", realpathSync(path), ...args], cwd, environment);
}

function architectures(path, cwd) {
  const text = appleCommand("/usr/bin/lipo", ["-archs", path], cwd).toString("utf8");
  return [...new Set(text.match(/\b(?:arm64e|arm64|x86_64)\b/g) ?? [])].sort();
}

function codeSignature(path, cwd) {
  const { stderr } = execute(
    arm64Launcher,
    ["-arm64", "/usr/bin/codesign", "-dvvv", path],
    cwd,
  );
  const text = stderr.toString("utf8");
  const field = (name) => text.match(new RegExp(`^${name}=(.+)$`, "m"))?.[1] ?? null;
  return { cdhash: field("CDHash"), identifier: field("Identifier"), team: field("TeamIdentifier") };
}

async function executableIdentity(path, cwd) {
  const target = await realpath(path);
  const bytes = await readFile(target);
  const selected = architectures(target, cwd);
  if (!selected.includes("arm64") && !selected.includes("arm64e")) {
    throw new Error(`non-Apple-ARM executable in runtime closure: ${target}`);
  }
  return {
    path: target,
    bytes: bytes.length,
    sha256: sha256(bytes),
    architectures: selected,
    code_signature: codeSignature(target, cwd),
  };
}

export async function gitTool(cwd) {
  if (process.platform !== "darwin" || process.arch !== "arm64") {
    throw new Error(`Git evidence requires native darwin/arm64, got ${process.platform}/${process.arch}`);
  }
  const translated = appleCommand("/usr/sbin/sysctl", ["-n", "sysctl.proc_translated"], cwd)
    .toString("utf8")
    .trim();
  const selected = appleCommand("/usr/bin/uname", ["-m"], cwd)
    .toString("utf8")
    .trim();
  if (translated !== "0" || selected !== "arm64") {
    throw new Error(`Git evidence requires native untranslated Apple ARM, got translated=${translated}, arch=${selected}`);
  }
  const versionBytes = gitCommand(["--version"], cwd);
  const executable = await executableIdentity(gitPayload, cwd);
  const resolver = await nativeTool("xcode-select", xcodeResolver, ["-p"], cwd);
  const dispatcher = await nativeTool(
    "git-dispatcher",
    gitDispatcher,
    ["--version"],
    cwd,
    { ...gitEnvironment, DEVELOPER_DIR: developerRoot },
  );
  if (resolver.version.text !== developerRoot) {
    throw new Error("Xcode resolver selection changed during Git capture");
  }
  if (!dispatcher.version.text.endsWith(versionBytes.toString("utf8").trim())) {
    throw new Error("Git dispatcher and selected implementation versions differ");
  }
  unchanged(arm64Launcher, arm64LauncherBytes, "Apple ARM launcher payload");
  unchanged(gitPayload, gitPayloadBytes, "Git executable payload");
  const versionPlist = resolve(developerRoot, "../version.plist");
  return {
    name: "git",
    authority: {
      resolver,
      dispatcher,
      developer: {
        root: developerRoot,
        version: appleCommand(resolve(developerRoot, "usr/bin/xcodebuild"), ["-version"], cwd)
          .toString("utf8")
          .trim(),
        version_plist: pathIdentity(versionPlist),
      },
    },
    invocation: {
      launcher: {
        bytes: arm64LauncherBytes.length,
        sha256: sha256(arm64LauncherBytes),
      },
      argument: "-arm64",
      selected_arch: selected,
      process_arch: process.arch,
      translated: false,
    },
    executable,
    runtime: await runtimeClosure(gitPayload, cwd),
    version: {
      text: versionBytes.toString("utf8").trim(),
      bytes: versionBytes.length,
      sha256: sha256(versionBytes),
    },
  };
}

const runtimeClosureCache = new Map();

function machoDependencies(path, cwd) {
  const architecture = architectures(path, cwd).includes("arm64") ? "arm64" : "arm64e";
  return appleCommand("/usr/bin/otool", ["-arch", architecture, "-L", path], cwd)
    .toString("utf8")
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(" (compatibility version", 1)[0])
    .filter(Boolean);
}

function machoRpaths(path, cwd) {
  const architecture = architectures(path, cwd).includes("arm64") ? "arm64" : "arm64e";
  const lines = appleCommand("/usr/bin/otool", ["-arch", architecture, "-l", path], cwd)
    .toString("utf8")
    .split("\n");
  const paths = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() !== "cmd LC_RPATH") continue;
    for (const candidate of lines.slice(index + 1, index + 5)) {
      const match = candidate.trim().match(/^path (.+) \(offset \d+\)$/);
      if (match) {
        paths.push(match[1]);
        break;
      }
    }
  }
  return paths;
}

function expandRuntimePath(path, loader, executable) {
  if (path.startsWith("@loader_path")) return resolve(dirname(loader), path.slice("@loader_path".length + 1));
  if (path.startsWith("@executable_path")) {
    return resolve(dirname(executable), path.slice("@executable_path".length + 1));
  }
  return path;
}

function isSystemInstallName(path) {
  return path.startsWith("/usr/lib/") || path.startsWith("/System/Library/");
}

function resolveInstallName(installName, loader, executable, inheritedRpaths, cwd) {
  if (isSystemInstallName(installName)) return { system: installName };
  if (installName.startsWith("@loader_path") || installName.startsWith("@executable_path")) {
    const path = expandRuntimePath(installName, loader, executable);
    return isSystemInstallName(path) ? { system: path } : { path: realpathSync(path) };
  }
  if (installName.startsWith("@rpath/")) {
    const suffix = installName.slice("@rpath/".length);
    const local = machoRpaths(loader, cwd).map((path) => expandRuntimePath(path, loader, executable));
    for (const root of [...local, ...inheritedRpaths]) {
      const candidate = resolve(root, suffix);
      if (!existsSync(candidate)) continue;
      return isSystemInstallName(candidate) ? { system: candidate } : { path: realpathSync(candidate) };
    }
    throw new Error(`unresolved non-system Mach-O dependency ${installName} from ${loader}`);
  }
  if (isAbsolute(installName)) return { path: realpathSync(installName) };
  throw new Error(`unsupported Mach-O install name ${installName} from ${loader}`);
}

function systemImageIdentity(installName, cwd) {
  const text = appleCommand("/usr/bin/dyld_info", ["-uuid", installName], cwd).toString("utf8");
  const match = text.match(/\[(arm64e|arm64)\]:[\s\S]*?([0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12})/);
  if (!match) throw new Error(`system image lacks Apple-ARM shared-cache UUID: ${installName}`);
  return { install_name: installName, architecture: match[1], uuid: match[2] };
}

export async function runtimeClosure(entryPath, cwd) {
  const entry = await realpath(entryPath);
  const cached = runtimeClosureCache.get(entry);
  if (cached !== undefined) return cached;
  const pending = (async () => {
    const files = new Map();
    const system = new Map();
    async function visit(path, executable, inheritedRpaths) {
      const target = await realpath(path);
      if (files.has(target)) return;
      const dependencies = machoDependencies(target, cwd);
      const identity = await executableIdentity(target, cwd);
      files.set(target, { ...identity, dependencies });
      const localRpaths = machoRpaths(target, cwd).map((item) => expandRuntimePath(item, target, executable));
      for (const dependency of dependencies) {
        const resolved = resolveInstallName(dependency, target, executable, [...localRpaths, ...inheritedRpaths], cwd);
        if (resolved.system !== undefined) {
          if (!system.has(resolved.system)) system.set(resolved.system, systemImageIdentity(resolved.system, cwd));
        } else {
          await visit(resolved.path, executable, [...localRpaths, ...inheritedRpaths]);
        }
      }
    }
    await visit(entry, entry, []);
    const fileRecords = [...files.values()].sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
    const systemImages = [...system.values()].sort((left, right) =>
      Buffer.compare(Buffer.from(left.install_name), Buffer.from(right.install_name)),
    );
    const body = {
      policy: "darwin-non-system-macho-v1",
      files: fileRecords,
      system_images: systemImages,
    };
    return { ...body, sha256: sha256(Buffer.from(canonical(body))) };
  })();
  runtimeClosureCache.set(entry, pending);
  return pending;
}

export function nul(bytes) {
  if (bytes.length === 0) return [];
  if (bytes.at(-1) !== 0) throw new Error("NUL-delimited command output lacks a terminal NUL");
  const values = [];
  let start = 0;
  for (let index = 0; index < bytes.length - 1; index += 1) {
    if (bytes[index] !== 0) continue;
    values.push(bytes.subarray(start, index));
    start = index + 1;
  }
  values.push(bytes.subarray(start, bytes.length - 1));
  return values;
}

function utf8(bytes, label = "path") {
  const value = bytes.toString("utf8");
  if (!Buffer.from(value, "utf8").equals(bytes)) {
    throw new Error(`repository contains a non-UTF-8 ${label}`);
  }
  return value;
}

export function inside(root, candidate) {
  const offset = relative(resolve(root), resolve(candidate));
  return offset === "" || (!offset.startsWith(`..${sep}`) && offset !== ".." && !isAbsolute(offset));
}

export function requireInside(root, candidate) {
  if (!inside(root, candidate)) throw new Error(`path escapes declared root: ${candidate}`);
  return resolve(candidate);
}

function excluded(path, excludes) {
  return excludes.some((candidate) => path === candidate || path.startsWith(`${candidate}/`));
}

function rawNul(chunks) {
  return Buffer.concat(chunks.flatMap((chunk) => [chunk, Buffer.from([0])]));
}

function fixedFields(bytes, boundaries, kind) {
  const fields = [];
  let start = 0;
  for (let index = 0; index < bytes.length && fields.length < boundaries; index += 1) {
    if (bytes[index] !== 0x20) continue;
    fields.push(utf8(bytes.subarray(start, index), `${kind} field`));
    start = index + 1;
  }
  if (fields.length !== boundaries || start >= bytes.length) {
    throw new Error(`malformed ${kind} record in git status --porcelain=v2 -z`);
  }
  return [fields, utf8(bytes.subarray(start), "dirty path")];
}

function porcelain(bytes) {
  const chunks = nul(bytes);
  const parsed = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const tag = String.fromCharCode(chunk[0] ?? 0);
    if (tag === "1") {
      const [fields, path] = fixedFields(chunk, 8, "ordinary");
      const [, xy, submodule, head_mode, index_mode, worktree_mode, head_oid, index_oid] = fields;
      parsed.push({
        chunks: [chunk],
        record: {
          type: "ordinary",
          xy,
          submodule,
          head_mode,
          index_mode,
          worktree_mode,
          head_oid,
          index_oid,
          path,
        },
      });
    } else if (tag === "2") {
      const [fields, path] = fixedFields(chunk, 9, "rename/copy");
      const sourceChunk = chunks[index + 1];
      if (sourceChunk === undefined) throw new Error("rename/copy record lacks its NUL-delimited source");
      index += 1;
      const source = utf8(sourceChunk, "rename/copy source path");
      const [, xy, submodule, head_mode, index_mode, worktree_mode, head_oid, index_oid, score] = fields;
      parsed.push({
        chunks: [chunk, sourceChunk],
        record: {
          type: "rename_or_copy",
          xy,
          submodule,
          head_mode,
          index_mode,
          worktree_mode,
          head_oid,
          index_oid,
          score,
          path,
          source,
        },
      });
    } else if (tag === "u") {
      const [fields, path] = fixedFields(chunk, 10, "unmerged");
      const [, xy, submodule, stage1_mode, stage2_mode, stage3_mode, worktree_mode, stage1_oid, stage2_oid, stage3_oid] = fields;
      parsed.push({
        chunks: [chunk],
        record: {
          type: "unmerged",
          xy,
          submodule,
          stage1_mode,
          stage2_mode,
          stage3_mode,
          worktree_mode,
          stage1_oid,
          stage2_oid,
          stage3_oid,
          path,
        },
      });
    } else if (tag === "?") {
      if (chunk[1] !== 0x20 || chunk.length < 3) throw new Error("malformed untracked status record");
      parsed.push({
        chunks: [chunk],
        record: { type: "untracked", path: utf8(chunk.subarray(2), "untracked path") },
      });
    } else {
      throw new Error(`unsupported git status --porcelain=v2 record tag: ${tag}`);
    }
  }
  return parsed;
}

export function parsePorcelainV2(bytes) {
  return porcelain(bytes).map(({ record }) => record);
}

function indexRecords(bytes) {
  return nul(bytes).map((chunk) => {
    const tab = chunk.indexOf(0x09);
    if (tab < 0) throw new Error("malformed git ls-files --stage -z record");
    const metadata = utf8(chunk.subarray(0, tab), "index metadata").split(" ");
    if (metadata.length !== 3) throw new Error("malformed git index metadata");
    const [mode, oid, stageText] = metadata;
    const stage = Number(stageText);
    if (!/^[0-7]{6}$/.test(mode) || !/^[0-9a-f]+$/.test(oid) || !Number.isInteger(stage)) {
      throw new Error("invalid git index metadata");
    }
    return { chunk, mode, oid, stage, path: utf8(chunk.subarray(tab + 1), "index path") };
  });
}

export function indexLedger(root, excludes = []) {
  const records = indexRecords(gitCommand(["ls-files", "--stage", "-z"], root)).filter(
    ({ path }) => !excluded(path, excludes),
  );
  const bytes = rawNul(records.map(({ chunk }) => chunk));
  return {
    receipt: {
      format: "git-ls-files-stage-z",
      entries: records.length,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    records,
  };
}

function gitlinks(records) {
  return new Map(
    records
      .filter(({ mode, stage }) => mode === "160000" && stage === 0)
      .map(({ path, oid }) => [path, oid]),
  );
}

function optionalGit(args, cwd) {
  try {
    return gitCommand(args, cwd);
  } catch {
    return null;
  }
}

async function submoduleEntry(root, path, indexOid) {
  const absolute = requireInside(root, resolve(root, path));
  let metadata;
  try {
    metadata = await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { path, kind: "submodule", index_oid: indexOid, checkout: "missing" };
    }
    throw error;
  }
  if (!metadata.isDirectory()) throw new Error(`gitlink is not a directory: ${path}`);
  const topBytes = optionalGit(["rev-parse", "--show-toplevel"], absolute);
  if (topBytes === null) return { path, kind: "submodule", index_oid: indexOid, checkout: "uninitialized" };
  const top = await realpath(topBytes.toString("utf8").trim());
  if (top !== (await realpath(absolute))) throw new Error(`submodule checkout root mismatch: ${path}`);
  const nestedIndex = indexLedger(absolute);
  return {
    path,
    kind: "submodule",
    index_oid: indexOid,
    head: gitCommand(["rev-parse", "HEAD"], absolute).toString("utf8").trim(),
    index: nestedIndex.receipt,
    dirty: await dirtyLedger(absolute, [], nestedIndex.records),
  };
}

async function fileEntry(root, path) {
  const absolute = requireInside(root, resolve(root, path));
  let metadata;
  try {
    metadata = await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return { path, kind: "missing" };
    throw error;
  }
  const mode = metadata.mode & 0o777;
  if (metadata.isSymbolicLink()) {
    const target = await readlink(absolute, { encoding: "buffer" });
    return { path, kind: "symlink", mode, bytes: target.length, sha256: sha256(target) };
  }
  if (metadata.isFile()) {
    const bytes = await readFile(absolute);
    return { path, kind: "file", mode, bytes: bytes.length, sha256: sha256(bytes) };
  }
  if (metadata.isDirectory()) return { path, kind: "directory", mode };
  throw new Error(`unsupported filesystem kind: ${path}`);
}

async function walk(root, path, output, excludes, links) {
  if (excluded(path, excludes)) return;
  if (links.has(path)) {
    output.set(path, await submoduleEntry(root, path, links.get(path)));
    return;
  }
  const absolute = requireInside(root, resolve(root, path));
  let metadata;
  try {
    metadata = await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") {
      output.set(path, { path, kind: "missing" });
      return;
    }
    throw error;
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    output.set(path, await fileEntry(root, path));
    return;
  }
  const children = await readdir(absolute, { withFileTypes: true });
  children.sort((left, right) => Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)));
  for (const child of children) {
    if (child.name === ".git") continue;
    const nested = path === "." ? child.name : `${path}/${child.name}`;
    await walk(root, nested, output, excludes, links);
  }
}

function byteSort(entries) {
  return entries.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
}

export async function ledger(root, roots, excludes = [], index = undefined) {
  const links = gitlinks(index ?? optionalIndex(root));
  const output = new Map();
  for (const path of [...new Set(roots)].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))) {
    await walk(root, path, output, excludes, links);
  }
  const entries = byteSort([...output.values()]);
  return { entries, sha256: sha256(Buffer.from(canonical(entries))) };
}

function optionalIndex(root) {
  const bytes = optionalGit(["ls-files", "--stage", "-z"], root);
  return bytes === null ? [] : indexRecords(bytes);
}

function recordPaths(record) {
  return record.source === undefined ? [record.path] : [record.path, record.source];
}

export async function dirtyLedger(root, excludes = [], index = undefined) {
  const parsed = porcelain(
    gitCommand(
      ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignore-submodules=none"],
      root,
    ),
  ).filter(({ record }) => !recordPaths(record).every((path) => excluded(path, excludes)));
  const statusBytes = rawNul(parsed.flatMap(({ chunks }) => chunks));
  const paths = new Set(
    parsed.flatMap(({ record }) => recordPaths(record).filter((path) => !excluded(path, excludes))),
  );
  const output = new Map();
  const links = gitlinks(index ?? optionalIndex(root));
  for (const path of [...paths].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))) {
    await walk(root, path, output, excludes, links);
  }
  const entries = byteSort([...output.values()]);
  return {
    status: {
      format: "git-status-porcelain-v2-z",
      records: parsed.map(({ record }) => record),
      bytes: statusBytes.length,
      sha256: sha256(statusBytes),
    },
    content: {
      entries,
      sha256: sha256(Buffer.from(canonical(entries))),
    },
  };
}

async function rawAuthorityFile(path, required = true) {
  let metadata;
  try {
    metadata = await lstat(path, { bigint: true });
  } catch (error) {
    if (!required && error?.code === "ENOENT") return null;
    throw error;
  }
  if (metadata.isSymbolicLink() || !metadata.isFile()) {
    throw new Error(`raw Git authority is not a regular file: ${path}`);
  }
  const bytes = await readFile(path);
  return {
    bytes: bytes.length,
    sha256: sha256(bytes),
    device: metadata.dev.toString(),
    inode: metadata.ino.toString(),
    mode: metadata.mode.toString(),
    size: metadata.size.toString(),
    mtime_ns: metadata.mtimeNs.toString(),
    ctime_ns: metadata.ctimeNs.toString(),
  };
}

export async function rawGitAuthority(root) {
  const gitDirectory = resolve(await realpath(root), ".git");
  const directory = await lstat(gitDirectory);
  if (directory.isSymbolicLink() || !directory.isDirectory()) {
    throw new Error("R6 requires a real in-worktree .git directory");
  }
  const [index, config, head, worktreeConfig] = await Promise.all([
    rawAuthorityFile(resolve(gitDirectory, "index")),
    rawAuthorityFile(resolve(gitDirectory, "config")),
    rawAuthorityFile(resolve(gitDirectory, "HEAD")),
    rawAuthorityFile(resolve(gitDirectory, "config.worktree"), false),
  ]);
  const configBytes = await readFile(resolve(gitDirectory, "config"), "utf8");
  if (/^\s*\[include(?:If)?\b/im.test(configBytes)) {
    throw new Error("local Git configuration may not include external authority");
  }
  return { index, config, head, worktree_config: worktreeConfig };
}

export async function nativeTool(name, payloadPath, versionArgs, cwd, environment = {}) {
  const target = await realpath(payloadPath);
  const before = await readFile(target);
  const versionBytes = appleCommand(target, versionArgs, cwd, environment);
  const [executable, runtime] = await Promise.all([
    executableIdentity(target, cwd),
    runtimeClosure(target, cwd),
  ]);
  const after = await readFile(target);
  if (!after.equals(before)) throw new Error(`native tool changed during capture: ${name}`);
  return {
    name,
    executable,
    runtime,
    version: {
      text: versionBytes.toString("utf8").trim(),
      bytes: versionBytes.length,
      sha256: sha256(versionBytes),
    },
  };
}

async function findUp(start, name) {
  let current = await realpath(start);
  while (true) {
    const candidate = resolve(current, name);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) throw new Error(`cannot find ${name} above ${start}`);
    current = parent;
  }
}

let rustAuthorityPromise;
export async function rustAuthority(workspace) {
  rustAuthorityPromise ??= (async () => {
    const rustupHome = await realpath(resolve(homedir(), ".rustup"));
    const rustupPayload = await realpath(resolve(homedir(), ".cargo/bin/rustup"));
    const environment = { RUSTUP_HOME: rustupHome };
    const rustup = (args) => appleCommand(rustupPayload, args, workspace, environment);
    const selectionPath = await findUp(workspace, "rust-toolchain.toml");
    const selectionBytes = await readFile(selectionPath);
    const active = rustup(["show", "active-toolchain"]).toString("utf8").trim().split(" ", 1)[0];
    const rustcPath = await realpath(rustup(["which", "rustc"]).toString("utf8").trim());
    const cargoPath = await realpath(rustup(["which", "cargo"]).toString("utf8").trim());
    const toolchainRoot = resolve(rustupHome, "toolchains", active);
    for (const [name, path] of [["rustc", rustcPath], ["cargo", cargoPath]]) {
      if (!inside(toolchainRoot, path)) throw new Error(`${name} escaped selected Rust toolchain`);
    }
    const rustc = await nativeTool("rustc", rustcPath, ["-vV"], workspace);
    const cargo = await nativeTool("cargo", cargoPath, ["--version", "--verbose"], workspace);
    const sysroot = await realpath(
      appleCommand(rustcPath, ["--print", "sysroot"], workspace).toString("utf8").trim(),
    );
    if (sysroot !== (await realpath(toolchainRoot))) throw new Error("rustc sysroot differs from selected toolchain");
    const rustlib = resolve(sysroot, "lib/rustlib");
    const names = (await readdir(rustlib)).filter(
      (name) => name === "components" || name.startsWith("manifest-") || name === "rust-installer-version",
    );
    const manifestRoots = names.map((name) => `lib/rustlib/${name}`);
    const manifests = await ledger(sysroot, manifestRoots, [], []);
    const components = (await readFile(resolve(rustlib, "components"), "utf8"))
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean)
      .sort();
    const resolver = await nativeTool("rustup", rustupPayload, ["--version"], workspace);
    const toolchain = {
      active,
      selection_bytes: selectionBytes.length,
      selection_sha256: sha256(selectionBytes),
    };
    return {
      resolver,
      toolchain,
      rustc,
      cargo,
      sysroot: {
        toolchain: active,
        components,
        manifests,
        sha256: sha256(Buffer.from(canonical({ components, manifests }))),
      },
    };
  })();
  return rustAuthorityPromise;
}

export function applePlatform(cwd) {
  const identity = (path) => pathIdentity(path);
  return {
    execution_arch: "arm64",
    process_arch: process.arch,
    translated: appleCommand("/usr/sbin/sysctl", ["-n", "sysctl.proc_translated"], cwd)
      .toString("utf8")
      .trim() === "0" ? false : true,
    operating_system: {
      product: appleCommand("/usr/bin/sw_vers", ["-productVersion"], cwd).toString("utf8").trim(),
      build: appleCommand("/usr/bin/sw_vers", ["-buildVersion"], cwd).toString("utf8").trim(),
    },
    kernel: {
      release: appleCommand("/usr/bin/uname", ["-r"], cwd).toString("utf8").trim(),
      version: appleCommand("/usr/bin/uname", ["-v"], cwd).toString("utf8").trim(),
    },
    system_tail: {
      shared_cache_identity: "dyld-image-uuid",
      code_signing_identity: "codesign-cdhash",
    },
    analyzers: {
      arch: identity("/usr/bin/arch"),
      codesign: identity("/usr/bin/codesign"),
      dyld_info: identity("/usr/bin/dyld_info"),
      lipo: identity("/usr/bin/lipo"),
      otool: identity("/usr/bin/otool"),
      sw_vers: identity("/usr/bin/sw_vers"),
      sysctl: identity("/usr/sbin/sysctl"),
      uname: identity("/usr/bin/uname"),
    },
  };
}

export async function executable(commandName, versionArgs, cwd, payloadPath) {
  if (payloadPath === undefined) throw new Error(`exact payload required for ${commandName}`);
  const located = payloadPath;
  const target = await realpath(located);
  const executableBytes = await readFile(target);
  const versionBytes = command(target, versionArgs, cwd);
  const afterBytes = await readFile(target);
  if (!afterBytes.equals(executableBytes)) {
    throw new Error(`executable payload changed while capturing version: ${commandName}`);
  }
  return {
    name: commandName,
    executable: { bytes: executableBytes.length, sha256: sha256(executableBytes) },
    version: {
      text: versionBytes.toString("utf8").trim(),
      bytes: versionBytes.length,
      sha256: sha256(versionBytes),
    },
  };
}

export async function lockLedger(root, lockfiles, index = undefined) {
  const result = await ledger(root, lockfiles, [], index);
  const missing = result.entries.filter(({ kind }) => kind === "missing").map(({ path }) => path);
  if (missing.length > 0) throw new Error(`missing declared lockfile: ${missing.join(", ")}`);
  return result;
}

async function lockWitness(root, lockfiles) {
  const content = await lockLedger(root, lockfiles);
  const metadata = [];
  for (const path of lockfiles) {
    const value = await lstat(requireInside(root, resolve(root, path)), { bigint: true });
    metadata.push({
      path,
      device: value.dev.toString(),
      inode: value.ino.toString(),
      mode: value.mode.toString(),
      size: value.size.toString(),
      mtime_ns: value.mtimeNs.toString(),
      ctime_ns: value.ctimeNs.toString(),
    });
  }
  return { content, metadata };
}

async function scanEscapes(root, path, escapes) {
  const absolute = requireInside(root, resolve(root, path));
  const metadata = await lstat(absolute);
  if (metadata.isSymbolicLink()) {
    const targetBytes = await readlink(absolute, { encoding: "buffer" });
    const target = utf8(targetBytes, "symlink target");
    const destination = isAbsolute(target) ? resolve(target) : resolve(dirname(absolute), target);
    if (!inside(root, destination)) escapes.push({ path, target });
    return;
  }
  if (!metadata.isDirectory()) return;
  for (const child of await readdir(absolute, { withFileTypes: true })) {
    if (child.name === ".git") continue;
    await scanEscapes(root, path === "." ? child.name : `${path}/${child.name}`, escapes);
  }
}

export async function assertNoSourceEscapes(root) {
  const escapes = [];
  await scanEscapes(root, ".", escapes);
  if (escapes.length > 0) {
    throw new Error(`source link escapes crater: ${escapes.map(({ path }) => path).join(", ")}`);
  }
}

async function guardedCommand(commandName, args, cwd, root, forbiddenReadRoots) {
  if (forbiddenReadRoots.length === 0) return command(commandName, args, cwd);
  if (process.platform !== "darwin") {
    throw new Error("source-read sandbox unavailable on this platform");
  }
  const crater = await realpath(root);
  const forbidden = await Promise.all(forbiddenReadRoots.map((path) => realpath(path)));
  if (forbidden.some((path) => inside(path, crater))) {
    throw new Error("disposable crater is inside a forbidden workspace source root");
  }
  const profile = [
    "(version 1)",
    "(allow default)",
    ...forbidden.map((path) => `(deny file-read* (subpath ${JSON.stringify(path)}))`),
  ].join("\n");
  return command("/usr/bin/sandbox-exec", ["-p", profile, commandName, ...args], cwd);
}

export async function guarded(
  root,
  lockfiles,
  commandName,
  args,
  cwd = root,
  { forbiddenReadRoots = [] } = {},
) {
  const commandCwd = requireInside(root, cwd);
  await assertNoSourceEscapes(root);
  const before = await lockWitness(root, lockfiles);
  let failure;
  try {
    await guardedCommand(commandName, args, commandCwd, root, forbiddenReadRoots);
  } catch (error) {
    failure = error;
  }
  let escapeFailure;
  try {
    await assertNoSourceEscapes(root);
  } catch (error) {
    escapeFailure = error;
  }
  const after = await lockWitness(root, lockfiles);
  if (canonical(before) !== canonical(after)) throw new Error("guarded command changed a lockfile");
  if (escapeFailure) throw escapeFailure;
  if (failure) throw failure;
  return after.content;
}
