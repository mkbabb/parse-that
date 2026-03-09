// CSS AST types (L1.5 — structural + typed values).

use crate::state::Span;
use smallvec::SmallVec;

// SmallVec type aliases for CSS AST

pub type SelectorVec<'a> = SmallVec<[CssSelector<'a>; 2]>;
pub type ValueVec<'a> = SmallVec<[CssValue<'a>; 2]>;
pub type FuncArgVec<'a> = Vec<CssValue<'a>>;
pub type CompoundVec<'a> = Vec<CssSelector<'a>>;
pub type DeclVec<'a> = Vec<CssDeclaration<'a>>;
pub type NodeVec<'a> = Vec<CssNode<'a>>;

#[derive(Debug, Clone, PartialEq)]
#[allow(clippy::large_enum_variant)]
pub enum CssNode<'a> {
    QualifiedRule {
        selector_list: SelectorVec<'a>,
        declarations: DeclVec<'a>,
    },
    AtMedia {
        queries: Vec<MediaQuery<'a>>,
        body: NodeVec<'a>,
    },
    AtSupports {
        condition: SupportsCondition<'a>,
        body: NodeVec<'a>,
    },
    AtFontFace {
        declarations: DeclVec<'a>,
    },
    AtImport {
        values: SmallVec<[CssValue<'a>; 4]>,
    },
    AtKeyframes {
        name: Span<'a>,
        blocks: SmallVec<[KeyframeBlock<'a>; 8]>,
    },
    GenericAtRule {
        name: Span<'a>,
        prelude: Span<'a>,
        body: Option<NodeVec<'a>>,
    },
    Comment(Span<'a>),
}

#[derive(Debug, Clone, PartialEq)]
pub struct CssDeclaration<'a> {
    pub property: Span<'a>,
    pub values: ValueVec<'a>,
    pub important: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub enum CssValue<'a> {
    Dimension(f64, Span<'a>),
    Number(f64),
    Percentage(f64),
    Color(CssColor<'a>),
    Function {
        name: Span<'a>,
        args: FuncArgVec<'a>,
    },
    String(Span<'a>),
    Ident(Span<'a>),
    Comma,
    Slash,
    Operator(Span<'a>),
}

#[derive(Debug, Clone, PartialEq)]
pub enum CssColor<'a> {
    Hex(Span<'a>),
    Named(Span<'a>),
    Function {
        name: Span<'a>,
        args: FuncArgVec<'a>,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub enum CssSelector<'a> {
    Type(Span<'a>),
    Class(Span<'a>),
    Id(Span<'a>),
    Universal,
    Attribute {
        name: Span<'a>,
        matcher: Option<Span<'a>>,
        value: Option<Span<'a>>,
    },
    PseudoClass(Span<'a>),
    PseudoElement(Span<'a>),
    PseudoFunction {
        name: Span<'a>,
        args: Vec<CssSelector<'a>>,
    },
    Compound(CompoundVec<'a>),
    Complex {
        left: Box<CssSelector<'a>>,
        combinator: Span<'a>,
        right: Box<CssSelector<'a>>,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub struct KeyframeBlock<'a> {
    pub stops: SmallVec<[KeyframeStop; 4]>,
    pub declarations: DeclVec<'a>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum KeyframeStop {
    From,
    To,
    Percentage(f64),
}

// Media Query AST (L1.75)

#[derive(Debug, Clone, PartialEq)]
pub struct MediaQuery<'a> {
    pub modifier: Option<Span<'a>>,
    pub media_type: Option<Span<'a>>,
    pub conditions: Vec<MediaCondition<'a>>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum MediaCondition<'a> {
    Feature(MediaFeature<'a>),
    And(Vec<MediaCondition<'a>>),
    Or(Vec<MediaCondition<'a>>),
    Not(Box<MediaCondition<'a>>),
}

#[derive(Debug, Clone, PartialEq)]
pub enum MediaFeature<'a> {
    Plain {
        name: Span<'a>,
        value: Option<CssValue<'a>>,
    },
    Range {
        name: Span<'a>,
        op: RangeOp,
        value: CssValue<'a>,
    },
    RangeInterval {
        name: Span<'a>,
        lo: CssValue<'a>,
        lo_op: RangeOp,
        hi: CssValue<'a>,
        hi_op: RangeOp,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RangeOp {
    Lt,
    LtEq,
    Gt,
    GtEq,
    Eq,
}

// Supports Condition AST (L1.75)

#[derive(Debug, Clone, PartialEq)]
pub enum SupportsCondition<'a> {
    Declaration {
        property: Span<'a>,
        value: Vec<CssValue<'a>>,
    },
    Not(Box<SupportsCondition<'a>>),
    And(Vec<SupportsCondition<'a>>),
    Or(Vec<SupportsCondition<'a>>),
}

// Specificity (L1.75)

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Specificity(pub u16, pub u16, pub u16);
