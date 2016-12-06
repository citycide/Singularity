const OFF = 0
const WARN = 1
const ERROR = 2

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
    'quotes': [ERROR, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'no-debugger': process.env.NODE_ENV === 'production' ? ERROR : OFF,
    'no-unused-vars': [WARN, { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    'babel/generator-star-spacing': [ERROR, { 'before': true, 'after': true }],
    'babel/new-cap': WARN,
    'babel/array-bracket-spacing': [ERROR, 'never'],
    'babel/object-curly-spacing': [ERROR, 'always'],
    'babel/object-shorthand': [ERROR, 'always'],
    'babel/arrow-parens': [ERROR, 'as-needed'],
    'babel/no-await-in-loop': WARN,
    'babel/flow-object-type': WARN,
    'babel/func-params-comma-dangle': WARN
  },
  globals: {
    $: true,
    weave: false
  }
}
