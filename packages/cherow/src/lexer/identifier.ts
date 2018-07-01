import { Token, descKeywordTable } from '../token';
import { State } from '../types';
import { Chars } from '../chars';
import { nextChar, nextUnicodeChar, fromCodePoint, consume, toHex } from './common';
import { report, Errors } from '../errors';
import { isValidIdentifierPart, isValidIdentifierStart } from '../unicode';

export function isIdentifierPart(code: Chars): boolean {
  const letter = code | 32;
  return (letter >= Chars.LowerA && letter <= Chars.LowerZ) ||
      code === Chars.Underscore ||
      code === Chars.Dollar ||
      code === Chars.Backslash ||
      (code >= Chars.Zero && code <= Chars.Nine // 0..9;
          ||
          isValidIdentifierPart(code));
}

export function nextIdentifierChar(parser: State): number {
  const hi = parser.source.charCodeAt(parser.index++);
  let code = hi;
  if ((hi & 0xFC00) == 0xD800) {
      const lo = parser.source.charCodeAt(parser.index);
      if ((lo & 0xFC00) == 0xDC00) {
          code = 0x10000 + ((hi & 0x3FF) << 10) + (lo & 0x3FF);
          parser.index++;
          parser.column++;
      }
  }

  parser.column++;
  return code;
}

export function scanIdentifier(state: State): Token {
  let start = state.index;
  state.tokenValue = '';
  let hasEscape = false;
  while (state.index < state.length) {
      const ch = nextIdentifierChar(state);
      if (!isIdentifierPart(ch)) break;
      // Speed up by checking the 4th bit set first
      if ((ch & 8) === 8) {
          if (ch === Chars.Backslash) {
              const pendingIndex = state.index - 1;
              const escaped = scanIdentifierUnicodeEscape(state);
              if (escaped < 0 || escaped === Chars.Backslash || !isValidIdentifierStart(escaped)) return Token.Invalid;
              state.tokenValue += state.source.slice(start, pendingIndex);
              state.tokenValue += fromCodePoint(escaped);
              hasEscape = true;
              start = state.index;
          }
      }
  }

  if (start < state.index) state.tokenValue += state.source.slice(start, state.index);
  const token = descKeywordTable[state.tokenValue] || Token.Identifier;
  if (!hasEscape) return token;
  if (hasEscape) {
      if (token & Token.IdentifierOrContextual) {
          return token;
      } else if (token & Token.FutureReserved ||
          token === Token.LetKeyword ||
          token === Token.StaticKeyword) {
          return Token.EscapedStrictReserved;
      } else return Token.EscapedKeyword;
  }
  return token;
}

/**
* Scans identifier unicode escape
*
* @param parser Parser object
*/
export function scanIdentifierUnicodeEscape(state: State): number {
  if (state.source.charCodeAt(state.index) !== Chars.LowerU) report(state, Errors.Unexpected);
  state.index++;
  state.column++;
  if (consume(state, Chars.LeftBrace)) {
      //\u{HexDigits}
      let value = 0;
      let digit = toHex(state.source.charCodeAt(state.index));
      if (digit < 0) return -1;
      while (digit >= 0) {
          value = (value << 4) | digit;
          if (value > Chars.NonBMPMax) report(state, Errors.Unexpected);
          state.index++;
          state.column++;
          digit = toHex(state.source.charCodeAt(state.index));
      }
      if (value < 0 || !consume(state, Chars.RightBrace)) {
          report(state, Errors.Unexpected);
      }
      return value;
  }
  //\uHex4Digits
  if (state.index + 4 > state.length) return -1;
  const cp1 = toHex(state.source.charCodeAt(state.index));
  if (cp1 < 0) return -1;
  const cp2 = toHex(state.source.charCodeAt(state.index + 1));
  if (cp2 < 0) return -1;
  const cp3 = toHex(state.source.charCodeAt(state.index + 2));
  if (cp3 < 0) return -1;
  const cp4 = toHex(state.source.charCodeAt(state.index + 3));
  if (cp4 < 0) return -1;
  state.index += 4;
  state.column += 4;
  return cp1 << 12 | cp2 << 8 | cp3 << 4 | cp4;
}
