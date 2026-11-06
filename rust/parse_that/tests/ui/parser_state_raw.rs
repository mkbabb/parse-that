use parse_that::ParserState;

fn main() {
    let mut state = ParserState::default();
    state.src = "source";
    state.src_bytes = b"different bytes";
    state.end = usize::MAX;
    state.offset = usize::MAX;
    state.furthest_offset = usize::MAX;
    state.context_ptr = (&0_u8 as *const u8).cast();
    state.ws_bitmap = u64::MAX;
    state.ws_bitmap_start = 0;
    let _ = state;
}
