import { State } from '../state';

import { Token, KeywordDescTable } from '../token';
import { Context } from '../../src/common';
import { nextToken } from '../../src/lexer/scan';
import { Options } from '../types';

export function tokenize(source: string, opts: Options= {}) {
  const state = new State(source, opts.onToken, opts.onComment);
  const tokens = [];
  let token;

  while (token !== Token.EndOfSource) {
    token = nextToken(state, Context.Empty);
    const t = {
      type: convertTokenType(token),
      value: getTokenValue(state, token),
      // TODO: loc...
    };
    tokens.push(t);
  }

  return tokens;
}

// TODO! Optimize and refactor this!

export function getTokenValue(state: State, t: Token) {

  if (t & Token.Punctuator) return KeywordDescTable[t & Token.Type];

  return state.source.slice(state.startIndex, state.index);

}

export function convertTokenType(t: Token): string {

  if (t & Token.Identifier) return 'Identifier';

  if (t & Token.Punctuator) return 'Punctuator';

  if (t & Token.NumericLiteral) return 'Numeric';

  if ((t & Token.StringLiteral) === Token.StringLiteral) return 'String';

  if (t & Token.RegularExpression) return 'Regular Expression';

  if (t & Token.Template) return 'Template';

  if (t & (Token.Reserved | Token.FutureReserved)) return 'Keyword';

  return 'Boolean'; // true / false

}
