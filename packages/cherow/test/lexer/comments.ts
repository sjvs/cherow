import * as t from 'assert';
import { nextToken } from '../../src/lexer/scan';
import { State } from '../../src/state';
import { Context } from '../../src/common';
import { Token } from '../../src/token';

// https://github.com/tc39/test262/tree/master/test/language/comments

describe('Lexer - Comments', () => {

  function pass(name: string, opts: any) {
      it(name, () => {
          const state = new State(opts.source, undefined, undefined);
          const token = nextToken(state, Context.Empty);
          t.deepEqual({
              index: state.index,
              line: state.line,
              column: state.column,
          }, {
              line: opts.line,
              index: opts.index,
              column: opts.column
          }, );
      });
  }

  function fail(name: string, context: Context, opts: any): any {
    it(name, () => {
        const state = new State(opts.source, undefined, undefined);
        t.throws(() => {
            nextToken(state, context)
        });
    });
}

fail('should fail "/* "', Context.Empty, {
  source: '/* '
})

fail('should fail on HTML open comment in module code', Context.Module, {
  source: '--> foo'
})

fail('should fail on HTML open comment in module code', Context.Module, {
  source: '<!-- foo'
})

pass('should skip a simple single line comment', {
  source: `// `,
  line: 1, column: 3, index: 3
});

pass('should skip a single line comment with new line', {
  source: `// foo\n`,
  line: 2, column: 0, index: 7
});

pass('should skip slash in a comment', {
  source: `// /`,
  line: 1, column: 4, index: 4
});

pass('should skip single line comment with malformed escape', {
  source: `//\\unope \\u{nope} \\xno `,
  line: 1, column: 23, index: 23
});

pass('should skip single line comment with multi line paragrap', {
  source: `// \u2028\u2028`,
  line: 3, column: 0, index: 5
});

pass('should skip single line comment with multi line paragrap', {
  source: `/* \u2028\u2029 */`,
  line: 2, column: 3, index: 8
});

pass('should skip single line comment with line feed', {
  source: `// \r`,
  line: 2, column: 0, index: 4
});

pass('should skip single line with newline and line feed', {
  source: `// \r\n`,
  line: 4, column: 0, index: 5
});

// Esprima issue -  #1828
pass('should skip mix of comments', {
  source: `ident /* multiline
  comment */ -->`,
  line: 1, column: 6, index: 6
});

pass('should handle slash in a comment', {
  source: `// */`,
  line: 1, column: 5, index: 5
});

pass('should skip multiline comment with multiple newline', {
  source: `/* \n\n\n */`,
  line: 2, column: 3, index: 9
});

pass('single line comment escaped newlines are ignored', {
  source: `//\\n \\r \\x0a \\u000a still comment`,
  line: 1, column: 33, index: 33
});

/*
    pass('should handle correct interpretation of single line comments', {
        source: `//FOO
        ///`,
        line: 2, column: 11, index: 17
    });*/

    pass('should handle correct interpretation of single line comments', {
      source: `/* var
      //x
      */`,
      line: 3, column: 8, index: 25
    });

    pass('should insert Single line comment into Multi line comment', {
        source: `/* var
        //x
        */`,
        line: 3, column: 10, index: 29
    });

    pass('should handle fist multi line comment, then Single line comment', {
        source: `/*CHECK#1*/
        /* var
        *///x*/`,
        line: 3, column: 15, index: 42
    });

    pass('single and Multi line comments are used together', {
      source: `// var /* x */`,
      line: 1, column: 14, index: 14
  });

  pass('multi line comment can contain FORM FEED (U+000C)', {
    source: `/*\\u000C multi line \\u000C comment \\u000C*/`,
    line: 1, column: 43, index: 43
  });

  pass('multi line comment can contain SPACE (U+0020)', {
    source: `/*\\u0020 multi line \\u0020 comment \\u0020*/`,
    line: 1, column: 43, index: 43
  });

  pass('multi line comment can contain NO-BREAK SPACE (U+00A0)', {
    source: `/*\\u00A0 multi line \\u00A0 comment \\u00A0*/`,
    line: 1, column: 43, index: 43
  });

  pass('multi line comment can contain NO-BREAK SPACE (U+00A0)', {
    source: `/*
    */-->the comment extends to these characters`,
    line: 2, column: 48, index: 51
  });

  pass('multi line comment can contain NO-BREAK SPACE (U+00A0)', {
    source: `/*
    optional
    MultiLineCommentChars */-->the comment extends to these characters`,
    line: 3, column: 70, index: 86
  });

  pass('optional SingleLineDelimitedCommentSequence', {
    source: `/*
    */ /* optional SingleLineDelimitedCommentSequence */-->the comment extends to these characters`,
    line: 2, column: 98, index: 101
  });

  pass('optional SingleLineDelimitedCommentSequence', {
    source: `-->the comment extends to these characters`,
    line: 1, column:  42, index: 42
  });

  pass('<!--the comment extends to these characters', {
    source: `<!--the comment extends to these characters`,
    line: 1, column:  43, index: 43
  });

  pass('optional SingleLineDelimitedCommentSequence', {
    source: `-->the comment extends to these characters`,
    line: 1, column:  42, index: 42
  });

  pass('multi line comment ignore escape', {
    source: '/* \\u{nope} \\unope \\xno */',
    line: 1, column:  26, index: 26
  });

  pass('ignores escaped newline', {
    source: '/* \\n \\r \\x0a \\u000a */',
    line: 1, column:  23, index: 23
  });

  pass('multi line comment ignore escape', {
    source: '/* \\u{nope} \\unope \\xno */',
    line: 1, column:  26, index: 26
  });

});
