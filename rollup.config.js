
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
  {
    input: './index.js',
    
    output: {
      file: 'dist/txml.js',
      format: 'cjs'
    },
    plugins: [
      resolve(),
      commonjs()
    ],  
    external: [
      'through2'
    ]
  },{
    input: './tXml.js',
    
    output: {
      file: 'dist/min.txml.js',
      format: 'cjs'
    },
    plugins: [
      resolve(),
      commonjs()
    ],  
    external: [
      'through2'
    ]
  },
];