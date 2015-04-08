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
    var openBracket="<";
    var openBracketCC="<".charCodeAt(0);
    var closeBracket=">";
    var closeBracketCC=">".charCodeAt(0);
    var minus="-";
    var slash="/";
    var slashCC="/".charCodeAt(0);
    
    /**
     * parsing a list of entries
     */
    function parseChildren(){
        var children=[];
        while(S[pos]){
            if(S.charCodeAt(pos)==closeBracketCC){
                if(S.charCodeAt(pos+1) === slashCC){
                    //while(S[pos]!=='>'){ pos++; }
                    pos = S.indexOf(closeBracket,pos)
                    return children;
                }else if(S[pos+1]==='!'){
                    if(S.charCodeAt(pos+2)==minusCC){
                        //jumpcomment
                        //pos+=4;
                        while(!(S.charCodeAt(pos)===closeBracketCC && S.charCodeAt(pos-1)==minusCC && S.charCodeAt(pos-2)==minusCC &&pos != -1)){pos = S.indexOf(closeBracket, pos+1);}
                        if(pos===-1) pos=S.length
                    }else{
                        //jump declaration
                        pos+=2;
                        while(S[pos]!==closeBracket){ pos++; }
                    }
                    pos++;
                    continue;
                }
                var node = parseNode();
                children.push(node);
            }else{
                var text = parseText()
                if(text.trim().length>0)
                    children.push(text);
            }
            pos++;
        }
        return children;
    }
    /**
     *    returns the text outside of texts until the first '<'
     */
    function parseText(){
        var start = pos;
        pos = S.indexOf(openBracket,pos);
        if(pos<0)pos=S.length-1;
        return S.slice(start,pos+1);
    }
    /**
     *    returns text until the first nonAlphebetic letter
     */
    var nameSpacer = '\n\t>/= ';
    function parseName(){
        var start = pos;
        while(nameSpacer.indexOf(S[pos])===-1){ pos++; }
        return S.slice(start,pos);
    }
    /**
     *    is parsing a node, including tagName, Attributes and its children,
     * to parse children it uses the parseChildren again, that makes the parsing recursive
     */
     var NoChildNodes=['img','br','input'];
    function parseNode(){
        var node = {};
        if(S.charCodeAt(pos)!==openBracketCC) throw '';//this method starts parsing with the "<"
        pos++;
        node.tagName = parseName();

        // parsing attributes
        var attrFound=false;
       	while(S.charCodeAt(pos) !== closeBracketCC){
            var c = S.charCodeAt(pos);
            if((c>64&&c<91)||(c>96&&c<123)){
            //if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(S[pos])!==-1 ){
                var name = parseName();
                // search beginning of the string
                while(S[pos] !== '"' && S[pos] !== "'"){ pos++; }
                
                var value = parseString();
                if(!attrFound){
                    node.attributes = {};
                    attrFound=true;
                }
                node.attributes[name] = value;
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
		    }else if(node.tagName == "style"){
		        var start=pos;
		    	pos=S.indexOf('</style>',pos);
		    	node.children=[S.slice(start,pos-1)];
		    	pos+=7;
		    }else if(NoChildNodes.indexOf(node.tagName)==-1){
		        pos++;
		        node.children = parseChildren(name);
		    }
		}
        return node;
    }
    /**
     *    is parsing a string, that starts with a char and with the same usually  ' or "
     */
    function parseString(){
       var startChar = S[pos];
       var startpos= ++pos;
       pos = S.indexOf(startChar,startpos)
       return S.slice(startpos,pos);
    }

    var pos=0;
    return parseChildren();
}
/* //some testCode
console.clear();
var s = document.body.innerHTML;
var start = new Date().getTime();
var o = tXml(s);
var end = new Date().getTime();
//console.log(JSON.stringify(o,undefined,'\t'));
console.log("MILLISECONDS",end-start);
var nodeCount=document.querySelectorAll('*').length;
console.log('node count',nodeCount);
console.log("speed:",(1000/(end-start))*nodeCount,'Nodes / second')
//console.log(JSON.stringify(tXml('<html><head><title>testPage</title></head><body><h1>TestPage</h1><p>this is a <b>test</b>page</p></body></html>'),undefined,'\t'));
// */
