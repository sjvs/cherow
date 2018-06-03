import { Parser } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { Context, Flags } from '../common';
import { Errors, recordErrors } from '../errors';
import { isValidIdentifierPart } from '../unicode';
import { isHex, consumeOpt } from './common';

    // Intentionally negative
    const enum Escape {
        Empty = -1,
            Unclosed = -2,
            Invalid = -3,
            OutOfRange = -4,
            TODO = -5,
    }

    const enum InternalState {
        Empty = 0,
        MaybeQuantifier = 1 << 0,
        HasError = 1 << 1, // Editor mode *only*
    }

    function parseRegexBody(
        parser: Parser,
        context: Context,
        next: number,
        depth: number,
        type: number,
        state = InternalState.Empty
    ) {

        while (parser.index != parser.length) {

            switch (parser.source.charCodeAt(parser.index++)) {

                // `^`, `.`, `$`
                case Chars.Caret:
                case Chars.Period:
                case Chars.Dollar:
                    state = state | InternalState.MaybeQuantifier;
                    break;

                    // `|`
                case Chars.VerticalBar:
                    state = state & ~InternalState.MaybeQuantifier;
                    break;

                case Chars.Slash:
                    if (depth !== 0) return recordRegExpErrors(Escape.Unclosed);
                    return type;

                    // Atom ::
                    //   \ AtomEscape
                case Chars.Backslash:
                    {
                        state = state | InternalState.MaybeQuantifier;
                        let subType = Type.Valid;
                        if (parser.index >= parser.length) return recordRegExpErrors(Escape.Invalid);
                        next = parser.source.charCodeAt(parser.index);
                        switch (next) {
                            case Chars.LowerB:
                            case Chars.UpperB:
                                parser.index++;
                                state = state & ~InternalState.MaybeQuantifier;
                                break;
                            case Chars.LowerU:
                                parser.index++;
                                subType = parseRegexUnicodeEscape(parser);
                                break;

                                // hex
                            case Chars.UpperX:
                            case Chars.LowerX:
                                parser.index++;

                                if (parser.index >= parser.length) {
                                    subType = recordRegExpErrors(Escape.TODO);
                                } else if (!isHex(parser.source.charCodeAt(parser.index))) {
                                    subType = recordRegExpErrors(Escape.TODO);
                                } else {
                                    parser.index++;
                                    if (parser.index >= parser.length) {
                                        subType = recordRegExpErrors(Escape.TODO);
                                    }

                                    if (!isHex(parser.source.charCodeAt(parser.index))) {
                                        subType = recordRegExpErrors(Escape.TODO);
                                        break;
                                    }
                                    parser.index++;
                                }
                                break;

                            case Chars.LowerC:
                                parser.index++;
                                if (parser.index >= parser.length) return recordRegExpErrors(Escape.TODO);
                                next = parser.source.charCodeAt(parser.index);
                                if (isAZaz(next)) {
                                    parser.index++;
                                    subType = Type.Valid;
                                    break;
                                }
                                subType = recordRegExpErrors(Escape.TODO);
                                break;

                                // ControlEscape :: one of
                                //   f n r t v
                            case Chars.LowerF:
                            case Chars.LowerN:
                            case Chars.LowerR:
                            case Chars.LowerT:
                            case Chars.LowerV:

                                // AtomEscape ::
                                //   CharacterClassEscape
                                //
                                // CharacterClassEscape :: one of
                                //   d D s S w W
                            case Chars.UpperD:
                            case Chars.LowerD:
                            case Chars.UpperS:
                            case Chars.LowerS:
                            case Chars.UpperW:
                            case Chars.LowerW:
                            case Chars.Caret:
                            case Chars.Dollar:
                            case Chars.Backslash:
                            case Chars.Period:
                            case Chars.Asterisk:
                            case Chars.Plus:
                            case Chars.QuestionMark:
                            case Chars.LeftParen:
                            case Chars.RightParen:
                            case Chars.LeftBracket:
                            case Chars.RightBracket:
                            case Chars.LeftBrace:
                            case Chars.RightBrace:
                            case Chars.VerticalBar:
                            case Chars.Slash:
                                parser.index++;
                                break;

                                // '0'
                            case Chars.Zero:
                                parser.index++;
                                if (isDecimalDigit(parser.source.charCodeAt(parser.index))) return recordRegExpErrors(Escape.TODO);
                                break;

                                // '1' - '9'
                            case Chars.One:
                            case Chars.Two:
                            case Chars.Three:
                            case Chars.Four:
                            case Chars.Five:
                            case Chars.Six:
                            case Chars.Seven:
                            case Chars.Eight:
                            case Chars.Nine:
                                subType = parseBackReferenceIndex(parser, next);
                                break;
                            case Chars.CarriageReturn:
                            case Chars.LineFeed:
                            case Chars.ParagraphSeparator:
                            case Chars.LineSeparator:
                                parser.index++;
                                subType = recordRegExpErrors(Escape.TODO); // regex has no line continuation
                                break;
                            default:
                                if (isIdentRestChr(next)) return recordRegExpErrors(Escape.TODO);
                                parser.index++;
                                subType = Type.GoodSansUFlag;
                        }

                        type = getRegExpState(type, subType);
                        break;
                    }

                    // '('
                case Chars.LeftParen:
                    {
                        if (parser.index >= parser.length) return recordRegExpErrors(Escape.TODO);
                        next = parser.source.charCodeAt(parser.index);

                        if (consumeOpt(parser, Chars.QuestionMark)) {
                            if (parser.index >= parser.length) return recordRegExpErrors(Escape.TODO);
                            next = parser.source.charCodeAt(parser.index);
                            switch (parser.source.charCodeAt(parser.index)) {
                                case Chars.Colon:
                                case Chars.EqualSign:
                                case Chars.Exclamation:
                                    parser.index++;
                                    if (parser.index >= parser.length) return recordRegExpErrors(Escape.TODO);
                                    next = parser.source.charCodeAt(parser.index);
                                    break;
                                default:
                                    type = recordRegExpErrors(Escape.TODO);
                            }
                        } else {
                            ++parser.capturingParens;
                        }

                        const subType = parseRegexBody(parser, context, next, depth + 1, Type.Valid);
                        state = state | InternalState.MaybeQuantifier;
                        type = getRegExpState(type, subType);
                        break;
                    }

                    // `)`
                case Chars.RightParen:
                    if (depth > 0) return type;
                    type = recordRegExpErrors(Escape.TODO); // invalid group
                    state = state | InternalState.MaybeQuantifier;
                    break;

                    // '['
                case Chars.LeftBracket:
                    const subType = parseRegexCharClass(parser);
                    type = getRegExpState(type, subType);
                    state = state | InternalState.MaybeQuantifier;
                    break;

                    // ']'
                case Chars.RightBracket:
                    type = recordRegExpErrors(Escape.TODO);
                    state = state | InternalState.MaybeQuantifier;
                    break;

                    // '*', '+', '?'
                case Chars.Asterisk:
                case Chars.Plus:
                case Chars.QuestionMark:
                    // doesnt matter to us which quantifier we find here

                    if ((state & InternalState.MaybeQuantifier) === InternalState.MaybeQuantifier) {
                        state = state & ~InternalState.MaybeQuantifier;
                        if (parser.index < parser.length) {
                            if (parser.source.charCodeAt(parser.index) == Chars.QuestionMark) {
                                parser.index++;
                            }
                        }
                    } else {
                        type = recordRegExpErrors(Escape.TODO);
                    }
                    break;

                    // '{'
                case Chars.LeftBrace:

                    if ((state & InternalState.MaybeQuantifier) === InternalState.MaybeQuantifier) {
                        if (!parseIntervalQuantifier(parser)) {
                            type = recordRegExpErrors(Escape.TODO);
                        }
                        if (parser.index < parser.length && parser.source.charCodeAt(parser.index) == Chars.QuestionMark) {
                            parser.index++;
                        }
                        state = state & ~InternalState.MaybeQuantifier;
                    } else {
                        type = recordRegExpErrors(Escape.TODO);
                    }
                    break;

                    // '}'
                case Chars.RightBrace:

                    type = recordRegExpErrors(Escape.TODO);
                    state = state & ~InternalState.MaybeQuantifier;
                    break;

                    // `LineTerminator`
                case Chars.CarriageReturn:
                case Chars.LineFeed:
                case Chars.ParagraphSeparator:
                case Chars.LineSeparator:
                    return recordRegExpErrors(Escape.TODO);
                default:
                    state = state | InternalState.MaybeQuantifier;
            }
        }

        // Invalid regular expression
        return recordRegExpErrors(Escape.Invalid);
    }
