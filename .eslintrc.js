'use strict';

module.exports = {
  extends: 'ts',
  rules: {
    'no-bitwise': 'off'
  },
  overrides: [
    {
      files: ['**/*.ts'],
      // TODO: enable it when
      // parser: 'cherow-ts',
    }
  ]
}
