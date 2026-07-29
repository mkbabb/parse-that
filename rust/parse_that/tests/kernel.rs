//! External laws for the SK-V26 invocation-owned parser kernel.
//!
//! These tests intentionally use only the crate-root API. The generated-shaped
//! control is explicitly isomorphic; genuine BBNF output is a W2 crossing gate.

mod kernel {
    mod control_laws;
    mod generated_shaped_control;
    mod input_contract;
    mod module_laws;
    mod outcome_laws;
    mod progress_laws;
    mod resource_laws;
    mod terminal_laws;
    mod transaction_laws;
}
