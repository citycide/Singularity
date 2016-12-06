module.exports = {
  extends: '../../../../../.eslintrc.js',
  env: {
    browser: true,
    node: true
  },
  rules: {
    'no-unused-vars': 'off'
  },
  globals: {
    $: true
  }
}
