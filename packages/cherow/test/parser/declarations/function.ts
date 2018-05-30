import * as t from 'assert';
import { pass } from '../../test-utils';
import { Context } from '../../../src/common';

describe('Miscellaneous - Function', () => {

    describe('Pass', () => {

        pass('function f(){}', Context.OptionsNext, {
            source: `function f(){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('{{{ function g() {} }}}', Context.OptionsNext, {
            source: `{{{ function g() {} }}}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "BlockStatement",
                        "body": [
                            {
                                "type": "BlockStatement",
                                "body": [
                                    {
                                        "type": "BlockStatement",
                                        "body": [
                                            {
                                                "type": "FunctionDeclaration",
                                                "params": [],
                                                "body": {
                                                    "type": "BlockStatement",
                                                    "body": []
                                                },
                                                "async": false,
                                                "generator": false,
                                                "expression": false,
                                                "id": {
                                                    "type": "Identifier",
                                                    "name": "g"
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        pass('if (x) { function g() {} }', Context.OptionsNext, {
            source: `if (x) { function g() {} }`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "IfStatement",
                        "test": {
                            "type": "Identifier",
                            "name": "x"
                        },
                        "consequent": {
                            "type": "BlockStatement",
                            "body": [
                                {
                                    "type": "FunctionDeclaration",
                                    "params": [],
                                    "body": {
                                        "type": "BlockStatement",
                                        "body": []
                                    },
                                    "async": false,
                                    "generator": false,
                                    "expression": false,
                                    "id": {
                                        "type": "Identifier",
                                        "name": "g"
                                    }
                                }
                            ]
                        },
                        "alternate": null
                    }
                ]
            }
        });

        pass('function f(a,b){}', Context.OptionsNext, {
            source: `function f(a,b){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "Identifier",
                                "name": "a"
                            },
                            {
                                "type": "Identifier",
                                "name": "b"
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f(a=b=c){}', Context.OptionsNext, {
            source: `function f(a=b=c){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "Identifier",
                                    "name": "a"
                                },
                                "right": {
                                    "type": "AssignmentExpression",
                                    "left": {
                                        "type": "Identifier",
                                        "name": "b"
                                    },
                                    "operator": "=",
                                    "right": {
                                        "type": "Identifier",
                                        "name": "c"
                                    }
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f([] = x){}', Context.OptionsNext, {
            source: `function f([] = x){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ArrayPattern",
                                    "elements": []
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f([foo], [foo]){}', Context.OptionsNext, {
            source: `function f([foo], [foo]){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "ArrayPattern",
                                "elements": [
                                    {
                                        "type": "Identifier",
                                        "name": "foo"
                                    }
                                ]
                            },
                            {
                                "type": "ArrayPattern",
                                "elements": [
                                    {
                                        "type": "Identifier",
                                        "name": "foo"
                                    }
                                ]
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f([x, ...[a, b]] = obj){}', Context.OptionsNext, {
            source: `function f([x, ...[a, b]] = obj){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ArrayPattern",
                                    "elements": [
                                        {
                                            "type": "Identifier",
                                            "name": "x"
                                        },
                                        {
                                            "type": "RestElement",
                                            "argument": {
                                                "type": "ArrayPattern",
                                                "elements": [
                                                    {
                                                        "type": "Identifier",
                                                        "name": "a"
                                                    },
                                                    {
                                                        "type": "Identifier",
                                                        "name": "b"
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "obj"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f({foo=a,bar} = x){}', Context.OptionsNext, {
            source: `function f({foo=a,bar} = x){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ObjectPattern",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "kind": "init",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "foo"
                                            },
                                            "computed": false,
                                            "value": {
                                                "type": "AssignmentPattern",
                                                "left": {
                                                    "type": "Identifier",
                                                    "name": "foo"
                                                },
                                                "right": {
                                                    "type": "Identifier",
                                                    "name": "a"
                                                }
                                            },
                                            "method": false,
                                            "shorthand": true
                                        },
                                        {
                                            "type": "Property",
                                            "kind": "init",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "bar"
                                            },
                                            "computed": false,
                                            "value": {
                                                "type": "Identifier",
                                                "name": "bar"
                                            },
                                            "method": false,
                                            "shorthand": true
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f({foo:a,bar:b} = x){}', Context.OptionsNext, {
            source: `function f({foo:a,bar:b} = x){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ObjectPattern",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "kind": "init",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "foo"
                                            },
                                            "computed": false,
                                            "value": {
                                                "type": "Identifier",
                                                "name": "a"
                                            },
                                            "method": false,
                                            "shorthand": false
                                        },
                                        {
                                            "type": "Property",
                                            "kind": "init",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "bar"
                                            },
                                            "computed": false,
                                            "value": {
                                                "type": "Identifier",
                                                "name": "b"
                                            },
                                            "method": false,
                                            "shorthand": false
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f({foo=a,bar} = x){}', Context.OptionsNext, {
            source: `function f({foo=a,bar} = x){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ObjectPattern",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "kind": "init",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "foo"
                                            },
                                            "computed": false,
                                            "value": {
                                                "type": "AssignmentPattern",
                                                "left": {
                                                    "type": "Identifier",
                                                    "name": "foo"
                                                },
                                                "right": {
                                                    "type": "Identifier",
                                                    "name": "a"
                                                }
                                            },
                                            "method": false,
                                            "shorthand": true
                                        },
                                        {
                                            "type": "Property",
                                            "kind": "init",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "bar"
                                            },
                                            "computed": false,
                                            "value": {
                                                "type": "Identifier",
                                                "name": "bar"
                                            },
                                            "method": false,
                                            "shorthand": true
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f({foo} = x, {foo} = y){}', Context.OptionsNext, {
            source: `function f({foo} = x, {foo} = y){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ObjectPattern",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "kind": "init",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "foo"
                                            },
                                            "computed": false,
                                            "value": {
                                                "type": "Identifier",
                                                "name": "foo"
                                            },
                                            "method": false,
                                            "shorthand": true
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            },
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ObjectPattern",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "kind": "init",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "foo"
                                            },
                                            "computed": false,
                                            "value": {
                                                "type": "Identifier",
                                                "name": "foo"
                                            },
                                            "method": false,
                                            "shorthand": true
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "y"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f([,foo] = x){}', Context.OptionsNext, {
            source: `function f([,foo] = x){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ArrayPattern",
                                    "elements": [
                                        null,
                                        {
                                            "type": "Identifier",
                                            "name": "foo"
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f([foo=a] = c){}', Context.OptionsNext, {
            source: `function f([foo=a] = c){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ArrayPattern",
                                    "elements": [
                                        {
                                            "type": "AssignmentPattern",
                                            "left": {
                                                "type": "Identifier",
                                                "name": "foo"
                                            },
                                            "right": {
                                                "type": "Identifier",
                                                "name": "a"
                                            }
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "c"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f([] = x){}', Context.OptionsNext, {
            source: `function f([] = x){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ArrayPattern",
                                    "elements": []
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f([,] = x){}', Context.OptionsNext, {
            source: `function f([,] = x){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ArrayPattern",
                                    "elements": [
                                        null
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });

        pass('function f([,,foo] = x){}', Context.OptionsNext, {
            source: `function f([,,foo] = x){}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "FunctionDeclaration",
                        "params": [
                            {
                                "type": "AssignmentPattern",
                                "left": {
                                    "type": "ArrayPattern",
                                    "elements": [
                                        null,
                                        null,
                                        {
                                            "type": "Identifier",
                                            "name": "foo"
                                        }
                                    ]
                                },
                                "right": {
                                    "type": "Identifier",
                                    "name": "x"
                                }
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": []
                        },
                        "async": false,
                        "generator": false,
                        "expression": false,
                        "id": {
                            "type": "Identifier",
                            "name": "f"
                        }
                    }
                ]
            }
        });
     });
});