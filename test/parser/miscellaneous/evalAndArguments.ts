import { pass, fail } from '../../test-utils';
import { Context } from '../../../src/utilities';
import * as t from 'assert';
import { parse } from '../../../src/parser';

describe('Miscellaneous - Eval and arguments', () => {

    describe('Failure', () => {

        const programs = [
            'var eval',
            'var arguments',
            'var foo, eval;',
            'var foo, arguments;',
            'try { } catch (eval) { }',
            'try { } catch (arguments) { }',
            'function eval() { }',
            'function arguments() { }',
            'function foo(eval) { }',
            'function foo(arguments) { }',
            'function foo(bar, eval) { }',
            'function foo(bar, arguments) { }',
            'eval => icefapper', // evil?
            '(eval) => { }',
            '(arguments) => { }',
            '(foo, eval) => { }',
            '(foo, arguments) => { }',
            'eval = 1;',
            'arguments = 1;',
            '[ arguments = 0 ]',
            'var foo = eval = 1;',
            'var foo = arguments = 1;',
            '++eval;',
            '++arguments;',
            'eval++;',
            'arguments++;',
            '{ foo: arguments }',
            '{ foo: eval }',
            '[ ...(eval = 0) ]',
            '{ x: (eval = 0) }',
            '{ x: (arguments = 0) }',
            '{ eval = 0 }',
            '{ arguments = 0 }',
            '{ foo: eval = 0 }',
            '{ foo: arguments = 0 }',
            '[ eval = 0 ]',
            '[ arguments = 0 ]',
            '{ x: (arguments) = 0 }',
            '{ x: (eval) = 0 }',
            '[ (eval = 0) ]',
            '[ (arguments = 0) ]',
            '[ (eval) = 0 ]',
            '[ (arguments) = 0 ]',
            '[ ...(arguments = 0) ]',
            '[ ...(eval) = 0 ]',
            '[ ...(arguments) = 0 ]',
            // TODO!
            //"{ arguments }",
            //"{ x: (eval) }",
            // "[...eval] = arr",
            // "{ eval }",
            // "[ eval ]",
            // "[ arguments ]",
            // "{ x: (arguments) }",
            // "[ (eval) ]",
            // "[ (arguments) ]"
            //"[ ...(eval) ]",
            //"[ ...(arguments) ]",

        ];

        for (const arg of programs) {

            it(`"use strict"; ${arg}`, () => {
                t.throws(() => {
                    parse(`"use strict"; ${arg}`, undefined, Context.Empty);
                });
            });

            it(`${arg}`, () => {
                t.throws(() => {
                    parse(`${arg}`, undefined, Context.Strict | Context.Module);
                });
            });
        }
    });

    describe('Pass', () => {

        const programs = [
            'var eval;',
            'var arguments',
            'var foo, eval;',
            'var foo, arguments;',
            'try { } catch (eval) { }',
            'try { } catch (arguments) { }',
            'function eval() { }',
            'function arguments() { }',
            'function foo(eval) { }',
            'function foo(arguments) { }',
            'function foo(bar, eval) { }',
            'function foo(bar, arguments) { }',
            'eval = 1;',
            'arguments = 1;',
            'var foo = eval = 1;',
            'var foo = arguments = 1;',
            '++eval;',
            '++arguments;',
            'eval++;',
            'arguments++;',
            'eval;',
            'arguments;'
        ];

        for (const arg of programs) {

            it(`${arg}`, () => {
                t.doesNotThrow(() => {
                    parse(`${arg}`, undefined, Context.Empty);
                });
            });

            it(`function foo() { ${arg} }`, () => {
                t.doesNotThrow(() => {
                    parse(`function foo() { ${arg} }`, undefined, Context.Empty);
                });
            });
        }

        const NoStrictError = [
            'var foo = eval;',
            'var foo = arguments;',
            'var foo = { eval: 1 };',
            'var foo = { arguments: 1 };',
            'var foo = { }; foo.eval = {};',
            'var foo = { }; foo.arguments = {};',
        ];

        for (const arg of NoStrictError) {

            it(`"use strict"; ${arg}`, () => {
                t.doesNotThrow(() => {
                    parse(`"use strict"; ${arg}`, undefined, Context.Empty);
                });
            });

            it(`() => { "use strict"; ${arg}}`, () => {
                t.doesNotThrow(() => {
                    parse(`() => { "use strict"; ${arg}}`, undefined, Context.Empty);
                });
            });

            it(`${arg}`, () => {
                t.doesNotThrow(() => {
                    parse(`${arg}`, undefined, Context.Module);
                });
            });

            it(`var eval; function test_func() {"use strict"; ${arg} }`, () => {
                t.doesNotThrow(() => {
                    parse(`var eval; function test_func() {"use strict"; ${arg} }`, undefined, Context.Empty);
                });
            });
        }
    });
});