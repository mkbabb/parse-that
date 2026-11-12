//! External laws for the invocation-owned parser kernel (`parse_that::kernel`).
//!
//! These tests intentionally use only the kernel module's public API. The
//! generated-shaped control is explicitly isomorphic; genuine generator output
//! is checked by the generator's own crossing gate.

mod kernel {
    mod control_laws;
    mod difference_laws;
    mod failure_contract_laws;
    mod generated_shaped_control;
    mod input_contract;
    mod module_laws;
    mod outcome_laws;
    mod progress_laws;
    mod resource_laws;
    mod terminal_laws;
    mod transaction_laws;
}
