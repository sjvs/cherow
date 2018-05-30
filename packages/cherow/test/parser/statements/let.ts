import * as t from 'assert';
import { pass } from '../../test-utils';
import { Context } from '../../../src/common';

describe('Declarations - Let', () => {

    pass('let', Context.Empty, {
        source: 'let',
        expected: {
            "type": "Program",
            "sourceType": "script",
            "body": [
                {
                    "type": "ExpressionStatement",
                    "expression": {
                        "type": "Identifier",
                        "name": "let"
                    }
                }
            ]
        }
    });

       pass('let [foo,bar] = x;', Context.Empty, {
            source: 'let [foo,bar] = x;',
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "VariableDeclaration",
                        "kind": "let",
                        "declarations": [
                            {
                                "type": "VariableDeclarator",
                                "init": {
                                    "type": "Identifier",
                                    "name": "x"
                                },
                                "id": {
                                    "type": "ArrayPattern",
                                    "elements": [
                                        {
                                            "type": "Identifier",
                                            "name": "foo"
                                        },
                                        {
                                            "type": "Identifier",
                                            "name": "bar"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        });

        pass('let foo;', Context.Empty, {
            source: 'let foo;',
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "VariableDeclaration",
                        "kind": "let",
                        "declarations": [
                            {
                                "type": "VariableDeclarator",
                                "init": null,
                                "id": {
                                    "type": "Identifier",
                                    "name": "foo"
                                }
                            }
                        ]
                    }
                ]
            }
        });

        pass('let foo, bar', Context.Empty, {
            source: 'let foo, bar',
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "VariableDeclaration",
                        "kind": "let",
                        "declarations": [
                            {
                                "type": "VariableDeclarator",
                                "init": null,
                                "id": {
                                    "type": "Identifier",
                                    "name": "foo"
                                }
                            },
                            {
                                "type": "VariableDeclarator",
                                "init": null,
                                "id": {
                                    "type": "Identifier",
                                    "name": "bar"
                                }
                            }
                        ]
                    }
                ]
            }
        });

        pass('let foo = bar', Context.Empty, {
            source: 'let foo = bar',
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "VariableDeclaration",
                        "kind": "let",
                        "declarations": [
                            {
                                "type": "VariableDeclarator",
                                "init": {
                                    "type": "Identifier",
                                    "name": "bar"
                                },
                                "id": {
                                    "type": "Identifier",
                                    "name": "foo"
                                }
                            }
                        ]
                    }
                ]
            }
        });

        pass('let [] = x;', Context.Empty, {
            source: 'let [] = x;',
            expected: {
                "type": "Program",
                "sourceType": "script",
                "body": [
                    {
                        "type": "VariableDeclaration",
                        "kind": "let",
                        "declarations": [
                            {
                                "type": "VariableDeclarator",
                                "init": {
                                    "type": "Identifier",
                                    "name": "x"
                                },
                                "id": {
                                    "type": "ArrayPattern",
                                    "elements": []
                                }
                            }
                        ]
                    }
                ]
            }
        });
    });
