/**
 * @author: Tobias Nickel
 * @date: 06.04.2015
 * I needed a small xmlparser chat can be used in a worker. 
 */

/**
 * parseXML / html into a DOM Object. with no validation and some failur tolerance
 * @params S {string} your XML to parse
 */
function tXml(S){
    "use strict";
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
    function parseChildren(){
        var children = [];
        while(S[pos]){
            if(S.charCodeAt(pos) == openBracketCC){
                if(S.charCodeAt(pos+1) === slashCC){
                    //while(S[pos]!=='>'){ pos++; }
                    pos = S.indexOf(closeBracket,pos);
                    return children;
                }else if(S.charCodeAt(pos+1) === exclamationCC){
                    if(S.charCodeAt(pos+2) == minusCC){
						//comment support
                        while(!(S.charCodeAt(pos)===closeBracketCC && S.charCodeAt(pos-1)==minusCC && S.charCodeAt(pos-2)==minusCC &&pos != -1)){pos = S.indexOf(closeBracket, pos+1);}
                        if(pos===-1) pos=S.length
                    }else{
						// doctypesupport
                        pos+=2;
                        while(S.charCodeAt(pos)!==closeBracketCC){ pos++; }
                    }
                    pos++;
                    continue;
                }
				var node = {};
				pos++;
				var startNamePos = pos;
				while(nameSpacer.indexOf(S[pos])===-1){ pos++; }
				var node_tagName = S.slice(startNamePos,pos);

				// parsing attributes
				var attrFound=false;
				while(S.charCodeAt(pos) !== closeBracketCC){
					var c = S.charCodeAt(pos);
					if((c>64&&c<91)||(c>96&&c<123)){
					//if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(S[pos])!==-1 ){
					
						startNamePos = pos;
						while(nameSpacer.indexOf(S[pos])===-1){ pos++; }
						var name = S.slice(startNamePos,pos);
						// search beginning of the string
						var code=S.charCodeAt(pos);
						while(code !== singleQuoteCC && code !== doubleQuoteCC){ pos++;code=S.charCodeAt(pos) }
						
						
						var startChar = S[pos];
						var startStringPos= ++pos;
						pos = S.indexOf(startChar,startStringPos);
						var value = S.slice(startStringPos,pos);
						if(!attrFound){
							var node_attributes = {};
							attrFound=true;
						}
						node_attributes[name] = value;
					}
					pos++;

				}
				// optional parsing of children
				if(S.charCodeAt(pos-1) !== slashCC){ 
					if(node.tagName == "script"){
						var start=pos;
						pos=S.indexOf('</script>',pos);
						node.children=[S.slice(start,pos-1)];
						pos+=8;
					}else if(node_tagName == "style"){
						var start=pos;
						pos=S.indexOf('</style>',pos);
						node.children=[S.slice(start,pos-1)];
						pos+=7;
					}else if(!NoChildNodes[node.tagName]){
						pos++;
						var node_children = parseChildren(name);
					}
				}
                children.push({children:node_children,tagName:node_tagName,attributes:node_attributes});
            }else{
				var startTextPos = pos;
				pos = S.indexOf(openBracket,pos)-1;
				if(pos===-2)pos=S.length;
                var text = S.slice(startTextPos,pos+1);
                if(text.trim().length>0)
                    children.push(text);
            }
            pos++;
        }
        return children;
    }
    /**
     *    returns text until the first nonAlphebetic letter
     */
    var nameSpacer = '\n\t>/= ';
    /**
     *    is parsing a node, including tagName, Attributes and its children,
     * to parse children it uses the parseChildren again, that makes the parsing recursive
     */
    var NoChildNodes={};['img','br','input'];
	NoChildNodes.img=true;
	NoChildNodes.br=true;
	NoChildNodes.input=true;
    
	var pos=0;
    return parseChildren();
}

 //some testCode
console.clear();
var s = document.body.innerHTML.toLowerCase();
var start = new Date().getTime();
var o = tXml(s);
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
var o2 = p.parseFromString(s2,'text/html')
var end2=new Date().getTime();
console.log("MILLISECONDS",end2-start2);

// */
