const { xml } = require('./tXml');
const assert = require('assert');

assert(xml, 'tXml is available');
assert(Array.isArray(xml('')), 'tXml don\'t return an empty array for an empty string');

/******************************************************************************************************
 * 
 ******************************************************************************************************/
assert.deepEqual(xml('<test>'),[{tagName:'test', attributes: {}, children:[]}],'not even passed the simplest test');
assert.deepEqual(xml('<test att="v">'),[{"tagName":"test","attributes":{"att":"v"},"children":[]}],'a single attribute');
assert.deepEqual(
	xml('<test att="v" att2="two">'),
	[{"tagName":"test","attributes":{"att":"v","att2":"two"},"children":[]}],
	'multiple attributes'
);
assert.deepEqual(xml('childTest'),["childTest"],'a single text');
assert.deepEqual(xml('<test>childTest'),[{"tagName":"test","attributes":{},"children":["childTest"]}],'a single child text');
assert.deepEqual(xml('<test></test>'),[{"tagName":"test","attributes":{},"children":[]}],'simple closingTag');
assert.deepEqual(
	xml('<test><cc></cc><cc></cc></test>'),
	[{"tagName":"test","attributes":{},"children":[{"tagName":"cc","attributes":{},"children":[]},{"tagName":"cc","attributes":{},"children":[]}]}],
	'two childNodes'
);
assert.deepEqual(
	xml('<!-- some comment --><test><cc c="d"><!-- some comment --></cc><!-- some comment --><cc>value<!-- some comment --></cc></test><!-- ending with not closing comment'),
	[{"tagName":"test","attributes":{},"children":[{"tagName":"cc","children":[],"attributes":{"c":"d"}},{"tagName":"cc","attributes":{},"children":["value"]}]}],
	'simple childNodes + attribute + childText + ignore comments'
);
assert.deepEqual(
	xml('<!DOCTYPE html><test><cc></cc><cc></cc></test>'),
	[{"tagName":"test","attributes":{},"children":[{"tagName":"cc","attributes":{},"children":[]},{"tagName":"cc","attributes":{},"children":[]}]}],
	'two childNodes + ignore doctype declaration'
);


/******************************************************************************************************
 * use options 
 ******************************************************************************************************/
assert.deepEqual(
	xml('<test><cc></cc><cc></cc></test>',{filter:function(element){return element.tagName.toLowerCase() == 'cc';}}),
	[{"tagName":"cc","attributes":{},"children":[]},{"tagName":"cc","attributes":{},"children":[]}],
	'get all "cc" nodes'
);
assert.deepEqual(
	xml.simplify(xml('<test><cc>one</cc>test<cc f="test"><sub>3</sub>two</cc><dd></dd></test>')),
	{"test":{"cc":["one",{"sub":"3","_attributes":{"f":"test"}}],dd:'', _attributes: {}}},
	'simplify'
);
assert.deepEqual(
	xml('<test><style>*{some:10px;}/* <tag> comment */</style></test>'),
	[{"tagName":"test","attributes":{},"children":[{"tagName":"style","attributes":{},"children":["*{some:10px;}/* <tag> comment *"]}]}]	,
	'css with tag as comment'
);
assert.deepEqual(
	xml('<test><script>$("<div>")</script></test>'),
	[{"tagName":"test","attributes":{},"children":[{"tagName":"script","attributes":{},"children":["$(\"<div>\""]}]}],
	'js creating some tags'
);
var x = '<test a="value"><child a=\'g"g\'>text</child></test>'
assert(x === xml.stringify(xml(x)),'optimal xml string need to keep the same');

var xShould = [{"tagName":"h1","attributes":{"class":"test package-name other-class test2"},"children":[]}];
var x = xml.getElementsByClassName('<html><head></head><body><h1 class="test package-name other-class test2"></h1></body></html>','package-name');
assert.deepEqual(x,xShould,'find elements by class')

// re-stringify an attribute without value
var s="<test><something flag></something></test>";
assert(xml.stringify(xml(s))===s, 'problem with attribute without value');

assert(xml.toContentString(xml('<test>f<case number="2">f</case>f</test>'))==="f f  f")

assert.deepEqual(
	xml.getElementById('<test><child id="theId">found</child></test>','theId'),
	{"tagName":"child","attributes":{"id":"theId"},"children":["found"]},'id not found')












