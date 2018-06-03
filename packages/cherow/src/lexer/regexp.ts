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
      InvalidRegExp = -3,
      OutOfRange = -4,
      UnterminatedGroup = -5,
      NothingToRepeat = -6,
      UnterminatedRegExpLiteral = -7,
      TODO = -8,
  }

  function parseRegexBody(parser: Parser, context: Context, depth: number, type: number): Type {

      let MaybeQuantifier = false;

      while (parser.index != parser.length) {

          switch (parser.source.charCodeAt(parser.index++)) {

              // `^`, `.`, `$`
              case Chars.Caret:
              case Chars.Period:
              case Chars.Dollar:
                  MaybeQuantifier = true;
                  break;

                  // `|`
              case Chars.VerticalBar:
                  MaybeQuantifier = false;
                  break;

              // '/'
              case Chars.Slash:
                  if (depth) return recordRegExpErrors(Escape.UnterminatedGroup);
                  return type;

                  // Atom ::
                  //   \ AtomEscape
              case Chars.Backslash:
                  {
                    if (parser.index >= parser.length) return recordRegExpErrors(Escape.UnterminatedRegExpLiteral);

                    MaybeQuantifier = true;

                    let subType = Type.Valid;

                      switch (parser.source.charCodeAt(parser.index)) {

                          // 'b', 'B'
                          case Chars.LowerB:
                          case Chars.UpperB:
                              parser.index++;
                              MaybeQuantifier = false;
                              break;

                          // 'u'
                          case Chars.LowerU:
                              parser.index++;
                              subType = parseRegexUnicodeEscape(parser);
                              break;

                           // 'x', 'X'
                          case Chars.UpperX:
                          case Chars.LowerX: {
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
                          }

                          // 'c'
                          case Chars.LowerC: {
                              parser.index++;
                              if (parser.index >= parser.length) return recordRegExpErrors(Escape.TODO);
                              const next = parser.source.charCodeAt(parser.index);
                              if (isAZaz(next)) {
                                  parser.index++;
                                  subType = Type.Valid;
                                  break;
                              }
                              subType = recordRegExpErrors(Escape.TODO);
                              break;
                          }
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
                              subType = parseBackReferenceIndex(parser, parser.source.charCodeAt(parser.index));
                              break;
                          case Chars.CarriageReturn:
                          case Chars.LineFeed:
                          case Chars.ParagraphSeparator:
                          case Chars.LineSeparator:
                              parser.index++;
                              subType = recordRegExpErrors(Escape.TODO);
                              break;
                          default:
                              if (isValidUnicodeidcontinue(parser.source.charCodeAt(parser.index))) return recordRegExpErrors(Escape.TODO);
                              parser.index++;
                              subType = Type.MaybeUnicode;
                      }

                      type = getRegExpState(type, subType);
                      break;
                  }

                  // '('
              case Chars.LeftParen:
                  {
                      if (parser.index >= parser.length) return recordRegExpErrors(Escape.TODO);

                      if (consumeOpt(parser, Chars.QuestionMark)) {

                          if (parser.index >= parser.length) return recordRegExpErrors(Escape.TODO);

                          switch (parser.source.charCodeAt(parser.index)) {

                              // ':', '=', '?'
                              case Chars.Colon:
                              case Chars.EqualSign:
                              case Chars.Exclamation:
                                  parser.index++;
                                  // non capturing group
                                  if (parser.index >= parser.length) return recordRegExpErrors(Escape.TODO);

                                  break;
                              default:
                                  type = recordRegExpErrors(Escape.TODO);
                          }
                      } else {
                          ++parser.capturingParens;
                      }

                      const subType = parseRegexBody(parser, context, depth + 1, Type.Valid);
                      MaybeQuantifier = true;
                      type = getRegExpState(type, subType);
                      break;
                  }

                  // `)`
              case Chars.RightParen:
                  if (depth > 0) return type;
                  type = recordRegExpErrors(Escape.UnterminatedGroup);
                  MaybeQuantifier = true;
                  break;

                  // '['
              case Chars.LeftBracket:
                  const subType = parseRegexCharClass(parser);
                  type = getRegExpState(type, subType);
                  MaybeQuantifier = true;
                  break;

                  // ']'
              case Chars.RightBracket:
                  type = recordRegExpErrors(Escape.TODO);
                  MaybeQuantifier = true;
                  break;

                  // '*', '+', '?'
              case Chars.Asterisk:
              case Chars.Plus:
              case Chars.QuestionMark:
                  if (MaybeQuantifier) {
                      MaybeQuantifier = false;
                      if (parser.index < parser.length) {
                          if (parser.source.charCodeAt(parser.index) == Chars.QuestionMark) {
                              parser.index++;
                          }
                      }
                  } else {
                      type = recordRegExpErrors(Escape.NothingToRepeat);
                  }
                  break;

                  // '{'
              case Chars.LeftBrace:

                  if (MaybeQuantifier) {
                      if (!parseIntervalQuantifier(parser)) {
                          type = recordRegExpErrors(Escape.NothingToRepeat);
                      }
                      if (parser.index < parser.length && parser.source.charCodeAt(parser.index) == Chars.QuestionMark) {
                          parser.index++;
                      }
                      MaybeQuantifier = false;
                  } else {
                      type = recordRegExpErrors(Escape.NothingToRepeat);
                  }
                  break;

                  // '}'
              case Chars.RightBrace:
                  type = recordRegExpErrors(Escape.NothingToRepeat);
                  MaybeQuantifier = false;
                  break;

                  // `LineTerminator`
              case Chars.CarriageReturn:
              case Chars.LineFeed:
              case Chars.ParagraphSeparator:
              case Chars.LineSeparator:
                  return recordRegExpErrors(Escape.InvalidRegExp);
              default:
              MaybeQuantifier = true;
          }
      }

      // Invalid regular expression
      return recordRegExpErrors(Escape.InvalidRegExp);
  }
