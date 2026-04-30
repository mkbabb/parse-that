#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::path::Path;

use divan::counter::BytesCount;
use divan::{Bencher, black_box};

use cssparser::{
    AtRuleParser, CowRcStr, DeclarationParser, ParseError, Parser, ParserInput,
    QualifiedRuleParser, RuleBodyItemParser, StyleSheetParser,
};

fn data_dir() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../data/css")
}

#[divan::bench]
fn normalize(b: Bencher) {
    parse(b, "normalize.css")
}

#[divan::bench]
fn bootstrap(b: Bencher) {
    parse(b, "bootstrap.css")
}

#[divan::bench]
fn tailwind(b: Bencher) {
    parse(b, "tailwind-output.css")
}

// Minimal visitor that counts rules and declarations (L0-L1 work)
struct RuleCounter {
    rule_count: usize,
    decl_count: usize,
}

impl<'i> QualifiedRuleParser<'i> for RuleCounter {
    type Prelude = ();
    type QualifiedRule = ();
    type Error = ();

    fn parse_prelude<'t>(
        &mut self,
        input: &mut Parser<'i, 't>,
    ) -> Result<Self::Prelude, ParseError<'i, ()>> {
        while input.next().is_ok() {}
        Ok(())
    }

    fn parse_block<'t>(
        &mut self,
        _prelude: Self::Prelude,
        _start: &cssparser::ParserState,
        input: &mut Parser<'i, 't>,
    ) -> Result<Self::QualifiedRule, ParseError<'i, ()>> {
        self.rule_count += 1;
        // Consume the block body
        while input.next().is_ok() {}
        Ok(())
    }
}

impl<'i> AtRuleParser<'i> for RuleCounter {
    type Prelude = ();
    type AtRule = ();
    type Error = ();

    fn parse_prelude<'t>(
        &mut self,
        _name: CowRcStr<'i>,
        input: &mut Parser<'i, 't>,
    ) -> Result<Self::Prelude, ParseError<'i, ()>> {
        while input.next().is_ok() {}
        Ok(())
    }

    fn parse_block<'t>(
        &mut self,
        _prelude: Self::Prelude,
        _start: &cssparser::ParserState,
        input: &mut Parser<'i, 't>,
    ) -> Result<Self::AtRule, ParseError<'i, ()>> {
        self.rule_count += 1;
        while input.next().is_ok() {}
        Ok(())
    }

    fn rule_without_block(
        &mut self,
        _prelude: Self::Prelude,
        _start: &cssparser::ParserState,
    ) -> Result<Self::AtRule, ()> {
        self.rule_count += 1;
        Ok(())
    }
}

impl<'i> DeclarationParser<'i> for RuleCounter {
    type Declaration = ();
    type Error = ();

    fn parse_value<'t>(
        &mut self,
        _name: CowRcStr<'i>,
        input: &mut Parser<'i, 't>,
    ) -> Result<Self::Declaration, ParseError<'i, ()>> {
        self.decl_count += 1;
        while input.next().is_ok() {}
        Ok(())
    }
}

impl<'i> RuleBodyItemParser<'i, (), ()> for RuleCounter {
    fn parse_qualified(&self) -> bool {
        true
    }
    fn parse_declarations(&self) -> bool {
        false
    }
}

fn parse(b: Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));

    b.counter(BytesCount::new(data.len())).bench_local(|| {
        let buf = black_box(&data);
        let mut input = ParserInput::new(buf);
        let mut parser = Parser::new(&mut input);
        let mut counter = RuleCounter {
            rule_count: 0,
            decl_count: 0,
        };

        let rule_parser = StyleSheetParser::new(&mut parser, &mut counter);
        for result in rule_parser {
            let _ = black_box(result);
        }
        black_box((counter.rule_count, counter.decl_count))
    });
}

fn main() {
    divan::main();
}
