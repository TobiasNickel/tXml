/**
 * @author: Tobias Nickel
 * @date: 06.04.2015
 * I needed a small xmlparser chat can be used in a worker.
 */

/**
 * parseXML / html into a DOM Object. with no validation and some failur tolerance
 * @params S {string} your XML to parse
 * @param options {object} all other options:
 *			searchId {string} the id of a single element, that should be returned. using this will increase the speed rapidly
 *			filter {function} filter method, as you know it from Array.filter. but is goes throw the DOM.
 *			simplefy {bool} to use tXml.simplefy.
 */
function tXml(S, options) {
    "use strict";
    options = options || {};

    var openBracket = "<";
    var openBracketCC = "<".charCodeAt(0);
    var closeBracket = ">";
    var closeBracketCC = ">".charCodeAt(0);
    var minus = "-";
    var minusCC = "-".charCodeAt(0);
    var slash = "/";
    var slashCC = "/".charCodeAt(0);
    var exclamation = '!';
    var exclamationCC = '!'.charCodeAt(0);
    var singleQuote = "'";
    var singleQuoteCC = "'".charCodeAt(0);
    var doubleQuote = '"';
    var doubleQuoteCC = '"'.charCodeAt(0);
    
    /**
     * parsing a list of entries
     */
    
    function parseChildren() {
        var children = [];
        while (S[pos]) {
            if (S.charCodeAt(pos) == openBracketCC) {
                if (S.charCodeAt(pos + 1) === slashCC) {
                    //while(S[pos]!=='>'){ pos++; }
                    pos = S.indexOf(closeBracket, pos);
                    return children;
                } else if (S.charCodeAt(pos + 1) === exclamationCC) {
                    if (S.charCodeAt(pos + 2) == minusCC) {
                        //comment support
                        while (!(S.charCodeAt(pos) === closeBracketCC && S.charCodeAt(pos - 1) == minusCC && S.charCodeAt(pos - 2) == minusCC && pos != -1)) {
                            pos = S.indexOf(closeBracket, pos + 1);
                        }
                        if (pos === -1)
                            pos = S.length
                    } else {
                        // doctypesupport
                        pos += 2;
                        while (S.charCodeAt(pos) !== closeBracketCC) {
                            pos++;
                        }
                    }
                    pos++;
                    continue;
                }
                var node = parseNode();
                children.push(node);
            } else {
                var text = parseText()
                if (text.trim().length > 0)
                    children.push(text);
            }
            pos++;
        }
        return children;
    }
    /**
     *    returns the text outside of texts until the first '<'
     */
    
    function parseText() {
        var start = pos;
        pos = S.indexOf(openBracket, pos) - 1;
        if (pos === -2)
            pos = S.length;
        return S.slice(start, pos + 1);
    }
    /**
     *    returns text until the first nonAlphebetic letter
     */
    var nameSpacer = '\n\t>/= ';
    
    function parseName() {
        var start = pos;
        while (nameSpacer.indexOf(S[pos]) === -1) {
            pos++;
        }
        return S.slice(start, pos);
    }
    /**
     *    is parsing a node, including tagName, Attributes and its children,
     * to parse children it uses the parseChildren again, that makes the parsing recursive
     */
    var NoChildNodes = ['img', 'br', 'input', 'meta', 'link'];
    function parseNode() {
        var node = {};
        pos++;
        node.tagName = parseName();
        
        // parsing attributes
        var attrFound = false;
        while (S.charCodeAt(pos) !== closeBracketCC) {
            var c = S.charCodeAt(pos);
            if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
                //if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(S[pos])!==-1 ){
                var name = parseName();
                // search beginning of the string
                var code = S.charCodeAt(pos);
                while (code !== singleQuoteCC && code !== doubleQuoteCC && !((code > 64 && code < 91) || (code > 96 && code < 123)) && code !== closeBracketCC) {
                    pos++;
                    code = S.charCodeAt(pos);
                }
                if (!attrFound) {
                    node.attributes = {};
                    attrFound = true;
                }
                if (code === singleQuoteCC || code === doubleQuoteCC) {
                    var value = parseString();
                } else {
                    value = null ;
                    pos--;
                }
                node.attributes[name] = value;
            }
            pos++;
        
        }
        // optional parsing of children
        if (S.charCodeAt(pos - 1) !== slashCC) {
            if (node.tagName == "script") {
                var start = pos + 1;
                pos = S.indexOf('</script>', pos);
                node.children = [S.slice(start, pos - 1)];
                pos += 8;
            } else if (node.tagName == "style") {
                var start = pos + 1;
                pos = S.indexOf('</style>', pos);
                node.children = [S.slice(start, pos - 1)];
                pos += 7;
            } else if (NoChildNodes.indexOf(node.tagName) == -1) {
                pos++;
                node.children = parseChildren(name);
            }
        }
        return node;
    }
    /**
     *    is parsing a string, that starts with a char and with the same usually  ' or "
     */
    
    function parseString() {
        var startChar = S[pos];
        var startpos = ++pos;
        pos = S.indexOf(startChar, startpos)
        return S.slice(startpos, pos);
    }
    function findId() {
        return new RegExp('\s*id\s*=\s*[\'"]' + options.searchId + '[\'"]').exec(S).index;
    }
    var out=null;
    if (options.searchId) {
        var pos = findId();
        if (pos !== -1) {  
            pos = S.lastIndexOf('<', pos);
            if (pos !== -1) {
                out = parseNode();
            }
        }
        return pos;
    } else {
        var pos = 0;
        out = parseChildren();
    }

    if(options.filter){
        out = tXml.filter(out,options.filter);
    }

    if(options.simplify){
        out = tXml.simplefy(out);
    }
    return out;
}
/**
 * transform the DomObject to an object that is like the object of PHPs simplexmp_load_*() methods.
 * this format helps you to write that is more likely to keep your programm working, even if there a small changes in the XML schema.
 * be aware, that it is not possible to reproduce the original xml from a simplefied version, because the order of elements is not saved.
 * therefore your programm will be more flexible and easyer to read.
 *
 * @param {array} the childrenList
 */
tXml.simplify = function simplefy(children) {
    var out = {};
    
    if(children.length === 1 && typeof children[0] == 'string')
        return children[0];

    // map each object
    children.forEach(function(child) {

        if (!out[child.tagName])
            out[child.tagName] = [];
        if (typeof child == 'object') {
            var kids = tXml.simplefy(child.children);
            out[child.tagName].push(kids);
            if (child.attributes) {
                kids._attributes = child.attributes;
            }
        }else{
            out[child.tagName].push(child);
        }
    }
    );
    
    for (var i in out) {
        if (out[i].length == 1) {
            out[i] = out[i][0];
        }
    }
    
    return out;
};

/**
 * behaves the same way as Array.filter, if the filter method return true, the element is in the resultList
 * @params children{Array} the children of a node
 * @param f{function} the filter method 
 */
tXml.filter = function(children,f){
    var out=[];
    children.forEach(function(child){
        if(typeof(child) === 'object' && f(child))out.push(child);
        if(child.children){
            var kids = tXml.filter(child.children,f);
            out = out.concat(kids);
        }
    });
    return out;
};
if('object'!==typeof window){module.exports=tXml;}
/*
console.clear();
tXml(d,'content');
 //some testCode
var s = document.body.innerHTML.toLowerCase();
var start = new Date().getTime();
var o = tXml(s,'content');
var end = new Date().getTime();
//console.log(JSON.stringify(o,undefined,'\t'));
console.log("MILLISECONDS",end-start);
var nodeCount=document.querySelectorAll('*').length;
console.log('node count',nodeCount);
console.log("speed:",(1000/(end-start))*nodeCount,'Nodes / second')
//console.log(JSON.stringify(tXml('<html><head><title>testPage</title></head><body><h1>TestPage</h1><p>this is a <b>test</b>page</p></body></html>'),undefined,'\t'));
var p = new DOMParser();
var s2='<body>'+s+'</body>'
var start2= new Date().getTime();
var o2 = p.parseFromString(s2,'text/html').querySelector('#content')
var end2=new Date().getTime();
console.log("MILLISECONDS",end2-start2);
// */
