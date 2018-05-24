import { Token } from './token';
import { Parser } from './types';
export declare const enum Context {
    Empty = 0,
    OptionsTokenize = 1,
    OptionsJSX = 2,
    OptionsRaw = 4,
    OptionsNext = 8,
    Strict = 16,
    Module = 32,
    Async = 64,
    Yield = 128,
    InParameter = 256,
    NewTarget = 512,
    Template = 1024,
    In = 2048,
    Statement = 4096,
}
export declare const enum Flags {
    Empty = 0,
    NewLine = 1,
    HasOctal = 2,
    IsAssignable = 4,
    IsBindable = 8,
}
export declare const enum BindingOrigin {
    Empty = 0,
    ForStatement = 1,
    FunctionArgs = 2,
    CatchClause = 4,
}
/** Binding state */
export declare const enum BindingType {
    Empty = 0,
    Args = 1,
    Var = 2,
    Let = 4,
    Const = 8,
    Class = 16,
}
export declare const enum Recovery {
    Empty = 0,
    Unterminated = 1,
}
export declare const enum Tokenize {
    Empty = 0,
    NoWhiteSpace = 1,
    All = 2,
}
export declare const enum ModifierState {
    None = 0,
    Generator = 1,
    Await = 2,
    Arrow = 4,
}
export declare function setContext(context: Context, mask: Context): Context;
export declare function swapContext(context: Context, state: ModifierState, isArrow?: boolean): Context;
export declare function nextToken(parser: Parser, context: Context): Token;
export declare function expect(parser: Parser, context: Context, token: Token): boolean;
export declare function consume(parser: Parser, context: Context, token: Token): boolean;
