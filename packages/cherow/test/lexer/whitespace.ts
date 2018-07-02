import * as t from 'assert';
import { nextToken } from '../../src/lexer/scan';
import { State } from '../../src/state';
import { Context } from '../../src/common';
import { Token } from '../../src/token';

// https://github.com/tc39/test262/tree/master/test/language/white-space

describe('Lexer - Whitespace', () => {

    function pass(name: string, opts: any) {
        it(name, () => {
            const state = new State(opts.source, undefined, undefined);
            const found = nextToken(state, Context.Empty);
            t.deepEqual({
                line: state.line,
             //   token: found,
                column: state.column,
            }, {
                line: opts.line,
              //  token: Token.WhiteSpace,
                column: opts.column
            }, );
        });
    }

    pass('should skip nothing', {
      source: '',
      line: 1, column: 0,
    });

    pass('should skip tabs', {
      source: '\t\t\t\t\t\t\t\t',
      line: 1, column: 8,
    });

    pass('should skip vertical tabs', {
      source: '\v\v\v\v\v\v\v\v',
      line: 1, column: 8,
    });

    pass('should skip mixed whitespace', {
      source: '    \t \r\n \n\r \v\f\t ',
      line: 4, column: 5,
    });

    pass('should skip mixed whitespace', {
      source: '    \t \r\n \n\r \v\f\t ',
      line: 4, column: 5,
  });

  // pass('should skip narrow no break space', {
  //   source: ' \u202F       ',
    // line: 1, column: 9,
  // });



});
