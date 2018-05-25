import { Parser } from './types';
import { Context } from './common';

/*@internal*/
export const enum Errors {
    Unexpected,
    InvalidOrUnexpectedToken,
    UnterminatedString,
    StrictOctalEscape,
    InvalidEightAndNine,
    ContinuousNumericSeparator,
    TrailingNumericSeparator,
    ZeroDigitNumericSeparator,
    DeclarationMissingInitializer
}
/*@internal*/
export const errorMessages: {
    [key: string]: string;
} = {
    [Errors.Unexpected]: 'Unexpected token',
    [Errors.UnterminatedString]: 'Unterminated string literal',
    [Errors.StrictOctalEscape]: 'Octal escapes are not allowed in strict mode',
    [Errors.InvalidEightAndNine]: 'Escapes \\8 or \\9 are not syntactically valid escapes',
    [Errors.ContinuousNumericSeparator]: 'Only one underscore is allowed as numeric separator',
    [Errors.TrailingNumericSeparator]: 'Numeric separators are not allowed at the end of numeric literals',
    [Errors.ZeroDigitNumericSeparator]: 'Numeric separator can not be used after leading 0.',
    [Errors.InvalidOrUnexpectedToken]: 'Invalid or unexpected token',
    [Errors.DeclarationMissingInitializer]: 'Missing initializer in destructuring declaration',
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
    //throw error;
}