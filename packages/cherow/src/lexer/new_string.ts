import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context } from '../utilities';
import { peekUnicodeEscape, scanHexNumber } from './identifier';
import { fromCodePoint } from './common';

const enum Recovery {
    Empty = -1,
    StrictOctal = -2,
    EightOrNine = -3,
    InvalidHex = -4,
    OutOfRange = -5,
    Unterminated = -6,
}

export function scanString(parser: Parser, context: Context, first: number): Token {
    const quote = parser.source.charCodeAt(parser.index);
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
                        const code = scanEscapeSequence(parser, context, ch);
                        if (code >= 0) {
                            result += fromCodePoint(code);
                            start = parser.index;
                            ch = parser.source.charCodeAt(parser.index);
                        } else {
                            return handleStringError(parser, code as Escape);
                        }
                    }
                    break;
                }

            case quote:
                result += parser.source.slice(start, parser.index);
                parser.index++;  parser.column++; // consume the quote
                if (context & Context.OptionsRaw) parser.source.slice(start, parser.index);
                parser.tokenValue = result;
                return Token.StringLiteral;

            case Chars.LineSeparator:
            case Chars.ParagraphSeparator:
            case Chars.CarriageReturn:
            case Chars.LineFeed:
                // falls through
            default:
                parser.index++;  parser.column++;
        }
    }

    return handleStringError(parser, Recovery.Unterminated);
}

function scanEscapeSequence(parser: Parser, context: Context, first: number): number {

    switch (first) {
        case Chars.LowerB:
            return Chars.Backspace;
        case Chars.LowerF:
            return Chars.FormFeed;
        case Chars.LowerR:
            return Chars.CarriageReturn;
        case Chars.LowerN:
            return Chars.LineFeed;
        case Chars.LowerT:
            return Chars.Tab;
        case Chars.LowerV:
            return Chars.VerticalTab;
        case Chars.LowerU:
            {
                parser.index++;
                parser.column++;
                // '\u{DDDDDDDD}'
                return peekUnicodeEscape(parser, context);
            }

        case Chars.LowerX:
            parser.index++;  parser.column++;
            return scanHexNumber(parser, 2);

        case Chars.Zero: // Fall through.
        case Chars.One: // fall through
        case Chars.Two: // fall through
        case Chars.Three: // fall through
           {
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
                    index++; column++;

                    if (index < parser.source.length) {
                        const next = parser.source.charCodeAt(index);

                        if (next >= Chars.Zero && next <= Chars.Seven) {
                            code = (code << 3) | (next - Chars.Zero);
                            index++; column++;
                        }
                    }

                    parser.index = index - 1;
                    parser.column = column - 1;
                }
            }

            return code;
        }
        case Chars.Four: // fall through
        case Chars.Five: // fall through
        case Chars.Six: // fall through
        case Chars.Seven: {
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
        }
        case Chars.CarriageReturn:
            {
                const { index } = parser;
                if (index < parser.source.length) {
                    const ch = parser.source.charCodeAt(index);
                    if (ch === Chars.LineFeed) {
                        parser.index = index + 1;
                    }
                }
            }
            // falls through
        case Chars.LineFeed:
        case Chars.LineSeparator:
        case Chars.ParagraphSeparator:
            parser.column = -1;
            parser.line++;
            return Recovery.Empty;
        default:
            parser.index++; parser.column++;
            return parser.source.charCodeAt(parser.index);
    }
}

function handleStringError(parser: Parser, code: Recovery): Token {
    // We have to keep going, so advance
    parser.index++; parser.column++;
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