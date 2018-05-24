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
    InParameter     = 1 << 8,
    NewTarget       = 1 << 9,
    Template        = 1 << 10,
    In              = 1 << 11,
    Statement       = 1 << 12,
}

/* Mutual parser flags */
export const enum Flags {
    Empty   = 0,
    NewLine = 1 << 0,
    HasOctal = 1 << 1,
    IsAssignable = 1 << 2,
    IsBindable = 1 << 3,
}

export const enum BindingOrigin {
    Empty = 0,
    ForStatement = 1 << 0,
    FunctionArgs = 1 << 1,
    CatchClause = 1 << 2,
}

/** Binding state */
export const enum BindingType {
    Empty   = 0,
    Args    = 1 << 0,
    Var     = 1 << 1,
    Let     = 1 << 2,
    Const   = 1 << 3,
    Class   = 1 << 4,
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
}

export function setContext(context: Context, mask: Context): Context {
    return (context | context) ^ mask;
}

export function swapContext(context: Context, state: ModifierState, isArrow: boolean = false): Context {
    context = setContext(context, Context.Yield);
    context = setContext(context, Context.Async);
    context = setContext(context, Context.InParameter);
    if (state & ModifierState.Generator) context = context | Context.Yield;
    if (state & ModifierState.Generator) context = context | Context.Async;
    if (!isArrow) context = context | Context.NewTarget;
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
