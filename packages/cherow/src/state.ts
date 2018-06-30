import { Token } from './token';
import { Flags } from './common';
import { OnComment, OnToken } from './types';
import { CommentType } from './lexer/comments';

export class State {
  public index: number;
  public column: number;
  public line: number;
  public startIndex: number;
  public source: string;
  public length: number;
  public nextChar: number;
  public flags: Flags;
  public token: Token;
  public tokenRaw: string;
  public onToken: OnToken;
  public onComment: OnComment;
  public commentState: number | undefined;
  public tokenValue: number | string;
  public commentStart: number;
  public commentEnd: number;
  public commentType: CommentType | void;

  constructor(source: string, onToken: OnToken | void, onComment: OnComment | void) {
      this.index = 0;
      this.column = 0;
      this.line = 1;
      this.startIndex = 0;
      this.source = source || '';
      this.length = source.length;
      this.flags = Flags.Empty;
      this.tokenValue = 0;
      this.nextChar = source.charCodeAt(0);
      this.token = Token.EndOfSource;
      this.tokenRaw = '';
      this.onToken = onToken;
      this.onComment = onComment;
      this.commentStart = 0;
      this.commentEnd = 0;
      this.commentType = undefined;
  }
}
