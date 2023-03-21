use std::collections::HashMap;

#[derive(Clone, Debug, Hash, PartialEq, Eq)]
pub enum Doc<'a> {
    Null,
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

pub struct PrettyIgnore<T>(pub T);

impl<T> From<T> for PrettyIgnore<T> {
    fn from(value: T) -> Self {
        PrettyIgnore(value)
    }
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

pub fn group<'a>(doc: impl Into<Doc<'a>>) -> Doc<'a> {
    Doc::Group(Box::new(doc.into()))
}

pub fn concat<'a>(docs: Vec<impl Into<Doc<'a>>>) -> Doc<'a> {
    Doc::Concat(docs.into_iter().map(|d| d.into()).collect())
}

pub fn wrap<'a>(
    left: impl Into<Doc<'a>>,
    doc: impl Into<Doc<'a>>,
    right: impl Into<Doc<'a>>,
) -> Doc<'a> {
    concat(vec![left.into(), doc.into(), right.into()])
}

pub fn join<'a>(sep: impl Into<Doc<'a>>, docs: Vec<impl Into<Doc<'a>>>) -> Doc<'a> {
    Doc::Join(
        Box::new(sep.into()),
        docs.into_iter().map(|d| d.into()).collect(),
    )
}

pub fn smart_join<'a>(sep: impl Into<Doc<'a>>, docs: Vec<impl Into<Doc<'a>>>) -> Doc<'a> {
    Doc::SmartJoin(
        Box::new(sep.into()),
        docs.into_iter().map(|d| d.into()).collect(),
    )
}

pub fn indent<'a>(doc: impl Into<Doc<'a>>) -> Doc<'a> {
    Doc::Indent(Box::new(doc.into()))
}

pub fn dedent<'a>(doc: impl Into<Doc<'a>>) -> Doc<'a> {
    Doc::Dedent(Box::new(doc.into()))
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

pub trait Group {
    fn group(self) -> Self;
}

impl Group for Doc<'_> {
    fn group(self) -> Self {
        group(self)
    }
}

pub trait Indent {
    fn indent(self) -> Self;
}

impl Indent for Doc<'_> {
    fn indent(self) -> Self {
        indent(self)
    }
}

pub trait Join<'a> {
    fn join(self, sep: impl Into<Doc<'a>>) -> Doc<'a>;
}

impl<'a> Join<'a> for Vec<Doc<'a>> {
    fn join(self, sep: impl Into<Doc<'a>>) -> Doc<'a> {
        join(sep, self)
    }
}

pub trait SmartJoin<'a> {
    fn smart_join(self, sep: impl Into<Doc<'a>>) -> Doc<'a>;
}

impl<'a> SmartJoin<'a> for Vec<Doc<'a>> {
    fn smart_join(self, sep: impl Into<Doc<'a>>) -> Doc<'a> {
        smart_join(sep, self)
    }
}

pub trait Wrap<'a> {
    fn wrap(self, left: impl Into<Doc<'a>>, right: impl Into<Doc<'a>>) -> Doc<'a>;
}

impl<'a> Wrap<'a> for Doc<'a> {
    fn wrap(self, left: impl Into<Doc<'a>>, right: impl Into<Doc<'a>>) -> Doc<'a> {
        concat(vec![left.into(), self, right.into()])
    }
}

impl<'a, T> Into<Doc<'a>> for Vec<T>
where
    T: Into<Doc<'a>>,
{
    fn into(self) -> Doc<'a> {
        let doc_vec: Vec<_> = self.into_iter().map(|item| item.into()).collect();

        if !doc_vec.is_empty() {
            let doc = doc_vec
                .smart_join(str(", "))
                .group()
                .wrap(str("["), str("]"))
                .indent();
            return doc;
        } else {
            return str("[]");
        }
    }
}

impl<'a, K, V, R> Into<Doc<'a>> for HashMap<K, V, R>
where
    K: Into<Doc<'a>>,
    V: Into<Doc<'a>>,
{
    fn into(self) -> Doc<'a> {
        let doc_vec: Vec<_> = self
            .into_iter()
            .map(|(key, value)| key.into() + str(": ") + value.into())
            .collect();

        if !doc_vec.is_empty() {
            let doc = doc_vec
                .join(str(", ") + Doc::Hardline)
                .group()
                .wrap(str("{"), str("}"))
                .indent();
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

impl<'a> Into<Doc<'a>> for bool {
    fn into(self) -> Doc<'a> {
        Doc::String(self.to_string())
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

impl<'a, T> Into<Doc<'a>> for Option<T>
where
    T: Into<Doc<'a>>,
{
    fn into(self) -> Doc<'a> {
        match self {
            Some(value) => value.into(),
            None => str("null"),
        }
    }
}

// create into impl for IntoIter
