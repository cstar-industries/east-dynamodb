export default {
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['jest-extended', './tests/setup.js'],
  testEnvironment: 'node'
};
