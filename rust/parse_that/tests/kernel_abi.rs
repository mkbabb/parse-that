//! The kernel ABI record (sk-v27 LW3.COMP-4b): `KERNEL_ABI` and the layout
//! descriptor equal what `KERNEL-ABI.md` records, and the record's digest
//! equals the one written here. A change to a public kernel type, a variant,
//! a field, a layout or a constant fails this test until `KERNEL-ABI.md`
//! gains an addendum with the new block and digest.

use parse_that::kernel::KERNEL_ABI;
use parse_that::kernel::abi::{abi_descriptor, fnv1a64};

const _: () = assert!(KERNEL_ABI == 4);

/// FNV-1a 64 of the recorded block (the `text` fence's contents, final
/// newline included).
const RECORDED: u64 = 0x6d8e_b39a_e6bf_44f9;

const RECORD: &str = include_str!("../KERNEL-ABI.md");

fn recorded_block() -> &'static str {
    let open = "```text\n";
    let start = RECORD.find(open).expect("KERNEL-ABI.md holds a text block") + open.len();
    let len = RECORD[start..].find("```").expect("the text block closes");
    &RECORD[start..start + len]
}

#[test]
fn kernel_abi_is_four() {
    assert_eq!(KERNEL_ABI, 4);
    assert!(
        RECORD.contains("**Version 4"),
        "KERNEL-ABI.md names version 4"
    );
}

#[test]
fn layout_descriptor_equals_the_record() {
    let descriptor = abi_descriptor();
    assert_eq!(
        descriptor,
        recorded_block(),
        "the kernel ABI moved: write a KERNEL-ABI.md addendum (new block, new digest)"
    );
}

#[test]
fn record_digest_is_pinned() {
    let digest = fnv1a64(recorded_block().as_bytes());
    assert_eq!(
        digest, RECORDED,
        "KERNEL-ABI.md's block digest is {digest:#018x}"
    );
    assert!(
        RECORD.contains(&format!("`{RECORDED:#018x}`")),
        "KERNEL-ABI.md states the digest"
    );
}
