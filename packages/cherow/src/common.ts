
/* Context masks */
export const enum Context {

    Empty            = 0,
    OptionsTokenize = 1 << 0,
    OptionsJSX      = 1 << 1,
    OptionsRaw      = 1 << 2,
    Strict          = 1 << 3,
    Module          = 1 << 4,
    Async           = 1 << 5,
    Yield           = 1 << 6,
    Template        = 1 << 7,
    In              = 1 << 8,
}

/* Mutual parser flags */
export const enum Flags {
    Empty   = 0,
    NewLine = 1 << 0,
    HasOctal = 1 << 1,
}

/* Recovery state */
export const enum Recovery {
    Empty   = 0,
    Unterminated = 1 << 0,
}

/* Tokenizer state */
export const enum Tokenize {
    Empty,
    NoWhiteSpace,
    All
}
