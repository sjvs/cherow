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
    const { index } = parser;
    const maximumDigits = 10;
    let hasFloat = false;
    let digit = maximumDigits - 1;
    let seenSeparator = false;
    let isBigInt = false;
    let value: string | number = 0;
    let code = parser.source.charCodeAt(parser.index);
    while ((code >= Chars.Zero && code <= Chars.Nine || code === Chars.Underscore) && digit >= 0) {
        if (code === Chars.Underscore) {
            parser.index++;
            parser.column++;
            if (parser.source.charCodeAt(parser.index) === Chars.Underscore) {
                return Token.Illegal;
            }
            seenSeparator = true;
            continue;
        }
        seenSeparator = false;
        value = 10 * value + (code - Chars.Zero);
        parser.index++;
        parser.column++;
        code = parser.source.charCodeAt(parser.index);
        --digit;
    }

    code = parser.source.charCodeAt(parser.index);

    if (digit >= 0 && code !== Chars.Period && !isIdentifierStart(code) && code !== Chars.LowerN) {
        parser.tokenValue = value;
        return Token.NumericLiteral;
    }

    if (consumeOpt(parser, Chars.Period)) {
        if (context & Context.OptionsNext && parser.source.charCodeAt(parser.index) === Chars.Underscore) {
            recordErrors(parser, Errors.ZeroDigitNumericSeparator);
        }
        hasFloat = true;
        value = `${value}.${scanDecimalDigitsOrSeparator(parser)}`;
    }

    const end = parser.index;

    if (consumeOpt(parser, Chars.LowerN)) {
        if (hasFloat) recordErrors(parser, Errors.Unexpected);
        isBigInt = true;
    }

    let next = parser.source.charCodeAt(parser.index);

    if (consumeOpt(parser, Chars.UpperE) || consumeOpt(parser, Chars.LowerE)) {
        next = parser.source.charCodeAt(parser.index);
        if (next === Chars.Plus || next === Chars.Hyphen) {
            parser.index++;  parser.column++;
            next = parser.source.charCodeAt(parser.index);
        }

        if (!(next >= Chars.Zero && next <= Chars.Nine)) {
            recordErrors(parser, Errors.Unexpected);
        }

        const preNumericPart = parser.index;
        const finalFragment = scanDecimalDigitsOrSeparator(parser);
        value = parser.source.substring(end, preNumericPart) + finalFragment;
    }

    if (isIdentifierStart(parser.source.charCodeAt(parser.index))) {
        recordErrors(parser, Errors.Unexpected);
    }

    parser.tokenValue = parser.source.slice(index, parser.index);
    return isBigInt ? Token.BigIntLiteral : Token.NumericLiteral;
}

/**
 * Scans decimal digit or numeric separator
 *
 * @param parser Parser object
 * @param context Context masks
 */
function scanDecimalDigitsOrSeparator(parser: Parser): string {
    let { index } = parser;
    let allowSeparator = false;
    let isPreviousTokenSeparator = false;
    let result = '';
    const code = parser.source.charCodeAt(parser.index);
    while (code >= Chars.Zero && code <= Chars.Nine || code === Chars.Underscore) {
        if (code === Chars.Underscore) {
            if (allowSeparator) {
                allowSeparator = false;
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
        allowSeparator = true;
        isPreviousTokenSeparator = false;
        parser.index++;
        parser.column++;
    }

    if (parser.source.charCodeAt(parser.index - 1) === Chars.Underscore) {
        recordErrors(parser, Errors.ContinuousNumericSeparator);
    }
    return result + parser.source.substring(index, parser.index);
}

function scanOctalDigits(parser: Parser, context: Context): void {}

function scanHexDigits(parser: Parser, context: Context): void {}

function scanBinaryDigits(parser: Parser, context: Context): void {}
