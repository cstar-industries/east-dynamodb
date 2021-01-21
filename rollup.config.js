import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
  external: ['path', '@aws-sdk/client-dynamodb', '@aws-sdk/util-dynamodb', /@babel\/runtime/],
  input: 'lib/index.js',
  plugins: [babel({ babelHelpers: 'runtime' }), terser()],
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    exports: 'auto',
    sourcemap: true
  }
};
