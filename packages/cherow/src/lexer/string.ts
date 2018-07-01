import { Context, Flags } from '../common';
import { State } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { toHex, nextChar, nextUnicodeChar, Escape, fromCodePoint } from './common';
import { report, Errors } from '../errors';

// Rest the 'nextChar' and advance the index if in unicode range.
// This is 'unique' only for string and template literals
export function readNext(state: State): number {
  if (state.nextChar > 0xFFFF) ++state.index;
  const ch = state.nextChar = state.source.charCodeAt(++state.index);
  if (state.index >= state.length) report(state, Errors.UnterminatedString);
  ++state.column;
  return ch;
}

/**
 * Scan a string literal
 *
 * @see [Link](https://tc39.github.io/ecma262/#sec-literals-string-literals)
 *
 * @param state State
 * @param context Context masks
 */

export function scanStringLiteral(state: State, context: Context): Token {

  const quote = state.nextChar;

  let ret = '';

  readNext(state);

  while (state.nextChar !== quote) {
      if (state.nextChar === Chars.Backslash) {
          nextChar(state);
          if (state.nextChar >= Chars.MaxAsciiCharacter) {
              ret += fromCodePoint(state.nextChar);
          } else {
              const code = table[state.nextChar](state, context);
              if (code >= 0) ret += fromCodePoint(code);
              else recordStringErrors(state, code as Escape);
          }
      } else if ((state.nextChar & 83) < 3 &&
                (state.nextChar === Chars.CarriageReturn ||
                state.nextChar === Chars.LineFeed)) {
          report(state, Errors.UnterminatedString);
      } else {
          ret += fromCodePoint(state.nextChar);
      }
      readNext(state);
  }

  nextChar(state); // Consume the quote

  if (context & Context.OptionsRaw) state.tokenRaw = state.source.slice(state.startIndex, state.index);

  state.tokenValue = ret;

  return Token.StringLiteral;
}

export const table = new Array < (state: State, context: Context) => number > (128).fill(nextUnicodeChar);

table[Chars.LowerB] = () => Chars.Backspace;
table[Chars.LowerF] = () => Chars.FormFeed;
table[Chars.LowerR] = () => Chars.CarriageReturn;
table[Chars.LowerN] = () => Chars.LineFeed;
table[Chars.LowerT] = () => Chars.Tab;
table[Chars.LowerV] = () => Chars.VerticalTab;


// Line continuations
table[Chars.CarriageReturn] = state => {
  state.column = -1;
  state.line++;
  const { index } = state;

  if (index < state.source.length) {
      const ch = state.source.charCodeAt(index);

      if (ch === Chars.LineFeed) {
          state.nextChar = ch;
          state.index = index + 1;
      }
  }

  return Escape.Empty;
};

table[Chars.LineFeed] =
  table[Chars.LineSeparator] =
  table[Chars.ParagraphSeparator] = state => {
      state.column = -1;
      state.line++;
      return Escape.Empty;
  };


table[Chars.CarriageReturn] = state => {
  state.column = -1;
  state.line++;

  const { index } = state;

  if (index < state.source.length) {
      const ch = state.source.charCodeAt(index);

      if (ch === Chars.LineFeed) {
          state.nextChar = ch;
          state.index = index + 1;
      }
  }

  return Escape.Empty;
};

table[Chars.LineFeed] =
  table[Chars.LineSeparator] =
  table[Chars.ParagraphSeparator] = state => {
      state.column = -1;
      state.line++;
      return Escape.Empty;
  };

// Null character, octals
table[Chars.Zero] = table[Chars.One] = table[Chars.Two] = table[Chars.Three] = (state, context) => {
  // 1 to 3 octal digits
  let code = state.nextChar - Chars.Zero;
  let index = state.index + 1;
  let column = state.column + 1;
  if (index < state.source.length) {
      let next = state.source.charCodeAt(index);
      if (next < Chars.Zero || next > Chars.Seven) {
          // Strict mode code allows only \0, then a non-digit.
          if (code !== 0 || next === Chars.Eight || next === Chars.Nine) {
              if (context & Context.Strict) return Escape.StrictOctal;
              // If not in strict mode, we mark the 'octal' as found and continue
              // parsing until we parse out the literal AST node
              state.flags = state.flags | Flags.HasOctal;
          }
      } else if (context & Context.Strict) {
          return Escape.StrictOctal;
      } else {
          state.flags = state.flags | Flags.HasOctal;
          state.nextChar = next;
          code = code * 8 + (next - Chars.Zero);
          index++;
          column++;

          if (index < state.source.length) {
              next = state.source.charCodeAt(index);

              if (next >= Chars.Zero && next <= Chars.Seven) {
                  state.nextChar = next;
                  code = code * 8 + (next - Chars.Zero);
                  index++;
                  column++;
              }
          }

          state.index = index - 1;
          state.column = column - 1;
      }
  }

  return code;
};

table[Chars.Four] = table[Chars.Five] = table[Chars.Six] = table[Chars.Seven] = (state, context) => {
  if (context & Context.Strict) return Escape.StrictOctal;
  let code = state.nextChar - Chars.Zero;
  const index = state.index + 1;
  const column = state.column + 1;

  if (index < state.source.length) {
      const next = state.source.charCodeAt(index);
      if (next >= Chars.Zero && next <= Chars.Seven) {
          code = code * 8 + (next - Chars.Zero);
          state.nextChar = next;
          state.index = index;
          state.column = column;
      }
  }

  return code;
};

table[Chars.Eight] = table[Chars.Nine] = () => Escape.EightOrNine;

// ASCII escapes
table[Chars.LowerX] = state => {
  const ch1 = nextChar(state);
  const hi = toHex(ch1);
  if (hi < 0 || state.index >= state.length) return Escape.InvalidHex;
  const ch2 = nextChar(state);
  const lo = toHex(ch2);
  if (lo < 0) return Escape.InvalidHex;
  return hi * 16 + lo;
};

table[Chars.LowerU] = state => {
  let ch = nextChar(state);
  if (ch === Chars.LeftBrace) {
      // \u{N}
      ch = nextChar(state);
      let code = toHex(ch);
      if (code < 0) return Escape.InvalidHex;

      ch = nextChar(state);
      while (ch !== Chars.RightBrace) {
          const digit = toHex(ch);
          if (digit < 0) return Escape.InvalidHex;
          code = code * 16 + digit;
          // Code point out of bounds
          if (code > Chars.NonBMPMax) return Escape.OutOfRange;
          ch = nextChar(state);
      }

      return code;
  } else {
      // \uNNNN
      let code = toHex(ch);
      if (code < 0) return Escape.InvalidHex;

      for (let i = 0; i < 3; i++) {
          ch = nextChar(state);
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
* @param state state object
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
