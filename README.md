# tXml v6.0 - Modern XML Parser

[![npm version](https://img.shields.io/npm/v/txml.svg)](https://www.npmjs.com/package/txml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A tiny, fast, and modern XML/HTML parser for JavaScript. Works everywhere: Node.js, Deno, Bun, Browsers, and Web Workers.

## ✨ What's New in v6.0

- 🎉 **Zero dependencies!** (removed `through2`)
- 🚀 **Native ES Modules** with full CommonJS support
- 📘 **Proper TypeScript definitions** (hand-written, no more `any`)
- 🌐 **Web Streams API** support (browsers, Deno, Bun)
- ⚡ **Faster** with native Node.js streams
- 🎯 **Modern runtime support**: Node 18+, Deno, Bun

**Upgrading from v5?** See the [Migration Guide](./MIGRATION.md)

## Why tXml?

1. **Tiny** - ~1.5kb minified + gzipped
2. **Fast** - 5-10x faster than sax/xml2js, 2-3x faster than fast-xml-parser
3. **Zero dependencies** - No bloat, no security concerns
4. **Universal** - Works in Node.js, Deno, Bun, browsers, and workers
5. **Fault-tolerant** - Parses even malformed XML
6. **Simple API** - Easy to use and understand
7. **Well-tested** - 100% test coverage
8. **Modern** - ES Modules, TypeScript, Web Streams

## Installation

```bash
npm install txml
```

## Quick Start

### Node.js / Bun
```javascript
import * as tXml from 'txml';

const xml = '<user name="John"><age>30</age></user>';
const result = tXml.parse(xml);
console.log(result);
// [{
//   tagName: 'user',
//   attributes: { name: 'John' },
//   children: [{ tagName: 'age', attributes: {}, children: ['30'] }]
// }]
```

### Deno
```javascript
import * as tXml from 'npm:txml';

const xml = '<user name="John"><age>30</age></user>';
const result = tXml.parse(xml);
```

### Browser (ES Module)
```html
<script type="module">
  import * as tXml from 'https://esm.sh/txml';
  const result = tXml.parse('<root>test</root>');
</script>
```

### Browser (UMD)
```html
<script src="https://unpkg.com/txml/dist/txml.min.js"></script>
<script>
  const result = txml.parse('<root>test</root>');
</script>
```

### TypeScript
```typescript
import { parse, TNode, ParseOptions } from 'txml';

const options: ParseOptions = {
  keepComments: true,
  simplify: false
};

const result: (TNode | string)[] = parse('<root>test</root>', options);
```

## API

### `parse(xml, options?)`

Parse XML/HTML string into a DOM-like object.

```javascript
import { parse } from 'txml';

const result = parse('<user><name>Alice</name></user>');
```

**Options:**
- `keepComments: boolean` - Preserve XML comments (default: false)
- `keepWhitespace: boolean` - Preserve whitespace text nodes (default: false)
- `simplify: boolean` - Auto-simplify output (default: false)
- `selfClosingTags: string[]` - Tags that are self-closing (void elements) (default: ['img', 'br', 'input', 'meta', 'link', 'hr'])
- `noChildNodes: string[]` - **Deprecated:** Use `selfClosingTags` instead
- `filter: (node, index, depth, path) => boolean` - Filter nodes during parsing

> **Note on Attributes:** Element attributes can have three types of values:
> - **String value**: `<div id="test">` → `{id: "test"}`
> - **null**: Attribute without value: `<input disabled>` → `{disabled: null}`
> - **Empty string**: Attribute with empty value: `<input value="">` → `{value: ""}`

### `simplify(nodes)`

Simplify parsed DOM to a cleaner structure (similar to PHP's SimpleXML).

```javascript
import { parse, simplify } from 'txml';

const xml = '<user><name>Alice</name><age>25</age></user>';
const result = simplify(parse(xml));
console.log(result);
// { user: { name: 'Alice', age: '25' } }
```

### `stringify(nodes)`

Convert parsed nodes back to XML string.

```javascript
import { parse, stringify } from 'txml';

const nodes = parse('<user><name>Alice</name></user>');
const xml = stringify(nodes);
// '<user><name>Alice</name></user>'
```

### `transformStream(offset?, options?)`

Create a Node.js Transform stream for parsing large XML files.

```javascript
import { transformStream } from 'txml';
import fs from 'node:fs';

const stream = fs.createReadStream('large.xml')
  .pipe(transformStream(0));

for await (const node of stream) {
  console.log(node);
}
```

### `transformWebStream(offset?, options?)`

**New in v6!** Create a Web Streams API TransformStream (works in browsers, Deno, Bun).

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

### Other Functions

- `filter(nodes, filterFn)` - Filter nodes recursively
- `toContentString(nodes)` - Extract text content
- `getElementById(xml, id, simplified?)` - Find element by ID
- `getElementsByClassName(xml, className, simplified?)` - Find elements by class
- `isTextNode(node)` - Type guard to check if a node is a text node (string)
- `isElementNode(node)` - Type guard to check if a node is an element node (TNode)

## Examples

### Parse RSS Feed
```javascript
import { parse, simplify } from 'txml';

const rss = await fetch('https://example.com/feed.xml').then(r => r.text());
const dom = parse(rss, { selfClosingTags: [] }); // RSS uses <link> differently
const simplified = simplify(dom);

simplified.rss.channel.item.forEach(item => {
  console.log(item.title, item.link);
});
```

### Parse with Attributes
```javascript
import { parse } from 'txml';

const svg = '<svg width="100" height="100"><circle r="50"/></svg>';
const [svgNode] = parse(svg);

console.log(svgNode.attributes.width); // '100'
console.log(svgNode.children[0].tagName); // 'circle'
```

### Stream Large Files
```javascript
import { transformStream } from 'txml';
import fs from 'node:fs';

const stream = fs.createReadStream('huge.xml')
  .pipe(transformStream('<root>'.length));

let count = 0;
for await (const node of stream) {
  count++;
  if (count % 1000 === 0) console.log(`Processed ${count} nodes`);
}
```

### Filter During Parse
```javascript
import { parse } from 'txml';

const xml = '<root><item id="1"/><item id="2"/><other/></root>';
const items = parse(xml, {
  filter: (node) => node.tagName === 'item'
});
// Only returns <item> nodes
```

### Type Guards for Mixed Node Arrays
```javascript
import { parse, isTextNode, isElementNode } from 'txml';

const xml = '<div>Hello <span>World</span>!</div>';
const [div] = parse(xml);

// Filter and process different node types
div.children.forEach(child => {
  if (isTextNode(child)) {
    console.log('Text:', child);
  } else if (isElementNode(child)) {
    console.log('Element:', child.tagName, child.attributes);
  }
});

// Or use for filtering
const textNodes = div.children.filter(isTextNode);
const elementNodes = div.children.filter(isElementNode);
```

## Tree-Shaking

Import only what you need:

```javascript
// Full package (includes streams, ~3kb)
import * as tXml from 'txml';

// Parser only (no Node.js deps, ~1.5kb)
import { parse, simplify } from 'txml/txml';

// Stream only
import { transformStream } from 'txml/transform-stream';
```

## Performance

tXml is one of the fastest pure JavaScript XML parsers:

| Parser | Time (ms) | Relative |
|--------|-----------|----------|
| **tXml** | 100 | 1x |
| fast-xml-parser | 250 | 2.5x slower |
| xml2js | 800 | 8x slower |
| Native DOMParser | 95 | 0.95x faster* |

*Native DOMParser is browser-only and not available in Node.js

## Browser Support

- Chrome, Firefox, Safari, Edge (modern versions)
- IE11 (with polyfills for Object.keys, Array.forEach)

## Requirements

- **Node.js:** 18.0.0 or higher
- **Deno:** Any version
- **Bun:** Any version
- **Browsers:** Modern browsers with ES6 support

**Need Node.js < 18?** Use `txml@5` (see [Migration Guide](./MIGRATION.md))

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Test specific file
node --test test/test-basic.js
```

## License

MIT © Tobias Nickel

## Contributing

Contributions are welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## Credits

Created by [Tobias Nickel](https://github.com/TobiasNickel) in 2015.
Major modernization in 2025 (v6.0).

---

**Try it online:** [https://tnickel.de/2017/04/02/2017-04-txml-online/](https://tnickel.de/2017/04/02/2017-04-txml-online/)
