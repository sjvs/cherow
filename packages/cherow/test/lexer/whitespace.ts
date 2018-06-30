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

  pass('should skip narrow no break space', {
    source: ' \u202F       ',
    line: 1, column: 9,
  });

  pass('should skip multiline comments with line separator', {
    source: `  \t /* foo * /* bar \u2028 */  `,
    line: 2, column: 5,
  });

  pass('should skip multiline comments with line feed', {
    source: `  \t /* foo * /* bar \n */  `,
    line: 2, column: 5,
  });

  pass('should skip multiline comments with line feed', {
    source: `  \t /* foo * /* bar \r */  `,
    line: 2, column: 5,
  });

  pass('should skip multiline comments with line feed', {
    source: `  \t /* foo bar\r *//* baz*/ \r /**/`,
    line: 3, column: 5,
  });

  pass('should skip single line comments with form feed', {
    source: '//\u000C single line \u000C comment \u000C',
    line: 1, column: 27,
});

pass('should skip multiline comment with horizontal tab', {
    source: '/*	multi\tline\tcomment*/',
    line: 1, column: 23,
});

pass('should skip multiline comment with space', {
    source: '/*\u0020 multi line \u0020 comment \u0020*/',
    line: 1, column: 28,
});

pass('should skip multiline comment with no break space', {
    source: '/*\u00A0 multi line \u00A0 comment \u00A0*/',
    line: 1, column: 28,
});

pass('should skip multiline comment with no mathematical space', {
  source: '/*\u00A0 multi line \0x205F comment \0x205F*/',
  line: 1, column: 38,
});

pass('should skip block HTML close with chars w/o line terminator', {
  source: "  \t /**/  --> the comment doesn't extend to these characters\n ",
  line: 1, column: 12,
});

pass("avoids single HTML close comment w/o line terminator", {
  source: "  \t -->  ",
  line: 1, column: 6,
});

pass("avoids single HTML close comment w/o line terminator", {
  source: `  \t /*\toptional\tMultiLineCommentChars \t*/  --> ` +
  `the comment extends to these characters\t `,
  line: 1, column: 45,
});

pass('should skip HTML single line comments with line feed', {
  source: `  \t <!-- foo bar\n  `,
  line: 3, column: 2,
});

pass('should skip line separators', {
  source: '    \t \u2028 ',
  line: 2, column: 1,
});

pass('should skip multiline comments with nothing', {
    source: '  \t /* foo * /* bar */  ',
    line: 1, column: 24,
});

});
