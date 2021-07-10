import { terser } from 'rollup-plugin-terser'; // minifier

const config = {
  dir: 'dist',
  // Small hack to lowercase tXml in bundle
  sanitizeFileName: (f) => f.includes('tXml') ? f.toLowerCase() : f,
};

export default [
  {
    input: ['index.js', 'tXml.js', 'transformStream.js'],
    output: [
      {
        ...config,
        format: 'cjs',
        entryFileNames: '[name].js',
      },
      {
        ...config,
        format: 'esm',
        entryFileNames: '[name].mjs',
      },
    ],
    external: [
      'through2'
    ]
  },
  {
    input: 'tXml.js',
    output: {
      file: 'dist/txml.min.js',
      format: 'umd',
      name: 'txml',
    },
    plugins: [ terser() ],
  }
];
