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
	/**
	 * parsing a list of entries
	 */
	function parseChildren(){
	    var children=[];
		while(S[pos]){
			if(S[pos]=='<'){
			    if(S[pos+1]==='/'){
			    	while(S[pos]!=='>'){
			    		pos++;
			    	}
			        return children;
			    }else if(S[pos+1]==='!'){
					if(S[pos+2]=='-'){
						//jumpcomment
						pos+=4;
						while(!(S[pos]==='>' && S[pos-1]=='-' && S[pos-2]=='-')){pos++}
					}else{
						//jump declaration
						pos+=2;
						while(S[pos]!=='>'){pos++}
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
	 *	returns the text until the first '<'
	 */
	function parseText(){
		var text=''
		var start = pos;
		while(S[pos] && S[pos]!='<'){
			//text+=S[pos];
			pos++;
		}
		pos--;
		return S.slice(start,pos+1);
	}
	/**
	 *	returns text until the first nonAlphebetic letter
	 */
	function parseName(){
		var start = pos;
		while('\n\t>/= '.indexOf(S[pos])===-1){
			pos++;
		}
		return S.slice(start,pos);
	}
	/**
	 *	is parsing a node, including tagName, Attributes and its children,
	 * to parse children it uses the parseChildren again, that makes the parsing recursive
	 */
	function parseNode(){
	    var node = {};
	    if(S[pos]!=='<') throw 'this method starts parsing with the "<"';
	    pos++;
	    node.tagName = parseName();

	    // parsing attributes
	    var attrFound=false;
	    while(S[pos] !== '>'){
			var c = S[pos].charCodeAt(0);
			if((c>64&&c<91)||(c>96&&c<123)){
	        //if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(S[pos])!==-1 ){
                var name = parseName();
                while(S[pos] !== '"' && S[pos] !== "'"){
                    pos++;   
                }
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
	    if(S[pos-1]!=='/' && ['img','br','input'].indexOf(node.tagName)==-1){
	        pos++;
	        node.children = parseChildren(name);
	    }

	    return node;

	}
	/**
	 *	is parsing a string, that starts with a char and with the same usually  ' or "
	 */
	function parseString(){
	   var startChar = S[pos];
	   var startpos=pos+1;
	   pos++;
	   while(S[pos]!==startChar){
	       pos++;
	   }
	   return S.slice(startpos,pos);
	}

	var pos=0;
	return parseChildren('');
}