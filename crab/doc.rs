use std::{cmp::min, collections::HashMap};

#[derive(Clone, Debug)]
pub enum Doc<'a> {
    String(String),
    Str(&'a str),

    Concat(Vec<Doc<'a>>),

    Group(Box<Doc<'a>>),

    Indent(Box<Doc<'a>>),
    Dedent(Box<Doc<'a>>),

    Join(Box<Doc<'a>>, Vec<Doc<'a>>),
    SmartJoin(Box<Doc<'a>>, Vec<Doc<'a>>),

    IfBreak(Box<Doc<'a>>, Box<Doc<'a>>),

    Hardline,
    Softline,
    Mediumline,
    Line,
}

impl<'a> std::ops::Add for Doc<'a> {
    type Output = Doc<'a>;

    fn add(self, other: Doc<'a>) -> Doc<'a> {
        match (self, other) {
            (Doc::Concat(mut docs), other) => {
                docs.push(other);
                Doc::Concat(docs)
            }
            (s, Doc::Concat(mut docs)) => {
                docs.insert(0, s);
                Doc::Concat(docs)
            }
            (s, other) => Doc::Concat(vec![s, other]),
        }
    }
}

pub fn count_text_length(doc: &Doc, printer: &Printer) -> usize {
    match doc {
        Doc::Str(s) => s.len(),
        Doc::Concat(docs) => docs
            .into_iter()
            .map(|d| count_text_length(d, printer))
            .sum(),
        Doc::Group(d) => count_text_length(d, printer),
        Doc::Indent(d) => count_text_length(d, printer) + printer.indent,
        Doc::Dedent(d) => count_text_length(d, printer) - printer.indent,
        Doc::Join(sep, docs) | Doc::SmartJoin(sep, docs) => {
            if docs.is_empty() {
                return 0;
            }

            let doc_length: usize = docs.iter().map(|d| count_text_length(d, printer)).sum();
            let separator_length = count_text_length(sep, printer);

            doc_length + separator_length * (docs.len() - 1)
        }
        Doc::Hardline | Doc::Mediumline | Doc::Line => printer.max_width,
        Doc::Softline => printer.max_width / 2,
        _ => 0,
    }
}

pub fn group<'a>(doc: Doc<'a>) -> Doc<'a> {
    Doc::Group(Box::new(doc))
}

pub fn concat<'a>(docs: Vec<Doc<'a>>) -> Doc<'a> {
    Doc::Concat(docs)
}

pub fn join<'a>(sep: Doc<'a>, docs: Vec<Doc<'a>>) -> Doc<'a> {
    Doc::Join(Box::new(sep), docs)
}

pub fn smart_join<'a>(sep: Doc<'a>, docs: Vec<Doc<'a>>) -> Doc<'a> {
    Doc::SmartJoin(Box::new(sep), docs)
}

pub fn indent<'a>(doc: Doc<'a>) -> Doc<'a> {
    Doc::Indent(Box::new(doc))
}

pub fn dedent<'a>(doc: Doc<'a>) -> Doc<'a> {
    Doc::Dedent(Box::new(doc))
}

pub fn str<'a>(s: impl Into<&'a str>) -> Doc<'a> {
    Doc::Str(s.into())
}

pub fn hardline<'a>() -> Doc<'a> {
    Doc::Hardline
}

pub fn softline<'a>() -> Doc<'a> {
    Doc::Softline
}

pub fn if_break<'a>(doc: Doc<'a>, other: Doc<'a>) -> Doc<'a> {
    Doc::IfBreak(Box::new(doc), Box::new(other))
}

pub fn join_impl<'a>(sep: &'a Doc<'a>, docs: &'a Vec<Doc>, _: &Printer) -> Vec<&'a Doc<'a>> {
    docs.iter()
        .enumerate()
        .fold(Vec::new(), |mut acc, (i, doc)| {
            if i > 0 {
                acc.push(sep);
            }
            acc.push(doc);
            acc
        })
}

pub fn text_justify(sep_length: usize, doc_lengths: &Vec<usize>, max_width: usize) -> Vec<usize> {
    struct Score {
        badness: usize,
        j: usize,
    }

    let n = doc_lengths.len();
    let mut dp = HashMap::new();

    dp.insert(n, Score { badness: 0, j: 0 });

    for i in (0..n).rev() {
        let mut best = Score {
            badness: usize::MAX,
            j: n,
        };
        let mut line_length = 0;

        for j in (i + 1)..=n {
            line_length += doc_lengths[j - 1] + sep_length;
            if line_length > max_width {
                break;
            }

            let badness = (max_width - line_length + sep_length).pow(3) + dp[&j].badness;
            if badness < best.badness {
                best = Score { badness, j };
            }
        }

        dp.insert(i, best);
    }

    let mut breaks = Vec::new();
    let mut i = 0;
    while i < n {
        let j = dp[&i].j;
        breaks.push(j);
        i = j;
    }
    breaks.pop();

    breaks
}

pub fn smart_join_impl<'a>(
    sep: &'a Doc<'a>,
    docs: &'a Vec<Doc>,
    printer: &Printer,
) -> Vec<&'a Doc<'a>> {
    let max_width = (printer.max_width / 4).max(2);

    let sep_length = count_text_length(sep, printer);
    let doc_lengths: Vec<_> = docs.iter().map(|d| count_text_length(d, printer)).collect();

    let breaks = text_justify(sep_length, &doc_lengths, max_width);

    docs.into_iter()
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
        })
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

pub fn pretty_print<'a>(doc: &Doc<'a>, printer: &Printer) -> String {
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

    let mut is_group = false;
    let mut group_broken = false;

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

                let indent_delta = if needs_breaking {
                    indent_delta + 1
                } else {
                    indent_delta
                };

                stack.push(PrintItem {
                    doc: d,
                    indent_delta,
                });
                if needs_breaking {
                    push_hardline(&mut stack, indent_delta);
                }

                is_group = true;
                group_broken = false;
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

                let joined = join_fn(*&sep, docs, printer);
                let length: usize = joined.iter().map(|d| count_text_length(d, printer)).sum();

                let needs_breaking =
                    length + ((indent_delta - 1) * printer.indent) > printer.max_width;

                if needs_breaking {
                    push_hardline(&mut stack, indent_delta - printer.indent);
                }
                for d in joined.into_iter().rev() {
                    stack.push(PrintItem {
                        doc: d,
                        indent_delta,
                    });
                }
                if needs_breaking {
                    push_hardline(&mut stack, indent_delta);
                }
            }

            Doc::Line => {
                output.push('\n');
            }

            Doc::Hardline => {
                if prev_was_hardline {
                    prev_was_hardline = false;
                    continue;
                }

                group_broken = is_group;

                output.push_str(&current_line);
                output.push('\n');
                current_line.clear();

                let space = if printer.use_tabs { "\t" } else { " " };
                current_line.push_str(&space.repeat(indent_delta));
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
        }

        prev_was_hardline = matches!(doc, Doc::Hardline);
    }

    output.push_str(&current_line);
    output
}

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

impl<'a> Printer {
    pub fn pretty(&self, doc: impl Into<Doc<'a>>) -> String {
        pretty_print(&doc.into(), self)
    }
}

impl<'a, T> Into<Doc<'a>> for Vec<T>
where
    T: Into<Doc<'a>>,
{
    fn into(self) -> Doc<'a> {
        let doc_vec: Vec<Doc> = self.into_iter().map(|item| item.into()).collect();

        if !doc_vec.is_empty() {
            let doc = str("[") + indent(smart_join(str(", "), doc_vec)) + Doc::Softline + str("]");

            return doc;
        } else {
            return str("[]");
        }
    }
}

impl<'a, K, V> Into<Doc<'a>> for HashMap<K, V>
where
    K: Into<Doc<'a>>,
    V: Into<Doc<'a>>,
{
    fn into(self) -> Doc<'a> {
        let mut doc_vec: Vec<Doc> = Vec::new();

        for (key, value) in self {
            let doc = key.into() + str(": ") + value.into();
            doc_vec.push(doc);
        }

        if !doc_vec.is_empty() {
            let doc = str("{")
                + indent(join(str(", ") + Doc::Hardline, doc_vec))
                + Doc::Hardline
                + str("}");

            return doc;
        } else {
            return str("{}");
        }
    }
}

impl<'a> Into<Doc<'a>> for &'a str {
    fn into(self) -> Doc<'a> {
        Doc::Str(self)
    }
}

impl<'a> Into<Doc<'a>> for String {
    fn into(self) -> Doc<'a> {
        Doc::String(self)
    }
}

macro_rules! impl_into_doc_for_number {
    ($($t:ty),*) => {
        $(
            impl<'a> Into<Doc<'a>> for $t {
                fn into(self) -> Doc<'a> {
                    Doc::String(self.to_string())
                }
            }
        )*
    };
}
impl_into_doc_for_number!(i8, i16, i32, i64, i128, isize, u8, u16, u32, u64, u128, usize, f32, f64);
