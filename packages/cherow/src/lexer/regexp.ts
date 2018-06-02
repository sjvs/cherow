import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context, Flags } from '../common';
import { isDecimalDigit, isSurrogateLead, isSurrogateTail, getSurrogate, toHex, isHex } from './common';
import { Errors, recordErrors } from '../errors';
import { isValidIdentifierPart } from '../unicode';

/**
 * Verify regular expression pattern
 *
 * @param parser Parser object
 * @param next Code point
 * @param depth Level
 * @param type RegExp state
 */
export function readTerm(
    parser: Parser,
    next: number,
    depth: number,
    type: Type,
    atom: boolean = false
): Type {

    loop:
        while (parser.index !== parser.length) {

            switch (next) {

                // `^`, `.`, `$`
                case Chars.Caret:
                case Chars.Period:
                case Chars.Dollar:
                    parser.index++;
                    atom = true;
                    break;

                    // `\`
                case Chars.Slash:
                    // Err: "Unterminated group"
                    if (depth !== 0) return Type.Invalid;
                    parser.index++;
                    return type;

                    // `|`
                case Chars.VerticalBar:
                    parser.index++;
                    atom = false;
                    break;

                    // Atom ::
                    //   \ AtomEscape
                case Chars.Backslash:
                    parser.index++;
                    atom = true;
                    // Pattern may not end with a trailing backslash
                    if (parser.index >= parser.length) return Type.Invalid; // \\ at end of pattern
                    next = parser.source.charCodeAt(parser.index);
                    switch (next) {
                        case Chars.LowerB:
                        case Chars.UpperB:
                            parser.index++;
                            atom = false;
                            break;
                        default:
                            let subType = parseRegexAtomEscape(parser, next);
                            // TODO
                    }

                    break;

                    // `(`
                case Chars.LeftParen:
                    parser.index++;
                    atom = false; // useless. just in case

                    if (parser.index >= parser.length) {
                        type = Type.Invalid;
                        break;
                    }

                    next = parser.source.charCodeAt(parser.index);

                    if (next === Chars.QuestionMark) {
                        parser.index++;
                        parser.column++;
                        switch (parser.source.charCodeAt(parser.index)) {
                            case Chars.Colon:
                            case Chars.EqualSign:
                            case Chars.Exclamation:
                                {
                                    parser.index++;
                                    if (parser.index >= parser.length) {
                                        type = Type.Invalid;
                                        break loop;
                                    }
                                    next = parser.source.charCodeAt(parser.index);
                                    break;
                                }
                            default:
                                type = Type.Invalid;
                        }
                    } else {
                        ++parser.capturingParens;
                    }

                    let subType = readTerm(parser, next, depth + 1, Type.Valid, atom);
                    // TODO
                    break;

                    // `)`
                case Chars.RightParen:
                    parser.index++;
                    if (depth > 0) return type; // invalid group
                    type = Type.Invalid;
                    atom = true;
                    break;

                    // `[`
                case Chars.LeftBracket:
                    let subType = parseCharacterClass(parser);
                    // TODO
                    atom = true;
                    break;

                    // `]`
                case Chars.RightBracket:
                    parser.index++;
                    atom = true;
                    break;

                    // `?`, `*`, `+`
                case Chars.Asterisk:
                case Chars.Plus:
                case Chars.QuestionMark:
                    parser.index++;
                    if (atom) {
                        atom = false;
                        if (parser.index < parser.length) {
                            if (parser.source.charCodeAt(parser.index) === Chars.QuestionMark) {
                                parser.index++;
                            }
                        }
                    } else {
                        type = Type.Invalid; // Nothing to repeat
                    }
                    break;

                    // `{`
                case Chars.LeftBrace:

                    parser.index++;

                    if (atom) {
                        if (!parseIntervalQuantifier(parser)) type = Type.Invalid;
                        if (parser.index < parser.length) {
                            if (parser.source.charCodeAt(parser.index) === Chars.QuestionMark) {

                                parser.index++;
                            }
                        }
                        atom = false;
                    } else {
                        type = Type.Invalid;
                    }
                    break;

                    // `}`
                case Chars.RightBrace:
                    parser.index++;
                    type = Type.Invalid;
                    atom = false;
                    break;

                    // `LineTerminator`
                case Chars.CarriageReturn:
                case Chars.LineFeed:
                case Chars.ParagraphSeparator:
                case Chars.LineSeparator:
                    return Type.Invalid;

                default:
                    parser.index++;
                    atom = true;
            }

            next = parser.source.charCodeAt(parser.index);
        }

    return Type.Invalid;
}
