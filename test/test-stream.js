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
};

test('stream: single element in commented.svg', async () => {
	const xmlStreamCommentedSvg = fs.createReadStream(files.commented)
		.pipe(tXml.transformStream(0));
	let numberOfElements = 0;
	for await (let element of xmlStreamCommentedSvg) {
		numberOfElements++;
	}
	assert.strictEqual(numberOfElements, 1, 'expect to find one element in commented.svg');
});

test('stream: two comments and one element with keepComments', async () => {
	const xmlStreamTwoCommentedSvg = fs.createReadStream(files.twoComments)
		.pipe(tXml.transformStream('', { keepComments: true }));
	let numberOfElements = 0;
	for await (let element of xmlStreamTwoCommentedSvg) {
		numberOfElements++;
	}
	assert.strictEqual(numberOfElements, 3, 'expect to find two comments and one element in twoComments.svg');
});

test('stream: do not find unclosed comments', async () => {
	const xmlStreamCommentOnlySvg = fs.createReadStream(files.commentOnly)
		.pipe(tXml.transformStream('', { keepComments: 0 }));
	let numberOfElements = 0;
	for await (let element of xmlStreamCommentOnlySvg) {
		numberOfElements++;
	}
	assert.strictEqual(numberOfElements, 0, 'do not find unclosed comments');
});

// Only run if long.xml exists
test('stream: long XML file', { skip: !fs.existsSync(join(__dirname, '../long.xml')) }, async () => {
	const xmlStreamLongXML = fs.createReadStream(join(__dirname, '../long.xml'))
		.pipe(tXml.transformStream(5));
	let numberOfElements = 0;
	for await (let element of xmlStreamLongXML) {
		numberOfElements++;
	}
	assert.strictEqual(numberOfElements, 10000000, 'expected to find many');
});
