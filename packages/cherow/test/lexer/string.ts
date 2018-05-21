import * as t from 'assert';
import { scan } from '../../src/lexer/scan';
import { fromCodePoint } from '../../src/lexer/common';
import { createParserObject } from '../../src/parser/parser';
import { Context, Recovery } from '../../src/utilities';
import { parseSource, parse } from '../../src/cherow';
import { Token, tokenDesc } from '../../src/token';
import * as assert from 'clean-assert';

describe('Lexer - String literals', () => {

    describe('Editor mode', () => {

        describe(`Early errors`, () => {
            it(`should move on if unterminated string literal`, () => {
                const errArray: any = [];
                const res = parse('"unterminated string', {
                    next: true
                }, (err: string, line: number, column: number) => {
                    errArray.push(`Line ${line}, column ${column}: ${err}`);
                });
                assert.match(errArray[0], 'Line 1, column 20: Unterminated string literal');
            });

            it(`should move on if unterminated string on multiple lines`, () => {
                const errArray: any = [];
                const res = parse(`"
                H
                e
                l
                l
                o
                "`, {
                    next: true
                }, (err: string, line: number, column: number) => {
                    errArray.push(`Line ${line}, column ${column}: ${err}`);
                });
                // Note: Unterminated strings are counted from quote to quote - or the last letter
                // where the missing quote should have been.
                // Invalid, but not unterminated string literal - across multiple lines are
                // counted from quote to quote
                assert.match(errArray[0], 'Line 1, column 1: Unterminated string literal');
                assert.match(errArray[1], 'Line 7, column 17: Unterminated string literal');
            });

        });
    });

    // should recover from this (invalid input)
    describe("Fails", () => {

        const inputData: any = [

            [Context.OptionsNext, '"\\8"', Token.Illegal],
            [Context.OptionsNext, '"\\9"', Token.Illegal],
            [Context.OptionsNext, '"\\u{2028"', Token.Illegal],
            [Context.OptionsNext, '"\\u"', Token.Illegal],
            [Context.OptionsNext, '"\\x"', Token.Illegal],
            [Context.OptionsNext, '"\\u{110000}"', Token.Illegal],
            [Context.OptionsNext, '"\\u{FFFFFFF}"', Token.Illegal],
        ];

        for (const [ctx, input, token] of inputData) {
            it(`scans invalid input - '${input}'`, () => {
                const parser = createParserObject(input, undefined);
                const found = scan(parser, ctx);
                assert.match({
                    token: tokenDesc(found),
                    value: parser.tokenValue
                }, {
                    token: tokenDesc(token),
                    value: undefined
                });
            });
        }
    });
    describe('Pass', () => {

        function pass(name: string, opts: any) {
            function test(name: string, context: Context, isEnd: boolean) {
                it(name, () => {

                    const parser = createParserObject(isEnd ? opts.source : `${opts.source} `, undefined);

                    assert.match({
                        token: scan(parser, context),
                        value: parser.tokenValue,
                        line: parser.line,
                        column: parser.column,
                    }, {
                        token: Token.StringLiteral,
                        value: opts.value,
                        line: opts.line,
                        column: opts.column,
                    });
                });
            }

            // Sloppy mode
            test(`should scan ${name}`, Context.Empty, false);

            // Strict mode
            test(`should scan ${name}`, Context.Strict, false);
        }

        pass('scans \'\'', {
            source: '\'\'',
            value: '',
            raw: '\'\'',
            line: 1,
            column: 2,
        });

        pass('scans ""', {
            source: '""',
            value: '',
            raw: '""',
            line: 1,
            column: 2,
        });

        pass('scans \'123\'', {
            source: '\'123\'',
            value: '123',
            raw: '\'123\'',
            line: 1,
            column: 5,
        });

        pass('scans "123"', {
            source: '"123"',
            value: '123',
            raw: '"123"',
            line: 1,
            column: 5,
        });

        const inputData: any = [
            // Empty string literal
            [Context.Empty, '""', '', Token.StringLiteral],
            [Context.Empty, '"0"', '0', Token.StringLiteral],
            [Context.Empty, '"a"', 'a', Token.StringLiteral],
            [Context.Empty, '"abc"', 'abc', Token.StringLiteral],

            // Letters small
            [Context.Empty, '"\\a"', '\a', Token.StringLiteral],
            [Context.Empty, '"\\b"', '\b', Token.StringLiteral],
            [Context.Empty, '"\\c"', '\c', Token.StringLiteral],

            // English capitals
            [Context.Empty, '"K"', 'K', Token.StringLiteral],
            [Context.Empty, '"M"', 'M', Token.StringLiteral],
            [Context.Empty, '"N"', 'N', Token.StringLiteral],

            // Russian small
            [Context.Empty, '"п"', 'п', Token.StringLiteral],
            [Context.Empty, '"ф"', 'ф', Token.StringLiteral],
            [Context.Empty, '"ч"', 'ч', Token.StringLiteral],
            [Context.Empty, '"с"', 'с', Token.StringLiteral],
            [Context.Empty, '"т"', 'т', Token.StringLiteral],
            [Context.Empty, '"о"', 'о', Token.StringLiteral],

            // Russian capitals
            [Context.Empty, '"Ж"', 'Ж', Token.StringLiteral],
            [Context.Empty, '"И"', 'И', Token.StringLiteral],
            [Context.Empty, '"П"', 'П', Token.StringLiteral],
            [Context.Empty, '"Ш"', 'Ш', Token.StringLiteral],
            [Context.Empty, '"т"', 'т', Token.StringLiteral],
            [Context.Empty, '"Ю"', 'Ю', Token.StringLiteral],
            [Context.Empty, '"Ъ"', 'Ъ', Token.StringLiteral],
            [Context.Empty, '"Э"', 'Э', Token.StringLiteral],
            [Context.Empty, '"З"', 'З', Token.StringLiteral],
            [Context.Empty, '"Р"', 'Р', Token.StringLiteral],
            [Context.Empty, '"Ф"', 'Ф', Token.StringLiteral],

            // Unicode
            [Context.Empty, '"\\u{00F8}"', 'ø', Token.StringLiteral],
            [Context.Empty, '"\\u{0000000000F8}"', 'ø', Token.StringLiteral],
            [Context.Empty, '"\\u{10FFFF}"', '􏿿', Token.StringLiteral],
            [Context.Empty, '"\\u000a"', '\n', Token.StringLiteral],
            [Context.Empty, '"\\u{4f06}"', '伆', Token.StringLiteral],
            [Context.Empty, '"\\u{6c1a}"', '氚', Token.StringLiteral],
            [Context.Empty, '"\\u{4c2a}"', '䰪', Token.StringLiteral],
            [Context.Empty, '"\\u03ef"', 'ϯ', Token.StringLiteral],
            [Context.Empty, '"\\u03f2"', 'ϲ', Token.StringLiteral],
            [Context.Empty, '"\\u03f2"', 'ϲ', Token.StringLiteral],
            [Context.Empty, '"\\u03f6"', '϶', Token.StringLiteral],
            [Context.Empty, '"\\u03a7"', 'Χ', Token.StringLiteral],
            [Context.Empty, '"\\u03f0"', 'ϰ', Token.StringLiteral],
            [Context.Empty, '"\\u4f64"', '佤', Token.StringLiteral],
            [Context.Empty, '"\\u4f66"', '佦', Token.StringLiteral],
            [Context.Empty, '"\\u4f68"', '佨', Token.StringLiteral],
            [Context.Empty, '"\\u80fb"', '胻', Token.StringLiteral],
            [Context.Empty, '"\\u80fc"', '胼', Token.StringLiteral],

            [Context.Empty, '"\\u8036"', '耶', Token.StringLiteral],
            [Context.Empty, '"\\u8037"', '耷', Token.StringLiteral],

            // Hex
            [Context.Empty, '"\\xF3"', 'ó', Token.StringLiteral],
            [Context.Empty, '"\\x80"', '', Token.StringLiteral],
            [Context.Empty, '"\xA7"', '§', Token.StringLiteral],
            [Context.Empty, '"\\xFD"', 'ý', Token.StringLiteral],
            [Context.Empty, '"\\x78"', 'x', Token.StringLiteral],
            [Context.Empty, '"\\xFC"', 'ü', Token.StringLiteral],
            [Context.Empty, '"\\xF9"', 'ù', Token.StringLiteral],
            [Context.Empty, '"\\xF3"', 'ó', Token.StringLiteral],
            [Context.Empty, '"\\0x410"', '\u0000x410', Token.StringLiteral],

            // Numbers
            [Context.Empty, '"\\1"', '\u0001', Token.StringLiteral],
            [Context.Empty, '"\\2"', '\u0002', Token.StringLiteral],
            [Context.Empty, '"\\3"', '\u0003', Token.StringLiteral],
            [Context.Empty, '"\\4"', '\u0004', Token.StringLiteral],
            [Context.Empty, '"\\5"', '\u0005', Token.StringLiteral],
            [Context.Empty, '"\\777"', '?7', Token.StringLiteral],
            [Context.Empty, '"\\123"', 'S', Token.StringLiteral],
            [Context.Empty, '"\\456"', '%6', Token.StringLiteral],
            [Context.Empty, '"\\470"', '\'0', Token.StringLiteral],
            [Context.Empty, '"\\00001"', '\u000001', Token.StringLiteral],
            [Context.Empty, '"\\0000000"', '\u00000000', Token.StringLiteral],
            [Context.Empty, '"\\7777447698834478562"', '?77447698834478562', Token.StringLiteral],
            [Context.Empty, '"\\2111"', '1', Token.StringLiteral],
            [Context.Empty, '"\\5111"', ')11', Token.StringLiteral],
            [Context.Empty, '"\\5a"', '\u0005a', Token.StringLiteral],
            [Context.Empty, '"\\500"', '(0', Token.StringLiteral],

            // \\0 - \\7 (with possible leading zeroes)
            [Context.Empty, '"\\6"', '\u0006', Token.StringLiteral],
            [Context.Empty, '"\\7"', '\u0007', Token.StringLiteral],

            // \\10 - \\77 (with possible leading zeroes)'
            [Context.Empty, '"\\10"', '\b', Token.StringLiteral],
            [Context.Empty, '"\\77"', '?', Token.StringLiteral],
            [Context.Empty, '"\\13"', '\u000b', Token.StringLiteral],
            [Context.Empty, '"\\61"', '1', Token.StringLiteral],
            [Context.Empty, '"\\62"', '2', Token.StringLiteral],
            [Context.Empty, '"\\57"', '/', Token.StringLiteral],
            [Context.Empty, '"\\26"', '\u0016', Token.StringLiteral],

            // \\100 - \\377 (with possible leading zeroes)
            [Context.Empty, '"\\353"', 'ë', Token.StringLiteral],
            [Context.Empty, '"\\360"', 'ð', Token.StringLiteral],
            [Context.Empty, '"\\374"', 'ü', Token.StringLiteral],
            [Context.Empty, '"\\267"', '·', Token.StringLiteral],
            [Context.Empty, '"\\136"', '^', Token.StringLiteral],
        ];

        for (const [ctx, source, parsed, token] of inputData) {
            it(`scans '${source}'`, () => {
                const parser = createParserObject(source, undefined);
                const found = scan(parser, ctx);

                assert.match({
                    token: tokenDesc(found),
                    value: parser.tokenValue,
                    line: parser.line,
                    column: parser.column,
                }, {
                    token: tokenDesc(token),
                    value: parsed,
                    line: 1,
                    column: source.length,
                });
            });
        }
    });
});
