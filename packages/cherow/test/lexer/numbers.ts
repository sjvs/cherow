import * as t from 'assert';
import { nextToken } from '../../src/lexer/scan';
import { State } from '../../src/state';
import { Context } from '../../src/common';
import { Token,  } from '../../src/token';

describe('Lexer - Numbers', () => {

  describe("Pass", () => {

    function pass(name: string, opts: any): any {
      function test(name: string, context: Context): any {
        it(name, () => {
          if (opts.strict !== true) {
            const parser = new State(opts.source, undefined, undefined);

            t.deepEqual({
              token: nextToken(parser, context),
              value: parser.tokenValue,
              line: parser.line,
          //    raw: parser.tokenRaw,
              column: parser.column,
            }, {
                token: opts.token,
                value: opts.value,
                line: opts.line,
            //    raw: opts.raw,
                column: opts.column,
              });
          }
        });
      }
      test(`${name}`, Context.OptionsRaw);
    }
      function fail(name: string, context: Context, opts: any): any {
        it(name, () => {
          const parser = new State(opts.source, undefined, undefined);
          t.throws(() => {
            nextToken(parser, context)
          });
        });
    }

    fail('should fail "1eTYU+1"', Context.Empty, {
      source: '1eTYU+1'
    })

    fail('Binary-integer-literal-like sequence containing an invalid digit', Context.Empty, {
      source: '00444n'
    })


    pass("scans '7890", {
      source: "7890",
      value: 7890,
      "raw": "7890",
      token: Token.NumericLiteral,
      line: 1,
      column: 4,
    });

    pass("scans '2.3", {
      source: "2.3",
      value: 2.3,
      raw: "2.3",
      token: Token.NumericLiteral,
      line: 1,
      column: 3,
    });

    pass("scans '1234567890.0987654321", {
      source: "1234567890.0987654321",
      value: 1234567890.0987654321,
      raw: "1234567890.0987654321",
      token: Token.NumericLiteral,
      line: 1,
      column: 21,
    });

    pass("scans '32e32", {
      source: "32e32",
      raw: "32e32",
      "value": 3.2e+33,
      token: Token.NumericLiteral,
      line: 1,
      column: 5,
    });
    pass("scans '1E-100", {
      source: "1E-100",
      value: 1e-100,
      raw: "1E-100",
      token: Token.NumericLiteral,
      line: 1,
      column: 6,
    });

    pass("scans '.1e+100", {
      source: ".1e+100",
      value: 1e+99,
      raw: ".1e+100",
      token: Token.NumericLiteral,
      line: 1,
      column: 7,
    });

    pass("scans '0.1E+100", {
      source: "0.1E+100",
      value: 1e+99,
      raw: "0.1E+100",
      token: Token.NumericLiteral,
      line: 1,
      column: 8,
    });
  });

});
