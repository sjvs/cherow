import { Token } from '../token';
import { Context, Flags } from '../common';
import { Chars } from '../chars';
import { State } from '../types';
import { consume } from './common';
import { Errors, report } from '../errors';

export const enum CommentType {
  Single,
  Multi,
  HTMLOpen,
  HTMLClose
}

export const CommentTypes = [
  'SingleLine',
  'MultiLine',
  'HTMLOpen',
  'HTMLClose',
]

// 11.4 Comments

/**
 * Skips single HTML comments. Same behavior as in V8.
 *
 * @param parser Parser Object
 * @param context Context masks.
 */
export function skipSingleHTMLComment(state: State, context: Context, type: CommentType): Token {
  if (context & Context.Module) report(state, Errors.HtmlCommentInModule);
  return skipSingleLineComment(state, type);
}

/**
 * Skips SingleLineComment, SingleLineHTMLCloseComment and SingleLineHTMLOpenComment
 *
 *  @see [Link](https://tc39.github.io/ecma262/#prod-SingleLineComment)
 *  @see [Link](https://tc39.github.io/ecma262/#prod-annexB-SingleLineHTMLOpenComment)
 *  @see [Link](https://tc39.github.io/ecma262/#prod-annexB-SingleLineHTMLCloseComment)
 *
 * @param state Parser object
 * @param returnToken Token to be returned
 */
export function skipSingleLineComment(state: State, type: any = CommentType.Single): Token {
  let lastIsCR = 0;
  if (state.onComment) state.commentStart = state.index;
  while (state.index < state.length) {
      const next = state.source.charCodeAt(state.index);
      if ((next & 8) === 8) {
          if ((next & 83) < 3 && (
                  next === Chars.LineFeed ||
                  next === Chars.CarriageReturn ||
                  next === Chars.LineSeparator ||
                  next === Chars.ParagraphSeparator)) {

              if (next === Chars.CarriageReturn) lastIsCR = 2;
              if (!--lastIsCR) state.line++;
              state.flags |= Flags.LineTerminator;
              state.index++;
              state.column = 0;
              state.line++;
          } else {
              if (lastIsCR) {
                  state.line++;
                  lastIsCR = 0;
              }
              state.index++;
              state.column++;
          }

      } else {
          if (lastIsCR) {
              state.line++;
              lastIsCR = 0;
          }
          state.index++;
          state.column++;
      }
  }

  if (state.onComment) {
      state.commentEnd = state.index;
      state.commentType = type;
  }
  return Token.SingleComment;
}

/**
 * Skips multiline comment
 *
 * @see [Link](https://tc39.github.io/ecma262/#prod-annexB-MultiLineComment)
 *
 * @param state Parser object
 */
export function skipMultilineComment(state: State): any {
  let lastIsCR = 0;
  if (state.onComment) state.commentStart = state.index;
  while (state.index < state.length) {
      switch (state.source.charCodeAt(state.index)) {
          case Chars.Asterisk:
              state.index++;
              state.column++;
              if (consume(state, Chars.Slash)) {
                if (state.onComment) {
                  state.commentEnd = state.index - 2;
                  state.commentType = CommentType.Multi;
              }
                return Token.MultiComment;
              }
              break;
          case Chars.CarriageReturn:
              lastIsCR = 2;
          case Chars.LineFeed:
          case Chars.LineSeparator:
          case Chars.ParagraphSeparator:
              if (!--lastIsCR) state.line++;
              state.flags |= Flags.LineTerminator;
              state.index++;
              state.column = 0;
              break;
          default:
              if (lastIsCR) {
                  state.line++;
                  lastIsCR = 0;
              }
              state.index++;
              state.column++;
      }
  }

  report(state, Errors.UnterminatedComment);
}
