import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context } from '../utilities';
import { nextUnicodeChar, consumeOpt } from './common';
import { Errors, recordErrors } from './errors';

export function scanNumeric(parser: Parser, context: Context, first: number): Token {
    const { index } = parser;

    scanDigits(parser);

    if (consumeOpt(parser, Chars.Period)) {
        scanDigits(parser);
    }

    let end = parser.index;
    let next = parser.source.charCodeAt(parser.index);

    if (consumeOpt(parser, Chars.UpperE) || consumeOpt(parser, Chars.LowerE)) {
        next = parser.source.charCodeAt(parser.index);
        if (next === Chars.Plus || next === Chars.Hyphen) {
            parser.index++;
            parser.column++;
            next = parser.source.charCodeAt(parser.index);
        }

        if (next >= Chars.Zero && next <= Chars.Nine) {
            parser.index++; parser.column++;
            scanDigits(parser);
            end = parser.index;
        } else {
            recordErrors(parser, Errors.UnterminatedString);
            return Token.Illegal;
        }
    }

    parser.tokenValue = parser.source.slice(index, parser.index);
    return Token.NumericLiteral;
}

function scanDigits(parser: Parser): void {
    let code = parser.source.charCodeAt(parser.index);
    while (code >= Chars.Zero && code <= Chars.Nine) {
        parser.index++;
        parser.column++;
        code = parser.source.charCodeAt(parser.index);
    }
}

function scanOctalDigits(parser: Parser, context: Context): void {}

function scanHexDigits(parser: Parser, context: Context): void {}

function scanBinaryDigits(parser: Parser, context: Context): void {}
