# tXml
a very small xml parser in pure javascript

This lib only provides one single method. **tXml()**

1. this code is about 130 lines, can be easily extended 
2. this code is 650byte minified + gzipped
3. this code can running in a worker 
4. this code is parsing at avarage the same speed as native DOMParser + potential to be faster
5. this code is easy to read and good for study. 
6. this code creates a domObject with minimal footprint, that is easy to traverse.
7. this code has proved in different projects.
8. this code can even parse handwritten XML that contains various errors

so, there are good reasons to give tXml.js a try. 

###Methods
**tXml** *(XML-string, ID-string(optional))*
  1. **XML string** is the XML to parse.
  2. **ID-String** is optional an ID of some object. that can be queried. Using this is incredable fast.

##XML - features
  1. tags
  2. childTags
  3. textnodes
  4. whitespaces
  5. attribures with single and double quotes
  6. attributes without value
  7. xmlComments (ignored)
  8. embedded CSS and Javascript
  9. HTML singleTag elements br, img, link, meta, hr

###Developer
[Tobias Nickel](http://tnickel.de/)  
![alt text](https://avatars1.githubusercontent.com/u/4189801?s=150) 
