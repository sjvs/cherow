import * as t from 'assert';
import { pass } from '../../test-utils';
import { Context } from '../../../src/common';

describe('Statements - While', () => {

        // Note: This will only parse in editor mode
       pass('while (foo) function () {}', Context.OptionsEditorMode, {
            source: 'while (foo) function () {}',
            expected: {
                  "body": [
                   {
                      "body": {
                        "async": false,
                        "body": {
                          "body": [],
                          "type": "BlockStatement",
                       },
                        "expression": false,
                        "generator": false,
                        "id": null,
                        "params": [],
                        "type": "FunctionDeclaration"
                      },
                      "test": {
                        "name": "foo",
                        "type": "Identifier",
                      },
                      "type": "WhileStatement"
                   },
                  ],
                  "sourceType": "script",
                  "type": "Program"
                }
       });

       pass('while (foo) bar;', Context.Empty, {
        source: 'while (foo) bar;',
        expected: {
            "type": "Program",
            "sourceType": "script",
            "body": [
                {
                    "type": "WhileStatement",
                    "test": {
                        "type": "Identifier",
                        "name": "foo"
                    },
                    "body": {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "Identifier",
                            "name": "bar"
                        }
                    }
                }
            ]
        }
       });
});
