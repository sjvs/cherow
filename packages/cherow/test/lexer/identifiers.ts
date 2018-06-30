import * as t from 'assert';
import { nextToken } from '../../src/lexer/scan';
import { State } from '../../src/state';
import { Context } from '../../src/common';
import { Token } from '../../src/token';

describe('Lexer - Identifiers', () => {

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

      test(`${name} (normal, has next)`, Context.Empty);
  }

  pass("scans 'foo'", {
      source: "foo",
      value: "foo",
      raw: "''",
      line: 1,
      column: 3,
  });

  // Ignore bar - proves that the ASCII char table works
  pass("scans 'foo'", {
      source: "foo bar",
      value: "foo",
      raw: "''",
      line: 1,
      column: 3,
  });

  pass("scans '$Insane'", {
      source: "$Insane",
      value: "$Insane",
      raw: "''",
      line: 1,
      column: 7,
  });

  pass("scans '_foo'", {
      source: "_foo",
      value: "_foo",
      raw: "''",
      line: 1,
      column: 4,
  });

  pass("scans '_$_'", {
      source: "_$_",
      value: "_$_",
      raw: "''",
      line: 1,
      column: 3,
  });
});
