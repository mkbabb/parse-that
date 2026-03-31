// CSS specificity calculator (L1.75).

use super::types::{CssSelector, Specificity};

// ── Specificity impl ───────────────────────────────────────

impl Specificity {
    pub fn zero() -> Self {
        Specificity(0, 0, 0)
    }
}

impl std::ops::Add for Specificity {
    type Output = Self;

    fn add(self, other: Specificity) -> Self {
        Specificity(
            self.0.saturating_add(other.0),
            self.1.saturating_add(other.1),
            self.2.saturating_add(other.2),
        )
    }
}

/// Calculate the specificity of a CSS selector.
pub fn specificity(selector: &CssSelector<'_>) -> Specificity {
    match selector {
        CssSelector::Id(_) => Specificity(1, 0, 0),
        CssSelector::Class(_) | CssSelector::PseudoClass(_) | CssSelector::Attribute { .. } => {
            Specificity(0, 1, 0)
        }
        CssSelector::Type(_) | CssSelector::PseudoElement(_) => Specificity(0, 0, 1),
        CssSelector::Universal => Specificity(0, 0, 0),
        CssSelector::Compound(parts) => parts
            .iter()
            .fold(Specificity::zero(), |acc, s| acc + specificity(s)),
        CssSelector::Complex { left, right, .. } => specificity(left) + specificity(right),
        CssSelector::PseudoFunction { name, args } => {
            let name_str = name.as_str();
            match name_str {
                "where" => Specificity(0, 0, 0),
                "is" | "not" | "has" => {
                    // Most specific argument
                    args.iter()
                        .map(specificity)
                        .max()
                        .unwrap_or(Specificity::zero())
                }
                "nth-child" | "nth-last-child" | "nth-of-type" | "nth-last-of-type" => {
                    Specificity(0, 1, 0)
                }
                _ => Specificity(0, 1, 0),
            }
        }
    }
}
