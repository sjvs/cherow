import * as t from 'assert';
import { nextToken } from '../../src/lexer/scan';
import { State } from '../../src/state';
import { Context } from '../../src/common';
import { Token } from '../../src/token';

describe('Lexer - Identifiers (chinese)', () => {

  function pass(name: string, opts: any) {
      function test(name: string, context: Context) {
          it(name, () => {
              if (opts.strict !== true) {
                  const parser = new State(opts.source, undefined, undefined);

                  t.deepEqual({
                      token: nextToken(parser, context),
                      value: parser.tokenValue,
                      line: parser.line,
                      column: parser.column,
                  }, {
                      token: Token.Identifier,
                      value: opts.value,
                      line: opts.line,
                      column: opts.column,
                  });
              }
          });
      }

      test(`${name}`, Context.Empty);
  }

  pass("scans '中国'", {
      source: "not中国",
      "value": "not中国",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 5,
  });

  pass("scans 'not角质'", {
      source: "not角质",
      "value": "not角质",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 5,
  });

  pass("scans 'not死'", {
      source: "not死",
      "value": "not死",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 4,
  });
});
