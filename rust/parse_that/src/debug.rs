use crate::parse::Parser;
use crate::state::ParserState;

#[cfg(feature = "diagnostics")]
use colored::{Color, Colorize};

#[cfg(feature = "diagnostics")]
const MAX_LINES: usize = 4;
#[cfg(feature = "diagnostics")]
const MAX_LINE_WIDTH: usize = 74; // 80 - 6 for line number prefix

#[cfg(feature = "diagnostics")]
const MAX_LINE_WIDTH_HALF: usize = MAX_LINE_WIDTH / 2;

#[cfg(feature = "diagnostics")]
std::thread_local! {
    static DEBUG_DEPTH: std::cell::Cell<usize> = const { std::cell::Cell::new(0) };
}

#[cfg(feature = "diagnostics")]
pub fn summarize_line(line: &str, column_num: usize) -> String {
    let line = line.trim_end();
    let line_len = line.chars().count();

    if line_len > MAX_LINE_WIDTH {
        let mid = column_num.min(line_len);
        let mut start = mid.saturating_sub(MAX_LINE_WIDTH_HALF).min(line_len);
        let mut end = (mid + MAX_LINE_WIDTH_HALF).min(line_len);

        while start > 0 && !line.is_char_boundary(start) {
            start -= 1;
        }
        while end < line.len() && !line.is_char_boundary(end) {
            end += 1;
        }

        if start == 0 {
            format!("{}...", &line[..end])
        } else if end >= line.len() {
            format!("...{}", &line[start..])
        } else {
            format!("...{}...", &line[start..end])
        }
    } else {
        line.to_string()
    }
}

#[cfg(feature = "diagnostics")]
pub fn format_expected(expected: &[&str]) -> String {
    match expected.len() {
        0 => String::new(),
        1 => format!("expected {}", expected[0]),
        2 => format!("expected {} or {}", expected[0], expected[1]),
        _ => {
            let last = expected.last().unwrap();
            let rest = &expected[..expected.len() - 1];
            format!("expected {}, or {}", rest.join(", "), last)
        }
    }
}

#[cfg(feature = "diagnostics")]
fn line_number_width(max_line: usize) -> usize {
    max_line.to_string().len()
}

#[cfg(feature = "diagnostics")]
pub fn add_cursor(state: &ParserState, cursor: &str, error: bool) -> String {
    let color_fn = if error { Color::Red } else { Color::Green };

    let line_num = state.get_line_number(); // 1-based
    let column_num = state.get_column_number(); // 0-based

    let lines: Vec<&str> = state.src.lines().collect();
    let start_idx = line_num.saturating_sub(MAX_LINES + 1);
    let end_idx = (line_num + MAX_LINES).min(lines.len());

    let ln_width = line_number_width(end_idx);

    let mut result = Vec::new();

    for (i, line_text) in lines.iter().enumerate().take(end_idx).skip(start_idx) {
        let line_content =
            summarize_line(line_text, if i == line_num - 1 { column_num } else { 0 });
        let ln = i + 1; // 1-based display
        let is_active = i == line_num - 1;

        let ln_str = format!("{:>width$}", ln, width = ln_width);
        let pipe = "|".color(Color::BrightBlack).to_string();

        if is_active {
            let ln_display = ln_str.bold().to_string();
            let line_display = line_content.color(color_fn).bold().to_string();
            result.push(format!(" {} {} {}", ln_display, pipe, line_display));

            if !cursor.is_empty() {
                let cursor_pad = " ".repeat(ln_width + 3 + column_num);
                let cursor_str = cursor.color(color_fn).to_string();
                result.push(format!("{}{}", cursor_pad, cursor_str));
            }
        } else {
            let ln_display = ln_str.color(Color::BrightBlack).to_string();
            result.push(format!(" {} {} {}", ln_display, pipe, line_content));
        }
    }

    result.join("\n")
}

#[cfg(feature = "diagnostics")]
pub fn format_secondary_spans(state: &ParserState) -> String {
    let mut result = Vec::new();

    for span in &state.secondary_spans {
        let lines: Vec<&str> = state.src.lines().collect();
        // Find line containing this offset
        let mut offset_acc = 0;
        for (i, line) in lines.iter().enumerate() {
            let line_end = offset_acc + line.len() + 1; // +1 for newline
            if span.offset < line_end {
                let col = span.offset - offset_acc;
                let ln_width = (i + 1).to_string().len().max(3);
                let pipe = "|".color(Color::BrightBlack).to_string();
                let ln_str = format!("{:>width$}", i + 1, width = ln_width);
                let ln_display = ln_str.color(Color::BrightBlack).to_string();

                result.push(format!(" {} {}", " ".repeat(ln_width), pipe));
                result.push(format!(" {} {} {}", ln_display, pipe, lines[i]));

                let marker_pad = " ".repeat(ln_width + 3 + col);
                let marker = "-".color(Color::Cyan).to_string();
                let label = span.label.color(Color::Cyan).to_string();
                result.push(format!("{}{} {}", marker_pad, marker, label));
                break;
            }
            offset_acc = line_end;
        }
    }

    result.join("\n")
}

#[cfg(feature = "diagnostics")]
pub fn format_suggestions(state: &ParserState) -> String {
    use crate::state::SuggestionKind;
    let mut result = Vec::new();

    for suggestion in &state.suggestions {
        let prefix = match &suggestion.kind {
            SuggestionKind::UnclosedDelimiter { .. } => {
                "help".color(Color::Yellow).bold().to_string()
            }
            SuggestionKind::TrailingContent { .. } => {
                "note".color(Color::Cyan).bold().to_string()
            }
        };
        result.push(format!("   = {}: {}", prefix, suggestion.message));
    }

    result.join("\n")
}

#[cfg(feature = "diagnostics")]
pub fn state_print(
    state_result: Result<&ParserState, &ParserState>,
    name: &str,
    parser_string: &str,
) -> String {
    let state = match state_result {
        Ok(s) => s,
        Err(s) => s,
    };

    let (badge, badge_bg) = match state_result {
        Ok(state) => {
            let finished = state.offset >= state.src.len();
            if finished {
                (" Done \u{221a} ", Color::Green)
            } else {
                (" Ok \u{221a} ", Color::Green)
            }
        }
        Err(_) => (" Err x ", Color::Red),
    };

    let badge_str = format!("{}", badge.on_color(badge_bg).bold());
    let name_str = if name.is_empty() {
        String::new()
    } else {
        format!("    {}", name.color(Color::Yellow).italic())
    };
    let offset_str = format!("    {}", state.offset.to_string().color(Color::Green));
    let parser_str = if parser_string.is_empty() {
        String::new()
    } else {
        format!("    {}", parser_string.color(Color::Green))
    };

    let header = format!("{}{}{}{}", badge_str, name_str, offset_str, parser_str);

    let is_error = state_result.is_err();
    let body = if state.offset >= state.src.len() {
        add_cursor(state, "", is_error)
    } else {
        let cursor = if is_error { "^^^" } else { "^" };
        add_cursor(state, cursor, is_error)
    };

    let mut output = format!("{}\n{}", header, body);

    // Error-specific extras
    if is_error {
        if !state.expected.is_empty() {
            let expected_str = format_expected(&state.expected);
            let expected_display = expected_str.color(Color::Cyan).to_string();
            output.push_str(&format!("\n   {}", expected_display));
        }

        if !state.secondary_spans.is_empty() {
            output.push_str(&format!("\n{}", format_secondary_spans(state)));
        }

        if !state.suggestions.is_empty() {
            output.push_str(&format!("\n{}", format_suggestions(state)));
        }
    }

    output
}

// ── Diagnostic formatting (for error recovery) ─────────────

#[cfg(feature = "diagnostics")]
pub fn format_diagnostic(d: &crate::state::Diagnostic, src: &str) -> String {
    let badge = " Err x ".on_color(Color::Red).bold().to_string();
    let loc = format!("{}:{}", d.line, d.column)
        .color(Color::BrightBlack)
        .to_string();
    let offset_str = d.furthest_offset.to_string().color(Color::Green).to_string();
    let header = format!("{}    {}    {}", badge, loc, offset_str);

    // Build a temporary ParserState for add_cursor
    let mut tmp_state = ParserState::new(src);
    tmp_state.offset = d.furthest_offset;
    let body = add_cursor(&tmp_state, "^^^", true);

    let mut output = format!("{}\n{}", header, body);

    if !d.expected.is_empty() {
        let expected_strs: Vec<&str> = d.expected.iter().map(|s| s.as_str()).collect();
        let expected_str = format_expected(&expected_strs);
        let expected_display = expected_str.color(Color::Cyan).to_string();
        output.push_str(&format!("\n   {}", expected_display));
    }

    if !d.secondary_spans.is_empty() {
        // Build temporary state with secondary spans for rendering
        let mut span_state = ParserState::new(src);
        span_state.secondary_spans = d.secondary_spans.clone();
        output.push_str(&format!("\n{}", format_secondary_spans(&span_state)));
    }

    if !d.suggestions.is_empty() {
        let mut sugg_state = ParserState::new(src);
        sugg_state.suggestions = d.suggestions.clone();
        output.push_str(&format!("\n{}", format_suggestions(&sugg_state)));
    }

    if !d.found.is_empty() {
        let found_display = format!("`{}`", d.found).color(Color::Red).to_string();
        let found_label = "found".color(Color::BrightBlack).to_string();
        output.push_str(&format!("\n   {} {}", found_label, found_display));
    }

    output
}

#[cfg(feature = "diagnostics")]
pub fn format_all_diagnostics(diagnostics: &[crate::state::Diagnostic], src: &str) -> String {
    if diagnostics.is_empty() {
        return String::new();
    }

    let parts: Vec<String> = diagnostics.iter().map(|d| format_diagnostic(d, src)).collect();
    let count = diagnostics.len();
    let summary = format!(
        "{} error{} found",
        count,
        if count == 1 { "" } else { "s" }
    )
    .color(Color::Red)
    .bold()
    .to_string();

    format!("{}\n\n{}", parts.join("\n\n"), summary)
}

// ── Non-diagnostic fallback ──────────────────────────────────

#[cfg(not(feature = "diagnostics"))]
pub fn state_print(
    state_result: Result<&ParserState, &ParserState>,
    name: &str,
    _parser_string: &str,
) -> String {
    let state = match state_result {
        Ok(s) => s,
        Err(s) => s,
    };
    let status = match state_result {
        Ok(s) if s.offset >= s.src.len() => "[done]",
        Ok(_) => "[ok]",
        Err(_) => "[err]",
    };
    format!(
        "{} {} offset={} line={} col={}",
        status,
        name,
        state.offset,
        state.get_line_number(),
        state.get_column_number(),
    )
}

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    pub fn debug(self, name: &'a str) -> Parser<'a, Output> {
        let debug = move |state: &mut ParserState<'a>| {
            #[cfg(feature = "diagnostics")]
            {
                DEBUG_DEPTH.with(|d| d.set(d.get() + 1));
                let depth = DEBUG_DEPTH.with(|d| d.get());
                let indent_str = "  ".repeat(depth.saturating_sub(1));

                match (self.parser_fn).call(state) {
                    Some(value) => {
                        eprintln!("{}{}", indent_str, state_print(Ok(state), name, ""));
                        DEBUG_DEPTH.with(|d| d.set(d.get() - 1));
                        Some(value)
                    }
                    None => {
                        eprintln!("{}{}", indent_str, state_print(Err(state), name, ""));
                        DEBUG_DEPTH.with(|d| d.set(d.get() - 1));
                        None
                    }
                }
            }
            #[cfg(not(feature = "diagnostics"))]
            {
                match (self.parser_fn).call(state) {
                    Some(value) => {
                        eprintln!("{}", state_print(Ok(state), name, ""));
                        Some(value)
                    }
                    None => {
                        eprintln!("{}", state_print(Err(state), name, ""));
                        None
                    }
                }
            }
        };

        Parser::new(debug)
    }
}
