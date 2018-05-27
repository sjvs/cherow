import { Parser } from './types';
import { Context } from './common';

/*@internal*/
export const enum Errors {
    Unexpected,
    UnexpectedToken,
    InvalidOrUnexpectedToken,
    UnterminatedString,
    StrictOctalEscape,
    InvalidEightAndNine,
    ContinuousNumericSeparator,
    TrailingNumericSeparator,
    ZeroDigitNumericSeparator,
    DeclarationMissingInitializer,
    ElementAfterRest,
    NoCatchOrFinally,
    NoCatchClause,
    NoCatchClauseDefault,
    InvalidLHSDefaultValue,
    InvalidLhsInFor,
    StrictFunction,
    SloppyFunction,
    UnNamedFunctionDecl,
    StrictModeWith,
    AsyncFunctionInSingleStatementContext,
    UnknownLabel,
    LabelRedeclaration,
    InvalidNestedStatement,
    IllegalContinue,
    IllegalBreak
}
/*@internal*/
export const errorMessages: {
    [key: string]: string;
} = {
    [Errors.Unexpected]: 'Unexpected token',
    [Errors.UnexpectedToken]: 'Unexpected token %0',
    [Errors.UnterminatedString]: 'Unterminated string literal',
    [Errors.StrictOctalEscape]: 'Octal escapes are not allowed in strict mode',
    [Errors.InvalidEightAndNine]: 'Escapes \\8 or \\9 are not syntactically valid escapes',
    [Errors.ContinuousNumericSeparator]: 'Only one underscore is allowed as numeric separator',
    [Errors.TrailingNumericSeparator]: 'Numeric separators are not allowed at the end of numeric literals',
    [Errors.ZeroDigitNumericSeparator]: 'Numeric separator can not be used after leading 0.',
    [Errors.InvalidOrUnexpectedToken]: 'Invalid or unexpected token',
    [Errors.DeclarationMissingInitializer]: 'Missing initializer in destructuring declaration',
    [Errors.ElementAfterRest]: 'Rest element must be last element',
    [Errors.NoCatchOrFinally]: 'Missing catch or finally after try',
    [Errors.NoCatchClause]: 'Missing catch clause',
    [Errors.NoCatchClauseDefault]: 'Catch clause parameter does not support default values',
    [Errors.InvalidLHSDefaultValue]: 'Only \'=\' operator can be used for specifying default value',
    [Errors.InvalidLhsInFor]: 'Invalid left-hand side in for-loop',
    [Errors.StrictFunction]: 'In strict mode code, functions can only be declared at top level or inside a block',
    [Errors.SloppyFunction]: 'In non-strict mode code, functions can only be declared at top level, inside a block, or as the body of an if statement',
    [Errors.UnNamedFunctionDecl]: 'Function declaration must have a name in this context',
    [Errors.StrictModeWith]: 'Strict mode code may not include a with statement',
    [Errors.AsyncFunctionInSingleStatementContext]: 'Async functions can only be declared at the top level or inside a block',
    [Errors.UnknownLabel]: 'Undefined label \'%0\'',
    [Errors.LabelRedeclaration]: 'Label \'%0\' has already been declared',
    [Errors.InvalidNestedStatement]: '%0  statement must be nested within an iteration statement',
    [Errors.IllegalContinue]: 'Illegal continue statement: no surrounding iteration statement',
    [Errors.IllegalBreak]: 'Illegal break statement',
};

export function constructError(index: number, line: number, column: number, description: string): void {
    const error: any = new SyntaxError(
        `Line ${line}, column ${column}: ${description}`,
    );

    error.index = index;
    error.line = line;
    error.column = column;
    error.description = description;
    return error;
}

export function recordErrors(parser: Parser, type: Errors, ...params: string[]) {
    const { index, line, column } = parser;
    const message = errorMessages[type].replace(/%(\d+)/g, (_: string, i: number) => params[i]);
    const error = constructError(index, line, column, message);
    if (parser.onError) parser.onError(message, line, column);
   // throw error;
}