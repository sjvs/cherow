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

function scanOctalDigits(parser: Parser, context: Context): void {}

function scanHexDigits(parser: Parser, context: Context): void {}

function scanBinaryDigits(parser: Parser, context: Context): void {}
