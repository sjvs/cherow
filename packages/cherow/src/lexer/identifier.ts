import { Token, descKeywordTable } from '../token';
import { ParserState } from '../types';
import { Chars, isIdentifierPart, AsciiLookup, CharType } from '../chars';
import { Context } from '../common';
import { nextChar, fromCodePoint, toHex } from './common';
import { report, Errors } from '../errors';

/**
 * Scans identifier
 *
 * @param state ParserState instance
 * @param context Context masks
 */
export function scanIdentifier(state: ParserState, context: Context): Token {
  // Hot path - fast path for utf8, non-multi unit char and not escape
  while ((AsciiLookup[nextChar(state)] & (CharType.IDContinue | CharType.Decimal)) > 0) {}
  if (state.startIndex < state.index) {
      state.tokenValue = state.source.slice(state.startIndex, state.index);
      if (state.index >= state.length || state.nextChar <= Chars.MaxAsciiCharacter && state.nextChar !== Chars.Backslash) {
          if (context & Context.OptionsRawidentifiers) state.tokenRaw = state.tokenValue;
          return descKeywordTable[state.tokenValue] || Token.Identifier;
      }
  }
  return scanIdentifierRest(state, context);
}

/**
 * Scans the rest of the identifiers. It's the slow path that has to deal with multi unit encoding
 *
 * @param state ParserState instance
 * @param context Context masks
 */
export function scanIdentifierRest(state: ParserState, context: Context): Token {
  let start = state.index;
  let hasEscape = false;
  while (state.index < state.length) {
      // The backslash char have it's 4th bit set. Checking that first before checking for
      // a Unicode escape sequence prevents additional checks for 63%
      if ((state.nextChar & 8) === 8 && state.nextChar === Chars.Backslash) {
          state.tokenValue += state.source.slice(start, state.index);
          const cookedChar = scanIdentifierUnicodeEscape(state);
          if (cookedChar < 0 || !isIdentifierPart(cookedChar)) {
              return Token.Invalid;
          }
          state.tokenValue += fromCodePoint(cookedChar);
          hasEscape = true;
          start = state.index;
      } else {
          if (!isIdentifierPart(state.source.charCodeAt(state.index))) break;
          nextChar(state);
      }
  }

  if (start < state.index) state.tokenValue += state.source.slice(start, state.index);

  // This is an optimized equalent for "normal" surrogate lead checking where the
  // code unit is in the range U+D800 - U+DBFF.
  if ((state.nextChar & 0xFC00) === 0xD800) {
      const code = state.nextChar;
      nextChar(state);
      const lo = state.source.charCodeAt(state.index);
      if ((lo & 0xFC00) !== 0xDC00) report(state, Errors.Unexpected);
      state.tokenValue += fromCodePoint(0x10000 + ((code & 0x3FF) << 10) + (lo & 0x3FF));
      nextChar(state);
  }
  // 'options -> rawIdentifier'
  if (context & Context.OptionsRawidentifiers) state.tokenRaw += state.source.slice(state.startIndex, state.index);
  if (start < state.index && isIdentifierPart(state.source.charCodeAt(state.index))) scanIdentifierRest(state, context);

  const t = descKeywordTable[state.tokenValue] || Token.Identifier;

  if (!hasEscape || t & Token.IdentifierOrContextual) return t;

  if (t & Token.FutureReserved || t === Token.LetKeyword || t === Token.StaticKeyword) {
      return Token.EscapedStrictReserved;
  }
  return Token.EscapedKeyword;
}

/**
 * Scans identifier unicode escape
 *
 * @param state ParserState instance
 */
export function scanIdentifierUnicodeEscape(state: ParserState): number {
   // Read 'u' characters
  if (nextChar(state) !== Chars.LowerU) report(state, Errors.Unexpected);
  let value = 0;
  if (nextChar(state) === Chars.LeftBrace) {
      let digit = toHex(nextChar(state));
      //  '\\u{}'
      if (state.nextChar === Chars.RightBrace) report(state, Errors.InvalidUnicodeEscape);
      // Note: The 'while' loop will only execute if the digit is higher than or equal to zero. And the 'value'
      // will still be 0 if invalid hex value. So no need for further validations
      while (digit >= 0) {
          value = (value << 4) | digit;
          if (value > 0x10FFFF) report(state, Errors.UndefinedUnicodeCodePoint);
          digit = toHex(nextChar(state));
      }
      if (value < 0 || state.nextChar != Chars.RightBrace) report(state, Errors.InvalidUnicodeEscape);
      nextChar(state);
      return value;
  }

  // 4 characters have to be read for this to be valid
  for (let i = 0; i < 4; i++) {
      const digit = toHex(state.nextChar);
      if (digit < 0) report(state, Errors.InvalidUnicodeEscape);
      value = (value << 4) | digit;
      nextChar(state);
  }

  return value;
}

/**
 * Checking non-ASCII code points. This can only be identifiers or whitespace
 *
 * @param state ParserState instance
 * @param context Context masks
 */
export function maybeIdentifier(state: ParserState, context: Context): Token {

  if ((state.nextChar & 0xFC00) === 0xD800) {
      state.index++;
      state.column++;
      const lo = state.source.charCodeAt(state.index);
      if ((lo & 0xFC00) !== 0xDC00) report(state, Errors.Unexpected);
      const surrogate = 0x10000 + ((state.nextChar & 0x3FF) << 10) + (lo & 0x3FF);
      state.tokenValue += fromCodePoint(surrogate);
      state.index++;
      state.column++;
  }
  if (state.index < state.length) return scanIdentifierRest(state, context);
  if (context & Context.OptionsRawidentifiers) state.tokenRaw = state.tokenValue;
  return Token.Identifier;
}
