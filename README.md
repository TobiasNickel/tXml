# tXml
a very small xml parser in pure javascript

This lib only provides one single method. **tXml()**

1. this code is about 230 lines, can be easily extended 
2. this code is 0.9kb minified + gzipped
3. this code can running in a worker 
4. this code is parsing at average the same speed as native DOMParser + potential to be faster
5. this code is easy to read and good for study. 
6. this code creates a domObject with minimal footprint, that is easy to traverse.
7. this code has proved in different projects.
8. this code can even parse handwritten XML that contains various errors

so, there are good reasons to give tXml.js a try. 

###XML - features
  1. tags
  2. childTags
  3. text-nodes
  4. white-spaces
  5. attributes with single and double quotes
  6. attributes without value
  7. xmlComments (ignored)
  8. embedded CSS and Javascript
  9. HTML singleTag elements br, img, link, meta, hr

### Installation
In browser you load it how ever you want. for example as tag before you use it: <script src="tXml.js"></script>.

In node, run **"npm install txml"** in your project. if necessary with **--save** parameter.
and then in your script you require it by "var tXml = require('txml');"


###Methods
**tXml** *(XML-string, options)*
  1. **XML string** is the XML to parse.
  2. **options** is optional 
		options are: **searchId** an ID of some object. that can be queried. Using this is incredible fast. 
		**filter** a method, to filter for interesting nodes, use it like Array.filter.
		**simplify** to simplify the object, to an easier
	example 1: tXml("<user is='great'><name>Tobias</name><familyName>Nickel</familyName><profession>Software Developer</profession><location>China</location><user>");
	// will return an object like: [
		{
			"tagName": "user",
			"attributes": {
				"is": "great"
			},
			"children": [
				{
					"tagName": "name",
					"children": [
						"Tobias"
					]
				},
				{
					"tagName": "familyName",
					"children": [
						"Nickel"
					]
				},
				{
					"tagName": "profession",
					"children": [
						"Software Developer"
					]
				},
				{
					"tagName": "location",
					"children": [
						"China"
					]
				},
				{
					"tagName": "user",
					"children": []
				}
			]
		}
	]	
		
		
	example 2: tXml("<user is='great'><name>Tobias</name><familyName>Nickel</familyName><profession>Software Developer</profession><location>China</location><user>",{simplify:1});
	// will return an object like: {
		"user": {
			"name": "Tobias",
			"familyName": "Nickel",
			"profession": "Software Developer",
			"location": "China",
			"user": {},
			"_attributes": {
				"is": "great"
			}
		}
	}

**tXml.simpify** *(tXml_DOM_Object)* this methid is used with the simplify parameter;
  1. **tXml_DOM_Object** the object to simplify.

**tXml.filter** *(tXml_DOM_Object, f)* this methid is used with the filter parameter, it is used like Array.filter.
  1. **tXml_DOM_Object** the object to filter.
  2. **f** a function that returns true if you want this elements in the result set.

###Developer
[Tobias Nickel](http://tnickel.de/)  
![alt text](https://avatars1.githubusercontent.com/u/4189801?s=150) 
