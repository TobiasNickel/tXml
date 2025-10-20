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
