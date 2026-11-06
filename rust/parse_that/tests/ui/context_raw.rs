use parse_that::regex::generated::RegexParser;

fn main() {
    let parser = RegexParser::regex();
    let wrong_context = ();
    let _ = parser.parse_with_context("a", &wrong_context);
}
