import * as t from 'assert';
import { nextToken } from '../../src/lexer/scan';
import { State } from '../../src/state';
import { Context } from '../../src/common';
import { Token } from '../../src/token';

describe("Lexer - OnToken", () => {

  function pass(name: string, opts: any) {
      it(name, () => {
          const tokens: any[] = [];
          const state = new State(opts.source, (type: any, value: any) => { tokens.push({ type,  value }); }, undefined, );

          // Get the first token in the stream
          nextToken(state, Context.Empty);
          // Get the rest of the tokens
          while (nextToken(state, Context.Empty) !== Token.EndOfSource) {}

          t.deepEqual({
              tokens,
              line: state.line,
              column: state.column,
          }, {
              tokens: opts.value,
              line: opts.line,
              column: opts.column
          }, );
      });
  }

  pass('should tokenize string literal correctly', {
    source: '"String literal tokenizing works!"',
    value: [{
        type: 'String',
        "value": "\"String literal tokenizing works!\""
    }],
    line: 1,
    column: 34,
});
/*
  pass('should tokenize numbers correctly', {
      source: '123',
      value: [{
          type: 'Numeric',
          value: '123'
      }],
      line: 1,
      column: 3,
  });

  pass('should tokenize numbers and punctuators correctly', {
      source: '(123)',
      value: [{
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Numeric',
              value: '123'
          },
          {
              type: 'Punctuator',
              value: ')'
          }
      ],
      line: 1,
      column: 5,
  });

  pass('should tokenize numbers and identifiers correctly', {
      source: 'abc 123 def',
      value: [{
              type: 'Identifier',
              value: 'abc'
          },
          {
              type: 'Numeric',
              value: '123'
          },
          {
              type: 'Identifier',
              value: 'def'
          }
      ],
      line: 1,
      column: 11,
  });

  pass('should tokenize identifiers correctly', {
      source: 'Cherow tokenizing works + identifiers',
      value: [{
              type: 'Identifier',
              value: 'Cherow'
          },
          {
              type: 'Identifier',
              value: 'tokenizing'
          },
          {
              type: 'Identifier',
              value: 'works'
          },
          {
              type: "Punctuator",
              value: "+"
          },
          {
              type: 'Identifier',
              value: 'identifiers'
          }
      ],
      line: 1,
      column: 37,
  });
  pass('should tokenize parenthesis and identifiers correctly', {
      source: '(Cherow) tokenizer and punctuators have become best friends!!',
      value: [{
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Identifier',
              value: 'Cherow'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Identifier',
              value: 'tokenizer'
          },
          {
              type: 'Identifier',
              value: 'and'
          },
          {
              type: 'Identifier',
              value: 'punctuators'
          },
          {
              type: 'Identifier',
              value: 'have'
          },
          {
              type: 'Identifier',
              value: 'become'
          },
          {
              type: 'Identifier',
              value: 'best'
          },
          {
              type: 'Identifier',
              value: 'friends'
          },
          {
              type: 'Punctuator',
              value: '!'
          },
          {
              type: 'Punctuator',
              value: '!'
          }
      ],
      line: 1,
      column: 61,
  });*/

  pass('should tokenize mix of punctuators', {
      source: '!(&/%)/)(&{}',
      value: [{
              type: 'Punctuator',
              value: '!'
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '&'
          },
          {
              type: 'Punctuator',
              value: '/'
          },
          {
              type: 'Punctuator',
              value: '%'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: '/'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '&'
          },
          {
              type: 'Punctuator',
              value: '{'
          },
          {
              type: 'Punctuator',
              value: '}'
          }
      ],
      line: 1,
      column: 12,
  });

  pass('should tokenize arrow', {
      source: '() => {}',
      value: [{
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: '=>'
          },
          {
              type: 'Punctuator',
              value: '{'
          },
          {
              type: 'Punctuator',
              value: '}'
          }
      ],
      line: 1,
      column: 8,
  });

  pass('should tokenize two parenthesis', {
      source: '()',
      value: [{
          type: 'Punctuator',
          value: '('
      }, {
          type: 'Punctuator',
          value: ')'
      }],
      line: 1,
      column: 2,
  });

  pass('should tokenize multiple parenthesis', {
      source: '(((((((())))))))',
      value: [{
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: '('
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: ')'
          },
          {
              type: 'Punctuator',
              value: ')'
          }
      ],
      line: 1,
      column: 16,
  });
});
