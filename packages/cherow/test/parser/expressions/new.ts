import * as t from 'assert';
import { pass } from '../../test-utils';
import { Context } from '../../../src/common';

describe('Miscellaneous - New', () => {

    describe('Pass', () => {

        pass('new a.b.c.d', Context.Empty, {
            source: `new a.b.c.d`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "MemberExpression",
                                    "object": {
                                        "type": "MemberExpression",
                                        "object": {
                                            "type": "Identifier",
                                            "name": "a"
                                        },
                                        "computed": false,
                                        "property": {
                                            "type": "Identifier",
                                            "name": "b"
                                        }
                                    },
                                    "computed": false,
                                    "property": {
                                        "type": "Identifier",
                                        "name": "c"
                                    }
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "d"
                                }
                            },
                            "arguments": []
                        }
                    }
                ]
            }  
        },  (msg: string) => {
            t.equal(msg, 'new.target expression is not allowed here');
        });

        pass('new Foo["bar"]', Context.Empty, {
            source: `new Foo["bar"]`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "Foo"
                                },
                                "computed": true,
                                "property": {
                                    "type": "Literal",
                                    "value": "bar"
                                }
                            },
                            "arguments": []
                        }
                    }
                ]
            }  
        },  (msg: string) => {
            t.equal(msg, 'new.target expression is not allowed here');
        });

        pass('new Foo()', Context.Empty, {
            source: `new Foo()`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "Foo"
                            },
                            "arguments": []
                        }
                    }
                ]
            }  
        },  (msg: string) => {
            t.equal(msg, 'new.target expression is not allowed here');
        });

        pass('new Foo.Bar()', Context.Empty, {
            source: `new Foo.Bar()`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "Foo"
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "Bar"
                                }
                            },
                            "arguments": []
                        }
                    }
                ]
            }  
        },  (msg: string) => {
            t.equal(msg, 'new.target expression is not allowed here');
        });

        pass('new a.b.c.d()', Context.Empty, {
            source: `new a.b.c.d()`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "MemberExpression",
                                    "object": {
                                        "type": "MemberExpression",
                                        "object": {
                                            "type": "Identifier",
                                            "name": "a"
                                        },
                                        "computed": false,
                                        "property": {
                                            "type": "Identifier",
                                            "name": "b"
                                        }
                                    },
                                    "computed": false,
                                    "property": {
                                        "type": "Identifier",
                                        "name": "c"
                                    }
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "d"
                                }
                            },
                            "arguments": []
                        }
                    }
                ]
            }  
        },  (msg: string) => {
            t.equal(msg, 'new.target expression is not allowed here');
        });

        pass('new Foo["bar"]()', Context.Empty, {
            source: `new Foo["bar"]()`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "Foo"
                                },
                                "computed": true,
                                "property": {
                                    "type": "Literal",
                                    "value": "bar"
                                }
                            },
                            "arguments": []
                        }
                    }
                ]
            }  
        },  (msg: string) => {
            t.equal(msg, 'new.target expression is not allowed here');
        });

        pass('new Foo.Bar(X)', Context.Empty, {
            source: `new Foo.Bar(X)`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "Foo"
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "Bar"
                                }
                            },
                            "arguments": [
                                {
                                    "type": "Identifier",
                                    "name": "X"
                                }
                            ]
                        }
                    }
                ]
            }  
        },  (msg: string) => {
            t.equal(msg, 'new.target expression is not allowed here');
        });

        pass('new Foo["bar"](X)', Context.Empty, {
            source: `new Foo["bar"](X)`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "Foo"
                                },
                                "computed": true,
                                "property": {
                                    "type": "Literal",
                                    "value": "bar"
                                }
                            },
                            "arguments": [
                                {
                                    "type": "Identifier",
                                    "name": "X"
                                }
                            ]
                        }
                    }
                ]
            }
        });

        pass('new Foo.Bar(X, Y, Z)', Context.Empty, {
            source: `new Foo.Bar(X, Y, Z)`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "Foo"
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "Bar"
                                }
                            },
                            "arguments": [
                                {
                                    "type": "Identifier",
                                    "name": "X"
                                },
                                {
                                    "type": "Identifier",
                                    "name": "Y"
                                },
                                {
                                    "type": "Identifier",
                                    "name": "Z"
                                }
                            ]
                        }
                    }
                ]
            }
        });

        pass('new Foo["bar"](X, Y, Z)', Context.Empty, {
            source: `new Foo["bar"](X, Y, Z)`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "Foo"
                                },
                                "computed": true,
                                "property": {
                                    "type": "Literal",
                                    "value": "bar"
                                }
                            },
                            "arguments": [
                                {
                                    "type": "Identifier",
                                    "name": "X"
                                },
                                {
                                    "type": "Identifier",
                                    "name": "Y"
                                },
                                {
                                    "type": "Identifier",
                                    "name": "Z"
                                }
                            ]
                        }
                    }
                ]
            }
        });

        pass('new x().y', Context.Empty, {
            source: `new x().y`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "MemberExpression",
                            "object": {
                                "type": "NewExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": "x"
                                },
                                "arguments": []
                            },
                            "computed": false,
                            "property": {
                                "type": "Identifier",
                                "name": "y"
                            }
                        }
                    }
                ]
            }
        });

        pass('new x()[y]', Context.Empty, {
            source: `new x()[y]`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "MemberExpression",
                            "object": {
                                "type": "NewExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": "x"
                                },
                                "arguments": []
                            },
                            "computed": true,
                            "property": {
                                "type": "Identifier",
                                "name": "y"
                            }
                        }
                    }
                ]
            }
        });

        pass('new x()();', Context.Empty, {
            source: `new x()();`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "NewExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": "x"
                                },
                                "arguments": []
                            },
                            "arguments": []
                        }
                    }
                ]
            }
        });

        pass('new x().y = z', Context.Empty, {
            source: `new x().y = z`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "AssignmentExpression",
                            "left": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "NewExpression",
                                    "callee": {
                                        "type": "Identifier",
                                        "name": "x"
                                    },
                                    "arguments": []
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "y"
                                }
                            },
                            "operator": "=",
                            "right": {
                                "type": "Identifier",
                                "name": "z"
                            }
                        }
                    }
                ]
            }
        });

        pass('new x().y + z', Context.Empty, {
            source: `new x().y + z`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "BinaryExpression",
                            "left": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "NewExpression",
                                    "callee": {
                                        "type": "Identifier",
                                        "name": "x"
                                    },
                                    "arguments": []
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "y"
                                }
                            },
                            "right": {
                                "type": "Identifier",
                                "name": "z"
                            },
                            "operator": "+"
                        }
                    }
                ]
            }
        });

        pass('new x()[y] + z', Context.Empty, {
            source: `new x()[y] + z`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "BinaryExpression",
                            "left": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "NewExpression",
                                    "callee": {
                                        "type": "Identifier",
                                        "name": "x"
                                    },
                                    "arguments": []
                                },
                                "computed": true,
                                "property": {
                                    "type": "Identifier",
                                    "name": "y"
                                }
                            },
                            "right": {
                                "type": "Identifier",
                                "name": "z"
                            },
                            "operator": "+"
                        }
                    }
                ]
            }
        });

        pass('new x().y++', Context.Empty, {
            source: `new x().y++`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "UpdateExpression",
                            "argument": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "NewExpression",
                                    "callee": {
                                        "type": "Identifier",
                                        "name": "x"
                                    },
                                    "arguments": []
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "y"
                                }
                            },
                            "operator": "++",
                            "prefix": false
                        }
                    }
                ]
            }
        });

        pass('delete new x()', Context.Empty, {
            source: `delete new x()`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "UnaryExpression",
                            "operator": "delete",
                            "argument": {
                                "type": "NewExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": "x"
                                },
                                "arguments": []
                            },
                            "prefix": true
                        }
                    }
                ]
            }
        });

        pass('delete new x().y', Context.Empty, {
            source: `delete new x().y`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "UnaryExpression",
                            "operator": "delete",
                            "argument": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "NewExpression",
                                    "callee": {
                                        "type": "Identifier",
                                        "name": "x"
                                    },
                                    "arguments": []
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "y"
                                }
                            },
                            "prefix": true
                        }
                    }
                ]
            }
        });

        pass('typeof new x()', Context.Empty, {
            source: `typeof new x()`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "UnaryExpression",
                            "operator": "typeof",
                            "argument": {
                                "type": "NewExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": "x"
                                },
                                "arguments": []
                            },
                            "prefix": true
                        }
                    }
                ]
            }
        });

        pass('new x().y++', Context.Empty, {
            source: `new x().y++`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "UpdateExpression",
                            "argument": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "NewExpression",
                                    "callee": {
                                        "type": "Identifier",
                                        "name": "x"
                                    },
                                    "arguments": []
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "y"
                                }
                            },
                            "operator": "++",
                            "prefix": false
                        }
                    }
                ]
            }
        });

        pass('new new x', Context.Empty, {
            source: `new new x`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "NewExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": "x"
                                },
                                "arguments": []
                            },
                            "arguments": []
                        }
                    }
                ]
            }
        });

        pass('new x()[y] = z', Context.Empty, {
            source: `new x()[y] = z`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "AssignmentExpression",
                            "left": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "NewExpression",
                                    "callee": {
                                        "type": "Identifier",
                                        "name": "x"
                                    },
                                    "arguments": []
                                },
                                "computed": true,
                                "property": {
                                    "type": "Identifier",
                                    "name": "y"
                                }
                            },
                            "operator": "=",
                            "right": {
                                "type": "Identifier",
                                "name": "z"
                            }
                        }
                    }
                ]
            }
        });
    });
});
