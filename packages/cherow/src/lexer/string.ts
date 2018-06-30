import { Context, Flags } from '../common';
import { State } from '../types';
import { Token, KeywordDescTable, descKeywordTable } from '../token';
import { Chars } from '../chars';
import { toHex, nextChar, nextUnicodeChar } from './common';
import { report, Errors } from '../errors';

export function readNext(state: State): number {
  const ch = nextChar(state);
  if (state.index >= state.length) report(state, Errors.UnterminatedString);
  return ch;
}

export const enum Escape {
  Empty = -1,
      StrictOctal = -2,
      EightOrNine = -3,
      InvalidHex = -4,
      OutOfRange = -5,
}

export function scanStringLiteral(state: State, context: Context): Token {
  const quote = state.nextChar;

  let ret = '';

  readNext(state);

  while (state.nextChar !== quote) {
      switch (state.nextChar) {
          case Chars.Backslash:
              nextChar(state);

              if (state.nextChar >= 128) {
                  ret += String.fromCodePoint(state.nextChar);
              } else {
                  const code = table[state.nextChar](state, context, state.nextChar);
                  if (code >= 0) ret += String.fromCodePoint(code);
                  else recordStringErrors(state, code as Escape);
              }
              break;
          case Chars.CarriageReturn:
          case Chars.LineFeed:
               report(state, Errors.UnterminatedString);
          default:
              ret += String.fromCodePoint(state.nextChar);
      }

      readNext(state);
  }

  nextChar(state); // Skip terminating quote.

  state.tokenValue = ret;
  return Token.StringLiteral;
}


export const table = new Array < (parser: State, context: Context, first: number) => number > (128).fill(nextUnicodeChar);

table[Chars.LowerB] = () => Chars.Backspace;
table[Chars.LowerF] = () => Chars.FormFeed;
table[Chars.LowerR] = () => Chars.CarriageReturn;
table[Chars.LowerN] = () => Chars.LineFeed;
table[Chars.LowerT] = () => Chars.Tab;
table[Chars.LowerV] = () => Chars.VerticalTab;


// Line continuations
table[Chars.CarriageReturn] = parser => {
  parser.column = -1;
  parser.line++;

  const {
      index
  } = parser;

  if (index < parser.source.length) {
      const ch = parser.source.charCodeAt(index);

      if (ch === Chars.LineFeed) {
          parser.nextChar = ch;
          parser.index = index + 1;
      }
  }

  return Escape.Empty;
};

table[Chars.LineFeed] =
  table[Chars.LineSeparator] =
  table[Chars.ParagraphSeparator] = parser => {
      parser.column = -1;
      parser.line++;
      return Escape.Empty;
  };


// Line continuations
table[Chars.CarriageReturn] = parser => {
  parser.column = -1;
  parser.line++;

  const {
      index
  } = parser;

  if (index < parser.source.length) {
      const ch = parser.source.charCodeAt(index);

      if (ch === Chars.LineFeed) {
          parser.nextChar = ch;
          parser.index = index + 1;
      }
  }

  return Escape.Empty;
};

table[Chars.LineFeed] =
  table[Chars.LineSeparator] =
  table[Chars.ParagraphSeparator] = parser => {
      parser.column = -1;
      parser.line++;
      return Escape.Empty;
  };

// Null character, octals
table[Chars.Zero] = table[Chars.One] = table[Chars.Two] = table[Chars.Three] = (
  parser, context, first
) => {
  // 1 to 3 octal digits
  let code = first - Chars.Zero;
  let index = parser.index + 1;
  let column = parser.column + 1;
  if (index < parser.source.length) {
      let next = parser.source.charCodeAt(index);
      if (next < Chars.Zero || next > Chars.Seven) {
          // Strict mode code allows only \0, then a non-digit.
          if (code !== 0 || next === Chars.Eight || next === Chars.Nine) {
              if (context & Context.Strict) return Escape.StrictOctal;
              //   parser.flags = parser.flags | Flags.HasOctal;

          }
      } else if (context & Context.Strict) {
          return Escape.StrictOctal;
      } else {
          //     parser.flags = parser.flags | Flags.HasOctal;
          parser.nextChar = next;
          code = code * 8 + (next - Chars.Zero);
          index++;
          column++;

          if (index < parser.source.length) {
              next = parser.source.charCodeAt(index);

              if (next >= Chars.Zero && next <= Chars.Seven) {
                  parser.nextChar = next;
                  code = code * 8 + (next - Chars.Zero);
                  index++;
                  column++;
              }
          }

          parser.index = index - 1;
          parser.column = column - 1;
      }
  }

  return code;
};

table[Chars.Four] = table[Chars.Five] = table[Chars.Six] = table[Chars.Seven] = (
  parser, context, first
) => {
  if (context & Context.Strict) return Escape.StrictOctal;
  let code = first - Chars.Zero;
  const index = parser.index + 1;
  const column = parser.column + 1;

  if (index < parser.source.length) {
      const next = parser.source.charCodeAt(index);
      if (next >= Chars.Zero && next <= Chars.Seven) {
          code = code * 8 + (next - Chars.Zero);
          parser.nextChar = next;
          parser.index = index;
          parser.column = column;
      }
  }

  return code;
};

table[Chars.Eight] = table[Chars.Nine] = () => Escape.EightOrNine;

// ASCII escapes
table[Chars.LowerX] = (parser, _) => {
  const ch1 = nextChar(parser);
  const hi = toHex(ch1);
  if (hi < 0 || parser.index >= parser.length) return Escape.InvalidHex;
  const ch2 = nextChar(parser);
  const lo = toHex(ch2);
  if (lo < 0) return Escape.InvalidHex;

  return hi * 16 + lo;
};

table[Chars.LowerU] = (parser, _) => {
  let ch = nextChar(parser);
  if (ch === Chars.LeftBrace) {
      // \u{N}
      ch = nextChar(parser);
      let code = toHex(ch);
      if (code < 0) return Escape.InvalidHex;

      ch = nextChar(parser);
      while (ch !== Chars.RightBrace) {
          const digit = toHex(ch);
          if (digit < 0) return Escape.InvalidHex;
          code = code * 16 + digit;
          // Code point out of bounds
          if (code > Chars.NonBMPMax) return Escape.OutOfRange;
          ch = nextChar(parser);
      }

      return code;
  } else {
      // \uNNNN
      let code = toHex(ch);
      if (code < 0) return Escape.InvalidHex;

      for (let i = 0; i < 3; i++) {
          ch = nextChar(parser);
          const digit = toHex(ch);
          if (digit < 0) return Escape.InvalidHex;
          if (code < 0) return Escape.InvalidHex;
          code = code * 16 + digit;
      }
      return code;
  }
};



/**
 * Throws a string error for either string or template literal
 *
 * @param parser Parser object
 * @param context Context masks
 */
export function recordStringErrors(state: State, code: Escape): any {
  let message: Errors = Errors.Unexpected;
  if (code === Escape.Empty) return;
  if (code === Escape.StrictOctal) message = Errors.StrictOctalEscape;
  if (code === Escape.EightOrNine) message = Errors.InvalidEightAndNine;
  if (code === Escape.InvalidHex) message = Errors.StrictOctalEscape;
  if (code === Escape.OutOfRange) message = Errors.InvalidEightAndNine;

  report(state, message);
  return Token.Invalid;
}
