export const enum Context {
  Empty = 0,
  ExpressionStart      = 1 << 10,
  Strict               = 1 << 14,
  Module               = 1 << 15,
}

export const enum Flags {
  Empty = 0,
  LineTerminator = 0,
}
