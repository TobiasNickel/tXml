# tXml
a very small xml parser in pure javascript

This lib only provides one single method. **tXml()**

1. this code is about 230 lines, can be easily extended. 
2. this code is 0.9kb minified + gzipped.
3. this code is 5 - 10 times faster then sax/xml2js.
4. this code can running in a worker.
5. this code is parsing at average the same speed as native DOMParser + potential to be faster.
6. this code is easy to read and good for study. 
7. this code creates a domObject with minimal footprint, that is easy to traverse.
8. this code has proven in different projects, like RSS reader, openStreetmap, websites.
9. this code can even parse handwritten XML that contains various errors.
10. this code is working in client and server.
11. this code is 100% covered by unit tests.
  
so, there are good reasons to give tXml.js a try. 

## XML - features
  1. tags
  2. childTagsttttt
  3. text-nodes
  4. white-spaces
  5. attributes with single and double quotes
  6. attributes without value
  7. xmlComments (ignored)
  8. embedded CSS and Javascript
  9. HTML singleTag elements br, img, link, meta, hr
  10. doctype definitions
  11. xml namespaces
  12. sync API for a sync process
  13. getElementsById/-Class direct on the xmlString 
  14. simplefy, similar to PHP's [SimpleXML](http://php.net/manual/en/book.simplexml.php)
  15. filter, similar to underscore, as a alternative to CSS selectors

## Installation
In browser you load it how ever you want. For example as tag: <script src="tXml.js"></script>.

In node and browseryfy, run **"npm install txml"** in your project.
and then in your script you require it by "var tXml = require('txml');

## Methods

### **tXml** *(XML-string, options)*
1. **XML string** is the XML to parse.
2. **options** is optional 
		**searchId** an ID of some object. that can be queried. Using this is incredible fast. 
		**filter** a method, to filter for interesting nodes, use it like Array.filter.
		**simplify** to simplify the object, to an easier access
		
	
	EXAMPLE 1: tXml("<user is='great'><name>Tobias</name><familyName>Nickel</familyName><profession>Software Developer</profession><location>Shanghai / China</location></user>");

	// will return an object like: 
	[{
		"tagName": "user",
		"attributes": {
			"is": "great"
		},
		"children": [{
				"tagName": "name",
				"children": [ "Tobias" ]
			}, {
				"tagName": "familyName",
				"children": [ "Nickel" ]
			}, {
				"tagName": "profession",
				"children": [ "Software Developer" ]
			}, {
				"tagName": "location",
				"children": [ "Shanghai / China" ]
			}
		]
	}]	
		
		
	EXAMLPLE 2: tXml("<user is='great'><name>Tobias</name><familyName>Nickel</familyName><profession>Software Developer</profession><location>Shanghai / China</location></user>",{simplify:1});
	// will return an object like: 
	{
		"user": {
			"name": "Tobias",
			"familyName": "Nickel",
			"profession": "Software Developer",
			"location": "Shanghai / China",
			"_attributes": {
				"is": "great"
			}
		}
	}

### **tXml.simpify** *(tXml_DOM_Object)* 
this methid is used with the simplify parameter;
1. **tXml_DOM_Object** the object to simplify.

### **tXml.filter** *(tXml_DOM_Object, f)* 
this methid is used with the filter parameter, it is used like Array.filter.
1. **tXml_DOM_Object** the object to filter.
2. **f** a function that returns true if you want this elements in the result set.

### **tXml.getElementById** (xml,id) 
to find an element by ID. if you are only interested for the information on, a specific node, this is easy and fast, because not the entire xml need to get parsed to a tDOM Object. returns the element not simplefied, you can do with tXml.simplify()
1. **xml** the xml string to search in.
2. **id** the id of the element to find


### **tXml.getElementsByClassName** (xml,className) 
find the elements with the given class, without parsing the entire xml into a tDOM. so it is very fast and convenient. returns a list of elements. 
1. **xml** the xml string to search in.
2. **className** the className of the element to find





## Developer
[Tobias Nickel](http://tnickel.de/) German software developer in Shanghai. 
![alt text](https://avatars1.githubusercontent.com/u/4189801?s=150) 
