use parse_that::Span;

fn main() {
    let mut span = Span::new(0, 1, "a");
    span.start = 0;
    span.end = 1;
    span.src = "b";
    let _ = span;
}
