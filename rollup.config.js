import terser from '@rollup/plugin-terser';

const config = {
  dir: 'dist',
  // Small hack to lowercase tXml in bundle
  sanitizeFileName: (f) => f.includes('tXml') ? f.toLowerCase() : f,
};

export default [
  // Main bundle (all exports)
  {
    input: 'src/index.js',
    output: [
      {
        ...config,
        format: 'cjs',
        entryFileNames: '[name].cjs',
        exports: 'named',
      },
      {
        ...config,
        format: 'esm',
        entryFileNames: '[name].mjs',
      },
    ],
    external: ['node:stream']
  },
  // Parser only (tree-shakeable, no Node.js dependencies)
  {
    input: 'src/tXml.js',
    output: [
      {
        ...config,
        format: 'cjs',
        entryFileNames: '[name].cjs',
        exports: 'named',
      },
      {
        ...config,
        format: 'esm',
        entryFileNames: '[name].mjs',
      },
      // Browser UMD bundle (minified)
      {
        file: 'dist/txml.min.js',
        format: 'umd',
        name: 'txml',
      }
    ],
    plugins: [
      terser()
    ]
  },
  // Transform stream
  {
    input: 'src/transformStream.js',
    output: [
      {
        ...config,
        format: 'cjs',
        entryFileNames: '[name].cjs',
        exports: 'named',
      },
      {
        ...config,
        format: 'esm',
        entryFileNames: '[name].mjs',
      },
    ],
    external: ['node:stream', './tXml.js']
  }
];
