// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==
/**
 * @author: Tobias Nickel
 * @created: 06.04.2015
 * I needed a small xmlparser chat can be used in a worker.
 */
/**
 * @typedef tNode
 * @property {string} tagName
 * @property {object} [attributes]
 * @property {tNode|string|number[]} children
 **/
/**
 * parseXML / html into a DOM Object. with no validation and some failure tolerance
 * @param {string} S your XML to parse
 * @param options {object} all other options:
 * searchId {string} the id of a single element, that should be returned. using this will increase the speed rapidly
 * filter {function} filter method, as you know it from Array.filter. but is goes throw the DOM.
 * simplify {bool} to use tXml.simplify.
 * @return {tNode[]}
 */
class tXml {
	constructor(S, options) {
		this.options = options || {};
		this.S = S;
		this.NoChildNodes = ['img', 'br', 'input', 'meta', 'link'];
		this.closeBracket = ">";
		this.closeBracketCC = ">".charCodeAt(0);
		this.doubleQuoteCC = '"'.charCodeAt(0);
		this.exclamationCC = '!'.charCodeAt(0);
		this.minusCC = "-".charCodeAt(0);
		this.nameSpacer = '\n\t>/= ';
		this.openBracket = "<";
		this.openBracketCC = "<".charCodeAt(0);
		this.singleQuoteCC = `'`.charCodeAt(0);
		this.slashCC = "/".charCodeAt(0);
		this.out = null;
		this.pos = this.options.pos || 0;
		if (this.options.attrValue !== undefined) {
			this.options.attrName = this.options.attrName || 'id';
			this.out = [];
			while ((this.pos = this.findElements()) !== -1) { //tXml.findElements()) !== -1) {
				this.pos = this.S.lastIndexOf(`<`, this.pos);
				if (this.pos !== -1) {
					this.out.push(parseNode());
				}
				this.S = this.S.substr(this.pos);
				this.pos = 0;
			}
		} else if (this.options.parseNode) {
			this.out = this.parseNode(); //tXml.parseNode();
		} else {
			this.out = this.parseChildren(); //tXml.parseChildren();
		}
		if (this.options.filter) {
			this.out = this.filter(out, options.filter); //tXml.filter(out, options.filter);
		}
		if (this.options.simplify) {
			this.out = this.simplify(out); //tXml.simplify(out);
			this.out.pos = this.pos;
			return this.out;
		}
	}
	/**
	 * parsing a list of entries
	 */
	parseChildren() {
		const children = [];
		while (this.S[this.pos]) {
			if (this.S.charCodeAt(this.pos) === this.openBracketCC) {
				if (this.S.charCodeAt(this.pos + 1) === this.slashCC) {
					this.pos = this.S.indexOf(this.closeBracket, this.pos);
					if (this.pos + 1) {
						this.pos += 1;
					}
					return children;
				} else if (this.S.charCodeAt(this.pos + 1) === this.exclamationCC) {
					if (this.S.charCodeAt(this.pos + 2) === this.minusCC) {
						//comment support
						while (this.pos !== -1 && !(this.S.charCodeAt(this.pos) === this.closeBracketCC && this.S.charCodeAt(this.pos - 1) === this.minusCC && this.S.charCodeAt(this.pos - 2) === this.minusCC && this.pos !== -1)) {
							this.pos = this.S.indexOf(this.closeBracket, this.pos + 1);
						}
						if (this.pos === -1) {
							this.pos = this.S.length;
						}
					} else {
						// doctypesupport
						this.pos += 2;
						while (this.S.charCodeAt(this.pos) !== this.closeBracketCC && this.S[this.pos]) {
							this.pos++;
						}
					}
					this.pos++;
					continue;
				}
				const node = this.parseNode();
				children.push(node);
			} else {
				const text = this.parseText();
				if (text.trim().length > 0) {
					children.push(text);
					this.pos++;
				}
			}
			return children;
		}
	}
	/**
	 *    returns the text outside of texts until the first '<'
	 */
	parseText() {
		const start = this.pos;
		this.pos = this.S.indexOf(this.openBracket, this.pos) - 1;
		if (this.pos === -2) {
			this.pos = this.S.length;
		}
		return this.S.slice(start, this.pos + 1);
	}
	/**
	 *    returns text until the first nonAlphebetic letter
	 */
	parseName() {
		const start = this.pos;
		while (this.nameSpacer.indexOf(this.S[this.pos]) === -1 && this.S[this.pos]) {
			this.pos++;
		}
		return this.S.slice(start, this.pos);
	}
	/**
	 *    is parsing a node, including tagName, Attributes and its children,
	 * to parse children it uses the parseChildren again, that makes the parsing recursive
	 */
	parseNode() {
		const node = {};
		this.pos++;
		node.tagName = this.parseName();
		// parsing attributes
		let attrFound = false,
			start;
		while (this.S.charCodeAt(this.pos) !== this.closeBracketCC && this.S[this.pos]) {
			const c = this.S.charCodeAt(this.pos);
			if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
				//if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(this.S[this.pos])!==-1 ){
				const name = this.parseName();
				// search beginning of the string
				let code = this.S.charCodeAt(this.pos),
					value;
				while (code && code !== this.singleQuoteCC && code !== this.doubleQuoteCC && !((code > 64 && code < 91) || (code > 96 && code < 123)) && code !== this.closeBracketCC) {
					this.pos++;
					code = this.S.charCodeAt(this.pos);
				}
				if (!attrFound) {
					node.attributes = {};
					attrFound = true;
				}
				if (code === this.singleQuoteCC || code === this.doubleQuoteCC) {
					value = this.parseString();
					if (this.pos === -1) {
						return node;
					}
				} else {
					value = null;
					this.pos--;
				}
				node.attributes[name] = value;
			}
			this.pos++;
		}
		// optional parsing of children
		if (this.S.charCodeAt(this.pos - 1) === this.slashCC) {
			this.pos++;
		} else if (node.tagName === "script") {
			start = this.pos + 1;
			this.pos = this.S.indexOf('</script>', this.pos);
			node.children = [this.S.slice(start, this.pos - 1)];
			this.pos += 8;
		} else if (node.tagName === "style") {
			start = this.pos + 1;
			this.pos = this.S.indexOf('</style>', this.pos);
			node.children = [this.S.slice(start, this.pos - 1)];
			this.pos += 7;
		} else if (this.NoChildNodes.indexOf(node.tagName) === -1) {
			this.pos++;
			node.children = this.parseChildren(name);
		}
		return node;
	}
	/**
	 *    is parsing a string, that starts with a char and with the same usually  ' or "
	 */
	parseString() {
		const startChar = this.S[this.pos],
			startpos = ++this.pos;
		this.pos = this.S.indexOf(startChar, startpos);
		return this.S.slice(startpos, this.pos);
	}
	/**
	 *
	 */
	findElements() {
		const r = new RegExp(`\\s${options.attrName}\\s*=['"]${options.attrValue}['"]`, 'u').exec(this.S);
		if (r) {
			return r.index;
		}
		return -1;
	}
	/**
	 * transform the DomObject to an object that is like the object of PHPs simplexmp_load_*() methods.
	 * this format helps you to write that is more likely to keep your programm working, even if there a small changes in the XML schema.
	 * be aware, that it is not possible to reproduce the original xml from a simplified version, because the order of elements is not saved.
	 * therefore your programm will be more flexible and easyer to read.
	 *
	 * @param {tNode[]} children the childrenList
	 */
	simplify(children) {
		let out = {};
		if (!children.length) {
			return '';
		}
		if (children.length === 1 && typeof children[0] === 'string') {
			return children[0];
		}
		// map each object
		children.forEach((child) => {
			if (typeof child !== 'object') {
				return;
			}
			if (!out[child.tagName]) {
				out[child.tagName] = [];
			}
			const kids = tXml.simplify(child.children || []);
			out[child.tagName].push(kids);
			if (child.attributes) {
				kids._attributes = child.attributes;
			}
		});
		for (let i in out) {
			if (out[i].length === 1) {
				out[i] = out[i][0];
			}
		}
		return out;
	}
	/**
	 * behaves the same way as Array.filter, if the filter method return true, the element is in the resultList
	 * @params children{Array} the children of a node
	 * @param f{function} the filter method
	 */
	filter(children, f) {
		let out = [];
		children.forEach((child) => {
			if (typeof child === 'object' && f(child)) {
				out.push(child);
			}
			if (child.children) {
				const kids = tXml.filter(child.children, f);
				out = out.concat(kids);
			}
		});
		return out;
	}
	/**
	 * stringify a previously parsed string object.
	 * this is useful,
	 *  1. to remove whitespaces
	 * 2. to recreate xml data, with some changed data.
	 * @param {tNode} O the object to Stringify
	 */
	stringify(O) {
		let out_s = '';

		out_s += this.writeChildren(O);
		return out_s;
		/**
		 * use this method to read the textcontent, of some node.
		 * It is great if you have mixed content like:
		 * this text has some <b>big</b> text and a <a href=''>link</a>;
		 * @return {string}
		 */
	}
	writeNode(N) {
		out_s += `<${N.tagName}`;
		for (let i in N.attributes) {
			if (N.attributes[i] === null) {
				out_s += ` ${i}`;
			} else {
				out_s = N.attributes[i].indexOf('"') === -1 ? ` ${i}="${N.attributes[i].trim()}"` : ` ${i}='${N.attributes[i].trim()}'`;
			}
		}
		out_s += '>';
		this.writeChildren(N.children);
		out_s += `</${N.tagName}>`;
	}
	writeChildren(O) {
		if (O) {
			for (let i = 0; i < O.length; i++) {
				if (typeof O[i] === 'string') {
					out_s += O[i].trim();
				} else {
					out_s += this.writeNode(O[i]);
				}
			}
		}
	}
	toContentString(tDom) {
		if (Array.isArray(tDom)) {
			let out = '';
			tDom.forEach((e) => {
				out += ` ${tXml.toContentString(e)}`;
				out = out.trim();
			});
			return out;
		} else if (typeof tDom === 'object') {
			return tXml.toContentString(tDom.children);
		}
		return ` ${tDom}`;
	}
	getElementById(S, id, simplified) {
		const out = tXml(S, {
			'attrValue': id,
			'simplify': simplified
		});
		return simplified ?
			out :
			out[0];
		/**
		 * A fast parsing method, that not realy finds by classname,
		 * more: the class attribute contains XXX
		 * @param
		 */
	}
	getElementsByClassName(S, classname, simplified) {
		tXml(S, {
			'attrName': 'class',
			'attrValue': `[a-zA-Z0-9\-\s ]*${classname}[a-zA-Z0-9\-\s ]*`,
			'simplify': simplified
		});
	}
	parseStream(stream, offset) {
		if (typeof offset === 'function') {
			cb = offset;
			offset = 0;
		}
		if (typeof offset === 'string') {
			offset = offset.length + 2;
		}
		if (typeof stream === 'string') {
			const fs = require('fs');
			stream = fs.createReadStream(stream, {
				'start': offset
			});
			offset = 0;
		}
		let data = '',
			position = offset;
		stream.on('data', (chunk) => {
			cc++;
			data += chunk;
			let lastpos = 0;
			do {
				position = data.indexOf('<', position) + 1;
				const res = tXml(data, {
					'parseNode': true,
					'pos': position
				});
				position = res.pos;
				if (position > data.length - 1 || position < lastpos) {
					if (lastpos) {
						data = data.slice(lastpos);
						position = 0;
						lastpos = 0;
					}
					return;
				} else {
					stream.emit('xml', res);
					lastpos = position;
				}
			} while (1);
			data = data.slice(position);
			position = 0;
		});
		stream.on('end', () => {
			console.log('end');
		});
		return stream;
	}
}
if (typeof module === 'object') {
	module.exports = tXml;
}
//console.clear();
//console.log('here:',tXml.getElementById('<some><xml id="test">dada</xml><that id="test">value</that></some>','test'));
//console.log('here:',tXml.getElementsByClassName('<some><xml id="test" class="sdf test jsalf">dada</xml><that id="test">value</that></some>','test'));
/*
	console.clear();
	tXml(d,'content');
	//some testCode
	let s = document.body.innerHTML.toLowerCase(), start = new Date().getTime(), o = tXml(s,'content'), end = new Date().getTime();
	//console.log(JSON.stringify(o,undefined,'\t')) {
	console.log("MILLISECONDS",end-start);
	let nodeCount=document.querySelectorAll('*').length;
	console.log('node count',nodeCount);
	console.log("speed:",(1000/(end-start))*nodeCount,'Nodes / second');
	//console.log(JSON.stringify(tXml('<html><head><title>testPage</title></head><body><h1>TestPage</h1><p>this is a <b>test</b>page</p></body></html>'),undefined,'\t')) {
	let p = new DOMParser(), s2='<body>'+s+'</body>';
	let start2= new Date().getTime(), o2 = p.parseFromString(s2,'text/html').querySelector('#content');
	let end2=new Date().getTime();
	console.log("MILLISECONDS",end2-start2);
*/
