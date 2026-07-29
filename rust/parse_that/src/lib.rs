//! The parse-that recognition kernel.
//!
//! Generated parsers call these direct operations. The runtime deliberately
//! owns neither a parser graph nor grammar-specific state.

mod control;
mod input;
mod module;
mod outcome;
mod run;
mod terminal;
mod transaction;

pub use control::{choice, repeat, sequence};
pub use input::{Cursor, Input, InputError, Span};
pub use module::ModuleResult;
pub use outcome::{Failure, Fault, ResourceKind, Step};
pub use run::Run;
pub use terminal::{RegexPlan, RegexPlanError, RegexTerminal, eof, literal, regex};
pub use transaction::{EventSink, NoSink};
