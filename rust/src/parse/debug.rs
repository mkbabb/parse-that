use crate::parse::*;
use crate::pretty::{concat, indent, Doc, PRINTER};

use colored::{Color, Colorize};

const MAX_LINES: usize = 5;
const MAX_LINE_WIDTH: usize = 80 - 6;

pub fn add_cursor(state: &ParserState, cursor: &str, error: bool) -> String {
    let color_fn = if error { Color::Red } else { Color::Green };

    let lines = state.src.split('\n').collect::<Vec<_>>();

    let line_num = state.get_line_number();
    let line_idx = lines.len().min(line_num).saturating_sub(1);

    let start_idx = line_idx.saturating_sub(MAX_LINES).max(0);
    let end_idx = (line_idx + MAX_LINES + 1).min(lines.len());
    let cursor_line_idx = line_num.saturating_sub(start_idx + 1);

    let column_num = state.get_column_number();
    let mut column_num_offset = 0;

    let line_summaries: Vec<_> = lines[start_idx..end_idx]
        .into_iter()
        .enumerate()
        .map(|(idx, line)| {
            let line = line.trim_end();
            let max_half_width = MAX_LINE_WIDTH / 2;
            let line_len = line.len();

            if line_len > MAX_LINE_WIDTH {
                let mid = column_num.min(line_len);

                let start = mid.saturating_sub(max_half_width).min(line_len);
                let end = (mid + max_half_width).min(line_len);

                if idx == cursor_line_idx.saturating_sub(1) {
                    column_num_offset = start.saturating_sub(3);
                }

                if start == 0 {
                    format!("{}...", &line[..end])
                } else if end == line_len {
                    format!("...{}", &line[start..])
                } else {
                    format!("...{}...", &line[start..end])
                }
            } else {
                line.to_string()
            }
        })
        .collect();

    let mut result_lines = Vec::new();

    let indent = " ".repeat(6);

    for (idx, line) in line_summaries.iter().enumerate() {
        let line_num_i = start_idx + idx + 1;
        let padded_line_num = line_num_i.to_string().black();

        let line = if line_num_i == line_num {
            line.color(color_fn)
        } else {
            line.color(Color::White)
        };

        let padded_line = format!("{}{}| {}", indent, padded_line_num, line);

        result_lines.push(padded_line);

        if cursor.is_empty() {
            continue;
        }

        if idx == cursor_line_idx {
            let offset = indent.len() + padded_line_num.len() + 2;
            let cursor_pos = column_num - column_num_offset + offset;

            let cursor_line = " ".repeat(cursor_pos) + &cursor.color(color_fn);
            result_lines.push(cursor_line);
        }
    }

    result_lines.join("\n")
}

pub fn state_print(
    state_result: Result<&ParserState, &ParserState>,
    name: &str,
    parser_string: &str,
) -> String {
    let (state_bg_color, state_color, state_string) = match state_result {
        Ok(state) => {
            let finished = state.offset >= state.src.len();
            let state_symbol = if finished { "🎉" } else { "✓ " };
            let state_name = if finished { "Done" } else { "Ok " };
            (
                Color::Green,
                Color::Green,
                format!(" {} {} ", state_name, state_symbol),
            )
        }
        Err(_) => (Color::Red, Color::Red, String::from(" Err ｘ ")),
    };

    let header = concat(vec![
        state_string
            .on_color(state_bg_color)
            .bold()
            .to_string()
            .into(),
        format!(
            "\t{}\t{}",
            name,
            state_result.unwrap_or(&Default::default()).offset,
        )
        .color(state_color)
        .bold()
        .to_string()
        .into(),
        Doc::Softline,
        parser_string.color(Color::Yellow).to_string().into(),
    ]);

    let body = match state_result {
        Ok(state) => {
            if state.offset >= state.src.len() {
                add_cursor(state, "", false)
                    .color(Color::Green)
                    .bold()
                    .to_string()
            } else {
                add_cursor(state, "^", false)
            }
        }
        Err(state) => add_cursor(state, "^", true),
    };

    let header_body = concat(vec![header, Doc::Hardline, indent(body.into())]);

    PRINTER.pretty(header_body)
}

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    pub fn debug(self, name: &'a str) -> Parser<'a, Output> {
        let debug = move |state: &mut ParserState<'a>| match (self.parser_fn).call(state) {
            Ok(value) => {
                println!("{}", state_print(Ok(state), name, ""));
                return Ok(value);
            }

            Err(()) => {
                println!("{}", state_print(Err(state), name, ""));
                return Err(());
            }
        };

        Parser::new(debug)
    }
}
