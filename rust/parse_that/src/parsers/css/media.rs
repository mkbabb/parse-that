// Media queries and @supports conditions.

use super::scan::*;
use super::types::*;
use super::value::*;
use crate::state::ParserState;

// ── Media Query parser (L1.75) ──────────────────────────────

fn parse_range_op(state: &mut ParserState<'_>) -> Option<RangeOp> {
    let bytes = state.src_bytes;
    let i = state.offset;
    match bytes.get(i)? {
        b'<' => {
            if bytes.get(i + 1) == Some(&b'=') {
                state.offset += 2;
                Some(RangeOp::LtEq)
            } else {
                state.offset += 1;
                Some(RangeOp::Lt)
            }
        }
        b'>' => {
            if bytes.get(i + 1) == Some(&b'=') {
                state.offset += 2;
                Some(RangeOp::GtEq)
            } else {
                state.offset += 1;
                Some(RangeOp::Gt)
            }
        }
        b'=' => {
            state.offset += 1;
            Some(RangeOp::Eq)
        }
        _ => None,
    }
}

fn parse_media_feature<'a>(state: &mut ParserState<'a>) -> Option<MediaFeature<'a>> {
    // ( feature-expression )
    if state.src_bytes.get(state.offset) != Some(&b'(') {
        return None;
    }
    state.offset += 1;
    ws_block_comment_scan(state);

    // Try value < name < value (range interval, value-first)
    let cp = state.offset;

    // First try: name [: value] or name op value
    let name = ident_scan_fast(state)?;
    ws_block_comment_scan(state);

    // Check for range op after name
    let range_cp = state.offset;
    if let Some(op) = parse_range_op(state) {
        ws_block_comment_scan(state);
        if let Some(value) = parse_value_inline(state) {
            ws_block_comment_scan(state);
            // Check for second range op (interval: name op value op value)
            let range_cp2 = state.offset;
            if let Some(op2) = parse_range_op(state) {
                ws_block_comment_scan(state);
                if let Some(value2) = parse_value_inline(state) {
                    ws_block_comment_scan(state);
                    if state.src_bytes.get(state.offset) == Some(&b')') {
                        state.offset += 1;
                        return Some(MediaFeature::RangeInterval {
                            name,
                            lo: value,
                            lo_op: op,
                            hi: value2,
                            hi_op: op2,
                        });
                    }
                }
                state.offset = range_cp2;
            }
            if state.src_bytes.get(state.offset) == Some(&b')') {
                state.offset += 1;
                return Some(MediaFeature::Range { name, op, value });
            }
        }
        state.offset = range_cp;
    }

    // Check for colon (plain feature)
    if state.src_bytes.get(state.offset) == Some(&b':') {
        state.offset += 1;
        ws_block_comment_scan(state);
        let value = parse_value_inline(state);
        ws_block_comment_scan(state);
        if state.src_bytes.get(state.offset) == Some(&b')') {
            state.offset += 1;
            return Some(MediaFeature::Plain { name, value });
        }
        state.offset = cp;
        return None;
    }

    // Bare feature name (e.g., (color))
    if state.src_bytes.get(state.offset) == Some(&b')') {
        state.offset += 1;
        return Some(MediaFeature::Plain { name, value: None });
    }

    state.offset = cp;
    None
}

fn parse_media_condition<'a>(state: &mut ParserState<'a>) -> Option<MediaCondition<'a>> {
    ws_block_comment_scan(state);

    // Check for "not" prefix
    let cp = state.offset;
    if let Some(ident) = ident_scan_fast(state) {
        if ident.as_str() == "not" {
            ws_block_comment_scan(state);
            if let Some(inner) = parse_media_condition(state) {
                return Some(MediaCondition::Not(Box::new(inner)));
            }
            state.offset = cp;
        } else {
            state.offset = cp;
        }
    }

    // Parse a feature
    let feature = parse_media_feature(state)?;
    let mut result = MediaCondition::Feature(feature);

    // Check for "and" / "or" chains
    loop {
        ws_block_comment_scan(state);
        let kw_cp = state.offset;
        if let Some(kw) = ident_scan_fast(state) {
            match kw.as_str() {
                "and" => {
                    ws_block_comment_scan(state);
                    if let Some(next) = parse_media_condition(state) {
                        let mut conditions = match result {
                            MediaCondition::And(v) => v,
                            other => vec![other],
                        };
                        conditions.push(next);
                        result = MediaCondition::And(conditions);
                        continue;
                    }
                    state.offset = kw_cp;
                    break;
                }
                "or" => {
                    ws_block_comment_scan(state);
                    if let Some(next) = parse_media_condition(state) {
                        let mut conditions = match result {
                            MediaCondition::Or(v) => v,
                            other => vec![other],
                        };
                        conditions.push(next);
                        result = MediaCondition::Or(conditions);
                        continue;
                    }
                    state.offset = kw_cp;
                    break;
                }
                _ => {
                    state.offset = kw_cp;
                    break;
                }
            }
        } else {
            break;
        }
    }

    Some(result)
}

fn parse_media_query<'a>(state: &mut ParserState<'a>) -> Option<MediaQuery<'a>> {
    ws_block_comment_scan(state);

    let mut modifier = None;
    let mut media_type = None;
    let mut conditions = Vec::new();

    let cp = state.offset;

    // Try modifier + media type: [not|only] <media-type>
    if let Some(ident) = ident_scan_fast(state) {
        let s = ident.as_str();
        if s == "not" || s == "only" {
            modifier = Some(ident);
            ws_block_comment_scan(state);
            if let Some(mt) = ident_scan_fast(state) {
                media_type = Some(mt);
            } else {
                // "not" might be a condition prefix, backtrack
                state.offset = cp;
                modifier = None;
            }
        } else {
            // Could be media type directly (screen, print, all)
            media_type = Some(ident);
        }
    }

    if media_type.is_some() {
        // Check for "and" <condition>
        ws_block_comment_scan(state);
        let kw_cp = state.offset;
        if let Some(kw) = ident_scan_fast(state) {
            if kw.as_str() == "and" {
                ws_block_comment_scan(state);
                if let Some(cond) = parse_media_condition(state) {
                    conditions.push(cond);
                }
            } else {
                state.offset = kw_cp;
            }
        }
    } else {
        // No media type — must be a condition
        state.offset = cp;
        modifier = None;
        if let Some(cond) = parse_media_condition(state) {
            conditions.push(cond);
        } else {
            return None;
        }
    }

    Some(MediaQuery {
        modifier,
        media_type,
        conditions,
    })
}

pub(super) fn parse_media_query_list<'a>(state: &mut ParserState<'a>) -> Vec<MediaQuery<'a>> {
    let mut queries = Vec::new();

    if let Some(q) = parse_media_query(state) {
        queries.push(q);
    } else {
        return queries;
    }

    loop {
        ws_block_comment_scan(state);
        if state.src_bytes.get(state.offset) != Some(&b',') {
            break;
        }
        state.offset += 1;
        ws_block_comment_scan(state);
        if let Some(q) = parse_media_query(state) {
            queries.push(q);
        } else {
            break;
        }
    }

    queries
}

// ── Supports Condition parser (L1.75) ───────────────────────

pub(super) fn parse_supports_condition<'a>(
    state: &mut ParserState<'a>,
) -> Option<SupportsCondition<'a>> {
    ws_block_comment_scan(state);

    // Check for "not" prefix
    let cp = state.offset;
    if let Some(ident) = ident_scan_fast(state) {
        if ident.as_str() == "not" {
            ws_block_comment_scan(state);
            if let Some(inner) = parse_supports_condition(state) {
                let mut result = SupportsCondition::Not(Box::new(inner));

                // Check for and/or chains after not
                loop {
                    ws_block_comment_scan(state);
                    let kw_cp = state.offset;
                    if let Some(kw) = ident_scan_fast(state) {
                        match kw.as_str() {
                            "and" => {
                                ws_block_comment_scan(state);
                                if let Some(next) = parse_supports_condition(state) {
                                    let mut conds = match result {
                                        SupportsCondition::And(v) => v,
                                        other => vec![other],
                                    };
                                    conds.push(next);
                                    result = SupportsCondition::And(conds);
                                    continue;
                                }
                                state.offset = kw_cp;
                            }
                            "or" => {
                                ws_block_comment_scan(state);
                                if let Some(next) = parse_supports_condition(state) {
                                    let mut conds = match result {
                                        SupportsCondition::Or(v) => v,
                                        other => vec![other],
                                    };
                                    conds.push(next);
                                    result = SupportsCondition::Or(conds);
                                    continue;
                                }
                                state.offset = kw_cp;
                            }
                            _ => {
                                state.offset = kw_cp;
                            }
                        }
                    }
                    break;
                }

                return Some(result);
            }
            state.offset = cp;
        } else {
            state.offset = cp;
        }
    }

    // Try (property: value) declaration test
    if state.src_bytes.get(state.offset) == Some(&b'(') {
        state.offset += 1;
        ws_block_comment_scan(state);

        // Try nested condition first
        let inner_cp = state.offset;
        if let Some(inner) = parse_supports_condition(state) {
            ws_block_comment_scan(state);
            if state.src_bytes.get(state.offset) == Some(&b')') {
                state.offset += 1;
                let mut result = inner;

                // Check for and/or chains
                loop {
                    ws_block_comment_scan(state);
                    let kw_cp = state.offset;
                    if let Some(kw) = ident_scan_fast(state) {
                        match kw.as_str() {
                            "and" => {
                                ws_block_comment_scan(state);
                                if let Some(next) = parse_supports_condition(state) {
                                    let mut conds = match result {
                                        SupportsCondition::And(v) => v,
                                        other => vec![other],
                                    };
                                    conds.push(next);
                                    result = SupportsCondition::And(conds);
                                    continue;
                                }
                                state.offset = kw_cp;
                            }
                            "or" => {
                                ws_block_comment_scan(state);
                                if let Some(next) = parse_supports_condition(state) {
                                    let mut conds = match result {
                                        SupportsCondition::Or(v) => v,
                                        other => vec![other],
                                    };
                                    conds.push(next);
                                    result = SupportsCondition::Or(conds);
                                    continue;
                                }
                                state.offset = kw_cp;
                            }
                            _ => {
                                state.offset = kw_cp;
                            }
                        }
                    }
                    break;
                }

                return Some(result);
            }
            state.offset = inner_cp;
        }

        // Try declaration: property: value
        if let Some(property) = ident_scan_fast(state) {
            ws_block_comment_scan(state);
            if state.src_bytes.get(state.offset) == Some(&b':') {
                state.offset += 1;
                ws_block_comment_scan(state);

                let mut values = Vec::new();
                loop {
                    ws_block_comment_scan(state);
                    if matches!(state.src_bytes.get(state.offset), Some(&b')') | None) {
                        break;
                    }
                    if let Some(v) = parse_value_inline(state) {
                        values.push(v);
                    } else {
                        break;
                    }
                }

                if state.src_bytes.get(state.offset) == Some(&b')') {
                    state.offset += 1;

                    let mut result = SupportsCondition::Declaration {
                        property,
                        value: values,
                    };

                    // Check for and/or chains
                    loop {
                        ws_block_comment_scan(state);
                        let kw_cp = state.offset;
                        if let Some(kw) = ident_scan_fast(state) {
                            match kw.as_str() {
                                "and" => {
                                    ws_block_comment_scan(state);
                                    if let Some(next) = parse_supports_condition(state) {
                                        let mut conds = match result {
                                            SupportsCondition::And(v) => v,
                                            other => vec![other],
                                        };
                                        conds.push(next);
                                        result = SupportsCondition::And(conds);
                                        continue;
                                    }
                                    state.offset = kw_cp;
                                }
                                "or" => {
                                    ws_block_comment_scan(state);
                                    if let Some(next) = parse_supports_condition(state) {
                                        let mut conds = match result {
                                            SupportsCondition::Or(v) => v,
                                            other => vec![other],
                                        };
                                        conds.push(next);
                                        result = SupportsCondition::Or(conds);
                                        continue;
                                    }
                                    state.offset = kw_cp;
                                }
                                _ => {
                                    state.offset = kw_cp;
                                }
                            }
                        }
                        break;
                    }

                    return Some(result);
                }
            }
        }

        // Backtrack past the '('
        state.offset = cp;
    }

    None
}
