import * as t from 'assert';
import { tokenize } from '../../src/tokenizer';

const valids = [
  {
    in: 'let foo = bar',
    out: [
      {
          "type": "Keyword",
          "value": "let",
      },
      {
          "type": "Identifier",
          "value": "foo",
      },
      {
          "type": "Punctuator",
          "value": "=",
      },
      {
          "type": "Identifier",
          "value": "bar",
      },
    ]
  },
];


describe('tokenize - valids', () => {
  valids.map(test => {
    console.log(tokenize(test.in));
    t.deepEqual(tokenize(test.in), test.out);
  })
});
