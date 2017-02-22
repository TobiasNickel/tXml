var tXml = require('./tXml');
var assert = require('assert');

assert(tXml, 'tXml is available');
assert(Array.isArray(tXml('')), 'tXml don\'t return an empty array for an empty string');

/******************************************************************************************************
 * 
 ******************************************************************************************************/
assert.deepEqual(tXml('<test>'),[{tagName:'test', children:[]}],'not even passed the simplest test');
assert.deepEqual(tXml('<test att="v">'),[{"tagName":"test","attributes":{"att":"v"},"children":[]}],'a single attribute');
assert.deepEqual(
	tXml('<test att="v" att2="two">'),
	[{"tagName":"test","attributes":{"att":"v","att2":"two"},"children":[]}],
	'multiple attributes'
);
assert.deepEqual(tXml('childTest'),["childTest"],'a single text');
assert.deepEqual(tXml('<test>childTest'),[{"tagName":"test","children":["childTest"]}],'a single child text');
assert.deepEqual(tXml('<test></test>'),[{"tagName":"test","children":[]}],'simple closingTag');
assert.deepEqual(
	tXml('<test><cc></cc><cc></cc></test>'),
	[{"tagName":"test","children":[{"tagName":"cc","children":[]},{"tagName":"cc","children":[]}]}],
	'two childNodes'
);
assert.deepEqual(
	tXml('<!-- some comment --><test><cc c="d"><!-- some comment --></cc><!-- some comment --><cc>value<!-- some comment --></cc></test><!-- ending with not closing comment'),
	[{"tagName":"test","children":[{"tagName":"cc","children":[],"attributes":{"c":"d"}},{"tagName":"cc","children":["value"]}]}],
	'simple childNodes + attribute + childText + ignore comments'
);
assert.deepEqual(
	tXml('<!DOCTYPE html><test><cc></cc><cc></cc></test>'),
	[{"tagName":"test","children":[{"tagName":"cc","children":[]},{"tagName":"cc","children":[]}]}],
	'two childNodes + ignore doctype declaration'
);


/******************************************************************************************************
 * use options 
 ******************************************************************************************************/
assert.deepEqual(
	tXml('<test><cc></cc><cc></cc></test>',{filter:function(element){return element.tagName.toLowerCase() == 'cc';}}),
	[{"tagName":"cc","children":[]},{"tagName":"cc","children":[]}],
	'get all "cc" nodes'
);
assert.deepEqual(
	tXml('<test><cc>one</cc>test<cc f="test"><sub>3</sub>two</cc><dd></dd></test>',{simplify:1}),
	{"test":{"cc":["one",{"sub":"3","_attributes":{"f":"test"}}],dd:''}},
	'simplify'
);
assert.deepEqual(
	tXml('<test><style>*{some:10px;}/* <tag> comment */</style></test>'),
	[{"tagName":"test","children":[{"tagName":"style","children":["*{some:10px;}/* <tag> comment *"]}]}]	,
	'css with tag as comment'
);
assert.deepEqual(
	tXml('<test><script>$("<div>")</script></test>'),
	[{"tagName":"test","children":[{"tagName":"script","children":["$(\"<div>\""]}]}],
	'js creating some tags'
);
var x = '<test a="value"><child a=\'g"g\'>text</child></test>'
assert(x === tXml.stringify(tXml(x)),'optimal xml string need to keep the same');

var xShould = [{"tagName":"h1","attributes":{"class":"test package-name"},"children":[]}];
var x = tXml.getElementsByClassName('<html><head></head><body><h1 class="test package-name"></h1></body></html>','package-name');
assert.deepEqual(x,xShould,'find elements by class')

// re-stringify an attribute without value
var s="<test><something flag></something></test>";
assert(tXml.stringify(tXml(s))===s, 'problem with attribute without value');

assert(tXml.toContentString(tXml('<test>f<case number="2">f</case>f</test>'))==="f f  f")

assert.deepEqual(
	tXml.getElementById('<test><child id="theId">found</child></test>','theId'),
	{"tagName":"child","attributes":{"id":"theId"},"children":["found"]},'id not found')












