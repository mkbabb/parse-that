extern crate pretty;
use pretty::Pretty;

#[derive(Pretty, Debug, PartialEq, Clone, Copy, Hash, Eq)]
pub struct Span<'a> {
    pub start: usize,
    pub end: usize,

    #[pretty(skip)]
    pub src: &'a str,
}

impl<'a> Span<'a> {
    pub fn new(start: usize, end: usize, src: &'a str) -> Self {
        Span { start, end, src }
    }

    pub fn as_str(&self) -> &'a str {
        unsafe { self.src.get_unchecked(self.start..self.end) }
    }
}

#[derive(Pretty, Debug, PartialEq, Clone, Hash, Eq)]
pub struct ParserState<'a> {
    #[pretty(skip)]
    pub src: &'a str,
    #[pretty(skip)]
    pub src_bytes: &'a [u8],

    pub end: usize,

    pub offset: usize,
    pub furthest_offset: usize,

    #[pretty(skip)]
    pub state_stack: Vec<usize>,
}

impl<'a> Default for ParserState<'a> {
    fn default() -> Self {
        ParserState {
            src: "",
            src_bytes: &[],
            end: 0,

            offset: 0,
            furthest_offset: 0,

            state_stack: Vec::new(),
        }
    }
}

impl<'a> ParserState<'a> {
    pub fn new(src: &'a str) -> ParserState<'a> {
        ParserState {
            src,
            src_bytes: src.as_bytes(),
            end: src.len(),
            ..Default::default()
        }
    }

    pub fn is_at_end(&self) -> bool {
        self.offset >= self.end
    }

    pub fn save(&mut self) {
        self.state_stack.push(self.offset);
    }

    pub fn restore(&mut self) {
        if let Some(offset) = self.state_stack.pop() {
            self.offset = offset;
        }
    }

    pub fn pop(&mut self) {
        self.state_stack.pop();
    }

    pub fn get_column_number(&self) -> usize {
        let offset = self.offset;
        let last_newline = self.src[..offset].rfind('\n').unwrap_or(0);
        if offset <= last_newline {
            0
        } else {
            offset - last_newline
        }
    }

    pub fn get_line_number(&self) -> usize {
        self.src[..self.offset]
            .as_bytes()
            .iter()
            .filter(|&&c| c == b'\n')
            .count()
            + 1
    }
}
