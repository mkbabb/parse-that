# PT-0 common evidence

Status: **PT-0.W0 parse-only evidence; gate RED.** This private harness exports
no parser and grants no PT-0, production, package, performance, or movement
credit. Every older receipt, run, bundle, and evidence record is append-only.

## R6 contract

R6 accepts one exact named profile and one unique bundle directory directly
beneath `runs/`:

```sh
/usr/bin/arch -arm64 /opt/homebrew/bin/node scripts/pin.mjs capture \
  --profile pt0-parse-only \
  --bundle runs/pt0-parse-only-r6-<unique-id>

/usr/bin/arch -arm64 /opt/homebrew/bin/node scripts/pin.mjs verify \
  --profile pt0-parse-only \
  --bundle runs/pt0-parse-only-r6-<unique-id>
```

The profile selects only parse-that. Value is absent from declared operands and
no R6 runtime code accesses a Value path. This is an operand-and-code boundary,
not a universal claim about ambient process behavior.

## Closed command and runtime authority

Every child receives an exact owned environment: `LANG`, `LC_ALL`, `TZ`, and
the explicit Darwin text-encoding variable. Ambient Git, developer, rustup,
Cargo, wrapper, SDK, PATH, compiler, linker, and dynamic-loader selectors are
not inherited. Redirected Git index/worktree/object/config authorities are
rejected.

The selected Xcode developer root is resolved once through `xcode-select`; the
resolver and `/usr/bin/git` dispatcher are both executed through
`/usr/bin/arch -arm64` and recorded with recursive runtime closures. Their
selection/version evidence is cross-checked against the version plist and the
separately recorded effective Xcode Git implementation. Every Git operation
invokes only that effective implementation through `arch -arm64`, with
global/system config disabled, local config bound, and `GIT_OPTIONAL_LOCKS=0`.

The repository `rust-toolchain.toml` selects rustup's exact toolchain under an
owned `RUSTUP_HOME`. rustc and Cargo are then invoked directly through
`arch -arm64`; no PATH or wrapper selects them.

One recursive runtime-closure owner records each effective entry file and every
resolved non-system Mach-O dependency, its Apple-ARM-capable slices, bytes,
SHA-256, dependencies, and code-signing identity. System dependencies are
represented by arm64/arm64e dyld image UUIDs—not misleading path-byte hashes.
The receipt also binds Node's `libnode`, rustc's driver, selected Rust component
manifests, OS build, kernel, analyzer payloads, and the shared-cache/code-signing
identity policy. No x86 slice is executed.

## Read-only census and closed bundle

Raw `.git/index`, `.git/config`, `.git/HEAD`, and optional worktree-config bytes
plus metadata must remain unchanged across each repository census and the whole
two-census transaction. Included local Git configuration is rejected. A stale
stat-cache regression proves that status inspection leaves the index exact.

Configuration, profile, and package inputs must be contained regular files with
no symlinked ancestry. Receipt, run, seal, member, repository, tool, runtime,
machine, Rust, ledger, and nested binding records have exact keys and types.
Unknown or missing fields fail closed. The seal must equal its canonical
constructor; selected-field validation is insufficient.

A successful bundle contains exactly three mode-`0600` files beneath a
mode-`0700` directory:

```text
receipt.json
run.json
complete.json
```

Members are exclusively created, synchronized, and sealed last. Real SIGKILL
witnesses after receipt and run publication prove that neither partial bundle
verifies. These are process-interruption facts, not claims of power-loss or
malicious same-user filesystem resistance.

## Cooperative source lease

Terminal capture additionally requires the exact external
`R6-SOURCE-LEASE.json` named by the harness. Its closed record identifies the
parse-that source/build-input scope, holder, bounded active window, and owner
acknowledgement. All governed writers must acknowledge that cooperative lease.
The harness keeps it active from the final census through completion-seal fsync,
performs a full matching post-seal recensus, and rechecks the unchanged lease
before returning. If writers cannot honor the lease, capture must not run; an
immutable content-addressed snapshot is required instead.

Run the tests through the explicit native Node payload:

```sh
/usr/bin/arch -arm64 /opt/homebrew/bin/node --test test/scripts/*.test.mjs
```
