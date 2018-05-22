import { Parser } from '../types';
import { Token, tokenDesc } from '../token';
import { Context, Flags } from '../common';
import { Chars } from '../chars';
import { scanIdentifier } from './identifier';
import { skipSingleLineComment } from './comments';

function invalid(parser: Parser, context: Context, first: number) {
    return Token.EndOfSource;
}

const table = new Array(128).fill(invalid) as any;

table[Chars.Space] = (parser: Parser, context: Context, first: number) => {
    return Token.Whitespace;
};

table[Chars.Tab] = (parser: Parser, context: Context, first: number) => {
    return Token.Whitespace;
};

table[Chars.LineFeed] = (parser: Parser, context: Context, first: number) => {
    parser.flags |= Flags.ConsumedNewline;
    return Token.LineFeed;
};

table[Chars.CarriageReturn] = (parser: Parser, context: Context, first: number) => {
    return parser.index < parser.length && parser.source.charCodeAt(parser.index) === Chars.LineFeed ?
        Token.LineFeed :
        Token.CarriageReturn;
};

table[Chars.LessThan] = (parser: Parser, context: Context, first: number) => {
    return parser.index < parser.length && parser.source.charCodeAt(parser.index) === Chars.LineFeed ?
        Token.LineFeed :
        Token.CarriageReturn;
};

// `/`, `/=`, `/>`
table[Chars.Slash] = (parser: Parser, context: Context, first: number) => {
    if (parser.index >= parser.length) return Token.Divide;
    const next = parser.source.charCodeAt(parser.index);
    if (next === Chars.Slash) {
        return skipSingleLineComment(parser);
    } else if (next === Chars.Asterisk) {
        //   return skipBlockComment(parser, state);
    } else if (next === Chars.EqualSign) {
        parser.index++; parser.column++;
        return Token.DivideAssign;
    } else if (next === Chars.GreaterThan) {
        parser.index++; parser.column++;
        return Token.JSXAutoClose;
    }
    return Token.Divide;
};

export function scan(parser: Parser, context: Context): Token {
    let token: Token = Token.EndOfSource;
    while (parser.index < parser.length) {
        const first = parser.source.charCodeAt(parser.index);
        if (first === Chars.Dollar || (first >= Chars.LowerA && first <= Chars.LowerZ)) {
            return scanIdentifier(parser, context);
        } else {
            parser.index++; parser.column++;
            token = table[first](parser, context, first);
            if ((token & Token.Whitespace) === Token.Whitespace) continue;
            if (context & Context.OptionsTokenize) parser.tokens.push(token);
            return token;
        }
    }
    return Token.EndOfSource;
}
