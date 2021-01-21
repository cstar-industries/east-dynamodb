import babel from '@rollup/plugin-babel';

export default {
  external: ['path', '@aws-sdk/client-dynamodb', '@aws-sdk/util-dynamodb', /@babel\/runtime/],
  input: 'lib/index.js',
  plugins: [babel({ babelHelpers: 'runtime' })],
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
    exports: 'auto',
    sourcemap: true
  }
};
