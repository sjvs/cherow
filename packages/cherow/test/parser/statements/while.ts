import * as t from 'assert';
import { pass } from '../../test-utils';
import { Context } from '../../../src/common';

describe('Statements - While', () => {

       pass('while (foo) function () {};', Context.Empty, {
            source: 'while (foo) function () {};',
            expected: {
                  "body": [
                    {
                      "body": {
                        "expression": {
                          "async": false,
                          "body": {
                            "body": [],
                            "type": "BlockStatement",
                          },
                          "expression": false,
                          "generator": false,
                          "id": null,
                          "params": [],
                          "type": "FunctionExpression",
                        },
                        "type": "ExpressionStatement",
                      },
                      "test": {
                        "name": "foo",
                        "type": "Identifier",
                      },
                      "type": "WhileStatement",
                    },
                 ],
                  "sourceType": "script",
                  "type": "Program"
                }
       });
});
