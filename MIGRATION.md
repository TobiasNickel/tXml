# Migration Guide: tXml v5 → v6

## Overview

Version 6.0 is a major modernization update that embraces modern JavaScript standards while maintaining the core XML parsing functionality you know and love.

## Breaking Changes

### 1. **Node.js Version Requirement**
- **v5**: Node.js 12+ 
- **v6**: Node.js 18+ ✨

**Why:** Node.js 12-17 are all end-of-life. By targeting Node 18+, we get better ESM support, native test runner, and modern features.

### 2. **ES Modules (ESM) by Default**
The package now uses `"type": "module"` in package.json.

**v5:**
```javascript
const tXml = require('txml');
// or
import * as tXml from 'txml';
```

**v6 (recommended):**
```javascript
import * as tXml from 'txml';
// or named imports
import { parse, simplify } from 'txml';
```

**v6 (CommonJS still supported):**
```javascript
const tXml = require('txml');
// Still works via the .cjs builds!
```

### 3. **Zero Dependencies! 🎉**
The `through2` dependency has been removed. Transform streams now use native Node.js streams.

**Impact:** Your bundle size just got smaller, and there are fewer security audit concerns.

### 4. **Transform Stream Changes**

**v5:**
```javascript
const stream = tXml.transformStream(offset, options);
// Uses through2 wrapper
```

**v6:**
```javascript
// Node.js (native Transform stream)
import { transformStream } from 'txml';
const stream = transformStream(offset, options);

// New! Web Streams API (works in browsers, Deno, Bun)
import { transformWebStream } from 'txml';
const webStream = transformWebStream(offset, options);
```

### 5. **Export Path Changes**

**v5:**
```javascript
import { transformStream } from 'txml/transformStream';
```

**v6:**
```javascript
import { transformStream } from 'txml/transform-stream';
// Note: kebab-case is now the convention
```

All exports:
- `txml` - Main package (all exports)
- `txml/txml` - Parser only (no Node.js dependencies, tree-shakeable)
- `txml/transform-stream` - Streaming parser

## New Features

### 1. **Better TypeScript Support**
Hand-written TypeScript definitions with proper types (no more `any`!).

```typescript
import { parse, TNode, ParseOptions } from 'txml';

const options: ParseOptions = {
  keepComments: true,
  simplify: false
};

const result: (TNode | string)[] = parse(xml, options);
```

### 2. **Web Streams API Support**
Works in browsers, Deno, and Bun:

```javascript
import { transformWebStream } from 'txml';

const response = await fetch('data.xml');
const xmlStream = response.body
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(transformWebStream(0));

for await (const node of xmlStream) {
  console.log(node);
}
```

### 3. **Better Build Outputs**
- `dist/index.mjs` - ESM bundle
- `dist/index.cjs` - CommonJS bundle  
- `dist/txml.min.js` - UMD browser bundle (minified)
- `dist/*.d.ts` - TypeScript definitions

## Platform Support

| Platform | v5 | v6 |
|----------|----|----|
| Node.js 18+ | ✅ | ✅ |
| Node.js 12-17 | ✅ | ❌ |
| Deno | ⚠️ | ✅ |
| Bun | ⚠️ | ✅ |
| Browser (ESM) | ✅ | ✅ |
| Browser (UMD) | ✅ | ✅ |
| Web Workers | ✅ | ✅ |

## Migration Steps

### For Modern Projects (Recommended)

1. **Update package.json:**
   ```bash
   npm install txml@6
   ```

2. **Update imports to use ESM:**
   ```javascript
   // Before
   const tXml = require('txml');
   
   // After
   import * as tXml from 'txml';
   ```

3. **Update transform stream usage (if applicable):**
   ```javascript
   // If you need Web Streams API
   import { transformWebStream } from 'txml/transform-stream';
   ```

4. **Run tests** - That's it!

### For Legacy Projects

If you **must** stay on Node.js < 18:
```bash
npm install txml@5
```

Version 5.x will receive security fixes for the next 12 months.

### For CommonJS Projects

Good news! CommonJS is still fully supported:
```javascript
const tXml = require('txml'); // Works!
```

The package provides both ESM (.mjs) and CommonJS (.cjs) builds.

## Environment-Specific Examples

### Node.js
```javascript
import * as tXml from 'txml';
const result = tXml.parse('<root>test</root>');
```

### Deno
```javascript
import * as tXml from 'npm:txml';
const result = tXml.parse('<root>test</root>');
```

### Bun
```javascript
import * as tXml from 'txml';
const result = tXml.parse('<root>test</root>');
```

### Browser (ESM)
```html
<script type="module">
  import * as tXml from 'https://esm.sh/txml@6';
  const result = tXml.parse('<root>test</root>');
</script>
```

### Browser (UMD)
```html
<script src="https://unpkg.com/txml@6/dist/txml.min.js"></script>
<script>
  const result = txml.parse('<root>test</root>');
</script>
```

## FAQ

### Q: Will v5 still be maintained?
**A:** Yes, v5 will receive security fixes for 12 months. After that, it's time to upgrade!

### Q: My tests are failing with "Cannot use import statement outside a module"
**A:** Your test files need to use ESM. Either:
1. Rename them to `.mjs`, or
2. Add `"type": "module"` to your package.json, or
3. Use `.cjs` extension for CommonJS files

### Q: Can I use v6 with Webpack/Rollup/Vite?
**A:** Yes! Modern bundlers handle ESM perfectly. You'll likely get better tree-shaking too.

### Q: What about TypeScript?
**A:** TypeScript definitions are much better in v6! You get proper types instead of `any`.

### Q: Performance differences?
**A:** Slightly faster! Native streams are more efficient than wrapped ones, and fewer dependencies mean faster installs.

## Need Help?

- 📖 [Full README](./README.md)
- 🐛 [Report Issues](https://github.com/TobiasNickel/tXml/issues)
- 💬 [Discussions](https://github.com/TobiasNickel/tXml/discussions)

## Changelog Summary

### Added ✨
- Native ES module support
- Web Streams API (`transformWebStream`)
- Hand-written TypeScript definitions
- Support for Deno and Bun
- Node.js 18+ native test runner

### Changed 🔄
- Minimum Node.js version: 18
- Transform streams use native Node.js streams (zero dependencies!)
- Export path: `transformStream` → `transform-stream`
- Package now uses `"type": "module"`

### Removed 🗑️
- `through2` dependency
- Support for Node.js < 18
- Old minified file in root (use `dist/txml.min.js`)

---

**Welcome to the future of tXml! 🚀**
