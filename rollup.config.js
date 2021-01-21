import babel from '@rollup/plugin-babel';
import copy from 'rollup-plugin-cpy';
import { terser } from 'rollup-plugin-terser';

export default {
  external: ['path', '@aws-sdk/client-dynamodb', '@aws-sdk/util-dynamodb', /@babel\/runtime/],
  input: 'lib/index.js',
  plugins: [babel({ babelHelpers: 'runtime' }), terser(), copy({ files: 'lib/template.js', dest: 'dist' })],
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    exports: 'auto',
    sourcemap: true
  }
};
