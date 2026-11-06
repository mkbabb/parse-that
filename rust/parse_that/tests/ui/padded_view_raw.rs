use parse_that::{INPUT_PAD_BYTES, PaddedView};

fn main() {
    let backing = [0_u8; INPUT_PAD_BYTES];
    let view = PaddedView::new(&backing, 0);
    let _ = (view.bytes(), view.len());
}
