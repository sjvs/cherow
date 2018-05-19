# Cherow

**Work in progress**

This is an experimental branch with focus on adding a "editor mode" for Cherow. It will replace current tolerant mode,
and will recover from all errors. Incremental parsing is a TODO.

Doing this would require a refactoring both of parser and the lexer. 

**Note:** This is a different approach than Acorn loose, and for *panic mode* it will not create any AST nodes, but
the scanner will be primed until statement level are reached.

**Second node** This code doesn't work in current state, but the string literal scanning gives a hint how this works.

```js
cherow.parse('var unterminated = "string literal ', { edit: true }, function(msg) {
   // errors ...
})
```
