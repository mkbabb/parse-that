use std::collections::HashMap;

#[derive(Clone, Debug, Hash, PartialEq, Eq)]
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

pub fn group<'a>(doc: Doc<'a>) -> Doc<'a> {
    Doc::Group(Box::new(doc))
}

pub fn concat<'a>(docs: Vec<impl Into<Doc<'a>>>) -> Doc<'a> {
    Doc::Concat(docs.into_iter().map(|d| d.into()).collect())
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

impl<'a, T> Into<Doc<'a>> for Vec<T>
where
    T: Into<Doc<'a>>,
{
    fn into(self) -> Doc<'a> {
        let doc_vec: Vec<Doc> = self.into_iter().map(|item| item.into()).collect();

        if !doc_vec.is_empty() {
            let doc = str("[") + indent(smart_join(str(", "), doc_vec)) + str("]");

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
                + Doc::Softline
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
