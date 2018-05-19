import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context } from '../utilities';
import { nextUnicodeChar, consumeOpt } from './common';
import { Errors, recordErrors } from './errors';
import { isIdentifierStart } from '../unicode';

/**
 * Scans numeric liteal
 *
 * @param parser Parser object
 * @param context Context masks
 */
export function scanNumeric(parser: Parser, context: Context): Token {
    const { index} = parser;
    const maximumDigits = 10;
    let isFloat = false;
    let digit = maximumDigits - 1;
    let seenSeparator = false;
    let value: string | number = 0;
    let code = parser.source.charCodeAt(parser.index);
    while ((code >= Chars.Zero && code <= Chars.Nine || code === Chars.Underscore) && digit >= 0) {
        if (code === Chars.Underscore) {
            parser.index++; parser.column++;
            if (parser.source.charCodeAt(parser.index) === Chars.Underscore) {
                recordErrors(parser, Errors.ContinuousNumericSeparator);
            }
            seenSeparator = true;
            code = parser.source.charCodeAt(parser.index);
            continue;
        }
        seenSeparator = false;
        value = 10 * value + (code - Chars.Zero);
        parser.index++; parser.column++;
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
    }

    if (consumeOpt(parser, Chars.Period)) {
        if (context & Context.OptionsNext && parser.source.charCodeAt(parser.index) === Chars.Underscore) {
            recordErrors(parser, Errors.ZeroDigitNumericSeparator);
        }
        isFloat = true;
        value = `${value}.${scanDecimalDigitsOrSeparator(parser)}`;
    }

    const end = parser.index;

    let isBigint = false;

    if (context & Context.OptionsNext && consumeOpt(parser, Chars.LowerN)) {
        if (isFloat) recordErrors(parser, Errors.Unexpected);
        isBigint = true;
    } else if (consumeOpt(parser, Chars.UpperE) || consumeOpt(parser, Chars.LowerE)) {
        if (consumeOpt(parser, Chars.Plus) || consumeOpt(parser, Chars.Hyphen)) {}
        const next = parser.source.charCodeAt(parser.index);
        if (!(next >= Chars.Zero && next <= Chars.Nine)) recordErrors(parser, Errors.Unexpected);
        const preNumericPart = parser.index;
        const finalFragment = scanDecimalDigitsOrSeparator(parser);
        value = parser.source.substring(end, preNumericPart) + finalFragment;
    }

    if (code >= Chars.Zero && code <= Chars.Nine ||
        (parser.index >= parser.source.length && isIdentifierStart(parser.source.charCodeAt(parser.index)))) {
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
function scanDecimalDigitsOrSeparator(parser: Parser): string {
    let { index } = parser;
    let seenSeparator = false;
    let isPreviousTokenSeparator = false;
    let result = '';
    let code = parser.source.charCodeAt(parser.index);
    while (code >= Chars.Zero && code <= Chars.Nine || code === Chars.Underscore) {
        if (code === Chars.Underscore) {
            if (seenSeparator) {
                seenSeparator = false;
                isPreviousTokenSeparator = true;
                result += parser.source.substring(index, parser.index);
            } else if (isPreviousTokenSeparator) {
                recordErrors(parser, Errors.TrailingNumericSeparator);
            } else {
                recordErrors(parser, Errors.ContinuousNumericSeparator);
            }
            parser.index++;
            parser.column++;
            index = parser.index;
            continue;
        }
        seenSeparator = true;
        isPreviousTokenSeparator = false;
        parser.index++;
        parser.column++;
        code = parser.source.charCodeAt(parser.index);
    }

    if (parser.source.charCodeAt(parser.index - 1) === Chars.Underscore) {
        recordErrors(parser, Errors.ContinuousNumericSeparator);
    }
    return result + parser.source.substring(index, parser.index);
}

function toHex(code: number): number {
  return code < Chars.UpperA ? code - Chars.Zero : (code - Chars.UpperA + 10) & 0xF;
}

/**
* Scans octal digits
*
* @param parser Parser object
* @param context Context masks
*/
export function scanOctalDigits(parser: Parser, context: Context): Token {
  parser.index++; parser.column++;
  let value = 0;
  let code = parser.source.charCodeAt(parser.index);
  const maximumDigits = 10;
  let seenSeparator = false;
  let digit = maximumDigits - 1;
  while (parser.index < parser.length && digit >= 0) {
      if (code === Chars.Underscore) {
          seenSeparator = scanNumericSeparator(parser, seenSeparator);
          code = parser.source.charCodeAt(parser.index);
          continue;
      }
      if (code >= Chars.Zero) break;
      seenSeparator = false;
      value = value * 8 + (code - Chars.Zero);
      parser.index++; parser.column++;
      code = parser.source.charCodeAt(parser.index);
      --digit;
  }
  if (digit === 9) recordErrors(parser, Errors.InvalidOrUnexpectedToken);
  else if (seenSeparator) recordErrors(parser, Errors.TrailingNumericSeparator);
  parser.tokenValue = value;
  if (consumeOpt(parser, Chars.LowerN)) return Token.BigIntLiteral;
  return Token.NumericLiteral;
}

/**
* Scans hex digits
*
* @param parser Parser object
* @param context Context masks
*/
export function scanHexDigits(parser: Parser, context: Context): Token {
  parser.index++; parser.column++;
  let value = 0;
  let code = parser.source.charCodeAt(parser.index);
  let maximumDigits = 7;
  let seenSeparator = false;
  while (parser.index < parser.length && isHex(code) && maximumDigits >= 0) {
      if (code === Chars.Underscore) {
          seenSeparator = scanNumericSeparator(parser, seenSeparator);
          code = parser.source.charCodeAt(parser.index);
          continue;
      }
      if (isHex(code)) break;
      seenSeparator = false;
      value = (value << 4) + toHex(code);
      parser.index++; parser.column++;
      code = parser.source.charCodeAt(parser.index);
      --maximumDigits;
  }
  if (seenSeparator) recordErrors(parser, Errors.TrailingNumericSeparator);
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
  let code = parser.source.charCodeAt(parser.index);
  const maximumDigits = 32;
  let seenSeparator = false;
  let digit = maximumDigits - 1;
  while (parser.index < parser.length && digit >= 0) {
      if (context & Context.OptionsNext && code === Chars.Underscore) {
          seenSeparator = scanNumericSeparator(parser, seenSeparator);
          code = parser.source.charCodeAt(parser.index);
          continue;
      }
      const valueOf = code - Chars.Zero;
      if (!(code >= Chars.Zero && code <= Chars.Two) || valueOf >= 2) break;
      seenSeparator = false;
      value = (value << 1) + valueOf;
      parser.index++; parser.column++;
      code = parser.source.charCodeAt(parser.index);
      --digit;
  }

  if (digit === 31) recordErrors(parser, Errors.InvalidOrUnexpectedToken);
  else if (seenSeparator) recordErrors(parser, Errors.TrailingNumericSeparator);
  parser.tokenValue = value;
  if (consumeOpt(parser, Chars.LowerN)) return Token.BigIntLiteral;
  return Token.NumericLiteral;
}

export function scanNumericSeparator(parser: Parser, seenSeparator: boolean): boolean {
  parser.index++;
  parser.column++;
  if (seenSeparator) recordErrors(parser, Errors.TrailingNumericSeparator);
  return true;
}
