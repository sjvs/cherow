import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context } from '../utilities';
import { nextUnicodeChar, consumeOpt, toHex, isHex, fromCodePoint } from './common';
import { Errors, recordErrors } from './errors';
import { isIdentifierStart } from '../unicode';

// TODO:
//
// - Strict mode
// - Simplify
// - Optimize

export const enum NumberState {
  None = 0,
  HasSeparator = 1 << 0
}

/**
* Scans numeric liteal
*
* @param parser Parser object
* @param context Context masks
*/
export function scanNumeric(parser: Parser, context: Context): Token {
  const { index } = parser;
  const maximumDigits = 10;
  let isFloat = false;
  let digit = maximumDigits - 1;
  let seenSeparator = false;
  let value: string | number = 0;
  let code = parser.source.charCodeAt(parser.index);
  while ((code >= Chars.Zero && code <= Chars.Nine || code === Chars.Underscore) && digit >= 0) {
      if (code === Chars.Underscore) {
          parser.index++;
          parser.column++;
          if (parser.source.charCodeAt(parser.index) === Chars.Underscore) {
              recordErrors(parser, Errors.ContinuousNumericSeparator);
          }
          seenSeparator = true;
          code = parser.source.charCodeAt(parser.index);
          continue;
      }
      seenSeparator = false;
      value = 10 * value + (code - Chars.Zero);
      parser.index++;
      parser.column++;
      code = parser.source.charCodeAt(parser.index);
      --digit;
  }

  if (seenSeparator) recordErrors(parser, Errors.TrailingNumericSeparator);

  code = parser.source.charCodeAt(parser.index);

  if (digit >= 0 && code !== Chars.Period &&
      (parser.index >= parser.source.length && isIdentifierStart(parser.source.charCodeAt(parser.index)))) {
      if (context & Context.OptionsNext) parser.tokenValue = parser.source.slice(index, parser.index);
      parser.tokenValue = value;
      return Token.NumericLiteral;
  } else value = value + scanDecimalDigitsOrSeparator(parser, context);

  if (consumeOpt(parser, Chars.Period)) {
      if (context & Context.OptionsNext && parser.source.charCodeAt(parser.index) === Chars.Underscore) {
          recordErrors(parser, Errors.ZeroDigitNumericSeparator);
      }
      isFloat = true;
      value = `${value}.${scanDecimalDigitsOrSeparator(parser, context)}`;
  }

  const end = parser.index;

  let isBigint = false;

  if (consumeOpt(parser, Chars.LowerN)) {
      if (isFloat) recordErrors(parser, Errors.Unexpected);
      isBigint = true;
  } else if (consumeOpt(parser, Chars.UpperE) || consumeOpt(parser, Chars.LowerE)) {
      isFloat = true;
      if (consumeOpt(parser, Chars.Plus) || consumeOpt(parser, Chars.Hyphen)) {}
      const next = parser.source.charCodeAt(parser.index);
      if (!(next >= Chars.Zero && next <= Chars.Nine)) recordErrors(parser, Errors.Unexpected);
      const preNumericPart = parser.index;
      const finalFragment = scanDecimalDigitsOrSeparator(parser, context);
      value = value + parser.source.substring(end, preNumericPart) + finalFragment;
  }

  if (code >= Chars.Zero && code <= Chars.Nine ||
      (parser.index >= parser.source.length && isIdentifierStart(parser.source.charCodeAt(parser.index)))) {
      parser.recovery |= Recovery.Invalid;
      recordErrors(parser, Errors.Unexpected);
  }

  if (context & Context.OptionsNext) parser.tokenRaw = parser.source.slice(index, parser.index);
  parser.tokenValue = isFloat ? parseFloat(value as string) : parseInt(value as string, 10);
  return isBigint ? Token.BigIntLiteral : Token.NumericLiteral;
}

/**
* Scans decimal digit or numeric separator
*
* @param parser Parser object
* @param context Context masks
*/

function scanDecimalDigitsOrSeparator(parser: Parser, context: Context): string {
  let { index } = parser;
  let seenSeparator = false;
  let isPreviousTokenSeparator = false;
  let result = '';
  let code = parser.source.charCodeAt(parser.index);
  while (code >= Chars.Zero && code <= Chars.Nine || code === Chars.Underscore) {
      if (context & Context.OptionsNext && code === Chars.Underscore) {
          if (seenSeparator) {
              seenSeparator = false;
              isPreviousTokenSeparator = true;
              result += parser.source.substring(index, parser.index);
          } else if (isPreviousTokenSeparator) {
              recordErrors(parser, Errors.TrailingNumericSeparator);
          } else {
              recordErrors(parser, Errors.ContinuousNumericSeparator);
          }
          parser.index++; parser.column++;
          code = parser.source.charCodeAt(parser.index);
          index = parser.index;
          continue;
      }
      seenSeparator = true;
      isPreviousTokenSeparator = false;
      parser.index++; parser.column++;
      code = parser.source.charCodeAt(parser.index);
  }

  if (context & Context.OptionsNext && parser.source.charCodeAt(parser.index - 1) === Chars.Underscore) {
      recordErrors(parser, Errors.ContinuousNumericSeparator);
  }
  return result + parser.source.substring(index, parser.index);
}

export function scanHexOctalOrBinary(parser: Parser, context: Context): Token {
  const next = parser.source.charCodeAt(parser.index);
  if (parser.index + 1 < parser.length) {
      parser.index++;
      parser.column++;
      switch (parser.source.charCodeAt(parser.index)) {
          case Chars.LowerB:
          case Chars.UpperB:
              return scanBinaryDigits(parser, context);
          case Chars.LowerO:
          case Chars.UpperO:
              return scanOctalDigits(parser, context);
          case Chars.LowerX:
          case Chars.UpperX:
              return scanHexDigits(parser, context);
          default:
              return scanImplicitOctalDigits(parser, context);
      }
  } else if (parser.index < parser.length && (next >= Chars.Zero || next <= Chars.Seven)) {
      return scanImplicitOctalDigits(parser, context);
  }
  return scanNumeric(parser, context);
}

export function scanOctalDigits(parser: Parser, context: Context): Token {
  parser.index++; parser.column++;
  let value = 0;
  let digits = 0;
  let code = parser.source.charCodeAt(parser.index);
  let state = NumberState.None;
  while (parser.index < parser.length) {
      if (context & Context.OptionsNext && code === Chars.Underscore) {
          state = scanNumericSeparator(parser, state);
          code = parser.source.charCodeAt(parser.index);
          continue;
      }
      if (!(code >= Chars.Zero && code <= Chars.Seven)) {
          parser.recovery |= Recovery.Invalid;
          break;
      }
      state = NumberState.None;
      value = value * 8 + (code - Chars.Zero);
      parser.index++; parser.column++;
      code = parser.source.charCodeAt(parser.index);
      digits++;
  }

  if (digits === 0) recordErrors(parser, Errors.InvalidOrUnexpectedToken);
  else if (state & NumberState.HasSeparator) recordErrors(parser, Errors.TrailingNumericSeparator);
  parser.tokenValue = value;
  if (consumeOpt(parser, Chars.LowerN)) return Token.BigIntLiteral;
  return Token.NumericLiteral;
}

export function scanHexDigits(parser: Parser, context: Context): Token {
  parser.index++; parser.column++;
  let value = toHex(parser.source.charCodeAt(parser.index));
  if (value < 0) recordErrors(parser, Errors.Unexpected);
  parser.index++; parser.column++;
  let state = NumberState.None;
  while (parser.index < parser.length) {
      const next = parser.source.charCodeAt(parser.index);
      if (context & Context.OptionsNext && next === Chars.Underscore) {
          state = scanNumericSeparator(parser, state);
          continue;
      }
      state = NumberState.None;
      const digit = toHex(next);
      if (digit < 0) {
          parser.recovery |= Recovery.Invalid;
          break;
      }
      value = value * 16 + digit;
      parser.index++; parser.column++;
  }
  if (state & NumberState.HasSeparator) recordErrors(parser, Errors.TrailingNumericSeparator);
  parser.tokenValue = value;
  if (consumeOpt(parser, Chars.LowerN)) return Token.BigIntLiteral;
  return Token.NumericLiteral;
}

/**
* Scans binary digits
*
* @param parser Parser object
* @param context Context masks
*/
export function scanBinaryDigits(parser: Parser, context: Context): Token {
  parser.index++; parser.column++;
  let value = 0;
  let state = NumberState.None;
  let digits = 0;
  while (parser.index < parser.length) {
      const code = parser.source.charCodeAt(parser.index);
      if (context & Context.OptionsNext && code === Chars.Underscore) {
          state = scanNumericSeparator(parser, state);
          continue;
      }
      if (!(code >= Chars.Zero && code <= Chars.Two)) {
          parser.recovery |= Recovery.Invalid;
          break;
      }
      state = NumberState.None;
      value = value * 2 + code - Chars.Zero;
      parser.index++; parser.column++;
      digits++;
  }

  if (digits === 0) recordErrors(parser, Errors.InvalidOrUnexpectedToken);
  else if (state & NumberState.HasSeparator) recordErrors(parser, Errors.ContinuousNumericSeparator);
  parser.tokenValue = value;
  if (consumeOpt(parser, Chars.LowerN)) return Token.BigIntLiteral;
  return Token.NumericLiteral;
}

/**
* Scans implicit octals
*
* @param parser Parser object
* @param context Context masks
*/
export function scanImplicitOctalDigits(parser: Parser, context: Context): Token {
  let next = parser.source.charCodeAt(parser.index);

  if (next >= Chars.Zero && next <= Chars.Seven || next === Chars.Underscore) {

      let value = 0;
      let index = parser.index;
      let column = parser.column;
      let digits = 0;
      // Implicit octal, unless there is a non-octal digit.
      // (Annex B.1.1 on Numeric Literals)
      while (index < parser.length) {
          next = parser.source.charCodeAt(index);
          if (next === Chars.Underscore) {
              recordErrors(parser, Errors.ZeroDigitNumericSeparator);
              index++;
              column++;
              continue;
          } else if (next === Chars.Eight || next === Chars.Nine) {
              return scanNumeric(parser, context);
          } else {
              if (!(next >= Chars.Zero && next <= Chars.Seven)) {
                  parser.recovery |= Recovery.Invalid;
                  break;
              }
              value = value * 8 + (next - Chars.Zero);
              parser.index++; parser.column++;
              digits++;
          }
          if (digits === 0) recordErrors(parser, Errors.Unexpected);
      }
      parser.tokenValue = value;
      parser.index = index;
      parser.column = column;
      if (consumeOpt(parser, Chars.LowerN)) return Token.BigIntLiteral;
      return Token.NumericLiteral;
  }

  if (context & Context.OptionsNext && parser.source.charCodeAt(parser.index) === Chars.Underscore) {
      recordErrors(parser, Errors.ZeroDigitNumericSeparator);
  }

  return scanNumeric(parser, context);
}

export function scanNumericSeparator(parser: Parser, state: NumberState): NumberState {
  parser.index++; parser.column++;
  if (state & NumberState.HasSeparator) recordErrors(parser, Errors.TrailingNumericSeparator);
  return NumberState.HasSeparator;
}
