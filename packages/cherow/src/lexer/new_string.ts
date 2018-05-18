import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context } from '../utilities';
import { peekUnicodeEscape, scanHexNumber } from './identifier';
import { nextUnicodeChar, fromCodePoint } from './common';

const enum Recovery {
    Empty = -1,
        StrictOctal = -2,
        EightOrNine = -3,
        InvalidHex = -4,
        OutOfRange = -5,
        Unterminated = -6,
}
/**
 * Scan string literal
 *
 * @export
 * @param parser Parser object
 * @param context Context masks
 * @param first code point
  */

export function scanString(parser: Parser, context: Context, quote: number): Token {
    parser.index++; parser.column++;
    let result = '';
    let { index: start } = parser;
    let ch = parser.source.charCodeAt(parser.index);

    while (parser.index < parser.source.length) {
        ch = parser.source.charCodeAt(parser.index);
        switch (ch) {
            case Chars.Backslash:
                {
                    result += parser.source.slice(start, parser.index);
                    parser.index++; parser.column++;
                    ch = parser.source.charCodeAt(parser.index);
                    if (ch >= 128) {
                        result += fromCodePoint(ch);
                    } else {
                        const code = table[ch](parser, context, ch);
                        if (code >= 0) {
                            result += fromCodePoint(code);
                            start = parser.index;
                            ch = parser.source.charCodeAt(parser.index);
                        } else {
                            return handleRecoveryErrors(parser, code as Recovery);
                        }
                    }
                    break;
                }

            case quote:
                result += parser.source.slice(start, parser.index);
                parser.index++;
                parser.column++; // consume the quote
                if (context & Context.OptionsRaw) parser.source.slice(start, parser.index);
                parser.tokenValue = result;
                return Token.StringLiteral;

            case Chars.LineSeparator:
            case Chars.ParagraphSeparator:
            case Chars.CarriageReturn:
            case Chars.LineFeed:
                // falls through
            default:
                parser.index++;
                parser.column++;
        }
    }

    return handleRecoveryErrors(parser, Recovery.Unterminated);
}

/**
 * Handles recovery errors.
 *
 * @param parser Object
 * @param code Errors code
 */
function handleRecoveryErrors(parser: Parser, code: Recovery): Token {
    // We have to keep going, so advance
    parser.index++;
    parser.column++;
    // TODO: Record errors for this cases
    switch (code) {
        case Recovery.Unterminated:
        case Recovery.StrictOctal:
        case Recovery.EightOrNine:
        case Recovery.InvalidHex:
        case Recovery.OutOfRange:
        default:
    }

    return Token.Illegal;
}

export const table = new Array<(parser: Parser, context: Context, first: number) => number> (128).fill(nextUnicodeChar);

table[Chars.LowerB] = () => Chars.Backspace;
table[Chars.LowerF] = () => Chars.FormFeed;
table[Chars.LowerR] = () => Chars.CarriageReturn;
table[Chars.LowerN] = () => Chars.LineFeed;
table[Chars.LowerT] = () => Chars.Tab;
table[Chars.LowerV] = () => Chars.VerticalTab;

table[Chars.CarriageReturn] = (parser: Parser) => {
    parser.column = -1;
    parser.line++;

    const { index } = parser;

    if (index < parser.source.length) {
        const ch = parser.source.charCodeAt(index);

        if (ch === Chars.LineFeed) {
            parser.index = index + 1;
        }
    }

    return Recovery.Empty;
};

table[Chars.LineFeed] =
    table[Chars.LineSeparator] =
    table[Chars.ParagraphSeparator] = (parser: Parser) => {
        parser.column = -1;
        parser.line++;
        return Recovery.Empty;
    };

table[Chars.Zero] =
    table[Chars.One] =
    table[Chars.Two] =
    table[Chars.Three] = (parser, context, first) => {
        let code = first - Chars.Zero;
        let index = parser.index + 1;
        let column = parser.column + 1;

        if (index < parser.source.length) {
            const next = parser.source.charCodeAt(index);

            if (next < Chars.Zero || next > Chars.Seven) {
                // Verify that it's `\0` if we're in strict mode.
                if (code !== 0 && context & Context.Strict) return Recovery.StrictOctal;
            } else if (context & Context.Strict) {
                // This happens in cases like `\00` in strict mode.
                return Recovery.StrictOctal;
            } else {
                code = (code << 3) | (next - Chars.Zero);
                index++;
                column++;

                if (index < parser.source.length) {
                    const next = parser.source.charCodeAt(index);

                    if (next >= Chars.Zero && next <= Chars.Seven) {
                        code = (code << 3) | (next - Chars.Zero);
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

table[Chars.Four] =
    table[Chars.Five] =
    table[Chars.Six] =
    table[Chars.Seven] = (parser, context, first) => {
        if (context & Context.Strict) return Recovery.StrictOctal;
        let code = first - Chars.Zero;
        const index = parser.index + 1;
        const column = parser.column + 1;

        if (index < parser.source.length) {
            const next = parser.source.charCodeAt(index);

            if (next >= Chars.Zero && next <= Chars.Seven) {
                code = (code << 3) | (next - Chars.Zero);
                parser.index = index;
                parser.column = column;
            }
        }

        return code;
    };

// `8`, `9` (invalid escapes)
table[Chars.Eight] = table[Chars.Nine] = () => Recovery.EightOrNine;

table[Chars.LowerU] = (parser, context, prev) => {
    parser.index++; parser.column++;
    // '\u{DDDDDDDD}'
    return peekUnicodeEscape(parser, context);
};

table[Chars.LowerX] = (parser, context, first) => {
    parser.index++; parser.column++;
    return scanHexNumber(parser, 2);
};
