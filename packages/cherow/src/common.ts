import { scan } from './lexer/scan';
import { Token } from './token';
import { Parser } from './types';
import { Errors, recordErrors, } from './errors';

/* Context masks */
export const enum Context {

    Empty            = 0,
    OptionsTokenize = 1 << 0,
    OptionsJSX      = 1 << 1,
    OptionsRaw      = 1 << 2,
    OptionsNext     = 1 << 3,
    Strict          = 1 << 4,
    Module          = 1 << 5,
    Async           = 1 << 6,
    Yield           = 1 << 7,
    Template        = 1 << 8,
    In              = 1 << 9,
}

/* Mutual parser flags */
export const enum Flags {
    Empty   = 0,
    NewLine = 1 << 0,
    HasOctal = 1 << 1,
    IsAssignable = 1 << 2,
    IsBindable = 1 << 3,
}

/* Recovery state */
export const enum Recovery {
    Empty   = 0,
    Unterminated = 1 << 0,
}

/* Tokenizer state */
export const enum Tokenize {
    Empty,
    NoWhiteSpace,
    All
}

export function nextToken(parser: Parser, context: Context): Token {
    return (parser.token = scan(parser, context));
  }
export function expect(parser: Parser, context: Context, token: Token): boolean {
    if (parser.token !== token) recordErrors(parser, Errors.Unexpected);
    nextToken(parser, context);
    return true;
  }

export function consume(parser: Parser, context: Context, token: Token): boolean {
    if (parser.token !== token) return false;
    nextToken(parser, context);
    return true;
  }  
  