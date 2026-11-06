use parse_that::{ASCII_WHITESPACE_CLASS, ByteClass8};

fn reference(class: &[u8], stripe: &[u8]) -> u64 {
    stripe[..64]
        .iter()
        .enumerate()
        .fold(0u64, |bitmap, (index, byte)| {
            bitmap | ((class.contains(byte) as u64) << index)
        })
}

#[test]
fn byte_class_is_exact_across_every_byte_and_lane() {
    for member in 0u8..=u8::MAX {
        let class = ByteClass8::new(&[member]);
        for lane in 0..64 {
            let mut stripe = [member.wrapping_add(1); 64];
            stripe[lane] = member;
            assert_eq!(class.member_bitmap_64(&stripe), 1u64 << lane);
        }
    }
}

#[test]
fn nibble_collisions_do_not_create_members() {
    let members = [0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0];
    let class = ByteClass8::new(&members);
    let mut stripe = [0u8; 64];
    for (index, byte) in stripe.iter_mut().enumerate() {
        let low = members[index % members.len()] & 0x0f;
        let high = members[(index + 1) % members.len()] & 0xf0;
        *byte = high | low;
    }
    assert_eq!(
        class.member_bitmap_64(&stripe),
        reference(&members, &stripe)
    );
}

#[test]
fn empty_duplicate_and_full_width_classes_are_total() {
    let stripe = core::array::from_fn::<_, 64, _>(|index| index as u8);
    assert_eq!(ByteClass8::new(&[]).member_bitmap_64(&stripe), 0);

    let duplicate = ByteClass8::new(&[7, 7, 7]);
    assert_eq!(duplicate.member_bitmap_64(&stripe), 1u64 << 7);

    let members = [0, 1, 2, 3, 60, 61, 62, 63];
    let class = ByteClass8::new(&members);
    assert_eq!(
        class.member_bitmap_64(&stripe),
        reference(&members, &stripe)
    );
}

#[test]
fn nonmember_bitmap_is_the_exact_complement() {
    let stripe = core::array::from_fn::<_, 64, _>(|index| match index % 7 {
        0 => b' ',
        1 => b'\t',
        2 => b'\n',
        3 => b'\r',
        value => b'a' + value as u8,
    });
    let members = [b' ', b'\t', b'\n', b'\r'];
    let expected = reference(&members, &stripe);
    assert_eq!(ASCII_WHITESPACE_CLASS.member_bitmap_64(&stripe), expected);
    assert_eq!(
        ASCII_WHITESPACE_CLASS.nonmember_bitmap_64(&stripe),
        !expected
    );
}

#[test]
fn bitmap_reads_exactly_one_stripe() {
    let mut input = [b'x'; 65];
    input[64] = b' ';
    assert_eq!(ASCII_WHITESPACE_CLASS.member_bitmap_64(&input), 0);
}

#[test]
#[should_panic(expected = "requires a 64-byte stripe")]
fn undersized_stripes_fail_before_intrinsic_loads() {
    let _ = ASCII_WHITESPACE_CLASS.member_bitmap_64(&[b' '; 63]);
}
