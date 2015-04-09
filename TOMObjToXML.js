function TOMObjToXML(O){
	var out='';
	function writeChildren(O){
	    if(O)
            for(var i =0;i<O.length;i++){
                if(typeof O[i] == 'string'){
                    out+=O[i].trim();
                }else{
                    writeNode(O[i]);
                }
            }
	}
	function writeNode(N){
		out+="<"+N.tagName;
		for(var i in N.attributes){
			if(N.attributes[i].indexOf('"')===-1){
				out+=' '+i+'="'+N.attributes[i].trim()+'"';
			}else{
				out+=' '+i+"='"+N.attributes[i].trim()+"'";
			}
		}
		out+='>';
		writeChildren(N.children);
		out+='</'+N.tagName+'>';
	}
	writeChildren(O);
	
	return out;
} 