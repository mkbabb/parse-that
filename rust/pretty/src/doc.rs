use std::{
    borrow::Borrow,
    collections::{HashMap, HashSet},
};

use regex::Regex;

#[derive(Clone, Hash, PartialEq, Eq, PartialOrd, Ord)]
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

pub trait Dedent {
    fn dedent(self) -> Self;
}

impl Dedent for Doc<'_> {
    fn dedent(self) -> Self {
        dedent(self)
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

impl<'a> From<&'a str> for Doc<'a> {
    fn from(s: &'a str) -> Doc<'a> {
        Doc::Str(s)
    }
}

impl<'a> From<String> for Doc<'a> {
    fn from(s: String) -> Doc<'a> {
        Doc::String(s)
    }
}

impl<'a> From<bool> for Doc<'a> {
    fn from(b: bool) -> Doc<'a> {
        Doc::String(b.to_string())
    }
}

macro_rules! impl_from_number_to_doc {
    ($($t:ty),*) => {
        $(
            impl<'a> From<$t> for Doc<'a>  {
                fn from(value: $t) -> Self {
                    Doc::String(value.to_string())
                }
            }
        )*
    };
}
impl_from_number_to_doc!(i8, i16, i32, i64, i128, isize, u8, u16, u32, u64, u128, usize, f32, f64);

impl<'a, T> From<Option<T>> for Doc<'a>
where
    T: Into<Doc<'a>>,
{
    fn from(opt: Option<T>) -> Doc<'a> {
        match opt {
            Some(value) => value.into(),
            None => str("None"),
        }
    }
}

impl<'a, T> From<&[T]> for Doc<'a>
where
    T: Into<Doc<'a>> + Clone,
{
    fn from(slice: &[T]) -> Doc<'a> {
        slice
            .iter()
            .map(|item| item.clone().into())
            .collect::<Vec<_>>()
            .into()
    }
}

impl From<()> for Doc<'_> {
    fn from(_: ()) -> Self {
        str("()")
    }
}

impl<'a, T> From<&T> for Doc<'a>
where
    T: Into<Doc<'a>> + Clone,
{
    fn from(value: &T) -> Self {
        value.clone().into()
    }
}

impl<'a, T> From<Box<T>> for Doc<'a>
where
    T: Into<Doc<'a>>,
{
    fn from(value: Box<T>) -> Self {
        (*value).into()
    }
}

impl<'a> From<Regex> for Doc<'a> {
    fn from(regex: Regex) -> Self {
        regex.as_str().to_owned().into()
    }
}

macro_rules! impl_from_tuple_to_doc {
    ($($t:ident),*) => {
        #[allow(non_snake_case)]
        impl<'a, $($t),*> From<($($t),*)> for Doc<'a>
        where
            $($t: Into<Doc<'a>>),*
        {
            fn from(tuple: ($($t),*)) -> Self {
                let ($($t),*) = tuple;
                vec![$($t.into()),*]
                    .smart_join(str(", "))
                    .group()
                    .wrap(str("("), str(")"))
            }
        }
    };
}

impl_from_tuple_to_doc!(T1, T2);
impl_from_tuple_to_doc!(T1, T2, T3);
impl_from_tuple_to_doc!(T1, T2, T3, T4);
impl_from_tuple_to_doc!(T1, T2, T3, T4, T5);
impl_from_tuple_to_doc!(T1, T2, T3, T4, T5, T6);
impl_from_tuple_to_doc!(T1, T2, T3, T4, T5, T6, T7);
impl_from_tuple_to_doc!(T1, T2, T3, T4, T5, T6, T7, T8);
impl_from_tuple_to_doc!(T1, T2, T3, T4, T5, T6, T7, T8, T9);
impl_from_tuple_to_doc!(T1, T2, T3, T4, T5, T6, T7, T8, T9, T10);
impl_from_tuple_to_doc!(T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11);
impl_from_tuple_to_doc!(T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12);

impl<'a, T> From<Vec<T>> for Doc<'a>
where
    T: Into<Doc<'a>>,
{
    fn from(vec: Vec<T>) -> Doc<'a> {
        let doc_vec: Vec<_> = vec.into_iter().map(|item| item.into()).collect();

        if !doc_vec.is_empty() {
            let doc = doc_vec
                .smart_join(str(", "))
                .group()
                .wrap(str("["), str("]"))
                .indent();
            doc
        } else {
            return str("[]");
        }
    }
}

impl<'a, K, V, R> From<HashMap<K, V, R>> for Doc<'a>
where
    K: Into<Doc<'a>>,
    V: Into<Doc<'a>>,
{
    fn from(map: HashMap<K, V, R>) -> Doc<'a> {
        let doc_vec: Vec<_> = map
            .into_iter()
            .map(|(key, value)| key.into() + str(": ") + value.into())
            .collect();

        if !doc_vec.is_empty() {
            let doc = doc_vec
                .join(str(", ") + Doc::Hardline)
                .group()
                .wrap(str("{"), str("}"))
                .indent();
            doc
        } else {
            return str("{}");
        }
    }
}

impl<'a, T> From<HashSet<T>> for Doc<'a>
where
    T: Into<Doc<'a>>,
{
    fn from(set: HashSet<T>) -> Self {
        let doc_vec: Vec<_> = set.into_iter().map(|item| item.into()).collect();

        if !doc_vec.is_empty() {
            let doc = doc_vec
                .smart_join(str(", "))
                .group()
                .wrap(str("{"), str("}"))
                .indent();
            doc
        } else {
            return str("{}");
        }
    }
}
