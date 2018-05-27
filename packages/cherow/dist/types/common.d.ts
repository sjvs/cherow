import { Token } from './token';
import { Parser } from './types';
import { Errors } from './errors';
export declare const enum Context {
    Empty = 0,
    OptionsTokenize = 1,
    OptionsJSX = 2,
    OptionsRaw = 4,
    OptionsNext = 8,
    OptionsWebCompat = 16,
    OptionsEditorMode = 32,
    OptionsGlobalReturn = 64,
    Strict = 128,
    Module = 256,
    InFunctionBody = 512,
    Async = 1024,
    Yield = 2048,
    InParameter = 4096,
    NewTarget = 8192,
    Template = 16384,
    In = 32768,
    Statement = 65536,
    Asi = 131072,
    RequireIdentifier = 262144,
}
export declare const enum Flags {
    Empty = 0,
    NewLine = 1,
    HasOctal = 2,
    Assignable = 4,
    Bindable = 8,
    SimpleParameterList = 16,
}
export declare const enum BindingOrigin {
    Empty = 0,
    ForStatement = 1,
    FunctionArgs = 2,
    CatchClause = 4,
    Export = 8,
    Import = 16,
    Statement = 32,
}
/** Binding state */
export declare const enum BindingType {
    Empty = 0,
    Args = 1,
    Var = 2,
    Let = 4,
    Const = 8,
    Class = 16,
    Variable = 14,
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
    Async = 8,
}
export declare function setGrammar(flags: Flags, mask: Flags): Context;
export declare function setContext(context: Context, mask: Context): Context;
export declare function swapContext(context: Context, state: ModifierState): Context;
export declare function nextToken(parser: Parser, context: Context): Token;
export declare function expect(parser: Parser, context: Context, token: Token, errMsg?: Errors): boolean;
export declare function consume(parser: Parser, context: Context, token: Token): boolean;
/**
 * Automatic Semicolon Insertion
 *
 * @see [Link](https://tc39.github.io/ecma262/#sec-automatic-semicolon-insertion)
 *
 * @param parser Parser object
 * @param context Context masks
 */
export declare function consumeSemicolon(parser: Parser, context: Context): void | boolean;
/**
 * Does a lookahead
 *
 * @param parser Parser object
 * @param context  Context masks
 * @param callback Callback function to be invoked
 * @param isLookahead  If set to false, the parser will not rewind
 */
export declare function lookahead<T>(parser: Parser, context: Context, callback: (parser: Parser, context: Context) => T, isLookahead?: boolean): T;
/**
 * Validates if the next token in the stream is a function keyword on the same line.
 *
 * @param parser Parser object
 * @param context  Context masks
 */
export declare function nextTokenIsFuncKeywordOnSameLine(parser: Parser, context: Context): boolean;
/**
* Validates if the next token in the stream is left parenthesis.
*
* @param parser Parser object
* @param context  Context masks
*/
export declare function nextTokenIsLeftParen(parser: Parser, context: Context): boolean;
/**
 * Validates if the next token in the stream is arrow
 *
 * @param parser Parser object
 * @param context  Context masks
 */
export declare function nextTokenIsArrow(parser: Parser, context: Context): boolean;
/**
* Returns true if this an valid lexical binding and not an identifier
*
* @param parser Parser object
* @param context  Context masks
*/
export declare function isLexical(parser: Parser, context: Context): boolean;
export declare function isInOrOf(parser: Parser): boolean;
export declare function isBinding(parser: Parser): boolean;
/**
 * Reinterpret various expressions as pattern
 * This is only used for assignment and arrow parameter list
 *
 * @param parser  Parser object
 * @param context Context masks
 * @param node AST node
 */
export declare function reinterpret(parser: Parser, node: any): void;
/**
 * Add label to the stack
 *
 * @param parser Parser object
 * @param label Label to be added
 */
export declare function addLabel(parser: Parser, label: string): void;
/**
 * Add function
 *
 * @param parser Parser object
 * @param label Label to be added
 */
export declare function addCrossingBoundary(parser: Parser): void;
/**
 * Validates continue statement
 *
 * @param parser Parser object
 * @param label Label
 */
export declare function validateContinueLabel(parser: Parser, label: string): void;
/**
 * Validates break statement
 *
 * @param parser Parser object
 * @param label Label
 */
export declare function validateBreakStatement(parser: Parser, label: any): void;
/**
 * Add label
 *
 * @param parser Parser object
 * @param label Label to be added
 */
export declare function getLabel(parser: Parser, label: string, iterationStatement?: boolean, crossBoundary?: boolean): LabelState;
