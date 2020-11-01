# tXml
A very small and probably the fastest xml parser in pure javascript.

This lib only provides one single method. **xml()**

1. this code is about 230 lines, can be easily extended. 
2. this code is 0.9kb minified + gzipped.
3. this code is 5 - 10 times faster than sax/xml2js and still 2-3 times [faster than fast-xml-parser](https://github.com/tobiasnickel/fast-xml-parser#benchmark)
4. this code can running in a worker.
5. this code is parsing at average the same speed as native DOMParser + potential to be faster.
6. this code is easy to read and good for study. 
7. this code creates a domObject with minimal footprint, that is easy to traverse.
8. this code has proven in different projects, like RSS reader, openStreetMap, websites.
9. this code can even parse handwritten XML that contains various errors.
10. this code is working in client and server.
11. this code is 100% covered by unit tests.
  
so, there are good reasons to give tXml.js a try. 

## XML - features

  1. tags
  2. childTags
  3. text-nodes
  4. white-spaces
  5. attributes with single and double quotes
  6. attributes without value
  7. xmlComments (ignored)
  8. CDATA
  9. embedded CSS and Javascript
  10. HTML singleTag elements br, img, link, meta, hr
  11. doctype definitions
  12. xml namespaces
  13. sync API for a sync process
  14. getElementsById/-Class direct on the xmlString 
  15. simplify, similar to PHP's [SimpleXML](http://php.net/manual/en/book.simplexml.php)
  16. filter, similar to underscore, as a alternative to CSS selectors
  17. monomorphism for fast processing and fewer if statements (a node always has tagName:'', attributes:{} and children:[])
  18. streamSupport ! ! !

## Try Online

Try without installing online: http://tnickel.de/2017/04/02/txml-online

## Installation
In browser you load it how ever you want. For example as tag: <script src="tXml.min.js"></script>.

In node and browserify, run **"npm install txml"** in your project
and then in your script you require it by `const xml = require('txml');`

## Methods

### **xml** *(xmlString, options)*
1. **xmlString** is the XML to parse.
2. **options** is optional 
    - **searchId** an ID of some object. that can be queried. Using this is incredible fast. 
    - **filter** a method, to filter for interesting nodes, use it like Array.filter.
    - **simplify** to simplify the object, to an easier access.
    - **pos** where to start parsing.
    - **noChildNodes** array of nodes, that have no children and don't need to be closed. Default is working good for html. For example when parsing rss, the link tag is used to really provide an URL that the user can open. In html however a link text is used to bind css or other resource into the document. In HTML it does not need to get closed. so by default the noChildNodes containes the tagName 'link'. Same as 'img', 'br', 'input', 'meta', 'link'. That means: when parsing rss, it makes to set `noChildNodes` to [], an empty array.
```js
    xml(`<user is='great'>
        <name>Tobias</name>
        <familyName>Nickel</familyName>
        <profession>Software Developer</profession>
        <location>Shanghai / China</location>
    </user>`);
    // will return an object like: 
    [{
        "tagName": "user",
        "attributes": {
            "is": "great"
        },
        "children": [{
                "tagName": "name",
                "attributes": {},
                "children": [ "Tobias" ]
            }, {
                "tagName": "familyName",
                "attributes": {},
                "children": [ "Nickel" ]
            }, {
                "tagName": "profession",
                "attributes": {},
                "children": [ "Software Developer" ]
            }, {
                "tagName": "location",
                "attributes": {},
                "children": [ "Shanghai / China" ]
            }
        ]
    }];  
```  

### **xml.simplify** *(tXml_DOM_Object)* 
this method is used with the simplify parameter;
1. **tXml_DOM_Object** the object to simplify.
```js
    xml.simplify(xml(`<user is='great'>
        <name>Tobias</name>
        <familyName>Nickel</familyName>
        <profession>Software Developer</profession>
        <location>Shanghai / China</location>
    </user>`));
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
```

### **xml.simplifyListLess** *(tXml_DOM_Object)* 
Same purpose of simplify, to make the data easier accessible, but this version is not the same as in PHP simple_xml, but therefor, you do not lose any information. if there are attributes, you get an _attribute property, even if there is only one of a kind, it will be a list with one item, for consistent code.

### **xml.filter** *(tXml_DOM_Object, f)* 
This method is used with the filter parameter, it is used like Array.filter. But it will traverse the entire deep tree.
1. **tXml_DOM_Object** the object to filter.
2. **f** a function that returns true if you want this elements in the result set.
```js
const dom = xml(`
<html>
    <head>
        <style>
            p { color: "red" }
        </style>
    </head>
    <body>
        <p>hello</p>
    </body>
</html>`);
const styleElement = data.filter(dom, node=>node.tagName.toLowerCase() === 'style')[0];
```


### **xml.getElementById** (xml, id) 
To find an element by ID. If you are only interested for the information on, a specific node, this is easy and fast, because not the entire xml text need to get parsed, but only the small section you are interested in.
1. **xml** the xml string to search in.
2. **id** the id of the element to find
**returns** return one node

### **xml.getElementsByClassName** (xml, className) 
Find the elements with the given class, without parsing the entire xml into a tDOM. So it is very fast and convenient. returns a list of elements. 
1. **xml** the xml string to search in.
2. **className** the className of the element to find


### **xml.parseStream** (stream, offset)
Useful for huge files, like OSM-world, wikipedia-dump. but also deprecated, as transformStream is much better.
1. stream is the stream or fileName, 
2. offset requires you to set short before the first item.
    Usually files begin with something like `<!DOCTYPE osm><osm>`. So the offset need to be before the first item starts, because between that item and the offset is no `<` character. Alternatively, pass a string, containing this preamble. Return stream, triggers event `xml` to get notified when a complete node has been parsed.
```js
const xmlStream = fs.createReadStream('your.xml')
xml.parseStream(xmlStream);
xmlStream.on('xml', node => processNode(node)); // you implement the process method
```

### **xml.transformStream** (offset)
2. offset optional you to set short before the first item.
    usually files begin with something like "<!DOCTYPE osm><osm>"
    so the offset need to be before the first item starts so that 
    between that item and the offset is no "<" character.
    alternatively, pass a string, containing this preamble.
return transformStream.
```js
const xmlStream = fs.createReadStream('your.xml')
  .pipe(xml.transformStream());
for await(let element of xmlStream) {
  // your logic here ...
}
```
The transform stream is better, because when your logic is slow, the file read stream will also run slower, and not fill up the RAM memory. For a more detailed explanation read [here](http://tnickel.de/2019/10/15/2019-10-for-async-on-nodejs-streams/)

## Roadmap for version 4
  - improved support for CDATA: DONE
  - option to keep comments: DONE
  - comment support for transformStream (comments inside elements are working, but not top level)
  - allow options for transformStream
  - export parser function only as `txml`, it will be the cleanest in all environments and let the user use `txml(xml)` where xml is the string.
  - remove `.parseStream` in favor of `transformStream`
  - split transform stream into its own module, for smaller builds

## Developer

![alt text](https://avatars1.githubusercontent.com/u/4189801?s=150)

[Tobias Nickel](http://tnickel.de/) German software developer in Shanghai. 

