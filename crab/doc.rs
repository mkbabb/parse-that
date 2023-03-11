#[derive(Clone, Debug)]
pub enum Doc {
    Text(String),
    Concat(Vec<Doc>),
    Group(Box<Doc>),
    Indent(usize, Box<Doc>),
    Dedent(usize, Box<Doc>),
    Join(Box<Doc>, Vec<Doc>),
    Hardline,
    Softline,
}

pub fn group(doc: Doc) -> Doc {
    Doc::Group(Box::new(doc))
}

pub fn concat(docs: Vec<Doc>) -> Doc {
    Doc::Concat(docs)
}

pub fn join(separator: Doc, docs: Vec<Doc>) -> Doc {
    Doc::Join(Box::new(separator), docs)
}

pub fn indent(doc: Doc, printer: &Printer) -> Doc {
    Doc::Indent(printer.indent, Box::new(doc))
}

pub fn text(s: &str) -> Doc {
    Doc::Text(s.to_string())
}

impl FromIterator<Doc> for Doc {
    fn from_iter<T: IntoIterator<Item = Doc>>(iter: T) -> Self {
        Doc::Concat(iter.into_iter().collect())
    }
}

// impl plus op for Doc
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

fn count_text_length(doc: &Doc) -> usize {
    match doc {
        Doc::Text(s) => s.len(),
        Doc::Concat(docs) => docs.iter().map(count_text_length).sum(),
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
        Doc::Hardline => 0,
        Doc::Softline => 1,
    }
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

            Doc::Join(separator, docs) => {
                let mut docs = docs.into_iter();
                let last = docs.next_back().unwrap();

                let mut docs_sep = vec![];
                while let Some(doc) = docs.next() {
                    docs_sep.push(doc + *separator.clone());
                }
                docs_sep.push(last);

                let group = group(group(concat(docs_sep)));

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
                }
            }
        }
    }

    output.push_str(&current_line);
    output
}

pub fn flatten(doc: Doc, current_line_len: usize, printer: &Printer) -> Doc {
    match doc {
        Doc::Group(d) => {
            let group_content_len = count_text_length(&*d);
            let flattened = flatten(*d, group_content_len + current_line_len, printer);

            if group_content_len + current_line_len >= printer.max_width {
                Doc::Hardline + flattened
            } else {
                flattened
            }
        }
        other => other,
    }
}

pub struct Printer {
    pub max_width: usize,
    pub indent: usize,
}

impl Printer {
    pub fn new(max_width: usize, indent: usize) -> Printer {
        Printer { max_width, indent }
    }

    pub fn print(&self, doc: Doc) -> String {
        pretty_print(doc, self)
    }

    pub fn indent(&self, doc: Doc) -> Doc {
        indent(doc, self)
    }
}
