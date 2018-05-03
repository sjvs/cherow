import { pass, fail } from '../../test-utils';
import { Context } from '../../../src/utilities';
import * as t from 'assert';
import { parse } from '../../../src/parser/parser';

describe('Experimental - Decorators', () => {

    describe('Failure', () => {

        fail(`@decorate`, Context.OptionsExperimental, {
            source: `@decorate`,
        });

        fail(`@decorate`, Context.OptionsExperimental, {
            source: `@decorate`,
        });
    });

    describe('Pass', () => {

        pass(`class Foo {
            @d1 method1(){};
          }`, Context.OptionsExperimental, {
            source: `class Foo {
                @d1 method1(){};
              }`,
            expected: {
                  "body": [
                    {
                      "body": {
                        "body": [
                          {
                            "computed": false,
                            "decorators": [
                              {
                                "expression": {
                                  "name": "d1",
                                  "type": "Identifier",
                                },
                                "type": "Decorator",
                              },
                            ],
                           "key": {
                              "name": "method1",
                              "type": "Identifier",
                            },
                            "kind": "method",
                            "static": false,
                            "type": "MethodDefinition",
                            "value": {
                              "async": false,
                              "body": {
                                "body": [],
                                "type": "BlockStatement",
                              },
                              "expression": false,
                              "generator": false,
                              "id": null,
                              "params": [],
                              "type": "FunctionExpression"
                            }
                          }
                        ],
                        "type": "ClassBody",
                      },
                      "decorators": [],
                      "id": {
                        "name": "Foo",
                        "type": "Identifier",
                     },
                      "superClass": null,
                      "type": "ClassDeclaration",
                    },
                  ],
                  "sourceType": "script",
                  "type": "Program"
                }
        });
        
        pass(`@deco1 @deco2() @deco3(foo, bar) @deco4({foo, bar}) class Foo {}`, Context.OptionsExperimental, {
            source: `@deco1 @deco2() @deco3(foo, bar) @deco4({foo, bar}) class Foo {}`,
            expected: {
                  "body": [
                    {
                      "body": {
                        "body": [],
                        "type": "ClassBody"
                      },
                     "decorators": [
                        {
                          "expression": {
                            "name": "deco1",
                            "type": "Identifier"
                          },
                          "type": "Decorator",
                        },
                        {
                          "expression": {
                            "arguments": [],
                            "callee": {
                              "name": "deco2",
                              "type": "Identifier"
                            },
                            "type": "CallExpression"
                          },
                          "type": "Decorator"
                        },
                        {
                          "expression": {
                            "arguments": [
                              {
                                "name": "foo",
                                "type": "Identifier"
                              },
                              {
                                "name": "bar",
                                "type": "Identifier"
                              },
                           ],
                            "callee": {
                             "name": "deco3",
                              "type": "Identifier",
                           },
                            "type": "CallExpression",
                          },
                          "type": "Decorator"
                        },
                        {
                          "expression": {
                            "arguments": [
                              {
                                "properties": [
                                  {
                                   "computed": false,
                                    "key": {
                                      "name": "foo",
                                      "type": "Identifier"
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": true,
                                    "type": "Property",
                                    "value": {
                                      "name": "foo",
                                      "type": "Identifier"
                                    }
                                  },
                                  {
                                    "computed": false,
                                    "key": {
                                      "name": "bar",
                                      "type": "Identifier"
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": true,
                                    "type": "Property",
                                    "value": {
                                      "name": "bar",
                                      "type": "Identifier"
                                    }
                                  }
                                ],
                                "type": "ObjectExpression"
                              }
                            ],
                            "callee": {
                              "name": "deco4",
                              "type": "Identifier"
                           },
                            "type": "CallExpression"
                         },
                          "type": "Decorator"
                        }
                      ],
                      "id": {
                        "name": "Foo",
                        "type": "Identifier",
                      },
                      "superClass": null,
                      "type": "ClassDeclaration"
                    }
                  ],
                  "sourceType": "script",
                  "type": "Program"
                }
        });
       

        pass(`@decorate
        class Foo {}`, Context.OptionsExperimental, {
            source: `@decorate
            class Foo {}`,
            expected: {
                  "body": [
                    {
                      "body": {
                        "body": [],
                        "type": "ClassBody"
                      },
                      "decorators": [
                        {
                          "expression": {
                            "name": "decorate",
                            "type": "Identifier",
                          },
                          "type": "Decorator"
                       },
                      ],
                      "id": {
                        "name": "Foo",
                        "type": "Identifier",
                     },
                      "superClass": null,
                      "type": "ClassDeclaration"
                    },
                  ],
                  "sourceType": "script",
                  "type": "Program"
                }
        });
    });
});