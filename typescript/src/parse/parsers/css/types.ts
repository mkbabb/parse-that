// CSS AST type definitions — all structural types for the CSS parser.

export type CssNode =
    | CssQualifiedRule
    | CssAtMedia
    | CssAtSupports
    | CssAtFontFace
    | CssAtImport
    | CssAtKeyframes
    | CssGenericAtRule
    | CssCommentNode;

export interface CssQualifiedRule {
    type: "qualifiedRule";
    selectorList: CssSelector[];
    declarations: CssDeclaration[];
}

export interface CssAtMedia {
    type: "atMedia";
    queries: MediaQuery[];
    body: CssNode[];
}

export interface CssAtSupports {
    type: "atSupports";
    condition: SupportsCondition;
    body: CssNode[];
}

export interface CssAtFontFace {
    type: "atFontFace";
    declarations: CssDeclaration[];
}

export interface CssAtImport {
    type: "atImport";
    values: CssValue[];
}

export interface CssAtKeyframes {
    type: "atKeyframes";
    name: string;
    blocks: KeyframeBlock[];
}

export interface CssGenericAtRule {
    type: "genericAtRule";
    name: string;
    prelude: string;
    body: CssNode[] | null;
}

export interface CssCommentNode {
    type: "comment";
    value: string;
}

export interface CssDeclaration {
    property: string;
    values: CssValue[];
    important: boolean;
}

export type CssValue =
    | { type: "dimension"; value: number; unit: string }
    | { type: "number"; value: number }
    | { type: "percentage"; value: number }
    | { type: "color"; color: CssColor }
    | { type: "function"; name: string; args: CssValue[] }
    | { type: "string"; value: string }
    | { type: "ident"; value: string }
    | { type: "comma" }
    | { type: "slash" }
    | { type: "operator"; value: string };

export type CssColor =
    | { type: "hex"; value: string }
    | { type: "named"; value: string }
    | { type: "function"; name: string; args: CssValue[] };

export type CssSelector =
    | { type: "type"; value: string }
    | { type: "class"; value: string }
    | { type: "id"; value: string }
    | { type: "universal" }
    | {
          type: "attribute";
          name: string;
          matcher: string | null;
          value: string | null;
      }
    | { type: "pseudoClass"; value: string }
    | { type: "pseudoElement"; value: string }
    | { type: "pseudoFunction"; name: string; args: CssSelector[] }
    | { type: "compound"; parts: CssSelector[] }
    | {
          type: "complex";
          left: CssSelector;
          combinator: string;
          right: CssSelector;
      };

export interface KeyframeBlock {
    stops: KeyframeStop[];
    declarations: CssDeclaration[];
}

export type KeyframeStop =
    | { type: "from" }
    | { type: "to" }
    | { type: "percentage"; value: number };

// Media query AST (L1.75)

export interface MediaQuery {
    modifier: string | null;
    mediaType: string | null;
    conditions: MediaCondition[];
}

export type MediaCondition =
    | { type: "feature"; feature: MediaFeature }
    | { type: "and"; conditions: MediaCondition[] }
    | { type: "or"; conditions: MediaCondition[] }
    | { type: "not"; condition: MediaCondition };

export type MediaFeature =
    | { type: "plain"; name: string; value: CssValue | null }
    | { type: "range"; name: string; op: RangeOp; value: CssValue }
    | { type: "rangeInterval"; name: string; lo: CssValue; loOp: RangeOp; hi: CssValue; hiOp: RangeOp };

export type RangeOp = "<" | "<=" | ">" | ">=" | "=";

// Supports condition AST (L1.75)

export type SupportsCondition =
    | { type: "declaration"; property: string; value: CssValue[] }
    | { type: "not"; condition: SupportsCondition }
    | { type: "and"; conditions: SupportsCondition[] }
    | { type: "or"; conditions: SupportsCondition[] };

// Specificity tuple: [ids, classes, types]
export type Specificity = [ids: number, classes: number, types: number];
