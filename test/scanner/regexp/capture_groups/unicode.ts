import * as assert from 'clean-assert';
import * as t from 'assert';
import { ValidatorState, validateRegExp } from '../../../../src/regexp';
import { Context } from '../../../../src/utilities';
import * as ESTree from '../../../../src/estree';

describe.skip('RegExp named capture groups', () => {

    describe.skip('Failure', () => {

        const invalidSyntaxUnicode = [
            '/(?<☀>a)\\k<☀>/u',
            '/(?<\\u0020>a)\\k<\\u0020>/u',
            '/(?<a>a)(?<\\u0061>a)/u',
            '/(?<a>a)(?<\\u{61}>a)/u',
            '/(?<a>a)\\k<b>/u',
            '/(?<a>a)\\2/u',
            '/(?<a>a)\\k<a/u',
            '/(?<a>a)\\k<a/',
            '/(?<a>a)\\k</u',
            '/(?<a>a)\\k</u',
            '/\\k<a>/u',
            '/\\k<a>/u',
            '/\\k/u',
            '/(?<aa)/u',
            '/(?<42a>a)/u',
            '/(?<:a>a)/u',
            '/(?<a:>a)/u',
            '/(?<a>a)(?<a>a)/u',
            '/(?<a>a)(?<b>b)(?<a>a)/u',
            '/\\k<a>/u',
            '/\\k<a/u',
            '/\\k/u',
            '/(?<a>.)\\k/u',
            '/(?<a>.)\\k<a/u',
            '/(?<a>.)\\k<b>/u',
            '/(?<a>a)\\k<ab>/u',
            '/\\k<a(?<a>a)/',
            '/(?<ab>a)\\k<a>/',
            '/(?<a>a)\\k<ab>/',
            '/\\k<a>(?<ab>a)/',
            '/(?<ab>a)\\k<a>/u',
            '/\\k<a>(?<ab>a)/u',
            '/(?<a\\u{10FFFF}>.)/',
            '/(?<a>\\a)/u',
            '/(?<❤>a)/u',
            '/(?<𐒤>a)/u',
            '/(?<a\\uD801>.)/u',
            '/(?<a\\u{110000}>.)/u',
            '/(?<a\uD801>.)/u',
            '/(?<a\uDCA4>.)/u',
            '/(?<a\\uD801>.)/u',
            '/(?<a\\uDCA4>.)/u',
            '/(?<\\>.)/u',
            '/(?<a\\>.)/u',
            '/(?<𠮷>a)\\k<\\u{20bb7}>/u',
            '/(?<abc>a)\\k<\\u0061\\u0062\\u0063>/u',
            '/(?<\\u0061\\u0062\\u0063>a)\\k<abc>/u',
            '/(?<❤>a)/u',
            '/(?<𐒤>a)/u',
            '/(?<a\\uD801>.)/u',
            '/(?<a\\uDCA4>.)/u',
            '/(?<a\\u{110000}>.)/u',
            '/(?<a\uDCA4>.)/u',
            '/(?<a\\uD801>.)/u',
            '/(?<a\\uDCA4>.)/u',
            '/(?<a\\>.)/u',
            '/(?<\\>.)/u',
            '/\\k<a>(?<a>a)/u',
            '/(?<$abc>a)\\k<$abc>/u',
            '/(?<a>a)\\k<a>/u',
            '/(?<$𐒤>a)/',
            '/(?<❤>a)/',
            '/(?<𐒤>a)/',
            '/(?<a\u{104A4}>.)/',
            '/(?<a\\uD801\uDCA4>.)/',
            '/(?<a\\uD801>.)/',
            '/(?<a\\uDCA4>.)/',
            //"/(?<a\\u{104A4}>.)/",
            '/(?<a\u{104A4}>.)/',
            '/(?<a\uD801\uDCA4>.)/u',
            '/(?<a\u{104A4}>.)/u',
            '(?<a\u{104A4}>.)',
            '/\\1(?:.)/u',
            '/\\1(?<=a)./u',
        ];
        for (const arg of invalidSyntaxUnicode) {

            it(`${arg}`, () => {

                t.throws(() => {
                    validateRegExp(`${arg}`, ValidatorState.Unicode);
                });
            });
        }
    });

    describe.skip('Pass', () => {
        const validSyntaxUnicode = [
            '/(?<=(?<fst>.)|(?<snd>.))/u',
            '/(?<=(?<a>\w){3})f/u',
            '/(?<=(?<a>\w){4})f/u',
            '/(?<=(?<a>\w)+)f/u',
            '/(?<\u{0041}>.)/u',
            '/(?<=(?<a>\w){6})f/u',
            '/(?<a>(?<=\w{3}))f/u',
            '/((?<=\w{3}))f/u',
            '/(?<a>(?<=\w{3}))f/u',
            '/(?<!(?<a>\d){3})f/u',
            '/(?<!(?<a>\D){3})f/u',
            '/(?<!(?<a>\D){3})f|f/u',
            '/(?<a>(?<!\D{3}))f|f/u',
            '/(?<=(?<a>\w){3})f/',
            '/(?<=(?<a>\w){3})f/',
            '/(?<=(?<a>\w){4})f/',
            '/(?<=(?<a>\w)+)f/',
            '/(?<=(?<a>\w){6})f/',
            '/((?<=\w{3}))f/',
            '/(?<a>(?<=\w{3}))f/',
            '/(?<!(?<a>\d){3})f/',
            '/(?<!(?<a>\D){3})f/',
            '/(?<!(?<a>\D){3})f|f/',
            '/(?<a>(?<!\D{3}))f|f/',
            '/(?<a>a)/u',
            '/(?<a42>a)/u',
            '/(?<_>a)/u',
            '/(?<$>a)/u',
            '/.(?<$>a)./u',
            '/.(?<a>a)(.)/u',
            '/.(?<a>a)(?<b>.)/u',
            '/.(?<a>\w\w)/u',
            '/(?<a>\w\w\w)/u',
            '/(?<a>\w\w)(?<b>\w)/u',
            '/.(?<a>\w\w)/u',
            '/(?<=(?<a>\w){6})f/',
            '/(?<a>a)\\1/u',
            '/(?<a>a)(?<b>a)/u',
            '/\\1(?<a>a)/u',
            '/(.)(?<a>a)\\1\\2/u',
            '/(.)(?<a>a)(?<b>\\1)(\\2)/u',
            '/(?<gt>>)a/u',
            '/(?<\u{03C0}>a)/u',
            '/(?<π>a)/u',
            '/(?<π>a)/u',
            '/(?<\u{03C0}>a)/u',
            '/(?<$>a)/u',
            '/(?<_>a)/u',
            '(?<_\u200C>a)/',
            '/(?<_\u200D>a)/u',
            '/(?<π>a)/u',
            '/(?<π>a)/u',
            '/(?<π>a)/u',
            '/(?<b>.).\k<b>/u',
            '/(?<b>b)\k<a>(?<a>a)\k<b>/u',
            '/(?<b>b)\k<a>(?<a>a)\k<b>/',
            '/(?<a>a)(?<b>b)\k<a>|(?<c>c)/u',
            '/(?<\u{0041}>.)/u',
            '"(?<\u{0041}>.)"',
            '"(?<\u{0041}>.)"',
            '"(?<\u{0041}>.)"',
            '"(?<\u{0041}>.)"',
            '(?<\u{0041}>.)'
        ];

        for (const arg of validSyntaxUnicode) {

            it(`${arg}`, () => {

                t.doesNotThrow(() => {
                    validateRegExp(`${arg}`, ValidatorState.Unicode);
                });
            });
        }
    });
});