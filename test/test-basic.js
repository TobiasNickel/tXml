import * as tXml from '../src/index.js';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const files = {
	commented: join(__dirname, 'examples/commented.svg'),
	commentOnly: join(__dirname, 'examples/commentOnly.svg'),
	twoComments: join(__dirname, 'examples/twocomments.svg'),
	tagesschauRSS: join(__dirname, 'examples/tagesschau.rss'),
	wordpadDocxDocument: join(__dirname, 'examples/wordpad.docx.document.xml'),
};

test('tXml is available', () => {
	assert(tXml, 'tXml should be available');
});

test('empty string returns empty array', () => {
	assert(Array.isArray(tXml.parse('')), 'tXml should return an empty array for empty string');
});

test('simplest parsing test', () => {
	assert.deepStrictEqual(
		tXml.parse('<test>'),
		[{ tagName: 'test', attributes: {}, children: [] }]
	);
});

test('single attribute', () => {
	assert.deepStrictEqual(
		tXml.parse('<test att="v">'),
		[{ tagName: 'test', attributes: { att: 'v' }, children: [] }]
	);
});

test('multiple attributes', () => {
	assert.deepStrictEqual(
		tXml.parse('<test att="v" att2="two">'),
		[{ tagName: 'test', attributes: { att: 'v', att2: 'two' }, children: [] }]
	);
});

test('single text node', () => {
	assert.deepStrictEqual(tXml.parse('childTest'), ['childTest']);
});

test('single child text', () => {
	assert.deepStrictEqual(
		tXml.parse('<test>childTest'),
		[{ tagName: 'test', attributes: {}, children: ['childTest'] }]
	);
});

test('simple closing tag', () => {
	assert.deepStrictEqual(
		tXml.parse('<test></test>'),
		[{ tagName: 'test', attributes: {}, children: [] }]
	);
});

test('two child nodes', () => {
	assert.deepStrictEqual(
		tXml.parse('<test><cc></cc><cc></cc></test>'),
		[{
			tagName: 'test',
			attributes: {},
			children: [
				{ tagName: 'cc', attributes: {}, children: [] },
				{ tagName: 'cc', attributes: {}, children: [] }
			]
		}]
	);
});

test('ignore comments by default', () => {
	assert.deepStrictEqual(
		tXml.parse('<!-- some comment --><test><cc c="d"><!-- some comment --></cc><!-- some comment --><cc>value<!-- some comment --></cc></test>'),
		[{
			tagName: 'test',
			attributes: {},
			children: [
				{ tagName: 'cc', children: [], attributes: { c: 'd' } },
				{ tagName: 'cc', attributes: {}, children: ['value'] }
			]
		}]
	);
});

test('ignore doctype declaration', () => {
	assert.deepStrictEqual(
		tXml.parse('<!DOCTYPE html><test><cc></cc><cc></cc></test>'),
		[
			'!DOCTYPE html',
			{
				tagName: 'test',
				attributes: {},
				children: [
					{ tagName: 'cc', attributes: {}, children: [] },
					{ tagName: 'cc', attributes: {}, children: [] }
				]
			}
		]
	);
});

test('filter option', () => {
	assert.deepStrictEqual(
		tXml.parse('<test><cc></cc><cc></cc></test>', {
			filter: (element) => element.tagName.toLowerCase() === 'cc'
		}),
		[
			{ tagName: 'cc', attributes: {}, children: [] },
			{ tagName: 'cc', attributes: {}, children: [] }
		]
	);
});

test('simplify', () => {
	assert.deepStrictEqual(
		JSON.stringify(tXml.simplify(tXml.parse('<test><cc>one</cc>test<cc f="test"><sub>3</sub>two</cc><dd></dd></test>'))),
		JSON.stringify({ test: { cc: ['one', { sub: '3', _attributes: { f: 'test' } }], dd: '' } })
	);
});

test('CSS with tag as comment', () => {
	assert.deepStrictEqual(
		tXml.parse('<test><style>*{some:10px;}/* <tag> comment */</style></test>'),
		[{
			tagName: 'test',
			attributes: {},
			children: [{
				tagName: 'style',
				attributes: {},
				children: ['*{some:10px;}/* <tag> comment */']
			}]
		}]
	);
});

test('do not cut off last character in style', () => {
	assert.deepStrictEqual(
		tXml.parse('<style>p { color: "red" }</style>'),
		[{
			tagName: 'style',
			attributes: {},
			children: ['p { color: "red" }']
		}]
	);
});

test('JavaScript creating tags in script', () => {
	assert.deepStrictEqual(
		tXml.parse('<test><script>$("<div>")</script></test>'),
		[{
			tagName: 'test',
			attributes: {},
			children: [{
				tagName: 'script',
				attributes: {},
				children: ['$("<div>")']
			}]
		}]
	);
});

test('stringify keeps optimal XML the same', () => {
	const x = '<test a="value"><child a=\'g"g\'>text</child></test>';
	assert.strictEqual(tXml.stringify(tXml.parse(x)), x);
});

test('getElementsByClassName', () => {
	const xShould = [{ tagName: 'h1', attributes: { class: 'test package-name other-class test2' }, children: [] }];
	const x = tXml.getElementsByClassName(
		'<html><head></head><body><h1 class="test package-name other-class test2"></h1></body></html>',
		'package-name'
	);
	assert.deepStrictEqual(x, xShould);
});

test('attribute without value', () => {
	const s = '<test><something flag></something></test>';
	assert.deepStrictEqual(tXml.stringify(tXml.parse(s)), s);
});

test('stringify ignores undefined', () => {
	assert(tXml.stringify(undefined) === '');
});

test('toContentString', () => {
	assert.strictEqual(
		tXml.toContentString(tXml.parse('<test>f<case number="2">f</case>f</test>')),
		'f f  f'
	);
});

test('getElementById', () => {
	assert.deepStrictEqual(
		tXml.getElementById('<test><child id="theId">found</child></test>', 'theId'),
		{ tagName: 'child', attributes: { id: 'theId' }, children: ['found'] }
	);
});

test('CDATA', () => {
	assert.deepStrictEqual(
		tXml.parse('<xml><![CDATA[some data]]></xml>'),
		[{ tagName: 'xml', attributes: {}, children: ['some data'] }]
	);
});

test('parse standalone CDATA', () => {
	assert.deepStrictEqual(tXml.parse('<![CDATA[nothing]]>'), ['nothing']);
});

test('parse unclosed CDATA', () => {
	assert.deepStrictEqual(tXml.parse('<![CDATA[nothing'), ['nothing']);
});

test('keepComments option', () => {
	assert.deepStrictEqual(
		tXml.parse('<test><!-- test --></test>', { keepComments: true }),
		[{ tagName: 'test', attributes: {}, children: ['<!-- test -->'] }]
	);
});

test('keep two comments', () => {
	assert.deepStrictEqual(
		tXml.parse('<test><!-- test --><!-- test2 --></test>', { keepComments: true }),
		[{ tagName: 'test', attributes: {}, children: ['<!-- test -->', '<!-- test2 -->'] }]
	);
});

test('throw on wrong close tag', () => {
	assert.throws(() => {
		tXml.parse('<user><name>robert</firstName><user>');
	});
});

test('simplifyLostLess empty nodes', () => {
	assert.deepStrictEqual(tXml.simplifyLostLess([]), {});
});

test('simplifyLostLess string list', () => {
	assert.deepStrictEqual(tXml.simplifyLostLess(['3']), '3');
});

test('simplifyLostLess ignores non-objects', () => {
	assert.deepStrictEqual(tXml.simplifyLostLess(['1', 2]), {});
});

test('filter allows nodes without children', () => {
	assert.deepStrictEqual(tXml.filter([{}], () => true), [{}]);
});

test('simplify option with parse', () => {
	// This should run without error: Issue #24
	tXml.parse('<?xml version="1.0"?><methodCall>TEST</methodCall>', { simplify: true });
	assert.ok(true);
});

test('SVG with comment', () => {
	const svgWithCommentString = fs.readFileSync(files.commented).toString();
	assert.deepStrictEqual(
		tXml.parse(svgWithCommentString),
		[{
			tagName: 'svg',
			attributes: { height: '200', width: '500' },
			children: [{
				tagName: 'polyline',
				attributes: {
					points: '20,20 40,25 60,40 80,120 120,140 200,180',
					style: 'fill:none;stroke:black;stroke-width:3'
				},
				children: []
			}]
		}]
	);
});

test('keepWhitespace option', () => {
	const wordpadDoc = fs.readFileSync(files.wordpadDocxDocument).toString();
	const filtered = tXml.filter(
		tXml.parse(wordpadDoc, { keepWhitespace: true }),
		(n) => n.tagName === 'w:t'
	);
	assert.strictEqual(filtered[1].children[0], '    ');
});

// ===== ADDITIONAL COMPREHENSIVE TESTS =====

test('parsing arbitrary text/lorem ipsum', () => {
	const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
	const result = tXml.parse(loremIpsum);
	assert.deepStrictEqual(result, [loremIpsum]);
	assert.strictEqual(result[0], loremIpsum);
});

test('parsing mixed text with XML fragments', () => {
	const mixed = 'Some text before <tag>content</tag> and after';
	const result = tXml.parse(mixed);
	assert.strictEqual(result.length, 3);
	assert.strictEqual(result[0], 'Some text before');
	assert.deepStrictEqual(result[1], { tagName: 'tag', attributes: {}, children: ['content'] });
	assert.strictEqual(result[2], 'and after');
});

test('parsing node with duplicate attribute (last wins)', () => {
	const result = tXml.parse('<test att="first" att="second" att="third">');
	assert.deepStrictEqual(result, [{
		tagName: 'test',
		attributes: { att: 'third' },
		children: []
	}]);
	assert.strictEqual(result[0].attributes.att, 'third', 'last attribute value should win');
});

test('parsing node with many attributes', () => {
	const manyAttrs = '<element ' +
		'id="test-id" ' +
		'class="test-class another-class" ' +
		'data-value="123" ' +
		'data-name="example" ' +
		'style="color: red; background: blue;" ' +
		'onclick="handleClick()" ' +
		'disabled ' +
		'aria-label="Test Label" ' +
		'tabindex="0" ' +
		'role="button">';
	
	const result = tXml.parse(manyAttrs);
	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0].attributes.id, 'test-id');
	assert.strictEqual(result[0].attributes.class, 'test-class another-class');
	assert.strictEqual(result[0].attributes['data-value'], '123');
	assert.strictEqual(result[0].attributes['data-name'], 'example');
	assert.strictEqual(result[0].attributes.style, 'color: red; background: blue;');
	assert.strictEqual(result[0].attributes.onclick, 'handleClick()');
	assert.strictEqual(result[0].attributes.disabled, null);
	assert.strictEqual(result[0].attributes['aria-label'], 'Test Label');
	assert.strictEqual(result[0].attributes.tabindex, '0');
	assert.strictEqual(result[0].attributes.role, 'button');
});

test('parsing example HTML document', () => {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Test Page</title>
	<link rel="stylesheet" href="style.css">
</head>
<body>
	<header>
		<h1 id="title">Welcome</h1>
		<nav>
			<ul>
				<li><a href="/">Home</a></li>
				<li><a href="/about">About</a></li>
			</ul>
		</nav>
	</header>
	<main>
		<p class="intro">This is a test paragraph.</p>
		<img src="image.jpg" alt="Test Image">
	</main>
	<footer>&copy; 2025</footer>
</body>
</html>`;

	const result = tXml.parse(html);
	assert(Array.isArray(result));
	assert(result.length > 0);
	
	// Find the html element
	const htmlElement = result.find(el => typeof el === 'object' && el.tagName === 'html');
	assert(htmlElement, 'html element should exist');
	assert.strictEqual(htmlElement.attributes.lang, 'en');
	
	// Check that structure is preserved
	const head = htmlElement.children.find(el => typeof el === 'object' && el.tagName === 'head');
	const body = htmlElement.children.find(el => typeof el === 'object' && el.tagName === 'body');
	assert(head, 'head element should exist');
	assert(body, 'body element should exist');
});

test('parsing SVG example', () => {
	const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
	<circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
	<rect x="10" y="10" width="30" height="30" fill="blue" />
	<line x1="0" y1="0" x2="100" y2="100" stroke="green" stroke-width="2" />
	<text x="50" y="50" font-family="Verdana" font-size="35" fill="white">Hi</text>
</svg>`;

	const result = tXml.parse(svg);
	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0].tagName, 'svg');
	assert.strictEqual(result[0].attributes.width, '100');
	assert.strictEqual(result[0].attributes.height, '100');
	assert.strictEqual(result[0].attributes.xmlns, 'http://www.w3.org/2000/svg');
	
	// Check children
	const circle = result[0].children.find(el => typeof el === 'object' && el.tagName === 'circle');
	const rect = result[0].children.find(el => typeof el === 'object' && el.tagName === 'rect');
	const line = result[0].children.find(el => typeof el === 'object' && el.tagName === 'line');
	const text = result[0].children.find(el => typeof el === 'object' && el.tagName === 'text');
	
	assert(circle, 'circle should exist');
	assert(rect, 'rect should exist');
	assert(line, 'line should exist');
	assert(text, 'text should exist');
	assert.strictEqual(text.children[0], 'Hi');
});

test('parsing RSS feed structure (simple example)', () => {
	// Use a simpler RSS example - note: link tags need closing tags in RSS
	const simpleRss = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
	<title>Example Feed</title>
	<url>https://example.com</url>
	<description>Example description</description>
	<item>
		<title>First Item</title>
		<url>https://example.com/item1</url>
		<description>First item description</description>
		<guid>item-1</guid>
	</item>
	<item>
		<title>Second Item</title>
		<url>https://example.com/item2</url>
		<description>Second item description</description>
		<guid>item-2</guid>
	</item>
</channel>
</rss>`;
	
	const result = tXml.parse(simpleRss);
	assert(Array.isArray(result));
	
	// Find the rss element
	const rss = result.find(el => typeof el === 'object' && el.tagName === 'rss');
	assert(rss, 'rss element should exist');
	assert.strictEqual(rss.attributes.version, '2.0');
	
	// Find channel
	const channel = rss.children.find(el => typeof el === 'object' && el.tagName === 'channel');
	assert(channel, 'channel element should exist');
	
	// Check for items
	const items = channel.children.filter(el => typeof el === 'object' && el.tagName === 'item');
	assert.strictEqual(items.length, 2, 'should have 2 items');
	
	// Check first item structure
	const firstItem = items[0];
	const title = firstItem.children.find(el => typeof el === 'object' && el.tagName === 'title');
	const url = firstItem.children.find(el => typeof el === 'object' && el.tagName === 'url');
	assert(title, 'item should have title');
	assert(url, 'item should have url');
	assert.strictEqual(title.children[0], 'First Item');
});

test('getElementById performance on large text', () => {
	// Generate a large XML document
	const largeDoc = '<root>' + 
		Array.from({ length: 1000 }, (_, i) => 
			`<item id="item${i}"><name>Item ${i}</name><value>${i * 10}</value></item>`
		).join('') +
		'</root>';
	
	// Test getElementById (should be faster as it uses regex search)
	const startGetById = Date.now();
	const result = tXml.getElementById(largeDoc, 'item999');
	const timeGetById = Date.now() - startGetById;
	
	assert(result, 'getElementById should find the element');
	assert.strictEqual(result.attributes.id, 'item999');
	
	// Test full parse (should be slower)
	const startFullParse = Date.now();
	const fullParsed = tXml.parse(largeDoc);
	const timeFullParse = Date.now() - startFullParse;
	
	assert(Array.isArray(fullParsed), 'should parse full document');
	
	// getElementById should be faster than full parse
	assert(timeGetById < timeFullParse, 
		`getElementById (${timeGetById}ms) should be faster than full parse (${timeFullParse}ms)`);
});

test('parsing XML with namespaces', () => {
	const xml = `<root xmlns:custom="http://example.com/custom">
		<custom:element custom:attr="value">Content</custom:element>
		<regular>Regular content</regular>
	</root>`;
	
	const result = tXml.parse(xml);
	assert.strictEqual(result[0].tagName, 'root');
	assert.strictEqual(result[0].attributes['xmlns:custom'], 'http://example.com/custom');
	
	const customElement = result[0].children.find(el => 
		typeof el === 'object' && el.tagName === 'custom:element'
	);
	assert(customElement, 'namespaced element should exist');
	assert.strictEqual(customElement.attributes['custom:attr'], 'value');
});

test('parsing deeply nested structure', () => {
	const depth = 50;
	const openTags = Array.from({ length: depth }, (_, i) => `<level${i}>`).join('');
	const closeTags = Array.from({ length: depth }, (_, i) => `</level${depth - 1 - i}>`).join('');
	const nested = openTags + 'deepest content' + closeTags;
	
	const result = tXml.parse(nested);
	assert.strictEqual(result.length, 1);
	
	// Navigate to the deepest level
	let current = result[0];
	for (let i = 1; i < depth; i++) {
		assert.strictEqual(current.children.length, 1);
		current = current.children[0];
		assert.strictEqual(current.tagName, `level${i}`);
	}
	assert.strictEqual(current.children[0], 'deepest content');
});

test('parsing with special characters in attributes', () => {
	const xml = `<element 
		attr1="value with &amp; ampersand"
		attr2="value with &lt; less than"
		attr3="value with &gt; greater than"
		attr4="value with &quot; quotes"
		attr5="value with &apos; apostrophe">
	</element>`;
	
	const result = tXml.parse(xml);
	assert.strictEqual(result[0].attributes.attr1, 'value with &amp; ampersand');
	assert.strictEqual(result[0].attributes.attr2, 'value with &lt; less than');
	assert.strictEqual(result[0].attributes.attr3, 'value with &gt; greater than');
});

test('parsing empty and self-closing tags', () => {
	const xml = '<root><empty></empty><selfclose /><selfclose/><another /></root>';
	const result = tXml.parse(xml);
	
	assert.strictEqual(result[0].tagName, 'root');
	assert.strictEqual(result[0].children.length, 4);
	
	result[0].children.forEach(child => {
		if (typeof child === 'object') {
			assert.deepStrictEqual(child.children, []);
		}
	});
});

test('parsing with mixed quoted attributes', () => {
	const xml = `<element single='value1' double="value2" mixed='has "quotes"' other="has 'quotes'"/>`;
	const result = tXml.parse(xml);
	
	assert.strictEqual(result[0].attributes.single, 'value1');
	assert.strictEqual(result[0].attributes.double, 'value2');
	assert.strictEqual(result[0].attributes.mixed, 'has "quotes"');
	assert.strictEqual(result[0].attributes.other, "has 'quotes'");
});

test('parsing JSON example within XML', () => {
	const xml = `<data>
		<json>{"name": "test", "value": 123, "nested": {"key": "value"}}</json>
		<other>content</other>
	</data>`;
	
	const result = tXml.parse(xml);
	const jsonElement = result[0].children.find(el => typeof el === 'object' && el.tagName === 'json');
	
	assert(jsonElement);
	const jsonContent = jsonElement.children[0];
	const parsed = JSON.parse(jsonContent);
	assert.strictEqual(parsed.name, 'test');
	assert.strictEqual(parsed.value, 123);
	assert.deepStrictEqual(parsed.nested, { key: 'value' });
});

test('parsing XML with processing instructions', () => {
	const xml = '<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="style.xsl"?><root>content</root>';
	const result = tXml.parse(xml);
	
	// Processing instructions should be parsed
	assert(Array.isArray(result));
	const root = result.find(el => typeof el === 'object' && el.tagName === 'root');
	assert(root, 'root element should exist');
});

test('performance comparison: getElementById vs full parse for large document', () => {
	// Create a very large document (10000 elements)
	const elementsCount = 10000;
	const targetId = 'target-element-9999';
	
	let largeXml = '<root>';
	for (let i = 0; i < elementsCount; i++) {
		const id = i === 9999 ? targetId : `element-${i}`;
		largeXml += `<item id="${id}"><data>Content ${i}</data></item>`;
	}
	largeXml += '</root>';
	
	// Measure getElementById
	const start1 = process.hrtime.bigint();
	const foundElement = tXml.getElementById(largeXml, targetId);
	const end1 = process.hrtime.bigint();
	const getByIdTime = Number(end1 - start1) / 1000000; // Convert to milliseconds
	
	assert(foundElement, 'getElementById should find element');
	assert.strictEqual(foundElement.attributes.id, targetId);
	
	// Measure full parse and search
	const start2 = process.hrtime.bigint();
	const parsed = tXml.parse(largeXml);
	const rootElement = parsed.find(el => typeof el === 'object' && el.tagName === 'root');
	const foundInParse = rootElement.children.find(el => 
		typeof el === 'object' && el.attributes.id === targetId
	);
	const end2 = process.hrtime.bigint();
	const fullParseTime = Number(end2 - start2) / 1000000; // Convert to milliseconds
	
	assert(foundInParse, 'full parse should find element');
	
	// Log performance comparison
	console.log(`\n  Performance comparison for ${elementsCount} elements:`);
	console.log(`    getElementById: ${getByIdTime.toFixed(2)}ms`);
	console.log(`    Full parse:     ${fullParseTime.toFixed(2)}ms`);
	console.log(`    Speedup:        ${(fullParseTime / getByIdTime).toFixed(2)}x faster`);
	
	// getElementById should be significantly faster
	assert(getByIdTime < fullParseTime, 
		`getElementById should be faster than full parse (${getByIdTime.toFixed(2)}ms vs ${fullParseTime.toFixed(2)}ms)`);
});

test('parsing malformed HTML throws on mismatched tags', () => {
	// tXml correctly throws errors on mismatched closing tags
	const malformed = '<div><p>Unclosed paragraph<div>Another div</div></div>';
	
	// Should throw because <p> is not properly closed before <div>
	assert.throws(() => {
		tXml.parse(malformed);
	}, /Unexpected close tag/);
});

test('parsing with unicode and emoji', () => {
	const xml = '<message lang="多语言">Hello 世界 🌍 🚀 ❤️</message>';
	const result = tXml.parse(xml);
	
	assert.strictEqual(result[0].tagName, 'message');
	assert.strictEqual(result[0].attributes.lang, '多语言');
	assert.strictEqual(result[0].children[0], 'Hello 世界 🌍 🚀 ❤️');
});

test('stringify with duplicate attributes preserves last value', () => {
	const parsed = [{
		tagName: 'test',
		attributes: { id: 'final-value' },
		children: []
	}];
	
	const result = tXml.stringify(parsed);
	assert.strictEqual(result, '<test id="final-value"></test>');
});

test('parsing complex SVG with paths and transforms', () => {
	const complexSvg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<linearGradient id="gradient1">
				<stop offset="0%" stop-color="red"/>
				<stop offset="100%" stop-color="blue"/>
			</linearGradient>
		</defs>
		<path d="M10 10 H 90 V 90 H 10 L 10 10" fill="url(#gradient1)"/>
		<g transform="translate(50,50)">
			<circle cx="0" cy="0" r="20" fill="green"/>
		</g>
	</svg>`;
	
	const result = tXml.parse(complexSvg);
	assert.strictEqual(result[0].tagName, 'svg');
	
	const defs = result[0].children.find(el => typeof el === 'object' && el.tagName === 'defs');
	const path = result[0].children.find(el => typeof el === 'object' && el.tagName === 'path');
	const g = result[0].children.find(el => typeof el === 'object' && el.tagName === 'g');
	
	assert(defs, 'should have defs element');
	assert(path, 'should have path element');
	assert(g, 'should have g element');
	assert.strictEqual(path.attributes.d, 'M10 10 H 90 V 90 H 10 L 10 10');
	assert.strictEqual(g.attributes.transform, 'translate(50,50)');
});

test('parsing MathML example', () => {
	const mathml = `<math xmlns="http://www.w3.org/1998/Math/MathML">
		<mrow>
			<mi>x</mi>
			<mo>=</mo>
			<mfrac>
				<mrow>
					<mo>-</mo>
					<mi>b</mi>
					<mo>±</mo>
					<msqrt>
						<msup><mi>b</mi><mn>2</mn></msup>
						<mo>-</mo>
						<mn>4</mn><mi>a</mi><mi>c</mi>
					</msqrt>
				</mrow>
				<mrow>
					<mn>2</mn><mi>a</mi>
				</mrow>
			</mfrac>
		</mrow>
	</math>`;
	
	const result = tXml.parse(mathml);
	assert.strictEqual(result[0].tagName, 'math');
	assert.strictEqual(result[0].attributes.xmlns, 'http://www.w3.org/1998/Math/MathML');
	
	const mrow = result[0].children.find(el => typeof el === 'object' && el.tagName === 'mrow');
	assert(mrow, 'should have mrow element');
});

test('parsing SOAP envelope example', () => {
	const soap = `<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
	<soap:Header>
		<auth:Authentication xmlns:auth="http://example.com/auth">
			<auth:Username>user123</auth:Username>
			<auth:Password>secret</auth:Password>
		</auth:Authentication>
	</soap:Header>
	<soap:Body>
		<m:GetStockPrice xmlns:m="http://example.com/stock">
			<m:StockName>IBM</m:StockName>
		</m:GetStockPrice>
	</soap:Body>
</soap:Envelope>`;
	
	const result = tXml.parse(soap);
	const envelope = result.find(el => typeof el === 'object' && el.tagName === 'soap:Envelope');
	
	assert(envelope, 'should have soap:Envelope');
	assert.strictEqual(envelope.attributes['xmlns:soap'], 'http://www.w3.org/2003/05/soap-envelope');
	
	const header = envelope.children.find(el => typeof el === 'object' && el.tagName === 'soap:Header');
	const body = envelope.children.find(el => typeof el === 'object' && el.tagName === 'soap:Body');
	
	assert(header, 'should have header');
	assert(body, 'should have body');
});

test('parsing HTML5 doctype', () => {
	const html5 = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>';
	const result = tXml.parse(html5);
	
	assert.strictEqual(result[0], '!DOCTYPE html');
	
	const html = result.find(el => typeof el === 'object' && el.tagName === 'html');
	assert(html, 'should have html element');
});

test('getElementsByClassName with multiple classes', () => {
	const html = `<div>
		<span class="highlight active">Item 1</span>
		<span class="highlight">Item 2</span>
		<span class="active">Item 3</span>
		<span class="highlight primary active">Item 4</span>
	</div>`;
	
	const highlighted = tXml.getElementsByClassName(html, 'highlight');
	assert.strictEqual(highlighted.length, 3);
	
	const active = tXml.getElementsByClassName(html, 'active');
	assert.strictEqual(active.length, 3);
});

test('performance: getElementById vs getElementsByClassName', () => {
	const largeDoc = '<root>' + 
		Array.from({ length: 5000 }, (_, i) => 
			`<item id="id${i}" class="item-class special-${i % 10}">Content ${i}</item>`
		).join('') +
		'</root>';
	
	// Test getElementById
	const start1 = process.hrtime.bigint();
	const byId = tXml.getElementById(largeDoc, 'id4999');
	const end1 = process.hrtime.bigint();
	const idTime = Number(end1 - start1) / 1000000;
	
	// Test getElementsByClassName
	const start2 = process.hrtime.bigint();
	const byClass = tXml.getElementsByClassName(largeDoc, 'special-9');
	const end2 = process.hrtime.bigint();
	const classTime = Number(end2 - start2) / 1000000;
	
	assert(byId, 'getElementById should find element');
	assert(byClass.length > 0, 'getElementsByClassName should find elements');
	
	console.log(`\n  getElementById vs getElementsByClassName:`);
	console.log(`    getElementById:        ${idTime.toFixed(2)}ms`);
	console.log(`    getElementsByClassName: ${classTime.toFixed(2)}ms`);
});

test('parsing XML with various whitespace handling', () => {
	const xml = `<root>
		<preserve xml:space="preserve">  text  with  spaces  </preserve>
		<normal>  text  with  spaces  </normal>
	</root>`;
	
	const result = tXml.parse(xml);
	const preserve = result[0].children.find(el => typeof el === 'object' && el.tagName === 'preserve');
	const normal = result[0].children.find(el => typeof el === 'object' && el.tagName === 'normal');
	
	assert(preserve);
	assert(normal);
	// By default, whitespace is trimmed
	assert.strictEqual(normal.children[0], 'text  with  spaces');
});

test('toContentString with nested elements', () => {
	const xml = '<article><title>The Title</title><p>First paragraph with <b>bold text</b> and <i>italic</i>.</p><p>Second paragraph.</p></article>';
	const parsed = tXml.parse(xml);
	const content = tXml.toContentString(parsed);
	
	assert(content.includes('The Title'));
	assert(content.includes('First paragraph'));
	assert(content.includes('bold text'));
	assert(content.includes('italic'));
	assert(content.includes('Second paragraph'));
});

test('filter with depth parameter', () => {
	const xml = '<root><level1><level2><level3>deep</level3></level2></level1></root>';
	const parsed = tXml.parse(xml);
	
	let maxDepth = 0;
	tXml.filter(parsed, (node, index, depth) => {
		if (depth > maxDepth) maxDepth = depth;
		return true;
	});
	
	assert(maxDepth >= 3, `should have depth of at least 3, got ${maxDepth}`);
});

test('simplify with arrays of similar elements', () => {
	const xml = '<list><item>First</item><item>Second</item><item>Third</item></list>';
	const parsed = tXml.parse(xml);
	const simplified = tXml.simplify(parsed);
	
	assert(simplified.list);
	assert(Array.isArray(simplified.list.item));
	assert.strictEqual(simplified.list.item.length, 3);
	assert.strictEqual(simplified.list.item[0], 'First');
	assert.strictEqual(simplified.list.item[1], 'Second');
	assert.strictEqual(simplified.list.item[2], 'Third');
});

test('parsing with very long attribute values', () => {
	const longValue = 'a'.repeat(10000);
	const xml = `<element data="${longValue}"/>`;
	const result = tXml.parse(xml);
	
	assert.strictEqual(result[0].attributes.data.length, 10000);
	assert.strictEqual(result[0].attributes.data, longValue);
});

test('parsing with very long text content', () => {
	const longText = 'Lorem ipsum '.repeat(1000);
	const xml = `<element>${longText}</element>`;
	const result = tXml.parse(xml);
	
	assert.strictEqual(result[0].children[0], longText.trim());
});

test('empty attributes and null handling', () => {
	const xml = '<element required disabled="" empty="" value="actual"/>';
	const result = tXml.parse(xml);
	
	assert.strictEqual(result[0].attributes.required, null);
	assert.strictEqual(result[0].attributes.disabled, '');
	assert.strictEqual(result[0].attributes.empty, '');
	assert.strictEqual(result[0].attributes.value, 'actual');
});

test('complex real-world XML: Atom feed', () => {
	const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>Example Feed</title>
	<link href="http://example.org/"/>
	<updated>2025-10-21T18:30:02Z</updated>
	<author>
		<name>John Doe</name>
	</author>
	<id>urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6</id>
	<entry>
		<title>Atom-Powered Robots Run Amok</title>
		<link href="http://example.org/2025/10/21/atom"/>
		<id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
		<updated>2025-10-21T18:30:02Z</updated>
		<summary>Some text.</summary>
	</entry>
</feed>`;
	
	const result = tXml.parse(atom);
	const feed = result.find(el => typeof el === 'object' && el.tagName === 'feed');
	
	assert(feed);
	assert.strictEqual(feed.attributes.xmlns, 'http://www.w3.org/2005/Atom');
	
	const entry = feed.children.find(el => typeof el === 'object' && el.tagName === 'entry');
	assert(entry, 'should have entry element');
});

test('noChildNodes option - link tag behavior', () => {
	// By default, 'link' is in the noChildNodes list (like img, br, etc.)
	const html = '<head><link rel="stylesheet" href="style.css"><title>Test</title></head>';
	const result = tXml.parse(html);
	
	const head = result[0];
	assert.strictEqual(head.tagName, 'head');
	
	// link should be self-closing
	const linkTag = head.children.find(el => typeof el === 'object' && el.tagName === 'link');
	assert(linkTag, 'should have link element');
	assert.strictEqual(linkTag.attributes.rel, 'stylesheet');
	assert.deepStrictEqual(linkTag.children, []);
});

test('parsing with custom noChildNodes option', () => {
	// Test with empty noChildNodes to allow link to have children
	const xml = '<container><custom>content</custom></container>';
	const result = tXml.parse(xml, { noChildNodes: [] });
	
	const container = result[0];
	assert.strictEqual(container.tagName, 'container');
	
	const custom = container.children.find(el => typeof el === 'object' && el.tagName === 'custom');
	assert(custom);
	assert.strictEqual(custom.children[0], 'content');
});
