const baseConfig = {
  dir: 'dist',
  sanitizeFileName: (f) => f.includes('tXml') ? f.toLowerCase() : f,
};

export default {
  input: ['index.js', 'tXml.js', 'transformStream.js'],
  output: [
    {
      ...baseConfig,
      format: 'cjs',
      entryFileNames: '[name].js',
    },
    {
      ...baseConfig,
      format: 'esm',
      entryFileNames: '[name].mjs',
    },
  ],
  external: [
    'through2'
  ]
};
