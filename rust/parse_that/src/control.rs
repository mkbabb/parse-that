use crate::{EventSink, Failure, Fault, Run, Step};

/// Run one generated sequence atomically.
pub fn sequence<'i, S, T, F>(run: &mut Run<'i, S>, parser: F) -> Step<'i, T>
where
    S: EventSink,
    F: FnOnce(&mut Run<'i, S>) -> Step<'i, T>,
{
    let entry = run.checkpoint();
    match parser(run) {
        matched @ Step::Matched(_) => matched,
        Step::Mismatch(failure) => {
            run.rollback(entry);
            match run.validate_failure(failure, entry.cursor) {
                Ok(failure) => Step::Mismatch(failure),
                Err(fault) => Step::Fault(fault),
            }
        }
        Step::Fault(fault) => {
            run.rollback(entry);
            Step::Fault(run.validate_fault(fault, entry.cursor))
        }
    }
}

/// Try two alternatives from the same transaction boundary.
pub fn choice<'i, S, T, L, R>(run: &mut Run<'i, S>, left: L, right: R) -> Step<'i, T>
where
    S: EventSink,
    L: FnOnce(&mut Run<'i, S>) -> Step<'i, T>,
    R: FnOnce(&mut Run<'i, S>) -> Step<'i, T>,
{
    let entry = run.checkpoint();
    match left(run) {
        matched @ Step::Matched(_) => matched,
        Step::Fault(fault) => {
            run.rollback(entry);
            Step::Fault(run.validate_fault(fault, entry.cursor))
        }
        Step::Mismatch(left_failure) => {
            run.rollback(entry);
            let left_failure = match run.validate_failure(left_failure, entry.cursor) {
                Ok(failure) => failure,
                Err(fault) => return Step::Fault(fault),
            };
            match right(run) {
                matched @ Step::Matched(_) => matched,
                Step::Fault(fault) => {
                    run.rollback(entry);
                    Step::Fault(run.validate_fault(fault, entry.cursor))
                }
                Step::Mismatch(right_failure) => {
                    run.rollback(entry);
                    match run.validate_failure(right_failure, entry.cursor) {
                        Ok(right_failure) => Step::Mismatch(left_failure.furthest(right_failure)),
                        Err(fault) => Step::Fault(fault),
                    }
                }
            }
        }
    }
}

/// Recognize `primary` only when `excluded` does not match at the same entry.
///
/// The exclusion probe is fully speculative: its cursor, events, and ordinary
/// mismatch diagnostics are discarded. A fault or foreign outcome remains a
/// fault, and a failed primary restores the complete difference transaction.
pub fn difference<'i, S, T, U, P, E>(run: &mut Run<'i, S>, primary: P, excluded: E) -> Step<'i, T>
where
    S: EventSink,
    P: FnOnce(&mut Run<'i, S>) -> Step<'i, T>,
    E: FnOnce(&mut Run<'i, S>) -> Step<'i, U>,
{
    let entry = run.checkpoint();
    match excluded(run) {
        Step::Matched(_) => {
            run.rollback(entry);
            Step::Mismatch(Failure::new(run.cursor()))
        }
        Step::Fault(fault) => {
            run.rollback(entry);
            Step::Fault(run.validate_fault(fault, entry.cursor))
        }
        Step::Mismatch(failure) => {
            let failure = run.validate_failure(failure, entry.cursor);
            run.rollback(entry);
            if let Err(fault) = failure {
                return Step::Fault(fault);
            }

            match primary(run) {
                matched @ Step::Matched(_) => matched,
                Step::Mismatch(failure) => {
                    run.rollback(entry);
                    match run.validate_failure(failure, entry.cursor) {
                        Ok(failure) => Step::Mismatch(failure),
                        Err(fault) => Step::Fault(fault),
                    }
                }
                Step::Fault(fault) => {
                    run.rollback(entry);
                    Step::Fault(run.validate_fault(fault, entry.cursor))
                }
            }
        }
    }
}

/// Repeat one generated operation, enforcing progress on every match.
pub fn repeat<'i, S, T, F>(
    run: &mut Run<'i, S>,
    minimum: usize,
    maximum: Option<usize>,
    mut parser: F,
) -> Step<'i, usize>
where
    S: EventSink,
    F: FnMut(&mut Run<'i, S>) -> Step<'i, T>,
{
    let entry = run.checkpoint();
    let limit = maximum.unwrap_or(usize::MAX);
    let mut count = 0;
    let mut last_failure: Option<Failure<'i>> = None;

    while count < limit {
        let iteration = run.checkpoint();
        let before = run.cursor();
        match parser(run) {
            Step::Matched(_) if run.cursor().offset() == before.offset() => {
                run.rollback(entry);
                return Step::Fault(Fault::StalledRepeat { at: before });
            }
            Step::Matched(_) => count += 1,
            Step::Mismatch(failure) => {
                run.rollback(iteration);
                match run.validate_failure(failure, iteration.cursor) {
                    Ok(failure) => last_failure = Some(failure),
                    Err(fault) => {
                        run.rollback(entry);
                        return Step::Fault(fault);
                    }
                }
                break;
            }
            Step::Fault(fault) => {
                run.rollback(entry);
                return Step::Fault(run.validate_fault(fault, entry.cursor));
            }
        }
    }

    if count >= minimum {
        Step::Matched(count)
    } else {
        let failure = last_failure.unwrap_or_else(|| Failure::new(run.cursor()));
        run.rollback(entry);
        Step::Mismatch(failure)
    }
}
