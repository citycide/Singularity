module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  plugins: [
    'html',
    'babel'
  ],
  rules: {
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'babel/generator-star-spacing': ['error', { 'before': true, 'after': true }],
    'babel/new-cap': 1,
    'babel/array-bracket-spacing': ['error', 'never'],
    'babel/object-curly-spacing': ['error', 'always'],
    'babel/object-shorthand': ['error', 'always'],
    'babel/arrow-parens': ['error', 'as-needed'],
    'babel/no-await-in-loop': 1,
    'babel/flow-object-type': 1,
    'babel/func-params-comma-dangle': 1
  },
  globals: {
    $: true,
    weave: false
  }
}
