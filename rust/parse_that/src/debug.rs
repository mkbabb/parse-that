extern crate pretty;

use crate::parse::*;
use pretty::{concat, indent, str, Doc, Indent, PRINTER};

use colored::{Color, Colorize};

const MAX_LINES: usize = 4;
const MAX_LINE_WIDTH: usize = 80 - 6;
const MAX_LINE_WIDTH_HALF: usize = MAX_LINE_WIDTH / 2;

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
        while end <= line_len && !line.is_char_boundary(end) {
            end += 1;
        }

        if start == 0 {
            format!("{}...", &line[..end])
        } else if end == line.len() {
            format!("...{}", &line[start..])
        } else {
            format!("...{}...", &line[start..end])
        }
    } else {
        line.to_string()
    }
}

pub fn add_cursor(state: &ParserState, cursor: &str, error: bool) -> String {
    let color_fn = if error { Color::Red } else { Color::Green };

    let line_num = state.get_line_number();
    let column_num = state.get_column_number();

    let lines = state
        .src
        .lines()
        .enumerate()
        .skip(line_num.saturating_sub(MAX_LINES))
        .take(2 * MAX_LINES)
        .collect::<Vec<_>>();

    let indent = " ".repeat(0);

    let result_lines = lines
        .into_iter()
        .map(|(line_num_i, line)| {
            let line = summarize_line(line, column_num);

            let padded_line_num = line_num_i.to_string().black();
            let line = if line_num_i == line_num - 1 {
                line.color(color_fn)
            } else {
                line.color(Color::White)
            };
            let padded_line = format!("{}| {}", padded_line_num, line);

            if line_num_i == line_num - 1 {
                let offset = padded_line_num.len();
                let cursor_pos = column_num + offset + 2;

                let cursor_line = " ".repeat(cursor_pos) + &cursor.color(color_fn);

                format!("{}\n{}", padded_line, cursor_line)
            } else {
                padded_line
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    return result_lines;
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

    let header_body = concat(vec![header, Doc::Hardline, indent(body)]);

    PRINTER.pretty(header_body)
}

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    pub fn debug(self, name: &'a str) -> Parser<'a, Output> {
        let debug = move |state: &mut ParserState<'a>| match (self.parser_fn).call(state) {
            Some(value) => {
                println!("{}", state_print(Ok(state), name, ""));
                return Some(value);
            }
            None => {
                println!("{}", state_print(Err(state), name, ""));
                return None;
            }
        };

        Parser::new(debug)
    }
}
