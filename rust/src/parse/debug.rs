use crate::parse::*;
use crate::pretty::{concat, indent, Doc, PRINTER};

use colored::{Color, Colorize};

const MAX_LINES: usize = 5;
const MAX_LINE_WIDTH: usize = 80;

pub fn add_cursor(state: &ParserState, cursor: &str, error: bool) -> String {
    let color_fn = if error { Color::Red } else { Color::Green };

    let lines = state.src.split('\n').collect::<Vec<_>>();
    let line_idx = lines.len().min(state.get_line_number()).saturating_sub(1);

    let start_idx = line_idx.saturating_sub(MAX_LINES).max(0);
    let end_idx = (line_idx + MAX_LINES + 1).min(lines.len());

    let line_summaries: Vec<_> = lines[start_idx..end_idx]
        .into_iter()
        .map(|line| {
            let line = line.trim_end();
            if line.len() > MAX_LINE_WIDTH {
                format!("{}...", &line[..MAX_LINE_WIDTH])
            } else {
                line.to_string()
            }
        })
        .collect();

    let mut result_lines = Vec::new();

    let indent = " ".repeat(6);

    for (idx, line) in line_summaries.iter().enumerate() {
        let line_num = start_idx + idx + 1;
        let padded_line_num = line_num.to_string().black();

        let line = if line_num == state.get_line_number() {
            line.color(color_fn)
        } else {
            line.color(Color::White)
        };

        let padded_line = format!("{}{}| {}", indent, padded_line_num, line);

        result_lines.push(padded_line);

        if cursor.is_empty() {
            continue;
        }

        if idx == state.get_line_number().saturating_sub(start_idx + 1) {
            let cursor_line = " "
                .repeat(state.get_column_number() + indent.len() + padded_line_num.len())
                + &cursor.color(color_fn);
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
            state_result
                .unwrap_or(&ParserState { offset: 0, src: "" })
                .offset,
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

// impl<'a, Output> Parser<'a, Output> {
//     pub fn debug(self, name: &'a str) -> Parser<'a, Output> {
//         if cfg!(feature = "perf") {
//             return self;
//         }

//         let debug = move |state: &ParserState<'a>| match (self.parser_fn)(state) {
//             Ok((new_state, value)) => {
//                 println!("{}", state_print(Ok(&new_state), name, ""));

//                 return Ok((new_state, value));
//             }
//             Err(()) => {
//                 println!("{}", state_print(Err(&state), name, ""));
//                 return Err(());
//             }
//         };

//         Parser::new(Box::new(debug), Some(self.context.clone()))
//     }
// }
