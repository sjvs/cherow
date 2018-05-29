import * as t from 'assert';
import { pass } from '../../test-utils';
import { Context } from '../../../src/common';

describe('Expressions - Object literal', () => {

    describe('Pass', () => {

        pass('foo = { aync, get, set }', Context.Empty, {
            source: `foo = { aync, get, set }`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "AssignmentExpression",
                            "left": {
                                "type": "Identifier",
                                "name": "foo"
                            },
                            "operator": "=",
                            "right": {
                                "type": "ObjectExpression",
                                "properties": [
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Identifier",
                                            "name": "aync"
                                        },
                                        "value": {
                                            "type": "Identifier",
                                            "name": "aync"
                                        },
                                        "kind": "init",
                                        "computed": false,
                                        "method": false,
                                        "shorthand": true
                                    },
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Identifier",
                                            "name": "get"
                                        },
                                        "value": {
                                            "type": "Identifier",
                                            "name": "get"
                                        },
                                        "kind": "init",
                                        "computed": false,
                                        "method": false,
                                        "shorthand": true
                                    },
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Identifier",
                                            "name": "set"
                                        },
                                        "value": {
                                            "type": "Identifier",
                                            "name": "set"
                                        },
                                        "kind": "init",
                                        "computed": false,
                                        "method": false,
                                        "shorthand": true
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        });

        pass('foo = { a, b, c }', Context.Empty, {
            source: `foo = { a, b, c }`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "AssignmentExpression",
                            "left": {
                                "type": "Identifier",
                                "name": "foo"
                            },
                            "operator": "=",
                            "right": {
                                "type": "ObjectExpression",
                                "properties": [
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Identifier",
                                            "name": "a"
                                        },
                                        "value": {
                                            "type": "Identifier",
                                            "name": "a"
                                        },
                                        "kind": "init",
                                        "computed": false,
                                        "method": false,
                                        "shorthand": true
                                    },
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Identifier",
                                            "name": "b"
                                        },
                                        "value": {
                                            "type": "Identifier",
                                            "name": "b"
                                        },
                                        "kind": "init",
                                        "computed": false,
                                        "method": false,
                                        "shorthand": true
                                    },
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Identifier",
                                            "name": "c"
                                        },
                                        "value": {
                                            "type": "Identifier",
                                            "name": "c"
                                        },
                                        "kind": "init",
                                        "computed": false,
                                        "method": false,
                                        "shorthand": true
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        });

        pass('foo({});', Context.Empty, {
            source: `foo({});`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "foo"
                            },
                            "arguments": [
                                {
                                    "type": "ObjectExpression",
                                    "properties": []
                                }
                            ]
                        }
                    }
                ]
            }
        });

        pass('foo({a});', Context.Empty, {
            source: `foo({a});`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "foo"
                            },
                            "arguments": [
                                {
                                    "type": "ObjectExpression",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "a"
                                            },
                                            "value": {
                                                "type": "Identifier",
                                                "name": "a"
                                            },
                                            "kind": "init",
                                            "computed": false,
                                            "method": false,
                                            "shorthand": true
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        });

        pass('foo = {async};', Context.Empty, {
            source: `foo = {async};`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "AssignmentExpression",
                            "left": {
                                "type": "Identifier",
                                "name": "foo"
                            },
                            "operator": "=",
                            "right": {
                                "type": "ObjectExpression",
                                "properties": [
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Identifier",
                                            "name": "async"
                                        },
                                        "value": {
                                            "type": "Identifier",
                                            "name": "async"
                                        },
                                        "kind": "init",
                                        "computed": false,
                                        "method": false,
                                        "shorthand": true
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        });

        pass('foo = {get:b}', Context.Empty, {
            source: `foo = {get:b}`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "AssignmentExpression",
                            "left": {
                                "type": "Identifier",
                                "name": "foo"
                            },
                            "operator": "=",
                            "right": {
                                "type": "ObjectExpression",
                                "properties": [
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Identifier",
                                            "name": "get"
                                        },
                                        "value": {
                                            "type": "Identifier",
                                            "name": "b"
                                        },
                                        "kind": "init",
                                        "computed": false,
                                        "method": false,
                                        "shorthand": false
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        });

        pass('foo({async:b});', Context.Empty, {
            source: `foo({async:b});`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "foo"
                            },
                            "arguments": [
                                {
                                    "type": "ObjectExpression",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "async"
                                            },
                                            "value": {
                                                "type": "Identifier",
                                                "name": "b"
                                            },
                                            "kind": "init",
                                            "computed": false,
                                            "method": false,
                                            "shorthand": false
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        });

        pass('foo({a:b});', Context.Empty, {
            source: `foo({a:b});`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "foo"
                            },
                            "arguments": [
                                {
                                    "type": "ObjectExpression",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "key": {
                                                "type": "Identifier",
                                                "name": 'a'
                                            },
                                            "value": {
                                                "type": "Identifier",
                                                "name": "b"
                                            },
                                            "kind": "init",
                                            "computed": false,
                                            "method": false,
                                            "shorthand": false
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        });

        pass('wrap({a, c:d});', Context.Empty, {
            source: `wrap({a, c:d});`,
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "wrap"
                            },
                            "arguments": [
                                {
                                    "type": "ObjectExpression",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "a"
                                            },
                                            "value": {
                                                "type": "Identifier",
                                                "name": "a"
                                            },
                                            "kind": "init",
                                            "computed": false,
                                            "method": false,
                                            "shorthand": true
                                        },
                                        {
                                            "type": "Property",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "c"
                                            },
                                            "value": {
                                                "type": "Identifier",
                                                "name": "d"
                                            },
                                            "kind": "init",
                                            "computed": false,
                                            "method": false,
                                            "shorthand": false
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        });
    });
});