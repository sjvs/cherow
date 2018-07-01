import { State } from './types';
import { Context } from './common';

/*@internal*/
export const enum Errors {
  Unexpected,
  UnterminatedString,
  StrictOctalEscape,
  InvalidEightAndNine,
  UnterminatedComment,
  HtmlCommentInModule
}

/*@internal*/
export const errorMessages: {
  [key: string]: string;
} = {
  [Errors.Unexpected]: 'Unexpected token',
  [Errors.UnterminatedString]: 'Unterminated string literal',
  [Errors.StrictOctalEscape]: 'Octal escapes are not allowed in strict mode',
  [Errors.InvalidEightAndNine]: 'Escapes \\8 or \\9 are not syntactically valid escapes',
  [Errors.UnterminatedComment]: 'Unterminated MultiLineComment',
  [Errors.HtmlCommentInModule]: 'HTML comments are not allowed in modules',


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

export function report(parser: State, type: Errors, ...params: string[]) {
  const { index, line, column } = parser;
  const message = errorMessages[type].replace(/%(\d+)/g, (_: string, i: number) => params[i]);
  const error = constructError(index, line, column, message);
  throw error;
}
