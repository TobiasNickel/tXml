const config = {
  dir: 'dist',
  sanitizeFileName: (f) => f.includes('tXml') ? f.toLowerCase() : f,
};

export default {
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
};
