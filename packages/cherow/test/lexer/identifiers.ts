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

  pass("scans '𪘀'", {
      source: "f𪘀",
      "value": "f𪘀",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 3,
  });



  pass("scans '_፩፪፫፬፭፮፯፰፱'", {
      source: "_፩፪፫፬፭፮፯፰፱",
      "value": "_፩፪፫፬፭፮፯፰፱",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 10, // TODO! Should be 10
  });

  pass("scans '℘'", {
      source: "a℘",
      "value": "a℘",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 2,
  });

  pass("scans 'abc℘'", {
      source: "abc℘",
      "value": "abc℘",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 4,
  });

  pass("scans 'a𐊧'", {
      source: "a𐊧",
      "value": "a𐊧",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 3,
  });
  pass("scans 'a℘'", {
      source: "a℘",
      "value": "a℘",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 2,
  });

  pass("scans 'a℮'", {
      source: "a℮",
      "value": "a℮",
      raw: "'abc'",
      token: Token.Identifier,
      line: 1,
      column: 2,
  });


  pass("scans 'foo'", {
      source: "foo",
      value: "foo",
      raw: "''",
      line: 1,
      column: 3,
  });

  // Ignore bar - proves that the ASCII char table works
  /*pass("scans 'foo'", {
      source: "foo bar",
      value: "foo",
      raw: "''",
      line: 1,
      column: 3,
  });*/

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

  pass("scans 'foo🀒'", {
    source: "foo🀒",
    value: "foo🀒",
    raw: "''",
    line: 1,
    column: 5,
});

pass("scans 'foo𞸀'", {
  source: "foo𞸀",
  value: "foo𞸀",
  raw: "''",
  line: 1,
  column: 5,
});

pass("scans '_𞸃'", {
  source: "_𞸃",
  value: "_𞸃",
  raw: "''",
  line: 1,
  column: 3,
});

pass("scans 'a℮'", {
  source: "a℮",
  "value": "a℮",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans 'a፭'", {
  source: "a፭",
  "value": "a፭",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans 'a፭'", {
  source: "a፭",
  "value": "a፭",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans 'a፰'", {
  source: "a፰",
  "value": "a፰",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans 'a℘'", {
  source: "a℘",
  "value": "a℘",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans 'a᧚'", {
  source: "a᧚",
  "value": "a᧚",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans 'a·'", {
  source: "a·",
  "value": "a·",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans '$$'", {
  source: "$$",
  "value": "$$",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans '__'", {
  source: "__",
  "value": "__",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans '_I'", {
  source: "_I",
  "value": "_I",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans 'O7'", {
  source: "O7",
  "value": "O7",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans 'wX'", {
  source: "wX",
  "value": "wX",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans '$4'", {
  source: "$4",
  "value": "$4",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});

pass("scans '$_'", {
  source: "$_",
  "value": "$_",
  raw: "'abc'",
  token: Token.Identifier,
  line: 1,
  column: 2,
});


pass("scans '\\u{10401}'", {
  source: "\\u{10401}",
  value: "𐐁",
  raw: "'case'",
  token: Token.Identifier,
  line: 1,
  column: 9,
});
/*
pass("scans '\\u{000000000000000000070}bc'", {
  source: "\\u{000000000000000000070}bc",
  "value": "pbc",
  raw: "",
  token: Token.Identifier,
  line: 1,
  column: 27,
});*/


pass("scans '_\\u{1EE03}'", {
  source: "_\\u{1EE03}",
  "value": "_𞸃",
  raw: "'var'",
  token: Token.Identifier,
  line: 1,
  column: 10,
});

pass("scans '\\u{1EE0A}\\u{1EE0B}'", {
  source: "\\u{1EE0A}\\u{1EE0B}",
  value: "𞸊𞸋",
  raw: "'var'",
  token: Token.Identifier,
  line: 1,
  column: 18,
});

pass("scans '\\u{1EE06}_$'", {
  source: "\\u{1EE06}_$",
  value: "𞸆_$",
  raw: "'var'",
  token: Token.Identifier,
  line: 1,
  column: 11,
});

pass("scans '\\u{1EE00}'", {
  source: "\\u{1EE00}",
  value: "𞸀",
  raw: "'var'",
  token: Token.Identifier,
  line: 1,
  column: 9,
});

pass("scans '_\\u{1EE03}'", {
  source: "_\\u{1EE03}",
  value: "_𞸃",
  raw: "'var'",
  token: Token.Identifier,
  line: 1,
  column: 10,
});

});
