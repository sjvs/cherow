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

        pass(`@defineElement('num-counter')`, Context.OptionsExperimental | Context.OptionsNext, {
            source: `@defineElement('num-counter')
            class Counter extends HTMLElement {
                @observed #x = 0;
                
                @bound
                #clicked() {
                    this.#x++;
                }

                constructor() {
                    super();
                    this.onclick = this.#clicked;
                  }
                
                  connectedCallback() { this.render(); }
                
                  @bound
                  render() {
                    this.textContent = this.#x.toString();
                  }
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
                                  "name": "observed",
                                 "type": "Identifier",
                                },
                                "type": "Decorator",
                              }
                            ],
                            "key": {
                              "name": "x",
                              "type": "PrivateName",
                            },
                            "static": false,
                            "type": "FieldDefinition",
                            "value": {
                              "type": "Literal",
                              "value": 0,
                            }
                          },
                          {
                            "computed": false,
                            "decorators": undefined,
                            "key": {
                              "name": "clicked",
                              "type": "PrivateName"
                            },
                            "kind": "method",
                            "static": false,
                            "type": "MethodDefinition",
                            "value": {
                              "async": false,
                              "body": {
                                "body": [
                                  {
                                    "expression": {
                                      "argument": {
                                        "computed": false,
                                        "object": {
                                          "type": "ThisExpression"
                                        },
                                        "property": {
                                          "name": "x",
                                          "type": "PrivateName",
                                        },
                                        "type": "MemberExpression",
                                      },
                                      "operator": "++",
                                      "prefix": false,
                                      "type": "UpdateExpression"
                                    },
                                    "type": "ExpressionStatement"
                                  }
                                ],
                                "type": "BlockStatement"
                              },
                              "expression": false,
                              "generator": false,
                              "id": null,
                              "params": [],
                              "type": "FunctionExpression"
                            }
                         },
                          {
                            "computed": false,
                           "decorators": [],
                            "key": {
                              "name": "constructor",
                              "type": "Identifier",
                            },
                            "kind": "constructor",
                            "static": false,
                            "type": "MethodDefinition",
                            "value": {
                              "async": false,
                              "body": {
                                "body": [
                                  {
                                    "expression": {
                                      "arguments": [],
                                      "callee": {
                                        "type": "Super",
                                      },
                                      "type": "CallExpression",
                                    },
                                    "type": "ExpressionStatement",
                                  },
                                  {
                                    "expression": {
                                      "left": {
                                        "computed": false,
                                        "object": {
                                          "type": "ThisExpression",
                                        },
                                       "property": {
                                          "name": "onclick",
                                          "type": "Identifier",
                                       },
                                        "type": "MemberExpression",
                                      },
                                      "operator": "=",
                                      "right": {
                                        "computed": false,
                                        "object": {
                                          "type": "ThisExpression"
                                        },
                                        "property": {
                                          "name": "clicked",
                                          "type": "PrivateName",
                                        },
                                        "type": "MemberExpression"
                                      },
                                      "type": "AssignmentExpression"
                                    },
                                    "type": "ExpressionStatement"
                                  }
                                ],
                                "type": "BlockStatement"
                              },
                              "expression": false,
                              "generator": false,
                              "id": null,
                              "params": [],
                              "type": "FunctionExpression"
                            }
                          },
                          {
                            "computed": false,
                            "decorators": [],
                            "key": {
                              "name": "connectedCallback",
                              "type": "Identifier"
                            },
                            "kind": "method",
                            "static": false,
                            "type": "MethodDefinition",
                            "value": {
                              "async": false,
                              "body": {
                                "body": [
                                  {
                                    "expression": {
                                      "arguments": [],
                                      "callee": {
                                        "computed": false,
                                        "object": {
                                          "type": "ThisExpression"
                                        },
                                        "property": {
                                          "name": "render",
                                          "type": "Identifier"
                                        },
                                        "type": "MemberExpression"
                                      },
                                      "type": "CallExpression"
                                    },
                                    "type": "ExpressionStatement"
                                  },
                                ],
                                "type": "BlockStatement"
                              },
                              "expression": false,
                              "generator": false,
                              "id": null,
                              "params": [],
                              "type": "FunctionExpression"
                            }
                          },
                          {
                            "computed": false,
                            "decorators": [
                              {
                                "expression": {
                                  "name": "bound",
                                  "type": "Identifier",
                                },
                                "type": "Decorator"
                              }
                            ],
                            "key": {
                              "name": "render",
                              "type": "Identifier",
                            },
                            "kind": "method",
                            "static": false,
                            "type": "MethodDefinition",
                           "value": {
                              "async": false,
                              "body": {
                                "body": [
                                  {
                                    "expression": {
                                      "left": {
                                        "computed": false,
                                        "object": {
                                          "type": "ThisExpression",
                                        },
                                        "property": {
                                          "name": "textContent",
                                          "type": "Identifier",
                                        },
                                        "type": "MemberExpression",
                                      },
                                      "operator": "=",
                                      "right": {
                                        "arguments": [],
                                        "callee": {
                                          "computed": false,
                                          "object": {
                                            "computed": false,
                                            "object": {
                                              "type": "ThisExpression"
                                            },
                                            "property": {
                                              "name": "x",
                                              "type": "PrivateName"
                                            },
                                            "type": "MemberExpression",
                                          },
                                          "property": {
                                            "name": "toString",
                                            "type": "Identifier",
                                          },
                                          "type": "MemberExpression"
                                        },
                                        "type": "CallExpression"
                                      },
                                      "type": "AssignmentExpression"
                                    },
                                    "type": "ExpressionStatement"
                                  },
                               ],
                                "type": "BlockStatement",
                              },
                              "expression": false,
                              "generator": false,
                              "id": null,
                              "params": [],
                              "type": "FunctionExpression",
                            }
                          }
                        ],
                        "type": "ClassBody",
                      },
                      "decorators": [
                        {
                          "expression": {
                            "arguments": [
                              {
                                "type": "Literal",
                                "value": "num-counter",
                              },
                            ],
                            "callee": {
                              "name": "defineElement",
                              "type": "Identifier",
                            },
                            "type": "CallExpression"
                          },
                          "type": "Decorator"
                        }
                      ],
                      "id": {
                        "name": "Counter",
                        "type": "Identifier",
                      },
                      "superClass": {
                        "name": "HTMLElement",
                        "type": "Identifier",
                      },
                      "type": "ClassDeclaration"
                   }
                  ],
                  "sourceType": "script",
                  "type": "Program"
                }
        });

        pass(`@defineElement('num-counter')`, Context.OptionsExperimental | Context.OptionsNext, {
            source: `@defineElement('num-counter')
            class Counter extends HTMLElement {
                @observed #x = 0;
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
                                  "name": "observed",
                                  "type": "Identifier",
                                },
                                "type": "Decorator",
                              },
                            ],
                           "key": {
                              "name": "x",
                              "type": "PrivateName",
                            },
                            "static": false,
                            "type": "FieldDefinition",
                           "value": {
                              "type": "Literal",
                              "value": 0,
                            }
                          }
                        ],
                        "type": "ClassBody"
                      },
                      "decorators": [
                        {
                          "expression": {
                            "arguments": [
                              {
                                "type": "Literal",
                                "value": "num-counter"
                              },
                            ],
                            "callee": {
                              "name": "defineElement",
                             "type": "Identifier",
                            },
                            "type": "CallExpression",
                          },
                          "type": "Decorator"
                        }
                      ],
                     "id": {
                        "name": "Counter",
                        "type": "Identifier",
                      },
                      "superClass": {
                        "name": "HTMLElement",
                        "type": "Identifier",
                      },
                      "type": "ClassDeclaration"
                    }
                  ],
                  "sourceType": "script",
                  "type": "Program"
                }
        });

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