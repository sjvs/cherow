
/* Context masks */
export const enum Context {

    Empty            = 0,
    OptionsTokenize = 1 << 0,
    OptionsJSX      = 1 << 1,
    Strict          = 1 << 2,
    Module          = 1 << 3,
    Async           = 1 << 4,
    Yield           = 1 << 5,
    Template        = 1 << 6,
    In              = 1 << 7,
}

/* Mutual parser flags */
export const enum Flags {
    Empty   = 0,
    NewLine = 1 << 0,
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
