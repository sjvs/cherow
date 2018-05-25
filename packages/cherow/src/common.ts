import { scan } from './lexer/scan';
import { Token, tokenDesc } from './token';
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
    InParameter     = 1 << 8,
    NewTarget       = 1 << 9,
    Template        = 1 << 10,
    In              = 1 << 11,
    Statement       = 1 << 12,
    Asi             = 1 << 13,
}

/* Mutual parser flags */
export const enum Flags {
    Empty               = 0,
    NewLine             = 1 << 0,
    HasOctal            = 1 << 1,
    IsAssignable        = 1 << 2,
    IsBindable          = 1 << 3,
    SimpleParameterList = 1 << 4,
}

export const enum BindingOrigin {
    Empty = 0,
    ForStatement = 1 << 0,
    FunctionArgs = 1 << 1,
    CatchClause = 1 << 2,
    Export = 1 << 3,
    Import = 1 << 4,
    Statement = 1 << 5,

}

/** Binding state */
export const enum BindingType {
    Empty       = 0,
    Args        = 1 << 0,
    Var         = 1 << 1,
    Let         = 1 << 2,
    Const       = 1 << 3,
    Class       = 1 << 4,
    Variable    = Var | Let | Const
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

export const enum ModifierState {
    None = 0,
    Generator = 1 << 0,
    Await = 1 << 1,
    Arrow = 1 << 2,
    Async = 1 << 2,
}

export function setContext(context: Context, mask: Context): Context {
    return (context | context) ^ mask;
}

export function swapContext(context: Context, state: ModifierState): Context {
    context = setContext(context, Context.Yield);
    context = setContext(context, Context.Async);
    context = setContext(context, Context.InParameter);
    if (state & ModifierState.Generator) context = context | Context.Yield;
    if (state & ModifierState.Async) context = context | Context.Async;
    // `new.target` disallowed for arrows in global scope
    if (!(state & ModifierState.Arrow)) context = context | Context.NewTarget;
    return context;
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


/**
 * Automatic Semicolon Insertion
 *
 * @see [Link](https://tc39.github.io/ecma262/#sec-automatic-semicolon-insertion)
 *
 * @param parser Parser object
 * @param context Context masks
 */
export function consumeSemicolon(parser: Parser, context: Context): void | boolean {
    return (parser.token & Token.ASI) === Token.ASI || parser.flags & Flags.NewLine
      ? consume(parser, context, Token.Semicolon)
      : recordErrors(parser, Errors.Unexpected);
  }
// WIP!! The lookahead will be replaced no point to rewind
// if we got a match
/**
 * Does a lookahead.
 *
 * @param parser Parser object
 * @param context  Context masks
 * @param callback Callback function to be invoked
 */
export function lookahead<T>(parser: Parser, context: Context, callback: (parser: Parser, context: Context) => T): T {
    const {
      tokenValue,
      flags,
      line,
      column,
      index,
      startIndex,
      tokenRaw,
      token,
      tokenRegExp,
    } = parser;
    const res = callback(parser, context);
    parser.index = index;
    parser.token = token;
    parser.tokenValue = tokenValue;
    parser.tokenValue = tokenValue;
    parser.flags = flags;
    parser.line = line;
    parser.column = column;
    parser.tokenRaw = tokenRaw;
    parser.startIndex = startIndex;
    parser.tokenRegExp = tokenRegExp;
    parser.tokenRegExp = tokenRegExp;
  
    return res;
  }

  /**
 * Validates if the next token in the stream is left parenthesis.
 *
 * @param parser Parser object
 * @param context  Context masks
 */
export function nextTokenIsLeftParen(parser: Parser, context: Context): boolean {
    nextToken(parser, context);

    return (parser.token & Token.Identifier) === Token.Identifier || 
            parser.token === Token.IsKeyword ||
            parser.token === Token.LeftParen;
  }

/**
 * Validates if the next token in the stream is arrow
 *
 * @param parser Parser object
 * @param context  Context masks
 */
export function nextTokenIsArrow(parser: Parser, context: Context): boolean {
    nextToken(parser, context);
    return parser.token === Token.Arrow;
  }

  /**
 * Returns true if this an valid lexical binding and not an identifier
 *
 * @param parser Parser object
 * @param context  Context masks
 */
export function isLexical(parser: Parser, context: Context): boolean {
    nextToken(parser, context);
    const { token } = parser;
    return (token & Token.Identifier) === Token.Identifier ||
    token === Token.LeftBracket ||
    token === Token.LeftBrace ||
    token === Token.LetKeyword ||
    token === Token.YieldKeyword;
}

export function isInOrOf(parser: Parser): boolean {
    return parser.token === Token.InKeyword || parser.token === Token.OfKeyword;
}
export function isBinding(parser: Parser): boolean {
    return  parser.token === Token.LeftBrace || parser.token === Token.LeftBracket;
}