import { Context, Flags } from '../common';
import { State } from '../types';
import { Token } from '../token';
import { Chars } from '../chars';
import { consume, mapToToken } from './common';
import { CommentType, skipSingleLineComment, skipMultilineComment } from './comments';
import { getTokenValue, convertTokenType } from './tokenizer';
import { scanStringLiteral } from './string';
import { scanTemplate } from './template';
import { scanIdentifier} from './identifier';
import { scanNumeric, parseLeadingZeroTable } from './numbers';
import { report, Errors } from '../errors';

const unexpectedCharacter: any = (state: State) => {
  report(state, Errors.Unexpected);
  return null;
};

const table = new Array(0xFFFF).fill(unexpectedCharacter, 0, 128) /*.fill(scanMaybeIdentifier, 128)*/ as((state: State, context: Context) => Token | null)[];

// `,`, `~`, `?`, `[`, `]`, `{`, `}`, `:`, `;`, `(` ,`)`, `"`, `'`
table[Chars.Comma] = mapToToken(Token.Comma);
table[Chars.Tilde] = mapToToken(Token.Complement);
table[Chars.QuestionMark] = mapToToken(Token.QuestionMark);
table[Chars.LeftBracket] = mapToToken(Token.LeftBracket);
table[Chars.RightBracket] = mapToToken(Token.RightBracket);
table[Chars.LeftBrace] = mapToToken(Token.LeftBrace);
table[Chars.RightBrace] = mapToToken(Token.RightBrace);
table[Chars.Colon] = mapToToken(Token.Colon);
table[Chars.Semicolon] = mapToToken(Token.Semicolon);
table[Chars.LeftParen] = mapToToken(Token.LeftParen);
table[Chars.RightParen] = mapToToken(Token.RightParen);

table[Chars.Space] =
  table[Chars.Tab] =
  table[Chars.FormFeed] =
  table[Chars.VerticalTab] =
  table[Chars.FormFeed] = state => {
      ++state.index;
      ++state.column;
      return Token.WhiteSpace;
  };

table[Chars.DoubleQuote] =
  table[Chars.SingleQuote] = scanStringLiteral;

table[Chars.LineSeparator] = state => {
  state.index++;
  state.column = 0;
  state.line++;
  state.flags |= Flags.LineTerminator;
  return Token.WhiteSpace;
};

table[Chars.LineFeed] = state => {
  state.index++;
  state.column = 0;
  state.line++;
  state.flags |= Flags.LineTerminator;
  return Token.WhiteSpace;
};
table[Chars.CarriageReturn] = state => {
  state.index++;
  state.column = 0;
  state.line++;
  state.flags |= Flags.LineTerminator;
  if (state.index < state.length &&
      state.source.charCodeAt(state.index) === Chars.LineFeed) {
      state.index++;
  }
  return Token.WhiteSpace;
};
// `=`, `==`, `===`, `=>`
table[Chars.EqualSign] = state => {
  state.index++;
  state.column++;
  const next = state.source.charCodeAt(state.index);
  if (next === Chars.EqualSign) {
      state.index++;
      state.column++;
      if (consume(state, Chars.EqualSign)) {
          return Token.StrictEqual;
      } else {
          return Token.LooseEqual;
      }
  } else if (next === Chars.GreaterThan) {
      state.index++;
      state.column++;
      return Token.Arrow;
  }
  return Token.Assign;
};

// `.`, `...`, `.123` (numeric literal)
table[Chars.Period] = (parser: State, context: Context) => {
  let index = parser.index + 1;
  const next = parser.source.charCodeAt(index);

  if (next === Chars.Period) {
      index++;
      if (index < parser.source.length &&
          parser.source.charCodeAt(index) === Chars.Period) {
          parser.index = index + 1;
          parser.column += 3;
          return Token.Ellipsis;
      }
  } else if (next >= Chars.Zero && next <= Chars.Nine) {
           return scanNumeric(parser, context, true);
  }
  parser.index++;
  parser.column++;
  return Token.Period;
};

// `<`, `<=`, `<<`, `<<=`, `</`,  <!--
table[Chars.LessThan] = (state: State, context: Context) => {
  state.index++;
  state.column++;
  if (state.index < state.source.length) {
      const next = state.source.charCodeAt(state.index);
      if (next === Chars.EqualSign) {
          state.index++;
          state.column++;
          return Token.LessThanOrEqual;
      } else if (next === Chars.LessThan) {
          state.index++;
          state.column++;
          if (consume(state, Chars.EqualSign)) return Token.ShiftLeftAssign;
          return Token.ShiftLeft;
      } else if (!(context & Context.Module) && consume(state, Chars.Exclamation) && consume(state, Chars.Hyphen) && consume(state, Chars.Hyphen)) {
          return skipSingleLineComment(state, CommentType.HTMLOpen);
      }
  }

  return Token.LessThan;
};

// `/`, `/=`, `/>`
table[Chars.Slash] = state => {
  state.index++;
  state.column++;
  if (state.index < state.length) {
      const next = state.source.charCodeAt(state.index);
      if (consume(state, Chars.Slash)) {
          return skipSingleLineComment(state);
      } else if (consume(state, Chars.Asterisk)) {
          return skipMultilineComment(state);
      } else if (next === Chars.EqualSign) {
          state.index++;
          state.column++;
          return Token.DivideAssign;
      }
  }
  return Token.Divide;
};

// `!`, `!=`, `!==`
table[Chars.Exclamation] = state => {
  state.index++;
  state.column++;
  if (!consume(state, Chars.EqualSign)) return Token.Negate;
  if (!consume(state, Chars.EqualSign)) return Token.LooseNotEqual;
  return Token.StrictNotEqual;
};

// `%`, `%=`
table[Chars.Percent] = state => {
  state.index++;
  state.column++;
  if (consume(state, Chars.EqualSign)) return Token.ModuloAssign;
  return Token.Modulo;
};

// `&`, `&&`, `&=`
table[Chars.Ampersand] = state => {
  state.index++;
  state.column++;
  if (state.index >= state.length) return Token.BitwiseAnd;
  const next = state.source.charCodeAt(state.index);
  if (next === Chars.Ampersand) {
      state.index++;
      state.column++;
      return Token.LogicalAnd;
  }
  if (next === Chars.EqualSign) {
      state.index++;
      state.column++;
      return Token.BitwiseAndAssign;
  }
  return Token.BitwiseAnd;
};

// `*`, `**`, `*=`, `**=`
table[Chars.Asterisk] = state => {
  state.index++;
  state.column++;
  if (state.index >= state.length) return Token.Multiply;
  const next = state.source.charCodeAt(state.index);
  if (next === Chars.EqualSign) {
      state.index++;
      state.column++;
      return Token.MultiplyAssign;
  }
  if (next !== Chars.Asterisk) return Token.Multiply;
  state.index++;
  state.column++;
  if (!consume(state, Chars.EqualSign)) return Token.Exponentiate;
  return Token.ExponentiateAssign;
};

// `+`, `++`, `+=`
table[Chars.Plus] = state => {
  state.index++;
  state.column++;
  if (state.index >= state.length) return Token.Add;

  const next = state.source.charCodeAt(state.index);
  if (next === Chars.Plus) {
      state.index++;
      state.column++;
      return Token.Increment;
  }

  if (next === Chars.EqualSign) {
      state.index++;
      state.column++;
      return Token.AddAssign;
  }

  return Token.Add;
};

// `-`, `--`, `-=`
table[Chars.Hyphen] = (state: State, context: Context) => {
  state.index++;
  state.column++;
  if (state.index < state.source.length) {
      const next = state.source.charCodeAt(state.index);
      if (next === Chars.Hyphen) {
          state.index++;
          state.column++;
          if (!(context & Context.Module) && state.flags & Flags.LineTerminator || state.startIndex === 0 &&
              consume(state, Chars.GreaterThan)) {
              return skipSingleLineComment(state, CommentType.HTMLClose);
          }
          return Token.Decrement;
      } else if (next === Chars.EqualSign) {
          state.index++;
          state.column++;
          return Token.SubtractAssign;
      }
  }

  return Token.Subtract;
};

// `^`, `^=`
table[Chars.Caret] = state => {
  state.index++;
  state.column++;
  if (consume(state, Chars.EqualSign)) return Token.BitwiseXorAssign;
  return Token.BitwiseXor;
};

// `|`, `||`, `|=`
table[Chars.VerticalBar] = state => {
  state.index++;
  state.column++;
  if (state.index < state.length) {
      const next = state.source.charCodeAt(state.index);
      if (next === Chars.VerticalBar) {
          state.index++;
          state.column++;
          return Token.LogicalOr;
      }
      if (next === Chars.EqualSign) {
          state.index++;
          state.column++;
          return Token.BitwiseOrAssign;
      }
  }
  return Token.BitwiseOr;
};

// `>`, `>=`, `>>`, `>>>`, `>>=`, `>>>=`
table[Chars.GreaterThan] = state => {
  state.index++;
  state.column++;
  if (state.index >= state.length) return Token.GreaterThan;
  let next = state.source.charCodeAt(state.index);

  if (next === Chars.EqualSign) {
      state.index++;
      state.column++;
      return Token.GreaterThanOrEqual;
  }

  if (next !== Chars.GreaterThan) return Token.GreaterThan;
  state.index++;
  state.column++;

  if (state.index < state.length) {
      next = state.source.charCodeAt(state.index);

      if (next === Chars.GreaterThan) {
          state.index++;
          state.column++;
          if (consume(state, Chars.EqualSign)) {
              return Token.LogicalShiftRightAssign;
          } else {
              return Token.LogicalShiftRight;
          }
      } else if (next === Chars.EqualSign) {
          state.index++;
          state.column++;
          return Token.ShiftRightAssign;
      }
  }
  return Token.ShiftRight;
};

table[Chars.Backtick] = (state: State, context: Context) => {
  return scanTemplate(state, context, state.nextChar);
};

table[Chars.Zero] = (state: State, context: Context) =>  (parseLeadingZeroTable[state.source.charCodeAt(state.index + 1)] || scanNumeric)(state, context);

// `1`...`9`
 for (let i = Chars.One; i <= Chars.Nine; i++) {
 table[i] = (state: State, context: Context) => scanNumeric(state, context);
 }

// `A`...`Z`
for (let i = Chars.UpperA; i <= Chars.UpperZ; i++) {
  table[i] = scanIdentifier;
}
// `a`...z`
for (let i = Chars.LowerA; i <= Chars.LowerZ; i++) {
  table[i] = scanIdentifier;
}
// `\\u{N}var` , `$foo`, `_var`
table[Chars.Backslash] = table[Chars.Dollar] = table[Chars.Underscore] = scanIdentifier;

table[Chars.Backslash] = (state: State) => {
  return scanIdentifier(state);
};

export function nextToken(state: State, context: Context): Token {
  const onToken = state.onToken;
  while (state.index < state.length) {
      state.startIndex = state.index;
      const first = state.source.charCodeAt(state.index);
      const token: any = table[first](state, context);
      if ((token & Token.WhiteSpace) === Token.WhiteSpace) continue;
      if (onToken) {
          onToken(convertTokenType(token), getTokenValue(state, token));
      }
      return state.token = token;
  }
  return Token.EndOfSource;
}
