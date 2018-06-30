import { Token } from '../token';
import { Flags } from '../common';
import { Chars } from '../chars';
import { State } from '../types';
import { consume } from './common';

export const enum CommentType {
  Single,
  Multi,
  HTMLOpen,
  HTMLClose
}

export const CommentTypes = [
  'SingleLineComment',
  'MultiLineComment',
  'HTMLCommentOpen',
  'HTMLCommentClose',
]

// 11.4 Comments

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
      switch (state.source.charCodeAt(state.index)) {
          case Chars.CarriageReturn:
              lastIsCR = 2;
          case Chars.LineFeed:
          case Chars.LineSeparator:
          case Chars.ParagraphSeparator:
              if (!--lastIsCR) state.line++;
              state.flags |= Flags.LineTerminator;
              state.index++;
              state.column = 0;
              state.line++;
              break;
          default:
              if (lastIsCR) {
                  state.line++;
                  lastIsCR = 0;
              }
              state.column++;
              state.index++;
      }
  }

  if (state.onComment) {
      state.commentEnd = state.index;
      state.commentType = type;
  }
  return Token.WhiteSpace;
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

 // report(state, Errors.UnterminatedComment);
}
