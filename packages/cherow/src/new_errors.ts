import { Parser } from '../types';
import { Context } from '../utilities';


/*@internal*/
export const enum Errors {
    Unexpected,
    UnterminatedString,
    StrictOctalEscape,
    InvalidEightAndNine
}

/*@internal*/
export const errorMessages: {
    [key: string]: string;
} = {
    [Errors.UnterminatedString]: 'Unterminated string literal',
    [Errors.StrictOctalEscape]: 'Octal escapes are not allowed in strict mode',
    [Errors.InvalidEightAndNine]: 'Escapes \\8 or \\9 are not syntactically valid escapes',
};


/**
 * Collect line, index, and colum from either the recorded error
 * or directly from the parser and returns it
 *
 * @param parser Parser instance
 * @param context Context masks
 * @param index  The 0-based end index of the error.
 * @param line The 0-based line position of the error.
 * @param column The 0-based column position of the error.
 * @param parser The 0-based end index of the current node.
 * @param description Error description
 */

/*@internal*/
export function constructError(
    parser: Parser,
    context: Context,
    index: number,
    line: number,
    column: number,
    description: string
): void {
    const error: any = new SyntaxError(`Line ${line}, column ${column}: ${description}` );

    error.index = index;
    error.line = line;
    error.column = column;
    error.description = description;
    return error;
}


export function recordErrors(parser: Parser, type: Errors, ...params: string[]) {
    const { index, line, column } = parser;
    const message = errorMessages[type].replace(/%(\d+)/g, (_: string, i: number) => params[i]);
    if (parser.onError) parser.onError(message);
}
