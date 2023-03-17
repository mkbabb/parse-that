use crate::pretty::doc::Doc;
use crate::pretty::utils::text_justify;
use std::collections::HashMap;

pub fn count_join_length<'a>(sep: &'a Doc<'a>, docs: &'a Vec<Doc<'a>>, printer: &Printer) -> usize {
    if docs.is_empty() {
        return 0;
    }
    let doc_length: usize = docs.iter().map(|d| count_text_length(d, printer)).sum();
    let separator_length = count_text_length(sep, printer);

    doc_length + separator_length * (docs.len() - 1)
}

pub fn count_text_length<'a>(doc: &'a Doc, printer: &Printer) -> usize {
    match doc {
        Doc::Str(s) => s.len(),
        Doc::Concat(docs) => docs.iter().map(|d| count_text_length(d, printer)).sum(),
        Doc::Group(d) => count_text_length(d, printer),
        Doc::Indent(d) => count_text_length(d, printer) + printer.indent,
        Doc::Dedent(d) => count_text_length(d, printer) - printer.indent,
        Doc::Join(sep, docs) => count_join_length(sep, docs, printer),
        Doc::IfBreak(t, f) => count_text_length(t, printer).max(count_text_length(f, printer)),
        Doc::SmartJoin(sep, docs) => {
            let length = count_join_length(sep, docs, printer);
            if length * docs.len() >= printer.max_width {
                length + printer.max_width
            } else {
                length
            }
        }
        Doc::Hardline | Doc::Mediumline | Doc::Line => printer.max_width,
        Doc::Softline => printer.max_width / 2,
        _ => 0,
    }
}

pub fn join_impl<'a>(
    sep: &'a Doc<'a>,
    docs: &'a Vec<Doc>,
    printer: &Printer,
) -> (usize, Vec<&'a Doc<'a>>) {
    let sep_length = count_text_length(sep, printer);
    let doc_length: usize = docs.iter().map(|d| count_text_length(d, printer)).sum();

    let total_length = doc_length + sep_length * (docs.len() - 1);

    let joined = docs
        .iter()
        .enumerate()
        .fold(Vec::new(), |mut acc, (i, doc)| {
            if i > 0 {
                acc.push(sep);
            }
            acc.push(doc);
            acc
        });

    (total_length, joined)
}

pub fn smart_join_impl<'a>(
    sep: &'a Doc<'a>,
    docs: &'a Vec<Doc>,
    printer: &Printer,
) -> (usize, Vec<&'a Doc<'a>>) {
    let max_width = (printer.max_width / 4).max(2);

    let sep_length = count_text_length(sep, printer);
    let doc_lengths: Vec<_> = docs.iter().map(|d| count_text_length(d, printer)).collect();

    let mut total_length = doc_lengths.iter().sum::<usize>() + sep_length * (docs.len() - 1);

    let breaks = text_justify(sep_length, &doc_lengths, max_width);

    if !breaks.is_empty() {
        total_length += printer.max_width;
    }

    let joined = docs
        .into_iter()
        .enumerate()
        .fold(Vec::new(), |mut acc, (i, doc)| {
            if i > 0 {
                acc.push(sep);
                if breaks.contains(&i) {
                    acc.push(&Doc::Hardline);
                }
            }
            acc.push(doc);
            acc
        });

    (total_length, joined)
}

#[allow(dead_code)]
pub fn string_impl<'a>(s: &'a str, indent_delta: usize, printer: &Printer) -> String {
    let indent = printer.indent * indent_delta;

    if printer.break_long_text && s.len() + indent > printer.max_width {
        let mut docs: Vec<String> = s.split(" ").map(|s| s.to_string()).collect();
        let doc_lengths = docs.iter().map(|s| s.len()).collect();

        let breaks = text_justify(0, &doc_lengths, printer.max_width - indent);

        for i in breaks.iter() {
            docs[*i] = format!("\n{}{}", " ".repeat(indent), docs[*i]);
        }

        docs.join(" ")
    } else {
        s.to_string()
    }
}

pub fn pretty_print<'a>(doc: &'a Doc<'a>, printer: &Printer) -> String {
    struct PrintItem<'a> {
        doc: &'a Doc<'a>,
        indent_delta: usize,
    }

    let mut output = String::new();
    let mut current_line = String::new();

    let mut prev_was_hardline = false;

    let push_hardline = |stack: &mut Vec<_>, indent_delta: usize| {
        stack.push(PrintItem {
            doc: &Doc::Hardline,
            indent_delta,
        });
    };

    let mut stack = vec![PrintItem {
        doc,
        indent_delta: 0,
    }];

    let mut hardlines = HashMap::new();

    while let Some(PrintItem { doc, indent_delta }) = stack.pop() {
        match &doc {
            Doc::Str(s) => {
                current_line.push_str(s);
            }
            Doc::String(s) => {
                current_line.push_str(s);
            }

            Doc::Concat(docs) => {
                for d in docs.into_iter().rev() {
                    stack.push(PrintItem {
                        doc: d,
                        indent_delta,
                    });
                }
            }

            Doc::Group(d) => {
                let needs_breaking = count_text_length(d, printer) > printer.max_width;

                if needs_breaking {
                    push_hardline(&mut stack, indent_delta - 1);
                }

                stack.push(PrintItem {
                    doc: d,
                    indent_delta,
                });

                if needs_breaking {
                    push_hardline(&mut stack, indent_delta);
                }
            }

            Doc::IfBreak(doc, other) => {
                let mut is_or_was_broken = prev_was_hardline;
                if let Some(last) = stack.last() {
                    is_or_was_broken =
                        matches!(last.doc, &Doc::Hardline) || matches!(last.doc, &Doc::Softline);
                }

                let d = if is_or_was_broken { doc } else { other };

                stack.push(PrintItem {
                    doc: d,
                    indent_delta,
                });
            }

            Doc::Indent(d) => {
                stack.push(PrintItem {
                    doc: d,
                    indent_delta: indent_delta + printer.indent,
                });
            }

            Doc::Dedent(d) => {
                stack.push(PrintItem {
                    doc: d,
                    indent_delta: indent_delta - printer.indent,
                });
            }

            Doc::Join(sep, docs) | Doc::SmartJoin(sep, docs) => {
                let join_fn = if matches!(doc, Doc::SmartJoin(_, _)) {
                    smart_join_impl
                } else {
                    join_impl
                };

                let (_, joined) = join_fn(*&sep, docs, printer);

                for d in joined.into_iter().rev() {
                    stack.push(PrintItem {
                        doc: d,
                        indent_delta,
                    });
                }
            }

            Doc::Line => {
                output.push('\n');
            }

            Doc::Hardline => {
                output.push_str(&current_line);
                output.push('\n');
                current_line.clear();

                let space = if printer.use_tabs { "\t" } else { " " };
                let line = hardlines
                    .entry(indent_delta)
                    .or_insert_with(|| space.repeat(indent_delta));

                current_line.push_str(line);
            }

            Doc::Mediumline => {
                if current_line.len() > printer.max_width / 2 {
                    push_hardline(&mut stack, indent_delta);
                }
            }

            Doc::Softline => {
                if current_line.len() > printer.max_width {
                    push_hardline(&mut stack, indent_delta);
                }
            }

            Doc::Null => {}
        }

        prev_was_hardline = matches!(doc, Doc::Hardline);
    }

    output.push_str(&current_line);
    output
}

#[derive(Debug, Clone)]
pub struct Printer {
    pub max_width: usize,
    pub indent: usize,
    pub break_long_text: bool,
    pub use_tabs: bool,
}

impl Default for Printer {
    fn default() -> Self {
        Printer {
            max_width: 80,
            indent: 2,
            break_long_text: true,
            use_tabs: false,
        }
    }
}

impl Printer {
    pub const fn new(
        max_width: usize,
        indent: usize,
        break_long_text: bool,
        use_tabs: bool,
    ) -> Self {
        Printer {
            max_width,
            indent,
            break_long_text,
            use_tabs,
        }
    }

    pub fn pretty<'a>(&self, doc: impl Into<Doc<'a>>) -> String {
        pretty_print(&doc.into(), self)
    }
}

pub const PRINTER: Printer = Printer::new(80, 2, true, false);
