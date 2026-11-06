# PT-0.W0 common evidence harness — author record

Status: **IMPLEMENTED; one transactionally GREEN capture recorded; PT-0 remains
RED pending hostile PT0-ART adjudication and a later authorized final capture.**

## Authorship and boundary

- Role: PT-0.W0 common evidence harness author/repairer
- Declared and recorded model: `gpt-5.6-sol`
- Reasoning effort: `xhigh`
- Edit boundary: `docs/tranches/T/prototypes/major/common/` only
- Production and sibling repositories: read-only
- Binding contract read: `MAJOR-PORTFOLIO.md` PT-0.W0 and PT-0.W1
- Movement authority: none; the SK-V25 operand includes
  `graph/P3-ADJUDICATION.md`, which denies graph-directed movement

The author read every pre-existing common file before repair. No production
source, sibling repository, lockfile, generated operand, or active receipt was
modified by the implementation work.

## Implemented truth model

The repaired harness has one JSON configuration and two runtime modules. It does
not introduce a registry or provider hierarchy.

1. Git state is split into exact planes: HEAD/tree, filtered
   `git ls-files --stage -z`, `git status --porcelain=v2 -z`, and working-tree
   content for every non-output dirty path.
2. Paths are decoded losslessly as UTF-8 or capture fails. Whitespace, tabs,
   newlines, rename/copy source paths, deletions, type changes, and unmerged
   records remain distinct.
3. Symlinks hash link-target bytes without following them. Gitlinks bind the
   parent index OID plus checked-out submodule HEAD, index, and recursively exact
   dirty content.
4. Only the dedicated `common/receipts` and `common/runs` output roots are
   mutable-plane exclusions. Generated cache exclusions are explicit relative
   config paths; dirty Git state does not inherit those exclusions.
5. Named sorted relative-file ledgers separately bind parse-that TypeScript,
   Rust, T, U, invocation v4, SK-V25, complete Value V-next, Value 4,
   Keyframes 6, and Glass 7 operands.
6. Package coordinates are checked against manifest bytes. Git, Node, npm,
   rustc, and Cargo bind both executable bytes and raw version output.
7. Stable capture compares two full censuses and atomically publishes only on
   equality. Stable JSON has no timestamp, host, architecture, or absolute
   workspace path; the volatile run owns those fields.
8. The command guard rejects crater-link escape, direct reads from declared
   workspace roots under the macOS sandbox, final lock drift, and write/restore
   lock ABA through inode/ctime witnesses. An unavailable read sandbox is RED.

## Counted verification

Both counted replays ran from
`docs/tranches/T/prototypes/major/common` after the implementation was frozen.

| Replay | Command | Result | Node test duration |
|---|---|---:|---:|
| 1 | `npm test` | 16 passed, 0 failed, 0 skipped | 1760.343875 ms |
| 2 | `npm test` | 16 passed, 0 failed, 0 skipped | 1774.050542 ms |

The external source-isomorphic tests exercise canonical encoding, NUL framing,
sorted file bytes, output exclusion, exact rename direction and unusual names,
independent index/worktree bytes, dirty submodules, lexical and symlink escape,
ordinary lock mutation, write/restore ABA mutation, direct forbidden source
reads, deterministic two-census drift, the live five-repository snapshot, every
named operand, package coordinates, executable/version bytes, and config binding.

## Single capture result

Exactly one capture command was run after the counted replays. It was not retried.

```text
$ npm run pin
> node scripts/pin.mjs capture
24433d35b686400864a47078048219bbf567ccb52530a9980ca3ff33a4098c9c  docs/tranches/T/prototypes/major/common/receipts/pins.json
```

- Exit: `0` (GREEN transaction)
- Wall time: `2.860692709 s`
- Capture time in volatile run: `2026-07-19T02:48:32.394Z`
- Stable receipt bytes: `941192`
- Stable receipt SHA-256:
  `24433d35b686400864a47078048219bbf567ccb52530a9980ca3ff33a4098c9c`
- Stable census SHA-256:
  `b1cc1809b0bb75fbc0b084db9277da68bb436e930287d33e1377bfaee0fb1d2d`
- Config SHA-256:
  `c1e9a7e15ef744065c897e9d30b6c27811fe2e0752bbcda534b7cf40375df7dd`
- Volatile run SHA-256:
  `ae67248d9b37f94815b16a4d134a6cd18c43bc0574adf7dd0aeca6525c0a5706`
- Absolute workspace path in stable receipt: absent
- Timestamp key in stable receipt: absent

The active repositories happened not to change between the two measured
censuses. This result proves only equality over that capture transaction. It is
not a claim that the repositories were clean, inactive before or after the
interval, or permanently quiescent.

## Repository state ledger at capture

| Repository | HEAD | Dirty status SHA-256 | Dirty content SHA-256 | Lock ledger SHA-256 |
|---|---|---|---|---|
| parse-that | `ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42` | `6992454241594462eb2f80bc3717c1a4fad0b4a57c6ddc6627762220f79883f2` | `69b4dfa1698b51deeeb200b0b98d487e79f293764d57e3d53555927c94f20ff6` | `2f7daabfa620359692ba87650501a72da4d51805698f45e5eae9ed0214ee92d3` |
| bbnf-lang | `af15f63e0d2d3d719938c13b906a50acbb92ea3b` | `34baaa4724ece9e915fbf810ba4cbcee300a26cabc00840ed08796b2efa77810` | `a240fd74abfb97a00a78e5ed20f62c301f73bfe4c9c998667d7c263694050645` | `8e45e3ea4577e0a40c6b66b6c2efc322e5e7d50a94d5781448c2b546c9be2b66` |
| value.js | `c654824e0b252cda7f8490b67f182a48c48cc0ed` | `1a63d263b8cc93cda66b8d4508d51f2ad870bb3401f8baf530ef5247f9ba5a3d` | `e03af700a51642c7ce01f9f9b2a1d885e96ab13288bd46a05504a42559980748` | `2307777903c4e5fb601d24a532936261cff1bf130be3fe9ccb15f9300e3ee638` |
| keyframes.js | `a59d3a22da080a8ed224e8d675112bb3bb0135b0` | `e25253d566fafa43462eb739377cb1d330b8357bd5ac82c722d6137b4d50dcf3` | `3b88dd9d0c7c4ec24efc82227357481b0436016093994dde83c9aab2e2a89c53` | `eaa36d7fcb38fcb3bf83f99b38a5333da1e8af4979a9e1de13a19b3431d7d4e2` |
| glass-ui | `b3c09517ef27781fd3b91f255588aac428455138` | `f4cee8ae8573065e45e8b60eb66519c12f7431e734a57a6254d22fde953b9f7e` | `e425e0fa471e82c55fe0c6cd1c9bba1938231201462644857702dada78a4cccf` | `fd29ed9b2786833eeb8d88c4bcdb238531732d0a23d3f8a969e368ce8cb70a82` |

Dirty record/content-entry counts were respectively: parse-that `146/179`,
bbnf-lang `368/368`, value.js `140/140`, keyframes.js `348/348`, and
glass-ui `42/42`. Dirty state was bound, not mistaken for cleanliness.

## Named operand ledger at capture

| Repository / operand | Entries | SHA-256 |
|---|---:|---|
| parse-that / `typescript-production` | 129 | `1497c9ff339640722e468aa9c50ddc7bdf5a2aba0ae25fe259d336ab09f33b57` |
| parse-that / `rust-production` | 173 | `59394a6aee7fe4ee5c4aa7c62b9f5a019678917bb485b244bab73b9fab565595` |
| parse-that / `tranche-t` | 157 | `811b892d0f70db227442ba133970937af910f83501e4bcf27f4fd255e6f6c1cf` |
| parse-that / `tranche-u` | 12 | `d2bcead5fa9a102a2f00d37cd0df7b6528f905345531a78612c17d254f00294a` |
| parse-that / `invocation-v4` | 68 | `71545234e9526dce62ac3ac853179b6fa324d1f3cd3798b523594f18d4cf8ae4` |
| parse-that / `binding-authority` | 42 | `ce7668a1682338ffffebc3127be6ac86b5a010af89fdd30f7e873abffe607dbb` |
| parse-that / `toolchain-selection` | 2 | `db844ca9b98c055d4763542d9941a160853d2b5228eb53483014e4fc1cc4baf8` |
| bbnf-lang / `sk-v25` | 229 | `92818c5aa9cbcbd5acfc4ea22cf2ae2a6242bbbbb0f238d5f001bc470fb5a072` |
| bbnf-lang / `workspace-manifests` | 4 | `4af1a5edfa8f57ba5fa838f989931d130641ff2f52e99b87eeda9fac71a4df11` |
| value.js / `value-v-next` | 120 | `249c505fb2ada1143464ceb672689ee0d5431077cec13f9431f9daa96685c3c3` |
| value.js / `value-4-source` | 145 | `9f581d764560cd2da906e77b600f8963474fad20a2934397aedd75c1939d3119` |
| keyframes.js / `keyframes-6-source` | 435 | `bf9cb05f358bf437cb6cf8bb53541e2c51e18f7094992079a23deb71a9627610` |
| keyframes.js / `keyframes-u-evidence` | 87 | `f15241fcb022cd3aa024af08873c39363cc85ee7b5a5b30a665300bc2e47423a` |
| glass-ui / `glass-7-source` | 1871 | `90e1402fded546ebd635860a9a6c27bd41d8c5e26fbf5edddba1d6715ed49cef` |
| glass-ui / `glass-7-evidence` | 6 | `aec7a8d698d84b0756f503d021eb66a703eec26790768c53adef30937576ce05` |

Verified package coordinates were `@mkbabb/parse-that@1.0.0`,
`@mkbabb/value.js@4.0.0`, `@mkbabb/keyframes.js@6.0.0`, and
`@mkbabb/glass-ui@7.0.0`.

## Executable and toolchain ledger

| Tool | Version | Executable SHA-256 | Raw version SHA-256 |
|---|---|---|---|
| Git | `git version 2.39.5 (Apple Git-154)` | `12bed4523661307059b879b9b54e77a73176e9d27d27a0e40363271d8f0668ba` | `b6d9afe6e5be5d40f0e18a09a0708100902e19a4d0e11fb5d3930d59785cb1aa` |
| Node | `v26.0.0` | `08dad0581f00a0cabf4d49ec92ca1f25fdfd01c2c18fa8e92b35f04d4c24c164` | `4ba81b51ceb2a5121a3018c8d23adc26a59dd3e470a2a6c7e75eb7c31327adfd` |
| npm | `11.12.1` | `8e5f6f3429f8cdbe693cdc29904e9d5a7b127a494bd15c804bd54c7403bfcbe7` | `608c86d3f47c084a7a0de5d4eb4bc18724c96c456f3fe6842d17f04004338c3f` |
| rustc | `1.96.0-nightly (02c7f9bec 2026-04-10)` | `aeb4105778ca1bd3c6b0e75768f581c656633cd51368fa61289b6a71696ac7e1` | `d5f79f5406781b8544d4eeb2e4d29a85352b8348d3c2fd0056c76e46eda02ac2` |
| Cargo | `1.96.0-nightly (eb94155a9 2026-04-09)` | `aeb4105778ca1bd3c6b0e75768f581c656633cd51368fa61289b6a71696ac7e1` | `81def4d843d4c9dc8af475715cb356caef3d673603434c57e5ea75d522a6a97e` |

The equal rustc/Cargo executable digest is expected here: both commands resolve
to the same pinned rustup proxy bytes, while their raw version outputs bind the
selected tools independently.

## Harness source ledger

This ledger covers every implementation/config/test/document byte that existed
at capture, plus the generated stable receipt. The present author record cannot
include its own digest without circularity and was necessarily written after the
single capture.

| Relative path | SHA-256 |
|---|---|
| `.gitignore` | `247681cefffa8448d973f21147c92b38b63f492a98a50aca3b3c490bc97499e1` |
| `README.md` | `2cc982fe896e00e353c0926c3102f24f6759ca5ccc1247e221463368d7ccc615` |
| `package.json` | `85b2bcb0f95b6a53a4a2fffa7580b452acb67484ebbd143a50536e8b89318297` |
| `pins.config.json` | `c1e9a7e15ef744065c897e9d30b6c27811fe2e0752bbcda534b7cf40375df7dd` |
| `scripts/hash.mjs` | `fc4954a9aca600c20353a2c0ae73197bac59cb593b5b072dbddefbc3d608de60` |
| `scripts/pin.mjs` | `f25282315a0fb009ae3cd585503bc18ef6e3dc1ebf3a265fa48807192e670317` |
| `test/scripts/hash.test.mjs` | `aac3a795ec26c96af82d3bddb2146b34835676a63bb7ffe5cf1f834f765aaa39` |
| `test/scripts/pin.test.mjs` | `7c12410768d3cf2afa92e9e4171ff976977dc5ac9a255ec28e97410e746477f5` |
| `receipts/pins.json` | `24433d35b686400864a47078048219bbf567ccb52530a9980ca3ff33a4098c9c` |

## Honest post-capture disposition

Creating this required author record adds a new file beneath the captured
`tranche-t` operand after the transaction. Therefore the published receipt is an
exact historical receipt of the stated interval, not a claim that `npm run
verify` would remain GREEN after this report. No verification command or second
capture was run. A future authorized capture must absorb this report and any
other intervening operand motion, and PT0-ART critics must still adjudicate the
harness and receipt before PT-0.W0 can close.
