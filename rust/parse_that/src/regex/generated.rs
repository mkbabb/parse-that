#![allow(unused, non_snake_case, non_camel_case_types, clippy::all)]
//! AUTO-GENERATED from bootstrap/regex.bbnf — do not edit manually.
//! Regenerate: scripts/bootstrap-regex.sh

use crate::*;

pub struct RegexParser;

#[allow(non_upper_case_globals)]
pub const GRAMMAR_RegexParser: [&'static str; 1usize] = [
    "// Regex grammar \u{2014} full L4 spec for self-hosting parse-that\'s regex parser.\n//\n// Natural recursion: alternation \u{2192} concat \u{2192} quantified \u{2192} atom \u{2192} group \u{2192} alternation.\n// Rules in the cycle survive the IR optimizer; leaf rules are correctly inlined.\n//\n// Regenerate: scripts/bootstrap-regex.sh\n\n// \u{2500}\u{2500} Leaf rules (defined first \u{2014} inlined by optimizer) \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n\nliteral = /[^\\\\()\\[\\]{}|*+?.^$]/ ;\n\nclass_escape\n    = \"\\\\\" >> /[dDwWsS]/\n    | \"\\\\\" >> \"u\" >> \"{\" >> /[0-9a-fA-F]+/ << \"}\"\n    | \"\\\\\" >> \"u\" >> /[0-9a-fA-F]{4}/\n    | \"\\\\\" >> \"x\" >> /[0-9a-fA-F]{2}/\n    | \"\\\\\" >> /[^\\n]/\n    ;\n\nclass_atom = class_escape | /[^\\]\\\\]/ ;\n\nclass_item\n    = class_atom , \"-\" >> class_atom\n    | class_escape\n    | /[^\\]\\\\]/\n    ;\n\nchar_class = \"[\" >> \"^\" ? , class_item + << \"]\" ;\n\nescape\n    = \"\\\\\" >> /[dDwWsS]/\n    | \"\\\\\" >> /[pP]/ >> \"{\" >> /[A-Za-z_]+/ << \"}\"\n    | \"\\\\\" >> \"u\" >> \"{\" >> /[0-9a-fA-F]+/ << \"}\"\n    | \"\\\\\" >> \"u\" >> /[0-9a-fA-F]{4}/\n    | \"\\\\\" >> \"x\" >> /[0-9a-fA-F]{2}/\n    | \"\\\\\" >> /[^\\n]/\n    ;\n\nquantifier\n    = \"*\" , \"?\" ?\n    | \"+\" , \"?\" ?\n    | \"?\" , \"?\" ?\n    | \"{\" >> /\\d+/ , ( \",\" >> /\\d*/ ) ? << \"}\" , \"?\" ?\n    ;\n\n// \u{2500}\u{2500} Recursive spine (last rule = entry point) \u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\n\ngroup\n    = \"(?:\" >> alternation << \")\"\n    | \"(?\" >> /[simux]+/ , \":\" >> alternation << \")\"\n    | \"(?\" >> /[simux]+/ << \")\"\n    | \"(\" >> alternation << \")\"\n    ;\n\natom\n    = group\n    | char_class\n    | \".\"\n    | \"^\"\n    | \"$\"\n    | escape\n    | literal\n    ;\n\nquantified = atom , quantifier ? ;\n\nconcat = quantified + ;\n\nalternation = concat , ( \"|\" >> concat ) * ;\n\n// Entry point \u{2014} last rule in source order.\nregex = alternation ;\n",
];
pub enum RegexParserEnum<'a> {
    class_escape(crate::Span<'a>),
    escape(crate::Span<'a>),
    quantifier(crate::Span<'a>),
    literal(crate::Span<'a>),
    class_atom(&'a RegexParserEnum<'a>),
    class_item(&'a RegexParserEnum<'a>),
    char_class((crate::Span<'a>, &'a [RegexParserEnum<'a>])),
    group(&'a RegexParserEnum<'a>),
    alternation((&'a RegexParserEnum<'a>, &'a [RegexParserEnum<'a>])),
    atom(&'a RegexParserEnum<'a>),
    concat(&'a [RegexParserEnum<'a>]),
    quantified((&'a RegexParserEnum<'a>, Option<&'a RegexParserEnum<'a>>)),
    regex(&'a RegexParserEnum<'a>),
    class_atom_0(crate::Span<'a>),
    class_item_0((crate::Span<'a>, &'a RegexParserEnum<'a>)),
    class_item_1(crate::Span<'a>),
    group_0((crate::Span<'a>, &'a RegexParserEnum<'a>)),
    group_1(crate::Span<'a>),
    atom_0(crate::Span<'a>),
    #[doc(hidden)]
    __Phantom(::core::marker::PhantomData<&'a ()>),
}
#[automatically_derived]
impl<'a> ::core::fmt::Debug for RegexParserEnum<'a> {
    #[inline]
    fn fmt(&self, f: &mut ::core::fmt::Formatter) -> ::core::fmt::Result {
        match self {
            RegexParserEnum::class_escape(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "class_escape",
                    &__self_0,
                )
            }
            RegexParserEnum::escape(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(f, "escape", &__self_0)
            }
            RegexParserEnum::quantifier(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "quantifier",
                    &__self_0,
                )
            }
            RegexParserEnum::literal(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "literal",
                    &__self_0,
                )
            }
            RegexParserEnum::class_atom(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "class_atom",
                    &__self_0,
                )
            }
            RegexParserEnum::class_item(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "class_item",
                    &__self_0,
                )
            }
            RegexParserEnum::char_class(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "char_class",
                    &__self_0,
                )
            }
            RegexParserEnum::group(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(f, "group", &__self_0)
            }
            RegexParserEnum::alternation(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "alternation",
                    &__self_0,
                )
            }
            RegexParserEnum::atom(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(f, "atom", &__self_0)
            }
            RegexParserEnum::concat(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(f, "concat", &__self_0)
            }
            RegexParserEnum::quantified(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "quantified",
                    &__self_0,
                )
            }
            RegexParserEnum::regex(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(f, "regex", &__self_0)
            }
            RegexParserEnum::class_atom_0(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "class_atom_0",
                    &__self_0,
                )
            }
            RegexParserEnum::class_item_0(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "class_item_0",
                    &__self_0,
                )
            }
            RegexParserEnum::class_item_1(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "class_item_1",
                    &__self_0,
                )
            }
            RegexParserEnum::group_0(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "group_0",
                    &__self_0,
                )
            }
            RegexParserEnum::group_1(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "group_1",
                    &__self_0,
                )
            }
            RegexParserEnum::atom_0(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(f, "atom_0", &__self_0)
            }
            RegexParserEnum::__Phantom(__self_0) => {
                ::core::fmt::Formatter::debug_tuple_field1_finish(
                    f,
                    "__Phantom",
                    &__self_0,
                )
            }
        }
    }
}
#[automatically_derived]
impl<'a> ::core::clone::Clone for RegexParserEnum<'a> {
    #[inline]
    fn clone(&self) -> RegexParserEnum<'a> {
        match self {
            RegexParserEnum::class_escape(__self_0) => {
                RegexParserEnum::class_escape(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::escape(__self_0) => {
                RegexParserEnum::escape(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::quantifier(__self_0) => {
                RegexParserEnum::quantifier(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::literal(__self_0) => {
                RegexParserEnum::literal(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::class_atom(__self_0) => {
                RegexParserEnum::class_atom(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::class_item(__self_0) => {
                RegexParserEnum::class_item(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::char_class(__self_0) => {
                RegexParserEnum::char_class(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::group(__self_0) => {
                RegexParserEnum::group(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::alternation(__self_0) => {
                RegexParserEnum::alternation(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::atom(__self_0) => {
                RegexParserEnum::atom(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::concat(__self_0) => {
                RegexParserEnum::concat(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::quantified(__self_0) => {
                RegexParserEnum::quantified(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::regex(__self_0) => {
                RegexParserEnum::regex(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::class_atom_0(__self_0) => {
                RegexParserEnum::class_atom_0(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::class_item_0(__self_0) => {
                RegexParserEnum::class_item_0(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::class_item_1(__self_0) => {
                RegexParserEnum::class_item_1(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::group_0(__self_0) => {
                RegexParserEnum::group_0(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::group_1(__self_0) => {
                RegexParserEnum::group_1(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::atom_0(__self_0) => {
                RegexParserEnum::atom_0(::core::clone::Clone::clone(__self_0))
            }
            RegexParserEnum::__Phantom(__self_0) => {
                RegexParserEnum::__Phantom(::core::clone::Clone::clone(__self_0))
            }
        }
    }
}
#[allow(non_camel_case_types)]
struct __RegexParserEnumCtx<'a> {
    __slab: crate::BumpSlab,
    __s0: ::std::cell::UnsafeCell<Vec<RegexParserEnum<'a>>>,
}
#[allow(non_snake_case)]
impl<'a> __RegexParserEnumCtx<'a> {
    fn with_capacity(n: usize) -> Self {
        Self {
            __slab: crate::BumpSlab::with_capacity(n * 32),
            __s0: ::std::cell::UnsafeCell::new(Vec::with_capacity(64)),
        }
    }
    #[inline(always)]
    fn slab(&self) -> &crate::BumpSlab {
        &self.__slab
    }
    #[inline(always)]
    #[allow(non_snake_case)]
    fn __s0(&self) -> &mut Vec<RegexParserEnum<'a>> {
        unsafe { &mut *self.__s0.get() }
    }
    #[inline(always)]
    #[allow(non_snake_case)]
    fn __c0(&'a self, depth: usize) -> &'a [RegexParserEnum<'a>] {
        let s = self.__s0();
        let slice = self.__slab.alloc_slice_clone(&s[depth..]);
        s.truncate(depth);
        slice
    }
}
#[allow(non_snake_case)]
#[inline(always)]
fn __RegexParserEnum_alloc<'a>(
    state: &crate::ParserState<'a>,
) -> &'a __RegexParserEnumCtx<'a> {
    if true {
        if !!state.context_ptr.is_null() {
            panic!("slab parser requires parse_with_context()");
        }
    }
    unsafe { &*(state.context_ptr as *const __RegexParserEnumCtx<'a>) }
}
impl RegexParser {
    #[allow(non_snake_case)]
    fn __quantifier<'a>(
        state: &mut crate::ParserState<'a>,
    ) -> Option<RegexParserEnum<'a>> {
        (|| {
            if state.offset < state.src.len() {
                match state.src.as_bytes()[state.offset] {
                    42u8 => {
                        (|| {
                            let __sp_start = state.offset;
                            {
                                let __start = state.offset;
                                state.offset += 1;
                                Some(
                                    crate::Span::new(__start, state.offset, state.src),
                                )
                            }?;
                            {
                                let __cp = state.offset;
                                if (|| {
                                    if state.offset < state.src.len()
                                        && state.src.as_bytes()[state.offset] == 63u8
                                    {
                                        let __start = state.offset;
                                        state.offset += 1;
                                        Some(
                                            crate::Span::new(__start, state.offset, state.src),
                                        )
                                    } else {
                                        None
                                    }
                                })()
                                    .is_none()
                                {
                                    state.offset = __cp;
                                }
                                Some(crate::Span::new(__cp, state.offset, state.src))
                            }?;
                            Some(
                                crate::Span::new(__sp_start, state.offset, state.src),
                            )
                        })()
                    }
                    43u8 => {
                        (|| {
                            let __sp_start = state.offset;
                            {
                                let __start = state.offset;
                                state.offset += 1;
                                Some(
                                    crate::Span::new(__start, state.offset, state.src),
                                )
                            }?;
                            {
                                let __cp = state.offset;
                                if (|| {
                                    if state.offset < state.src.len()
                                        && state.src.as_bytes()[state.offset] == 63u8
                                    {
                                        let __start = state.offset;
                                        state.offset += 1;
                                        Some(
                                            crate::Span::new(__start, state.offset, state.src),
                                        )
                                    } else {
                                        None
                                    }
                                })()
                                    .is_none()
                                {
                                    state.offset = __cp;
                                }
                                Some(crate::Span::new(__cp, state.offset, state.src))
                            }?;
                            Some(
                                crate::Span::new(__sp_start, state.offset, state.src),
                            )
                        })()
                    }
                    63u8 => {
                        (|| {
                            let __sp_start = state.offset;
                            {
                                let __start = state.offset;
                                state.offset += 1;
                                Some(
                                    crate::Span::new(__start, state.offset, state.src),
                                )
                            }?;
                            {
                                let __cp = state.offset;
                                if (|| {
                                    if state.offset < state.src.len()
                                        && state.src.as_bytes()[state.offset] == 63u8
                                    {
                                        let __start = state.offset;
                                        state.offset += 1;
                                        Some(
                                            crate::Span::new(__start, state.offset, state.src),
                                        )
                                    } else {
                                        None
                                    }
                                })()
                                    .is_none()
                                {
                                    state.offset = __cp;
                                }
                                Some(crate::Span::new(__cp, state.offset, state.src))
                            }?;
                            Some(
                                crate::Span::new(__sp_start, state.offset, state.src),
                            )
                        })()
                    }
                    123u8 => {
                        (|| {
                            let __sp_start = state.offset;
                            (|| {
                                {
                                    let __start = state.offset;
                                    state.offset += 1;
                                    Some(
                                        crate::Span::new(__start, state.offset, state.src),
                                    )
                                }?;
                                crate::scan_number_span_json(state)
                            })()?;
                            (|| {
                                let __kept = {
                                    let __cp = state.offset;
                                    if (|| (|| {
                                        if state.offset < state.src.len()
                                            && state.src.as_bytes()[state.offset] == 44u8
                                        {
                                            let __start = state.offset;
                                            state.offset += 1;
                                            Some(
                                                crate::Span::new(__start, state.offset, state.src),
                                            )
                                        } else {
                                            None
                                        }?;
                                        crate::scan_number_span_json(state)
                                    })())()
                                        .is_none()
                                    {
                                        state.offset = __cp;
                                    }
                                    Some(crate::Span::new(__cp, state.offset, state.src))
                                }?;
                                if state.offset < state.src.len()
                                    && state.src.as_bytes()[state.offset] == 125u8
                                {
                                    let __start = state.offset;
                                    state.offset += 1;
                                    Some(
                                        crate::Span::new(__start, state.offset, state.src),
                                    )
                                } else {
                                    None
                                }?;
                                Some(__kept)
                            })()?;
                            {
                                let __cp = state.offset;
                                if (|| {
                                    if state.offset < state.src.len()
                                        && state.src.as_bytes()[state.offset] == 63u8
                                    {
                                        let __start = state.offset;
                                        state.offset += 1;
                                        Some(
                                            crate::Span::new(__start, state.offset, state.src),
                                        )
                                    } else {
                                        None
                                    }
                                })()
                                    .is_none()
                                {
                                    state.offset = __cp;
                                }
                                Some(crate::Span::new(__cp, state.offset, state.src))
                            }?;
                            Some(
                                crate::Span::new(__sp_start, state.offset, state.src),
                            )
                        })()
                    }
                    _ => None,
                }
            } else {
                None
            }
        })()
            .map(|__x| RegexParserEnum::quantifier(__x))
    }
    pub fn quantifier<'a>() -> Parser<'a, RegexParserEnum<'a>> {
        Parser::new(Self::__quantifier)
    }
    #[allow(non_snake_case)]
    fn __alternation<'a>(
        state: &mut crate::ParserState<'a>,
    ) -> Option<RegexParserEnum<'a>> {
        (|| {
            (|| {
                let __v2 = Self::__concat(state)
                    .map(|__v| &*__RegexParserEnum_alloc(state).slab().alloc(__v))?;
                let __v3 = {
                    let __depth0 = __RegexParserEnum_alloc(state).__s0().len();
                    loop {
                        let __prev1 = state.offset;
                        match (|| {
                            if state.offset < state.src.len()
                                && state.src.as_bytes()[state.offset] == 124u8
                            {
                                let __start = state.offset;
                                state.offset += 1;
                                Some(
                                    crate::Span::new(__start, state.offset, state.src),
                                )
                            } else {
                                None
                            }?;
                            Self::__concat(state)
                        })() {
                            Some(__value) => {
                                __RegexParserEnum_alloc(state).__s0().push(__value);
                                if state.offset == __prev1 {
                                    break;
                                }
                            }
                            None => {
                                state.offset = __prev1;
                                break;
                            }
                        }
                    }
                    Some(__RegexParserEnum_alloc(state).__c0(__depth0))
                }?;
                Some((__v2, __v3))
            })()
        })()
            .map(|__x| RegexParserEnum::alternation(__x))
    }
    pub fn alternation<'a>() -> Parser<'a, RegexParserEnum<'a>> {
        Parser::new(Self::__alternation)
    }
    #[allow(non_snake_case)]
    fn __concat<'a>(
        state: &mut crate::ParserState<'a>,
    ) -> Option<RegexParserEnum<'a>> {
        (|| {
            {
                let __depth14 = __RegexParserEnum_alloc(state).__s0().len();
                loop {
                    let __prev15 = state.offset;
                    match (|| {
                        let __v12 = if state.offset < state.src.len() {
                            match state.src.as_bytes()[state.offset] {
                                46u8 => {
                                    ({
                                        let __start = state.offset;
                                        state.offset += 1;
                                        Some(
                                            crate::Span::new(__start, state.offset, state.src),
                                        )
                                    })
                                        .map(|__sv| {
                                            &*__RegexParserEnum_alloc(state)
                                                .slab()
                                                .alloc(RegexParserEnum::class_atom_0(__sv))
                                        })
                                }
                                94u8 => {
                                    ({
                                        let __start = state.offset;
                                        state.offset += 1;
                                        Some(
                                            crate::Span::new(__start, state.offset, state.src),
                                        )
                                    })
                                        .map(|__sv| {
                                            &*__RegexParserEnum_alloc(state)
                                                .slab()
                                                .alloc(RegexParserEnum::class_atom_0(__sv))
                                        })
                                }
                                36u8 => {
                                    ({
                                        let __start = state.offset;
                                        state.offset += 1;
                                        Some(
                                            crate::Span::new(__start, state.offset, state.src),
                                        )
                                    })
                                        .map(|__sv| {
                                            &*__RegexParserEnum_alloc(state)
                                                .slab()
                                                .alloc(RegexParserEnum::class_atom_0(__sv))
                                        })
                                }
                                40u8 => {
                                    (|| {
                                        {
                                            let __cp = state.offset;
                                            let __result = (|| {
                                                let __kept = (|| {
                                                    if state.src[state.offset..].starts_with("(?:") {
                                                        let __start = state.offset;
                                                        state.offset += 3usize;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }?;
                                                    Self::__alternation(state)
                                                        .map(|__v| {
                                                            &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                                        })
                                                })()?;
                                                if state.offset < state.src.len()
                                                    && state.src.as_bytes()[state.offset] == 41u8
                                                {
                                                    let __start = state.offset;
                                                    state.offset += 1;
                                                    Some(
                                                        crate::Span::new(__start, state.offset, state.src),
                                                    )
                                                } else {
                                                    None
                                                }?;
                                                Some(__kept)
                                            })();
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        {
                                            let __cp = state.offset;
                                            let __result = ((|| {
                                                let __sp_start = state.offset;
                                                (|| {
                                                    if state.src[state.offset..].starts_with("(?") {
                                                        let __start = state.offset;
                                                        state.offset += 2usize;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }?;
                                                    {
                                                        let __start = state.offset;
                                                        let __end = state.src_bytes.len();
                                                        let mut __pos = __start;
                                                        while __pos < __end {
                                                            let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                            if __b == b's' || __b == b'i' || __b == b'm' || __b == b'u'
                                                                || __b == b'x'
                                                            {
                                                                __pos += 1;
                                                            } else {
                                                                break;
                                                            }
                                                        }
                                                        if __pos >= __start + 1 {
                                                            state.offset = __pos;
                                                            Some(crate::Span::new(__start, __pos, state.src))
                                                        } else {
                                                            None
                                                        }
                                                    }
                                                })()?;
                                                let __sp4 = crate::Span::new(
                                                    __sp_start,
                                                    state.offset,
                                                    state.src,
                                                );
                                                let __v5 = (|| {
                                                    let __kept = (|| {
                                                        if state.offset < state.src.len()
                                                            && state.src.as_bytes()[state.offset] == 58u8
                                                        {
                                                            let __start = state.offset;
                                                            state.offset += 1;
                                                            Some(
                                                                crate::Span::new(__start, state.offset, state.src),
                                                            )
                                                        } else {
                                                            None
                                                        }?;
                                                        Self::__alternation(state)
                                                            .map(|__v| {
                                                                &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                                            })
                                                    })()?;
                                                    if state.offset < state.src.len()
                                                        && state.src.as_bytes()[state.offset] == 41u8
                                                    {
                                                        let __start = state.offset;
                                                        state.offset += 1;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }?;
                                                    Some(__kept)
                                                })()?;
                                                Some((__sp4, __v5))
                                            })())
                                                .map(|__sv| {
                                                    &*__RegexParserEnum_alloc(state)
                                                        .slab()
                                                        .alloc(RegexParserEnum::class_item_0(__sv))
                                                });
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        {
                                            let __cp = state.offset;
                                            let __result = ((|| {
                                                let __kept = (|| {
                                                    if state.src[state.offset..].starts_with("(?") {
                                                        let __start = state.offset;
                                                        state.offset += 2usize;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }?;
                                                    {
                                                        let __start = state.offset;
                                                        let __end = state.src_bytes.len();
                                                        let mut __pos = __start;
                                                        while __pos < __end {
                                                            let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                            if __b == b's' || __b == b'i' || __b == b'm' || __b == b'u'
                                                                || __b == b'x'
                                                            {
                                                                __pos += 1;
                                                            } else {
                                                                break;
                                                            }
                                                        }
                                                        if __pos >= __start + 1 {
                                                            state.offset = __pos;
                                                            Some(crate::Span::new(__start, __pos, state.src))
                                                        } else {
                                                            None
                                                        }
                                                    }
                                                })()?;
                                                if state.offset < state.src.len()
                                                    && state.src.as_bytes()[state.offset] == 41u8
                                                {
                                                    let __start = state.offset;
                                                    state.offset += 1;
                                                    Some(
                                                        crate::Span::new(__start, state.offset, state.src),
                                                    )
                                                } else {
                                                    None
                                                }?;
                                                Some(__kept)
                                            })())
                                                .map(|__sv| {
                                                    &*__RegexParserEnum_alloc(state)
                                                        .slab()
                                                        .alloc(RegexParserEnum::class_atom_0(__sv))
                                                });
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        {
                                            let __cp = state.offset;
                                            let __result = (|| {
                                                let __kept = (|| {
                                                    {
                                                        let __start = state.offset;
                                                        state.offset += 1;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    }?;
                                                    Self::__alternation(state)
                                                        .map(|__v| {
                                                            &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                                        })
                                                })()?;
                                                if state.offset < state.src.len()
                                                    && state.src.as_bytes()[state.offset] == 41u8
                                                {
                                                    let __start = state.offset;
                                                    state.offset += 1;
                                                    Some(
                                                        crate::Span::new(__start, state.offset, state.src),
                                                    )
                                                } else {
                                                    None
                                                }?;
                                                Some(__kept)
                                            })();
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        None
                                    })()
                                        .map(|__inner| {
                                            let __v = RegexParserEnum::group(__inner);
                                            &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                        })
                                }
                                91u8 => {
                                    (|| {
                                        let __sp_start = state.offset;
                                        (|| {
                                            {
                                                let __start = state.offset;
                                                state.offset += 1;
                                                Some(
                                                    crate::Span::new(__start, state.offset, state.src),
                                                )
                                            }?;
                                            {
                                                let __cp = state.offset;
                                                if (|| {
                                                    if state.offset < state.src.len()
                                                        && state.src.as_bytes()[state.offset] == 94u8
                                                    {
                                                        let __start = state.offset;
                                                        state.offset += 1;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }
                                                })()
                                                    .is_none()
                                                {
                                                    state.offset = __cp;
                                                }
                                                Some(crate::Span::new(__cp, state.offset, state.src))
                                            }
                                        })()?;
                                        let __sp10 = crate::Span::new(
                                            __sp_start,
                                            state.offset,
                                            state.src,
                                        );
                                        let __v11 = (|| {
                                            let __kept = {
                                                let __depth8 = __RegexParserEnum_alloc(state).__s0().len();
                                                loop {
                                                    let __prev9 = state.offset;
                                                    match (|| {
                                                        {
                                                            let __cp = state.offset;
                                                            let __result = ((|| {
                                                                let __sp_start = state.offset;
                                                                if state.offset < state.src.len() {
                                                                    match state.src.as_bytes()[state.offset] {
                                                                        92u8 => {
                                                                            (|| {
                                                                                {
                                                                                    let __cp = state.offset;
                                                                                    let __result = (|| {
                                                                                        {
                                                                                            let __start = state.offset;
                                                                                            state.offset += 1;
                                                                                            Some(
                                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                                            )
                                                                                        }?;
                                                                                        {
                                                                                            let __start = state.offset;
                                                                                            if let Some(&__b) = state.src_bytes.get(__start) {
                                                                                                if #[allow(non_exhaustive_omitted_patterns)]
                                                                                                match __b {
                                                                                                    b'd' | b'D' | b'w' | b'W' | b's' | b'S' => true,
                                                                                                    _ => false,
                                                                                                } {
                                                                                                    state.offset = __start + 1;
                                                                                                    Some(
                                                                                                        crate::Span::new(__start, __start + 1, state.src),
                                                                                                    )
                                                                                                } else {
                                                                                                    None
                                                                                                }
                                                                                            } else {
                                                                                                None
                                                                                            }
                                                                                        }
                                                                                    })();
                                                                                    if __result.is_some() {
                                                                                        return __result;
                                                                                    }
                                                                                    state.offset = __cp;
                                                                                }
                                                                                {
                                                                                    let __cp = state.offset;
                                                                                    let __result = (|| {
                                                                                        let __kept = (|| {
                                                                                            (|| {
                                                                                                (|| {
                                                                                                    if state.offset < state.src.len()
                                                                                                        && state.src.as_bytes()[state.offset] == 92u8
                                                                                                    {
                                                                                                        let __start = state.offset;
                                                                                                        state.offset += 1;
                                                                                                        Some(
                                                                                                            crate::Span::new(__start, state.offset, state.src),
                                                                                                        )
                                                                                                    } else {
                                                                                                        None
                                                                                                    }?;
                                                                                                    if state.offset < state.src.len()
                                                                                                        && state.src.as_bytes()[state.offset] == 117u8
                                                                                                    {
                                                                                                        let __start = state.offset;
                                                                                                        state.offset += 1;
                                                                                                        Some(
                                                                                                            crate::Span::new(__start, state.offset, state.src),
                                                                                                        )
                                                                                                    } else {
                                                                                                        None
                                                                                                    }
                                                                                                })()?;
                                                                                                if state.offset < state.src.len()
                                                                                                    && state.src.as_bytes()[state.offset] == 123u8
                                                                                                {
                                                                                                    let __start = state.offset;
                                                                                                    state.offset += 1;
                                                                                                    Some(
                                                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                                                    )
                                                                                                } else {
                                                                                                    None
                                                                                                }
                                                                                            })()?;
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                let __end = state.src_bytes.len();
                                                                                                let mut __pos = __start;
                                                                                                while __pos < __end {
                                                                                                    let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                                    if (__b >= b'0' && __b <= b'9')
                                                                                                        || (__b >= b'a' && __b <= b'f')
                                                                                                        || (__b >= b'A' && __b <= b'F')
                                                                                                    {
                                                                                                        __pos += 1;
                                                                                                    } else {
                                                                                                        break;
                                                                                                    }
                                                                                                }
                                                                                                if __pos >= __start + 1 {
                                                                                                    state.offset = __pos;
                                                                                                    Some(crate::Span::new(__start, __pos, state.src))
                                                                                                } else {
                                                                                                    None
                                                                                                }
                                                                                            }
                                                                                        })()?;
                                                                                        if state.offset < state.src.len()
                                                                                            && state.src.as_bytes()[state.offset] == 125u8
                                                                                        {
                                                                                            let __start = state.offset;
                                                                                            state.offset += 1;
                                                                                            Some(
                                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                                            )
                                                                                        } else {
                                                                                            None
                                                                                        }?;
                                                                                        Some(__kept)
                                                                                    })();
                                                                                    if __result.is_some() {
                                                                                        return __result;
                                                                                    }
                                                                                    state.offset = __cp;
                                                                                }
                                                                                {
                                                                                    let __cp = state.offset;
                                                                                    let __result = (|| {
                                                                                        (|| {
                                                                                            if state.offset < state.src.len()
                                                                                                && state.src.as_bytes()[state.offset] == 92u8
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                state.offset += 1;
                                                                                                Some(
                                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                                )
                                                                                            } else {
                                                                                                None
                                                                                            }?;
                                                                                            if state.offset < state.src.len()
                                                                                                && state.src.as_bytes()[state.offset] == 117u8
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                state.offset += 1;
                                                                                                Some(
                                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                                )
                                                                                            } else {
                                                                                                None
                                                                                            }
                                                                                        })()?;
                                                                                        {
                                                                                            let __start = state.offset;
                                                                                            let __end = state.src_bytes.len();
                                                                                            let mut __pos = __start;
                                                                                            let mut __count: usize = 0;
                                                                                            while __pos < __end && __count < 4 {
                                                                                                let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                                if (__b >= b'0' && __b <= b'9')
                                                                                                    || (__b >= b'a' && __b <= b'f')
                                                                                                    || (__b >= b'A' && __b <= b'F')
                                                                                                {
                                                                                                    __pos += 1;
                                                                                                    __count += 1;
                                                                                                } else {
                                                                                                    break;
                                                                                                }
                                                                                            }
                                                                                            if __count >= 4 {
                                                                                                state.offset = __pos;
                                                                                                Some(crate::Span::new(__start, __pos, state.src))
                                                                                            } else {
                                                                                                None
                                                                                            }
                                                                                        }
                                                                                    })();
                                                                                    if __result.is_some() {
                                                                                        return __result;
                                                                                    }
                                                                                    state.offset = __cp;
                                                                                }
                                                                                {
                                                                                    let __cp = state.offset;
                                                                                    let __result = (|| {
                                                                                        (|| {
                                                                                            if state.offset < state.src.len()
                                                                                                && state.src.as_bytes()[state.offset] == 92u8
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                state.offset += 1;
                                                                                                Some(
                                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                                )
                                                                                            } else {
                                                                                                None
                                                                                            }?;
                                                                                            if state.offset < state.src.len()
                                                                                                && state.src.as_bytes()[state.offset] == 120u8
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                state.offset += 1;
                                                                                                Some(
                                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                                )
                                                                                            } else {
                                                                                                None
                                                                                            }
                                                                                        })()?;
                                                                                        {
                                                                                            let __start = state.offset;
                                                                                            let __end = state.src_bytes.len();
                                                                                            let mut __pos = __start;
                                                                                            let mut __count: usize = 0;
                                                                                            while __pos < __end && __count < 2 {
                                                                                                let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                                if (__b >= b'0' && __b <= b'9')
                                                                                                    || (__b >= b'a' && __b <= b'f')
                                                                                                    || (__b >= b'A' && __b <= b'F')
                                                                                                {
                                                                                                    __pos += 1;
                                                                                                    __count += 1;
                                                                                                } else {
                                                                                                    break;
                                                                                                }
                                                                                            }
                                                                                            if __count >= 2 {
                                                                                                state.offset = __pos;
                                                                                                Some(crate::Span::new(__start, __pos, state.src))
                                                                                            } else {
                                                                                                None
                                                                                            }
                                                                                        }
                                                                                    })();
                                                                                    if __result.is_some() {
                                                                                        return __result;
                                                                                    }
                                                                                    state.offset = __cp;
                                                                                }
                                                                                {
                                                                                    let __cp = state.offset;
                                                                                    let __result = (|| {
                                                                                        if state.offset < state.src.len()
                                                                                            && state.src.as_bytes()[state.offset] == 92u8
                                                                                        {
                                                                                            let __start = state.offset;
                                                                                            state.offset += 1;
                                                                                            Some(
                                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                                            )
                                                                                        } else {
                                                                                            None
                                                                                        }?;
                                                                                        {
                                                                                            let __start = state.offset;
                                                                                            let __result: Option<()> = (|| {
                                                                                                {
                                                                                                    let __b = *state.src_bytes.get(state.offset)?;
                                                                                                    if !(!(__b == b'\n')) {
                                                                                                        return None;
                                                                                                    }
                                                                                                    state.offset += 1;
                                                                                                }
                                                                                                Some(())
                                                                                            })();
                                                                                            if __result.is_some() && state.offset > __start {
                                                                                                Some(
                                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                                )
                                                                                            } else {
                                                                                                state.offset = __start;
                                                                                                None
                                                                                            }
                                                                                        }
                                                                                    })();
                                                                                    if __result.is_some() {
                                                                                        return __result;
                                                                                    }
                                                                                    state.offset = __cp;
                                                                                }
                                                                                None
                                                                            })()
                                                                                .map(|__inner| {
                                                                                    let __v = RegexParserEnum::class_escape(__inner);
                                                                                    &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                                                                })
                                                                        }
                                                                        _ => {
                                                                            ({
                                                                                let __start = state.offset;
                                                                                let __result: Option<()> = (|| {
                                                                                    {
                                                                                        let __b = *state.src_bytes.get(state.offset)?;
                                                                                        if !(!((__b >= b'\\' && __b <= b']'))) {
                                                                                            return None;
                                                                                        }
                                                                                        state.offset += 1;
                                                                                    }
                                                                                    Some(())
                                                                                })();
                                                                                if __result.is_some() && state.offset > __start {
                                                                                    Some(
                                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                                    )
                                                                                } else {
                                                                                    state.offset = __start;
                                                                                    None
                                                                                }
                                                                            })
                                                                                .map(|__sv| {
                                                                                    &*__RegexParserEnum_alloc(state)
                                                                                        .slab()
                                                                                        .alloc(RegexParserEnum::class_atom_0(__sv))
                                                                                })
                                                                        }
                                                                    }
                                                                } else {
                                                                    ({
                                                                        let __start = state.offset;
                                                                        let __result: Option<()> = (|| {
                                                                            {
                                                                                let __b = *state.src_bytes.get(state.offset)?;
                                                                                if !(!((__b >= b'\\' && __b <= b']'))) {
                                                                                    return None;
                                                                                }
                                                                                state.offset += 1;
                                                                            }
                                                                            Some(())
                                                                        })();
                                                                        if __result.is_some() && state.offset > __start {
                                                                            Some(
                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                            )
                                                                        } else {
                                                                            state.offset = __start;
                                                                            None
                                                                        }
                                                                    })
                                                                        .map(|__sv| {
                                                                            &*__RegexParserEnum_alloc(state)
                                                                                .slab()
                                                                                .alloc(RegexParserEnum::class_atom_0(__sv))
                                                                        })
                                                                }
                                                                    .map(|__v| RegexParserEnum::class_atom(__v))?;
                                                                let __sp6 = crate::Span::new(
                                                                    __sp_start,
                                                                    state.offset,
                                                                    state.src,
                                                                );
                                                                let __v7 = (|| {
                                                                    if state.offset < state.src.len()
                                                                        && state.src.as_bytes()[state.offset] == 45u8
                                                                    {
                                                                        let __start = state.offset;
                                                                        state.offset += 1;
                                                                        Some(
                                                                            crate::Span::new(__start, state.offset, state.src),
                                                                        )
                                                                    } else {
                                                                        None
                                                                    }?;
                                                                    if state.offset < state.src.len() {
                                                                        match state.src.as_bytes()[state.offset] {
                                                                            92u8 => {
                                                                                (|| {
                                                                                    {
                                                                                        let __cp = state.offset;
                                                                                        let __result = (|| {
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                state.offset += 1;
                                                                                                Some(
                                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                                )
                                                                                            }?;
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                if let Some(&__b) = state.src_bytes.get(__start) {
                                                                                                    if #[allow(non_exhaustive_omitted_patterns)]
                                                                                                    match __b {
                                                                                                        b'd' | b'D' | b'w' | b'W' | b's' | b'S' => true,
                                                                                                        _ => false,
                                                                                                    } {
                                                                                                        state.offset = __start + 1;
                                                                                                        Some(
                                                                                                            crate::Span::new(__start, __start + 1, state.src),
                                                                                                        )
                                                                                                    } else {
                                                                                                        None
                                                                                                    }
                                                                                                } else {
                                                                                                    None
                                                                                                }
                                                                                            }
                                                                                        })();
                                                                                        if __result.is_some() {
                                                                                            return __result;
                                                                                        }
                                                                                        state.offset = __cp;
                                                                                    }
                                                                                    {
                                                                                        let __cp = state.offset;
                                                                                        let __result = (|| {
                                                                                            let __kept = (|| {
                                                                                                (|| {
                                                                                                    (|| {
                                                                                                        if state.offset < state.src.len()
                                                                                                            && state.src.as_bytes()[state.offset] == 92u8
                                                                                                        {
                                                                                                            let __start = state.offset;
                                                                                                            state.offset += 1;
                                                                                                            Some(
                                                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                                                            )
                                                                                                        } else {
                                                                                                            None
                                                                                                        }?;
                                                                                                        if state.offset < state.src.len()
                                                                                                            && state.src.as_bytes()[state.offset] == 117u8
                                                                                                        {
                                                                                                            let __start = state.offset;
                                                                                                            state.offset += 1;
                                                                                                            Some(
                                                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                                                            )
                                                                                                        } else {
                                                                                                            None
                                                                                                        }
                                                                                                    })()?;
                                                                                                    if state.offset < state.src.len()
                                                                                                        && state.src.as_bytes()[state.offset] == 123u8
                                                                                                    {
                                                                                                        let __start = state.offset;
                                                                                                        state.offset += 1;
                                                                                                        Some(
                                                                                                            crate::Span::new(__start, state.offset, state.src),
                                                                                                        )
                                                                                                    } else {
                                                                                                        None
                                                                                                    }
                                                                                                })()?;
                                                                                                {
                                                                                                    let __start = state.offset;
                                                                                                    let __end = state.src_bytes.len();
                                                                                                    let mut __pos = __start;
                                                                                                    while __pos < __end {
                                                                                                        let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                                        if (__b >= b'0' && __b <= b'9')
                                                                                                            || (__b >= b'a' && __b <= b'f')
                                                                                                            || (__b >= b'A' && __b <= b'F')
                                                                                                        {
                                                                                                            __pos += 1;
                                                                                                        } else {
                                                                                                            break;
                                                                                                        }
                                                                                                    }
                                                                                                    if __pos >= __start + 1 {
                                                                                                        state.offset = __pos;
                                                                                                        Some(crate::Span::new(__start, __pos, state.src))
                                                                                                    } else {
                                                                                                        None
                                                                                                    }
                                                                                                }
                                                                                            })()?;
                                                                                            if state.offset < state.src.len()
                                                                                                && state.src.as_bytes()[state.offset] == 125u8
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                state.offset += 1;
                                                                                                Some(
                                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                                )
                                                                                            } else {
                                                                                                None
                                                                                            }?;
                                                                                            Some(__kept)
                                                                                        })();
                                                                                        if __result.is_some() {
                                                                                            return __result;
                                                                                        }
                                                                                        state.offset = __cp;
                                                                                    }
                                                                                    {
                                                                                        let __cp = state.offset;
                                                                                        let __result = (|| {
                                                                                            (|| {
                                                                                                if state.offset < state.src.len()
                                                                                                    && state.src.as_bytes()[state.offset] == 92u8
                                                                                                {
                                                                                                    let __start = state.offset;
                                                                                                    state.offset += 1;
                                                                                                    Some(
                                                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                                                    )
                                                                                                } else {
                                                                                                    None
                                                                                                }?;
                                                                                                if state.offset < state.src.len()
                                                                                                    && state.src.as_bytes()[state.offset] == 117u8
                                                                                                {
                                                                                                    let __start = state.offset;
                                                                                                    state.offset += 1;
                                                                                                    Some(
                                                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                                                    )
                                                                                                } else {
                                                                                                    None
                                                                                                }
                                                                                            })()?;
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                let __end = state.src_bytes.len();
                                                                                                let mut __pos = __start;
                                                                                                let mut __count: usize = 0;
                                                                                                while __pos < __end && __count < 4 {
                                                                                                    let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                                    if (__b >= b'0' && __b <= b'9')
                                                                                                        || (__b >= b'a' && __b <= b'f')
                                                                                                        || (__b >= b'A' && __b <= b'F')
                                                                                                    {
                                                                                                        __pos += 1;
                                                                                                        __count += 1;
                                                                                                    } else {
                                                                                                        break;
                                                                                                    }
                                                                                                }
                                                                                                if __count >= 4 {
                                                                                                    state.offset = __pos;
                                                                                                    Some(crate::Span::new(__start, __pos, state.src))
                                                                                                } else {
                                                                                                    None
                                                                                                }
                                                                                            }
                                                                                        })();
                                                                                        if __result.is_some() {
                                                                                            return __result;
                                                                                        }
                                                                                        state.offset = __cp;
                                                                                    }
                                                                                    {
                                                                                        let __cp = state.offset;
                                                                                        let __result = (|| {
                                                                                            (|| {
                                                                                                if state.offset < state.src.len()
                                                                                                    && state.src.as_bytes()[state.offset] == 92u8
                                                                                                {
                                                                                                    let __start = state.offset;
                                                                                                    state.offset += 1;
                                                                                                    Some(
                                                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                                                    )
                                                                                                } else {
                                                                                                    None
                                                                                                }?;
                                                                                                if state.offset < state.src.len()
                                                                                                    && state.src.as_bytes()[state.offset] == 120u8
                                                                                                {
                                                                                                    let __start = state.offset;
                                                                                                    state.offset += 1;
                                                                                                    Some(
                                                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                                                    )
                                                                                                } else {
                                                                                                    None
                                                                                                }
                                                                                            })()?;
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                let __end = state.src_bytes.len();
                                                                                                let mut __pos = __start;
                                                                                                let mut __count: usize = 0;
                                                                                                while __pos < __end && __count < 2 {
                                                                                                    let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                                    if (__b >= b'0' && __b <= b'9')
                                                                                                        || (__b >= b'a' && __b <= b'f')
                                                                                                        || (__b >= b'A' && __b <= b'F')
                                                                                                    {
                                                                                                        __pos += 1;
                                                                                                        __count += 1;
                                                                                                    } else {
                                                                                                        break;
                                                                                                    }
                                                                                                }
                                                                                                if __count >= 2 {
                                                                                                    state.offset = __pos;
                                                                                                    Some(crate::Span::new(__start, __pos, state.src))
                                                                                                } else {
                                                                                                    None
                                                                                                }
                                                                                            }
                                                                                        })();
                                                                                        if __result.is_some() {
                                                                                            return __result;
                                                                                        }
                                                                                        state.offset = __cp;
                                                                                    }
                                                                                    {
                                                                                        let __cp = state.offset;
                                                                                        let __result = (|| {
                                                                                            if state.offset < state.src.len()
                                                                                                && state.src.as_bytes()[state.offset] == 92u8
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                state.offset += 1;
                                                                                                Some(
                                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                                )
                                                                                            } else {
                                                                                                None
                                                                                            }?;
                                                                                            {
                                                                                                let __start = state.offset;
                                                                                                let __result: Option<()> = (|| {
                                                                                                    {
                                                                                                        let __b = *state.src_bytes.get(state.offset)?;
                                                                                                        if !(!(__b == b'\n')) {
                                                                                                            return None;
                                                                                                        }
                                                                                                        state.offset += 1;
                                                                                                    }
                                                                                                    Some(())
                                                                                                })();
                                                                                                if __result.is_some() && state.offset > __start {
                                                                                                    Some(
                                                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                                                    )
                                                                                                } else {
                                                                                                    state.offset = __start;
                                                                                                    None
                                                                                                }
                                                                                            }
                                                                                        })();
                                                                                        if __result.is_some() {
                                                                                            return __result;
                                                                                        }
                                                                                        state.offset = __cp;
                                                                                    }
                                                                                    None
                                                                                })()
                                                                                    .map(|__inner| {
                                                                                        let __v = RegexParserEnum::class_escape(__inner);
                                                                                        &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                                                                    })
                                                                            }
                                                                            _ => {
                                                                                ({
                                                                                    let __start = state.offset;
                                                                                    let __result: Option<()> = (|| {
                                                                                        {
                                                                                            let __b = *state.src_bytes.get(state.offset)?;
                                                                                            if !(!((__b >= b'\\' && __b <= b']'))) {
                                                                                                return None;
                                                                                            }
                                                                                            state.offset += 1;
                                                                                        }
                                                                                        Some(())
                                                                                    })();
                                                                                    if __result.is_some() && state.offset > __start {
                                                                                        Some(
                                                                                            crate::Span::new(__start, state.offset, state.src),
                                                                                        )
                                                                                    } else {
                                                                                        state.offset = __start;
                                                                                        None
                                                                                    }
                                                                                })
                                                                                    .map(|__sv| {
                                                                                        &*__RegexParserEnum_alloc(state)
                                                                                            .slab()
                                                                                            .alloc(RegexParserEnum::class_atom_0(__sv))
                                                                                    })
                                                                            }
                                                                        }
                                                                    } else {
                                                                        ({
                                                                            let __start = state.offset;
                                                                            let __result: Option<()> = (|| {
                                                                                {
                                                                                    let __b = *state.src_bytes.get(state.offset)?;
                                                                                    if !(!((__b >= b'\\' && __b <= b']'))) {
                                                                                        return None;
                                                                                    }
                                                                                    state.offset += 1;
                                                                                }
                                                                                Some(())
                                                                            })();
                                                                            if __result.is_some() && state.offset > __start {
                                                                                Some(
                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                )
                                                                            } else {
                                                                                state.offset = __start;
                                                                                None
                                                                            }
                                                                        })
                                                                            .map(|__sv| {
                                                                                &*__RegexParserEnum_alloc(state)
                                                                                    .slab()
                                                                                    .alloc(RegexParserEnum::class_atom_0(__sv))
                                                                            })
                                                                    }
                                                                        .map(|__inner| {
                                                                            let __v = RegexParserEnum::class_atom(__inner);
                                                                            &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                                                        })
                                                                })()?;
                                                                Some((__sp6, __v7))
                                                            })())
                                                                .map(|__sv| {
                                                                    &*__RegexParserEnum_alloc(state)
                                                                        .slab()
                                                                        .alloc(RegexParserEnum::class_item_0(__sv))
                                                                });
                                                            if __result.is_some() {
                                                                return __result;
                                                            }
                                                            state.offset = __cp;
                                                        }
                                                        {
                                                            let __cp = state.offset;
                                                            let __result = (|| {
                                                                {
                                                                    let __cp = state.offset;
                                                                    let __result = (|| {
                                                                        if state.offset < state.src.len()
                                                                            && state.src.as_bytes()[state.offset] == 92u8
                                                                        {
                                                                            let __start = state.offset;
                                                                            state.offset += 1;
                                                                            Some(
                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                            )
                                                                        } else {
                                                                            None
                                                                        }?;
                                                                        {
                                                                            let __start = state.offset;
                                                                            if let Some(&__b) = state.src_bytes.get(__start) {
                                                                                if #[allow(non_exhaustive_omitted_patterns)]
                                                                                match __b {
                                                                                    b'd' | b'D' | b'w' | b'W' | b's' | b'S' => true,
                                                                                    _ => false,
                                                                                } {
                                                                                    state.offset = __start + 1;
                                                                                    Some(
                                                                                        crate::Span::new(__start, __start + 1, state.src),
                                                                                    )
                                                                                } else {
                                                                                    None
                                                                                }
                                                                            } else {
                                                                                None
                                                                            }
                                                                        }
                                                                    })();
                                                                    if __result.is_some() {
                                                                        return __result;
                                                                    }
                                                                    state.offset = __cp;
                                                                }
                                                                {
                                                                    let __cp = state.offset;
                                                                    let __result = (|| {
                                                                        let __kept = (|| {
                                                                            (|| {
                                                                                (|| {
                                                                                    if state.offset < state.src.len()
                                                                                        && state.src.as_bytes()[state.offset] == 92u8
                                                                                    {
                                                                                        let __start = state.offset;
                                                                                        state.offset += 1;
                                                                                        Some(
                                                                                            crate::Span::new(__start, state.offset, state.src),
                                                                                        )
                                                                                    } else {
                                                                                        None
                                                                                    }?;
                                                                                    if state.offset < state.src.len()
                                                                                        && state.src.as_bytes()[state.offset] == 117u8
                                                                                    {
                                                                                        let __start = state.offset;
                                                                                        state.offset += 1;
                                                                                        Some(
                                                                                            crate::Span::new(__start, state.offset, state.src),
                                                                                        )
                                                                                    } else {
                                                                                        None
                                                                                    }
                                                                                })()?;
                                                                                if state.offset < state.src.len()
                                                                                    && state.src.as_bytes()[state.offset] == 123u8
                                                                                {
                                                                                    let __start = state.offset;
                                                                                    state.offset += 1;
                                                                                    Some(
                                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                                    )
                                                                                } else {
                                                                                    None
                                                                                }
                                                                            })()?;
                                                                            {
                                                                                let __start = state.offset;
                                                                                let __end = state.src_bytes.len();
                                                                                let mut __pos = __start;
                                                                                while __pos < __end {
                                                                                    let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                    if (__b >= b'0' && __b <= b'9')
                                                                                        || (__b >= b'a' && __b <= b'f')
                                                                                        || (__b >= b'A' && __b <= b'F')
                                                                                    {
                                                                                        __pos += 1;
                                                                                    } else {
                                                                                        break;
                                                                                    }
                                                                                }
                                                                                if __pos >= __start + 1 {
                                                                                    state.offset = __pos;
                                                                                    Some(crate::Span::new(__start, __pos, state.src))
                                                                                } else {
                                                                                    None
                                                                                }
                                                                            }
                                                                        })()?;
                                                                        if state.offset < state.src.len()
                                                                            && state.src.as_bytes()[state.offset] == 125u8
                                                                        {
                                                                            let __start = state.offset;
                                                                            state.offset += 1;
                                                                            Some(
                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                            )
                                                                        } else {
                                                                            None
                                                                        }?;
                                                                        Some(__kept)
                                                                    })();
                                                                    if __result.is_some() {
                                                                        return __result;
                                                                    }
                                                                    state.offset = __cp;
                                                                }
                                                                {
                                                                    let __cp = state.offset;
                                                                    let __result = (|| {
                                                                        (|| {
                                                                            if state.offset < state.src.len()
                                                                                && state.src.as_bytes()[state.offset] == 92u8
                                                                            {
                                                                                let __start = state.offset;
                                                                                state.offset += 1;
                                                                                Some(
                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                )
                                                                            } else {
                                                                                None
                                                                            }?;
                                                                            if state.offset < state.src.len()
                                                                                && state.src.as_bytes()[state.offset] == 117u8
                                                                            {
                                                                                let __start = state.offset;
                                                                                state.offset += 1;
                                                                                Some(
                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                )
                                                                            } else {
                                                                                None
                                                                            }
                                                                        })()?;
                                                                        {
                                                                            let __start = state.offset;
                                                                            let __end = state.src_bytes.len();
                                                                            let mut __pos = __start;
                                                                            let mut __count: usize = 0;
                                                                            while __pos < __end && __count < 4 {
                                                                                let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                if (__b >= b'0' && __b <= b'9')
                                                                                    || (__b >= b'a' && __b <= b'f')
                                                                                    || (__b >= b'A' && __b <= b'F')
                                                                                {
                                                                                    __pos += 1;
                                                                                    __count += 1;
                                                                                } else {
                                                                                    break;
                                                                                }
                                                                            }
                                                                            if __count >= 4 {
                                                                                state.offset = __pos;
                                                                                Some(crate::Span::new(__start, __pos, state.src))
                                                                            } else {
                                                                                None
                                                                            }
                                                                        }
                                                                    })();
                                                                    if __result.is_some() {
                                                                        return __result;
                                                                    }
                                                                    state.offset = __cp;
                                                                }
                                                                {
                                                                    let __cp = state.offset;
                                                                    let __result = (|| {
                                                                        (|| {
                                                                            if state.offset < state.src.len()
                                                                                && state.src.as_bytes()[state.offset] == 92u8
                                                                            {
                                                                                let __start = state.offset;
                                                                                state.offset += 1;
                                                                                Some(
                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                )
                                                                            } else {
                                                                                None
                                                                            }?;
                                                                            if state.offset < state.src.len()
                                                                                && state.src.as_bytes()[state.offset] == 120u8
                                                                            {
                                                                                let __start = state.offset;
                                                                                state.offset += 1;
                                                                                Some(
                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                )
                                                                            } else {
                                                                                None
                                                                            }
                                                                        })()?;
                                                                        {
                                                                            let __start = state.offset;
                                                                            let __end = state.src_bytes.len();
                                                                            let mut __pos = __start;
                                                                            let mut __count: usize = 0;
                                                                            while __pos < __end && __count < 2 {
                                                                                let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                                                if (__b >= b'0' && __b <= b'9')
                                                                                    || (__b >= b'a' && __b <= b'f')
                                                                                    || (__b >= b'A' && __b <= b'F')
                                                                                {
                                                                                    __pos += 1;
                                                                                    __count += 1;
                                                                                } else {
                                                                                    break;
                                                                                }
                                                                            }
                                                                            if __count >= 2 {
                                                                                state.offset = __pos;
                                                                                Some(crate::Span::new(__start, __pos, state.src))
                                                                            } else {
                                                                                None
                                                                            }
                                                                        }
                                                                    })();
                                                                    if __result.is_some() {
                                                                        return __result;
                                                                    }
                                                                    state.offset = __cp;
                                                                }
                                                                {
                                                                    let __cp = state.offset;
                                                                    let __result = (|| {
                                                                        if state.offset < state.src.len()
                                                                            && state.src.as_bytes()[state.offset] == 92u8
                                                                        {
                                                                            let __start = state.offset;
                                                                            state.offset += 1;
                                                                            Some(
                                                                                crate::Span::new(__start, state.offset, state.src),
                                                                            )
                                                                        } else {
                                                                            None
                                                                        }?;
                                                                        {
                                                                            let __start = state.offset;
                                                                            let __result: Option<()> = (|| {
                                                                                {
                                                                                    let __b = *state.src_bytes.get(state.offset)?;
                                                                                    if !(!(__b == b'\n')) {
                                                                                        return None;
                                                                                    }
                                                                                    state.offset += 1;
                                                                                }
                                                                                Some(())
                                                                            })();
                                                                            if __result.is_some() && state.offset > __start {
                                                                                Some(
                                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                                )
                                                                            } else {
                                                                                state.offset = __start;
                                                                                None
                                                                            }
                                                                        }
                                                                    })();
                                                                    if __result.is_some() {
                                                                        return __result;
                                                                    }
                                                                    state.offset = __cp;
                                                                }
                                                                None
                                                            })()
                                                                .map(|__inner| {
                                                                    let __v = RegexParserEnum::class_escape(__inner);
                                                                    &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                                                });
                                                            if __result.is_some() {
                                                                return __result;
                                                            }
                                                            state.offset = __cp;
                                                        }
                                                        {
                                                            let __cp = state.offset;
                                                            let __result = ({
                                                                let __start = state.offset;
                                                                let __result: Option<()> = (|| {
                                                                    {
                                                                        let __b = *state.src_bytes.get(state.offset)?;
                                                                        if !(!((__b >= b'\\' && __b <= b']'))) {
                                                                            return None;
                                                                        }
                                                                        state.offset += 1;
                                                                    }
                                                                    Some(())
                                                                })();
                                                                if __result.is_some() && state.offset > __start {
                                                                    Some(
                                                                        crate::Span::new(__start, state.offset, state.src),
                                                                    )
                                                                } else {
                                                                    state.offset = __start;
                                                                    None
                                                                }
                                                            })
                                                                .map(|__sv| {
                                                                    &*__RegexParserEnum_alloc(state)
                                                                        .slab()
                                                                        .alloc(RegexParserEnum::class_atom_0(__sv))
                                                                });
                                                            if __result.is_some() {
                                                                return __result;
                                                            }
                                                            state.offset = __cp;
                                                        }
                                                        None
                                                    })()
                                                        .map(|__v| RegexParserEnum::class_item(__v))
                                                    {
                                                        Some(__value) => {
                                                            __RegexParserEnum_alloc(state).__s0().push(__value);
                                                            if state.offset == __prev9 {
                                                                break;
                                                            }
                                                        }
                                                        None => {
                                                            state.offset = __prev9;
                                                            break;
                                                        }
                                                    }
                                                }
                                                if (__RegexParserEnum_alloc(state).__s0().len() - __depth8)
                                                    >= 1usize
                                                {
                                                    Some(__RegexParserEnum_alloc(state).__c0(__depth8))
                                                } else {
                                                    __RegexParserEnum_alloc(state).__s0().truncate(__depth8);
                                                    None
                                                }
                                            }?;
                                            if state.offset < state.src.len()
                                                && state.src.as_bytes()[state.offset] == 93u8
                                            {
                                                let __start = state.offset;
                                                state.offset += 1;
                                                Some(
                                                    crate::Span::new(__start, state.offset, state.src),
                                                )
                                            } else {
                                                None
                                            }?;
                                            Some(__kept)
                                        })()?;
                                        Some((__sp10, __v11))
                                    })()
                                        .map(|__inner| {
                                            let __v = RegexParserEnum::char_class(__inner);
                                            &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                        })
                                }
                                92u8 => {
                                    (|| {
                                        {
                                            let __cp = state.offset;
                                            let __result = (|| {
                                                {
                                                    let __start = state.offset;
                                                    state.offset += 1;
                                                    Some(
                                                        crate::Span::new(__start, state.offset, state.src),
                                                    )
                                                }?;
                                                {
                                                    let __start = state.offset;
                                                    if let Some(&__b) = state.src_bytes.get(__start) {
                                                        if #[allow(non_exhaustive_omitted_patterns)]
                                                        match __b {
                                                            b'd' | b'D' | b'w' | b'W' | b's' | b'S' => true,
                                                            _ => false,
                                                        } {
                                                            state.offset = __start + 1;
                                                            Some(
                                                                crate::Span::new(__start, __start + 1, state.src),
                                                            )
                                                        } else {
                                                            None
                                                        }
                                                    } else {
                                                        None
                                                    }
                                                }
                                            })();
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        {
                                            let __cp = state.offset;
                                            let __result = (|| {
                                                let __kept = (|| {
                                                    (|| {
                                                        (|| {
                                                            if state.offset < state.src.len()
                                                                && state.src.as_bytes()[state.offset] == 92u8
                                                            {
                                                                let __start = state.offset;
                                                                state.offset += 1;
                                                                Some(
                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                )
                                                            } else {
                                                                None
                                                            }?;
                                                            {
                                                                let __start = state.offset;
                                                                if let Some(&__b) = state.src_bytes.get(__start) {
                                                                    if #[allow(non_exhaustive_omitted_patterns)]
                                                                    match __b {
                                                                        b'p' | b'P' => true,
                                                                        _ => false,
                                                                    } {
                                                                        state.offset = __start + 1;
                                                                        Some(
                                                                            crate::Span::new(__start, __start + 1, state.src),
                                                                        )
                                                                    } else {
                                                                        None
                                                                    }
                                                                } else {
                                                                    None
                                                                }
                                                            }
                                                        })()?;
                                                        if state.offset < state.src.len()
                                                            && state.src.as_bytes()[state.offset] == 123u8
                                                        {
                                                            let __start = state.offset;
                                                            state.offset += 1;
                                                            Some(
                                                                crate::Span::new(__start, state.offset, state.src),
                                                            )
                                                        } else {
                                                            None
                                                        }
                                                    })()?;
                                                    crate::scan_ident(state)
                                                })()?;
                                                if state.offset < state.src.len()
                                                    && state.src.as_bytes()[state.offset] == 125u8
                                                {
                                                    let __start = state.offset;
                                                    state.offset += 1;
                                                    Some(
                                                        crate::Span::new(__start, state.offset, state.src),
                                                    )
                                                } else {
                                                    None
                                                }?;
                                                Some(__kept)
                                            })();
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        {
                                            let __cp = state.offset;
                                            let __result = (|| {
                                                let __kept = (|| {
                                                    (|| {
                                                        (|| {
                                                            if state.offset < state.src.len()
                                                                && state.src.as_bytes()[state.offset] == 92u8
                                                            {
                                                                let __start = state.offset;
                                                                state.offset += 1;
                                                                Some(
                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                )
                                                            } else {
                                                                None
                                                            }?;
                                                            if state.offset < state.src.len()
                                                                && state.src.as_bytes()[state.offset] == 117u8
                                                            {
                                                                let __start = state.offset;
                                                                state.offset += 1;
                                                                Some(
                                                                    crate::Span::new(__start, state.offset, state.src),
                                                                )
                                                            } else {
                                                                None
                                                            }
                                                        })()?;
                                                        if state.offset < state.src.len()
                                                            && state.src.as_bytes()[state.offset] == 123u8
                                                        {
                                                            let __start = state.offset;
                                                            state.offset += 1;
                                                            Some(
                                                                crate::Span::new(__start, state.offset, state.src),
                                                            )
                                                        } else {
                                                            None
                                                        }
                                                    })()?;
                                                    {
                                                        let __start = state.offset;
                                                        let __end = state.src_bytes.len();
                                                        let mut __pos = __start;
                                                        while __pos < __end {
                                                            let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                            if (__b >= b'0' && __b <= b'9')
                                                                || (__b >= b'a' && __b <= b'f')
                                                                || (__b >= b'A' && __b <= b'F')
                                                            {
                                                                __pos += 1;
                                                            } else {
                                                                break;
                                                            }
                                                        }
                                                        if __pos >= __start + 1 {
                                                            state.offset = __pos;
                                                            Some(crate::Span::new(__start, __pos, state.src))
                                                        } else {
                                                            None
                                                        }
                                                    }
                                                })()?;
                                                if state.offset < state.src.len()
                                                    && state.src.as_bytes()[state.offset] == 125u8
                                                {
                                                    let __start = state.offset;
                                                    state.offset += 1;
                                                    Some(
                                                        crate::Span::new(__start, state.offset, state.src),
                                                    )
                                                } else {
                                                    None
                                                }?;
                                                Some(__kept)
                                            })();
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        {
                                            let __cp = state.offset;
                                            let __result = (|| {
                                                (|| {
                                                    if state.offset < state.src.len()
                                                        && state.src.as_bytes()[state.offset] == 92u8
                                                    {
                                                        let __start = state.offset;
                                                        state.offset += 1;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }?;
                                                    if state.offset < state.src.len()
                                                        && state.src.as_bytes()[state.offset] == 117u8
                                                    {
                                                        let __start = state.offset;
                                                        state.offset += 1;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }
                                                })()?;
                                                {
                                                    let __start = state.offset;
                                                    let __end = state.src_bytes.len();
                                                    let mut __pos = __start;
                                                    let mut __count: usize = 0;
                                                    while __pos < __end && __count < 4 {
                                                        let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                        if (__b >= b'0' && __b <= b'9')
                                                            || (__b >= b'a' && __b <= b'f')
                                                            || (__b >= b'A' && __b <= b'F')
                                                        {
                                                            __pos += 1;
                                                            __count += 1;
                                                        } else {
                                                            break;
                                                        }
                                                    }
                                                    if __count >= 4 {
                                                        state.offset = __pos;
                                                        Some(crate::Span::new(__start, __pos, state.src))
                                                    } else {
                                                        None
                                                    }
                                                }
                                            })();
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        {
                                            let __cp = state.offset;
                                            let __result = (|| {
                                                (|| {
                                                    if state.offset < state.src.len()
                                                        && state.src.as_bytes()[state.offset] == 92u8
                                                    {
                                                        let __start = state.offset;
                                                        state.offset += 1;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }?;
                                                    if state.offset < state.src.len()
                                                        && state.src.as_bytes()[state.offset] == 120u8
                                                    {
                                                        let __start = state.offset;
                                                        state.offset += 1;
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        None
                                                    }
                                                })()?;
                                                {
                                                    let __start = state.offset;
                                                    let __end = state.src_bytes.len();
                                                    let mut __pos = __start;
                                                    let mut __count: usize = 0;
                                                    while __pos < __end && __count < 2 {
                                                        let __b = unsafe { *state.src_bytes.get_unchecked(__pos) };
                                                        if (__b >= b'0' && __b <= b'9')
                                                            || (__b >= b'a' && __b <= b'f')
                                                            || (__b >= b'A' && __b <= b'F')
                                                        {
                                                            __pos += 1;
                                                            __count += 1;
                                                        } else {
                                                            break;
                                                        }
                                                    }
                                                    if __count >= 2 {
                                                        state.offset = __pos;
                                                        Some(crate::Span::new(__start, __pos, state.src))
                                                    } else {
                                                        None
                                                    }
                                                }
                                            })();
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        {
                                            let __cp = state.offset;
                                            let __result = (|| {
                                                if state.offset < state.src.len()
                                                    && state.src.as_bytes()[state.offset] == 92u8
                                                {
                                                    let __start = state.offset;
                                                    state.offset += 1;
                                                    Some(
                                                        crate::Span::new(__start, state.offset, state.src),
                                                    )
                                                } else {
                                                    None
                                                }?;
                                                {
                                                    let __start = state.offset;
                                                    let __result: Option<()> = (|| {
                                                        {
                                                            let __b = *state.src_bytes.get(state.offset)?;
                                                            if !(!(__b == b'\n')) {
                                                                return None;
                                                            }
                                                            state.offset += 1;
                                                        }
                                                        Some(())
                                                    })();
                                                    if __result.is_some() && state.offset > __start {
                                                        Some(
                                                            crate::Span::new(__start, state.offset, state.src),
                                                        )
                                                    } else {
                                                        state.offset = __start;
                                                        None
                                                    }
                                                }
                                            })();
                                            if __result.is_some() {
                                                return __result;
                                            }
                                            state.offset = __cp;
                                        }
                                        None
                                    })()
                                        .map(|__inner| {
                                            let __v = RegexParserEnum::escape(__inner);
                                            &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                        })
                                }
                                0u8 | 1u8 | 2u8 | 3u8 | 4u8 | 5u8 | 6u8 | 7u8 | 8u8 | 9u8
                                | 10u8 | 11u8 | 12u8 | 13u8 | 14u8 | 15u8 | 16u8 | 17u8
                                | 18u8 | 19u8 | 20u8 | 21u8 | 22u8 | 23u8 | 24u8 | 25u8
                                | 26u8 | 27u8 | 28u8 | 29u8 | 30u8 | 31u8 | 32u8 | 33u8
                                | 34u8 | 35u8 | 37u8 | 38u8 | 39u8 | 44u8 | 45u8 | 47u8
                                | 48u8 | 49u8 | 50u8 | 51u8 | 52u8 | 53u8 | 54u8 | 55u8
                                | 56u8 | 57u8 | 58u8 | 59u8 | 60u8 | 61u8 | 62u8 | 64u8
                                | 65u8 | 66u8 | 67u8 | 68u8 | 69u8 | 70u8 | 71u8 | 72u8
                                | 73u8 | 74u8 | 75u8 | 76u8 | 77u8 | 78u8 | 79u8 | 80u8
                                | 81u8 | 82u8 | 83u8 | 84u8 | 85u8 | 86u8 | 87u8 | 88u8
                                | 89u8 | 90u8 | 95u8 | 96u8 | 97u8 | 98u8 | 99u8 | 100u8
                                | 101u8 | 102u8 | 103u8 | 104u8 | 105u8 | 106u8 | 107u8
                                | 108u8 | 109u8 | 110u8 | 111u8 | 112u8 | 113u8 | 114u8
                                | 115u8 | 116u8 | 117u8 | 118u8 | 119u8 | 120u8 | 121u8
                                | 122u8 | 126u8 | 127u8 => {
                                    {
                                        let __start = state.offset;
                                        let __result: Option<()> = (|| {
                                            {
                                                let __b = *state.src_bytes.get(state.offset)?;
                                                if !(!((__b == b'$' || (__b >= b'(' && __b <= b'+')
                                                    || __b == b'.' || __b == b'?'
                                                    || (__b >= b'[' && __b <= b'^')
                                                    || (__b >= b'{' && __b <= b'}'))))
                                                {
                                                    return None;
                                                }
                                                state.offset += 1;
                                            }
                                            Some(())
                                        })();
                                        if __result.is_some() && state.offset > __start {
                                            Some(
                                                crate::Span::new(__start, state.offset, state.src),
                                            )
                                        } else {
                                            state.offset = __start;
                                            None
                                        }
                                    }
                                        .map(|__inner| {
                                            let __v = RegexParserEnum::literal(__inner);
                                            &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                        })
                                }
                                _ => None,
                            }
                        } else {
                            None
                        }
                            .map(|__inner| {
                                let __v = RegexParserEnum::atom(__inner);
                                &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                            })?;
                        let __v13 = {
                            let __cp = state.offset;
                            match (|| {
                                Self::__quantifier(state)
                                    .map(|__v| {
                                        &*__RegexParserEnum_alloc(state).slab().alloc(__v)
                                    })
                            })() {
                                Some(__v) => Some(Some(__v)),
                                None => {
                                    state.offset = __cp;
                                    Some(None)
                                }
                            }
                        }?;
                        Some((__v12, __v13))
                    })()
                        .map(|__v| RegexParserEnum::quantified(__v))
                    {
                        Some(__value) => {
                            __RegexParserEnum_alloc(state).__s0().push(__value);
                            if state.offset == __prev15 {
                                break;
                            }
                        }
                        None => {
                            state.offset = __prev15;
                            break;
                        }
                    }
                }
                if (__RegexParserEnum_alloc(state).__s0().len() - __depth14) >= 1usize {
                    Some(__RegexParserEnum_alloc(state).__c0(__depth14))
                } else {
                    __RegexParserEnum_alloc(state).__s0().truncate(__depth14);
                    None
                }
            }
        })()
            .map(|__x| RegexParserEnum::concat(__x))
    }
    pub fn concat<'a>() -> Parser<'a, RegexParserEnum<'a>> {
        Parser::new(Self::__concat)
    }
    #[allow(non_snake_case)]
    fn __regex<'a>(
        state: &mut crate::ParserState<'a>,
    ) -> Option<RegexParserEnum<'a>> {
        (|| {
            Self::__alternation(state)
                .map(|__v| &*__RegexParserEnum_alloc(state).slab().alloc(__v))
        })()
            .map(|__x| RegexParserEnum::regex(__x))
    }
    pub fn regex<'a>() -> Parser<'a, RegexParserEnum<'a>> {
        Parser::new(Self::__regex)
    }
}
/// Parse a regex pattern using the generated parser.
/// Returns `true` if the parse consumed the entire input.
pub fn parse_generated(pattern: &str) -> bool {
    let ctx = __RegexParserEnumCtx::with_capacity(pattern.len().max(64));
    let parser = RegexParser::regex();
    let (result, state) = parser.parse_return_state_with_context(pattern, &ctx);
    result.is_some() && state.offset >= pattern.len()
}
