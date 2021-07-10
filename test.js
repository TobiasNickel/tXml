const tXml = require('.');
const assert = require('assert');
const fs = require('fs');

const files = {
	commented: __dirname + '/test/examples/commented.svg',
	commentOnly: __dirname + '/test/examples/commentOnly.svg',
	twoComments: __dirname + '/test/examples/twocomments.svg',
	tagesschauRSS: __dirname + '/test/examples/tagesschau.rss',
	wordpadDocxDocument: __dirname+'/test/examples/wordpad.docx.document.xml',
};

assert(tXml, 'tXml is available');
assert(Array.isArray(tXml.parse('')), 'tXml don\'t return an empty array for an empty string');

/******************************************************************************************************
 * 
 ******************************************************************************************************/
assert.deepStrictEqual(tXml.parse('<test>'), [{ tagName: 'test', attributes: {}, children: [] }], 'not even passed the simplest test');
assert.deepStrictEqual(tXml.parse('<test att="v">'), [{ "tagName": "test", "attributes": { "att": "v" }, "children": [] }], 'a single attribute');
assert.deepStrictEqual(
	tXml.parse('<test att="v" att2="two">'),
	[{ "tagName": "test", "attributes": { "att": "v", "att2": "two" }, "children": [] }],
	'multiple attributes'
);
assert.deepStrictEqual(tXml.parse('childTest'), ["childTest"], 'a single text');
assert.deepStrictEqual(tXml.parse('<test>childTest'), [{ "tagName": "test", "attributes": {}, "children": ["childTest"] }], 'a single child text');

assert.deepStrictEqual(tXml.parse('<test></test>'), [{ "tagName": "test", "attributes": {}, "children": [] }], 'simple closingTag');

assert.deepStrictEqual(
	tXml.parse('<test><cc></cc><cc></cc></test>'),
	[{ "tagName": "test", "attributes": {}, "children": [{ "tagName": "cc", "attributes": {}, "children": [] }, { "tagName": "cc", "attributes": {}, "children": [] }] }],
	'two childNodes'
);
assert.deepStrictEqual(
	tXml.parse('<!-- some comment --><test><cc c="d"><!-- some comment --></cc><!-- some comment --><cc>value<!-- some comment --></cc></test><!-- ending with not closing comment'),
	[{ "tagName": "test", "attributes": {}, "children": [{ "tagName": "cc", "children": [], "attributes": { "c": "d" } }, { "tagName": "cc", "attributes": {}, "children": ["value"] }] }],
	'simple childNodes + attribute + childText + ignore comments'
);
assert.deepStrictEqual(
	tXml.parse('<!DOCTYPE html><test><cc></cc><cc></cc></test>'),
	['!DOCTYPE html',{ "tagName": "test", "attributes": {}, "children": [{ "tagName": "cc", "attributes": {}, "children": [] }, { "tagName": "cc", "attributes": {}, "children": [] }] }],
	'two childNodes + ignore doctype declaration'
);
assert.deepStrictEqual(tXml.parse(`<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [
<!ENTITY ns_extend "http://ns.adobe.com/Extensibility/1.0/">
<!ENTITY ns_ai "http://ns.adobe.com/AdobeIllustrator/10.0/">
<!ENTITY ns_graphs "http://ns.adobe.com/Graphs/1.0/">
]>
<svg xmlns:x="&ns_extend;" xmlns:i="&ns_ai;" xmlns:graph="&ns_graphs;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" width="583.029px" height="45px" viewBox="0 0 583.029 45" enable-background="new 0 0 583.029 45" xml:space="preserve">
<input id="test">
</svg>`),
[
  {
    "tagName": "?xml",
    "attributes": {
      "version": "1.0",
      "encoding": "utf-8"
    },
    "children": []
  },
  "!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\" [\n<!ENTITY ns_extend \"http://ns.adobe.com/Extensibility/1.0/\">\n<!ENTITY ns_ai \"http://ns.adobe.com/AdobeIllustrator/10.0/\">\n<!ENTITY ns_graphs \"http://ns.adobe.com/Graphs/1.0/\">\n]",
  {
    "tagName": "svg",
    "attributes": {
      "xmlns:x": "&ns_extend;",
      "xmlns:i": "&ns_ai;",
      "xmlns:graph": "&ns_graphs;",
      "xmlns": "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      "version": "1.1",
      "x": "0px",
      "y": "0px",
      "width": "583.029px",
      "height": "45px",
      "viewBox": "0 0 583.029 45",
      "enable-background": "new 0 0 583.029 45",
      "xml:space": "preserve"
    },
    "children": [
      {
        "tagName": "input",
        "attributes": {
          "id": "test"
        },
        "children": []
      }
    ]
  }
]);

/******************************************************************************************************
 * use options 
 ******************************************************************************************************/
assert.deepStrictEqual(
	tXml.parse('<test><cc></cc><cc></cc></test>', { filter: function (element) { return element.tagName.toLowerCase() == 'cc'; } }),
	[{ "tagName": "cc", "attributes": {}, "children": [] }, { "tagName": "cc", "attributes": {}, "children": [] }],
	'get all "cc" nodes'
);
assert.deepStrictEqual(
	JSON.stringify(tXml.simplify(tXml.parse('<test><cc>one</cc>test<cc f="test"><sub>3</sub>two</cc><dd></dd></test>'))),
	JSON.stringify({ "test": { "cc": ["one", { "sub": "3", "_attributes": { "f": "test" } }], "dd": "" } }),
	'simplify'
);
assert.deepStrictEqual(
	tXml.parse('<test><style>*{some:10px;}/* <tag> comment */</style></test>'),
	[{ "tagName": "test", "attributes": {}, "children": [{ "tagName": "style", "attributes": {}, "children": ["*{some:10px;}/* <tag> comment */"] }] }],
	'css with tag as comment'
);

assert.deepStrictEqual(tXml.parse('<style>p { color: "red" }</style>'), [
	{
		tagName: 'style',
		attributes: {},
		children: ['p { color: "red" }'] // note here the closing bracket is missing
	}
], 'do not cut off the last character');

assert.deepStrictEqual(
	tXml.parse('<test><script>$("<div>")</script></test>'),
	[{ "tagName": "test", "attributes": {}, "children": [{ "tagName": "script", "attributes": {}, "children": ["$(\"<div>\")"] }] }],
	'js creating some tags'
);
var x = '<test a="value"><child a=\'g"g\'>text</child></test>'
assert(x === tXml.stringify(tXml.parse(x)), 'optimal xml string need to keep the same');

var xShould = [{ "tagName": "h1", "attributes": { "class": "test package-name other-class test2" }, "children": [] }];
var x = tXml.getElementsByClassName('<html><head></head><body><h1 class="test package-name other-class test2"></h1></body></html>', 'package-name');
assert.deepStrictEqual(x, xShould, 'find elements by class')

// re-stringify an attribute without value
var s = "<test><something flag></something></test>";
assert.deepStrictEqual(tXml.stringify(tXml.parse(s)), s, 'problem with attribute without value');
assert(tXml.stringify(undefined) === '', 'stringify ignore null values');

assert(tXml.toContentString(tXml.parse('<test>f<case number="2">f</case>f</test>')) === "f f  f")

assert.deepStrictEqual(
	tXml.getElementById('<test><child id="theId">found</child></test>', 'theId'),
	{ "tagName": "child", "attributes": { "id": "theId" }, "children": ["found"] }, 'id not found')

assert.deepStrictEqual(tXml.parse(`<xml><![CDATA[some data]]></xml>`),
	[{ tagName: 'xml', attributes: {}, children: ['some data'] }],
	'cdata'
);


assert.deepStrictEqual(tXml.simplifyLostLess(tXml.parse(`<question>
<text><![CDATA[<b>Question 1 Text</b>]]> </text>
<answers>
<text correct="1">1Answer 1 Text</text>
<text correct="0">1Answer 2 Text</text>
</answers>
</question>
<question>
<text><![CDATA[<b>Question 2 Text</b>]]> </text>
<answers>
<text correct="1">2Answer 1 Text</text>
<text correct="0">2Answer 2 Text</text>
</answers>
</question>`)),
	{
		"question": [
			{
				"text": [
					"<b>Question 1 Text</b>"
				],
				"answers": [
					{
						"text": [
							{
								"_attributes": {
									"correct": "1"
								},
								"value": "1Answer 1 Text"
							},
							{
								"_attributes": {
									"correct": "0"
								},
								"value": "1Answer 2 Text"
							}
						]
					}
				]
			},
			{
				"text": [
					"<b>Question 2 Text</b>"
				],
				"answers": [
					{
						"text": [
							{
								"_attributes": {
									"correct": "1"
								},
								"value": "2Answer 1 Text"
							},
							{
								"_attributes": {
									"correct": "0"
								},
								"value": "2Answer 2 Text"
							}
						]
					}
				]
			}
		]
	},
	'simplifyLostLess'
);

assert.deepStrictEqual(
	tXml.parse(`<test><!-- test --></test>`, { keepComments: true }),
	[ { tagName: 'test', attributes: {}, children: [ '<!-- test -->' ] } ],
	'keepComments'
);
assert.deepStrictEqual(
	tXml.parse(`<test><!-- test --><!-- test2 --></test>`, { keepComments: true }),
	[ { tagName: 'test', attributes: {}, children: [ '<!-- test -->', '<!-- test2 -->' ] } ],
	'keep two comments'
);
assert.deepStrictEqual(
	tXml.parse(`<test><!--></test>`, { keepComments: true }),
	[ { tagName: 'test', attributes: {}, children: [ '<!-->' ] } ],
	'keep two comments'
);


const svgWithCommentString = fs.readFileSync(files.commented).toString();
assert.deepStrictEqual(
	tXml.parse(svgWithCommentString),
	[{tagName:"svg",attributes:{height:"200",width:"500"},children:[{tagName:"polyline",attributes:{points:"20,20 40,25 60,40 80,120 120,140 200,180",style:"fill:none;stroke:black;stroke-width:3"},children:[]}]}],
	'svg with comment'
);

assert.deepStrictEqual(tXml.parse(`<!-- Test -->
<svg height="200" width="500">
  <polyline points="20,20 40,25 60,40 80,120 120,140 200,180" style="fill:none;stroke:black;stroke-width:3" />
</svg>`, { keepComments: true }),
	[
		'<!-- Test -->',
		{
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
		}
	]
);

assert.deepStrictEqual(tXml.parse('<![CDATA[nothing]]>'), ['nothing'], 'parse CDATA');
assert.deepStrictEqual(tXml.parse('<![CDATA[nothing'), ['nothing'], 'parse unclosed CDATA');

var noError = false;
try{
	tXml.parse('<user><name>robert</firstName><user>');
	noError = true;
}catch(e){}
assert.deepStrictEqual(noError, false, 'throw when the closeTag is wrong')

assert.deepStrictEqual(tXml.simplifyLostLess([]), {}, 'empty nodes simplify to empty object')
assert.deepStrictEqual(tXml.simplifyLostLess(['3']), '3', 'string list becomes the stirng')
assert.deepStrictEqual(tXml.simplifyLostLess(['1',2]), {}, 'ignore non objects')

assert.deepStrictEqual(tXml.filter([{}],()=>true), [{}], 'allow nodes without children')


const wordpadDoc = fs.readFileSync(files.wordpadDocxDocument).toString();
assert.deepStrictEqual(
	tXml.filter(
		tXml.parse(wordpadDoc, { keepWhitespace: true }),
		(n) => n.tagName === 'w:t'
	)[1].children[0],
	'    '
);


// https://github.com/TobiasNickel/tXml/issues/14
testAsync().catch(err=>console.log(err));
async function testAsync(){
	const xmlStreamCommentedSvg = fs.createReadStream(files.commented)
		.pipe(tXml.transformStream(0));
	let numberOfElements = 0;
	for await(let element of xmlStreamCommentedSvg) {
		numberOfElements++;
	}
	assert.strictEqual(numberOfElements, 1, 'expect to find one element in commented.svg')

	const xmlStreamTwoCommentedSvg = fs.createReadStream(files.twoComments)
		.pipe(tXml.transformStream('', { keepComments: true }));
	numberOfElements = 0;
	for await(let element of xmlStreamTwoCommentedSvg) {
		numberOfElements++;
	}
	assert.strictEqual(numberOfElements, 3, 'expect to find two comments and one element in twoComments.svg')

	const xmlStreamCommentOnlySvg = fs.createReadStream(files.commentOnly)
		.pipe(tXml.transformStream('', { keepComments: 0 }));
	numberOfElements = 0;
	for await(let element of xmlStreamCommentOnlySvg) {
		numberOfElements++;
	}
	assert.strictEqual(numberOfElements, 0, 'do not find unclosed comments')

	const xmlStreamLongXML = fs.createReadStream(__dirname + '/long.xml')
		.pipe(tXml.transformStream(5));
	numberOfElements = 0;
	for await(let element of xmlStreamLongXML) {
		numberOfElements++;
	}
	assert.strictEqual(numberOfElements, 10000000, 'expected to find many');
}

