use std::collections::HashMap;

#[derive(Clone, Debug)]
pub enum Doc {
    Text(String),
    Concat(Vec<Doc>),
    Group(Box<Doc>),
    Indent(usize, Box<Doc>),
    Dedent(usize, Box<Doc>),
    Join(Box<Doc>, Vec<Doc>),
    SmartJoin(Box<Doc>, Vec<Doc>),
    Hardline,
    Softline,
}

impl FromIterator<Doc> for Doc {
    fn from_iter<T: IntoIterator<Item = Doc>>(iter: T) -> Self {
        Doc::Concat(iter.into_iter().collect())
    }
}

impl std::ops::Add for Doc {
    type Output = Doc;

    fn add(self, other: Doc) -> Doc {
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

pub fn count_text_length(doc: &Doc) -> usize {
    match doc {
        Doc::Text(s) => s.len(),
        Doc::Concat(docs) => docs.into_iter().map(count_text_length).sum(),
        Doc::Group(d) => count_text_length(d),
        Doc::Indent(i, d) => count_text_length(d) + i,
        Doc::Dedent(i, d) => count_text_length(d) - i,
        Doc::Join(separator, docs) => {
            if docs.is_empty() {
                0
            } else {
                let doc_length: usize = docs.iter().map(count_text_length).sum();
                let separator_length = count_text_length(separator);

                doc_length + separator_length * (docs.len() - 1)
            }
        }
        Doc::Hardline => usize::MAX,
        _ => 0,
    }
}

pub fn flatten(doc: Doc, current_line_len: usize, printer: &Printer) -> Doc {
    match doc {
        Doc::Group(d) => {
            let group_content_len = count_text_length(&*d);

            if group_content_len + current_line_len >= printer.max_width {
                Doc::Hardline + *d
            } else {
                *d
            }
        }
        other => other,
    }
}

pub fn group(doc: Doc) -> Doc {
    Doc::Group(Box::new(doc))
}

pub fn concat(docs: Vec<Doc>) -> Doc {
    Doc::Concat(docs)
}

pub fn join(sep: Doc, docs: Vec<Doc>) -> Doc {
    Doc::Join(Box::new(sep), docs)
}

pub fn smart_join(sep: Doc, docs: Vec<Doc>) -> Doc {
    Doc::SmartJoin(Box::new(sep), docs)
}

pub fn indent(doc: Doc, printer: &Printer) -> Doc {
    Doc::Indent(printer.indent, Box::new(doc))
}

pub fn dedent(doc: Doc, printer: &Printer) -> Doc {
    Doc::Dedent(printer.indent, Box::new(doc))
}

pub fn text<S: Into<String>>(s: S) -> Doc {
    Doc::Text(s.into())
}

pub fn hardline() -> Doc {
    Doc::Hardline
}

pub fn softline() -> Doc {
    Doc::Softline
}

pub fn join_impl(sep: Doc, docs: Vec<Doc>) -> Vec<Doc> {
    docs.into_iter()
        .enumerate()
        .fold(Vec::new(), |mut acc, (i, doc)| {
            if i > 0 {
                acc.push(sep.clone());
            }
            acc.push(doc);
            acc
        })
}

pub fn smart_join_impl(sep: Doc, docs: Vec<Doc>, max_width: usize) -> Vec<Doc> {
    struct Score {
        badness: usize,
        j: usize,
    }

    let sep_length = count_text_length(&sep);
    let doc_lengths: Vec<_> = docs.iter().map(count_text_length).collect();

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

    docs.into_iter()
        .enumerate()
        .fold(Vec::new(), |mut acc, (i, doc)| {
            if i > 0 {
                acc.push(sep.clone());
                if breaks.contains(&i) {
                    acc.push(Doc::Hardline);
                }
            }
            acc.push(doc);
            acc
        })
}

pub fn pretty_print(doc: Doc, printer: &Printer) -> String {
    let mut output = String::new();
    let mut current_line = String::new();
    let mut current_indent: usize = 0;

    let mut stack = vec![(doc, 0)];

    while let Some((doc, indent_delta)) = stack.pop() {
        match doc {
            Doc::Text(s) => {
                current_line.push_str(&s);
            }

            Doc::Concat(docs) => {
                for d in docs.into_iter().rev() {
                    stack.push((d, indent_delta));
                }
            }

            Doc::Group(d) => {
                let flattened = flatten(*d, indent_delta, printer);
                stack.push((flattened, indent_delta));
            }

            Doc::Indent(i, d) => {
                stack.push((*d, indent_delta + i));
                current_indent += i;
            }

            Doc::Dedent(i, d) => {
                stack.push((*d, indent_delta - i));
                current_indent -= i;
            }

            Doc::Join(sep, docs) => {
                let joined = join_impl(*sep, docs);
                let group = group(group(concat(joined)));

                stack.push((group, indent_delta));
            }

            Doc::SmartJoin(sep, docs) => {
                let joined = smart_join_impl(*sep, docs, printer.max_width - current_indent);
                let group = group(group(concat(joined)));

                stack.push((group, indent_delta));
            }

            Doc::Hardline => {
                output.push_str(&current_line);
                output.push('\n');
                current_line.clear();

                current_line.push_str(&" ".repeat(indent_delta));
            }

            Doc::Softline => {
                if current_line.len() + indent_delta >= printer.max_width {
                    stack.push((Doc::Hardline, indent_delta));
                } else {
                    current_line.push(' ');
                }
            }
        }
    }

    output.push_str(&current_line);
    output
}

pub struct Printer {
    pub max_width: usize,
    pub indent: usize,
}

impl Default for Printer {
    fn default() -> Self {
        Printer {
            max_width: 80,
            indent: 2,
        }
    }
}

impl Printer {
    pub fn new(max_width: usize, indent: usize) -> Printer {
        Printer { max_width, indent }
    }

    pub fn pretty(&self, doc: Doc) -> String {
        pretty_print(doc, self)
    }

    pub fn indent(&self, doc: Doc) -> Doc {
        indent(doc, self)
    }

    pub fn dedent(&self, doc: Doc) -> Doc {
        dedent(doc, self)
    }
}
