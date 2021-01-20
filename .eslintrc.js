module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    '@cstar-industries'
  ],
  parserOptions: { 
    sourceType: 'module',
    ecmaVersion: '2020'
  },
  overrides: [
    {
      files: ['tests/*.{j,t}s?(x)'],
      env: {
        jest: true
      }
    }
  ]
};
