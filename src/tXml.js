/**
 * @author: Tobias Nickel
 * @created: 06.04.2015
 * I needed a small xmlparser that can be used in a worker.
 */

/**
 * parseXML / html into a DOM Object. with no validation and some failure tolerance
 * @param {string} S your XML to parse
 * @param {import('./tXml.d.ts').ParseOptions} [options] all other options:
 * @return {(import('./tXml.d.ts').TNode | string)[] | any}
 */
export function parse(S, options) {
    "txml";
    options = options || {};

    var pos = options.pos || 0;
    var keepComments = !!options.keepComments;
    var keepWhitespace = !!options.keepWhitespace

    var openBracket = "<";
    var openBracketCC = "<".charCodeAt(0);
    var closeBracket = ">";
    var closeBracketCC = ">".charCodeAt(0);
    var minusCC = "-".charCodeAt(0);
    var slashCC = "/".charCodeAt(0);
    var exclamationCC = '!'.charCodeAt(0);
    var singleQuoteCC = "'".charCodeAt(0);
    var doubleQuoteCC = '"'.charCodeAt(0);
    var openCornerBracketCC = '['.charCodeAt(0);
    var closeCornerBracketCC = ']'.charCodeAt(0);


    /**
     * parsing a list of entries
     * @param {string} tagName
     * @returns {(import('./tXml.d.ts').TNode | string)[]}
     */
    function parseChildren(tagName) {
        var children = [];
        while (S[pos]) {
            if (S.charCodeAt(pos) == openBracketCC) {
                if (S.charCodeAt(pos + 1) === slashCC) {
                    var closeStart = pos + 2;
                    pos = S.indexOf(closeBracket, pos);

                    var closeTag = S.substring(closeStart, pos)
                    if (closeTag.indexOf(tagName) == -1) {
                        var parsedText = S.substring(0, pos).split('\n');
                        throw new Error(
                            'Unexpected close tag\nLine: ' + (parsedText.length - 1) +
                            '\nColumn: ' + (parsedText[parsedText.length - 1].length + 1) +
                            '\nChar: ' + S[pos]
                        );
                    }

                    if (pos + 1) pos += 1

                    return children;
                } else if (S.charCodeAt(pos + 1) === exclamationCC) {
                    if (S.charCodeAt(pos + 2) == minusCC) {
                        //comment support
                        const startCommentPos = pos;
                        while (pos !== -1 && !(S.charCodeAt(pos) === closeBracketCC && S.charCodeAt(pos - 1) == minusCC && S.charCodeAt(pos - 2) == minusCC && pos != -1)) {
                            pos = S.indexOf(closeBracket, pos + 1);
                        }
                        if (pos === -1) {
                            pos = S.length
                        }
                        if (keepComments) {
                            children.push(S.substring(startCommentPos, pos + 1));
                        }
                    } else if (
                        S.charCodeAt(pos + 2) === openCornerBracketCC &&
                        S.charCodeAt(pos + 8) === openCornerBracketCC &&
                        S.substr(pos + 3, 5).toLowerCase() === 'cdata'
                    ) {
                        // cdata
                        var cdataEndIndex = S.indexOf(']]>', pos);
                        if (cdataEndIndex == -1) {
                            children.push(S.substr(pos + 9));
                            pos = S.length;
                        } else {
                            children.push(S.substring(pos + 9, cdataEndIndex));
                            pos = cdataEndIndex + 3;
                        }
                        continue;
                    } else {
                        // doctypesupport
                        const startDoctype = pos + 1;
                        pos += 2;
                        var encapsuled = false;
                        while ((S.charCodeAt(pos) !== closeBracketCC || encapsuled === true) && S[pos]) {
                            if (S.charCodeAt(pos) === openCornerBracketCC) {
                                encapsuled = true;
                            } else if (encapsuled === true && S.charCodeAt(pos) === closeCornerBracketCC) {
                                encapsuled = false;
                            }
                            pos++;
                        }
                        children.push(S.substring(startDoctype, pos));
                    }
                    pos++;
                    continue;
                }
                var node = parseNode();
                children.push(node);
                if (node.tagName[0] === '?') {
                    children.push(...node.children);
                    node.children = [];
                }
            } else {
                var text = parseText();
                if (keepWhitespace) {
                    if (text.length > 0) {
                        children.push(text);
                    }
                } else {
                    var trimmed = text.trim();
                    if (trimmed.length > 0) {
                        children.push(trimmed);
                    }
                }
                pos++;
            }
        }
        return children;
    }

    /**
     *    returns the text outside of texts until the first '<'
     * @returns {string}
     */
    function parseText() {
        var start = pos;
        pos = S.indexOf(openBracket, pos) - 1;
        if (pos === -2)
            pos = S.length;
        return S.slice(start, pos + 1);
    }
    /**
     *    returns text until the first nonAlphabetic letter
     * @returns {string}
     */
    var nameSpacer = '\r\n\t>/= ';

    function parseName() {
        var start = pos;
        while (nameSpacer.indexOf(S[pos]) === -1 && S[pos]) {
            pos++;
        }
        return S.slice(start, pos);
    }
    /**
     *    is parsing a node, including tagName, Attributes and its children,
     * to parse children it uses the parseChildren again, that makes the parsing recursive
     * @returns {import('./tXml.d.ts').TNode}
     */
    var SelfClosingTags = options.selfClosingTags || options.noChildNodes || ['img', 'br', 'input', 'meta', 'link', 'hr'];

    function parseNode() {
        pos++;
        const tagName = parseName();
        /** @type {Record<string, string | null>} */
        const attributes = {};
        /** @type {(import('./tXml.d.ts').TNode | string)[]} */
        let children = [];

        // parsing attributes
        while (S.charCodeAt(pos) !== closeBracketCC && S[pos]) {
            var c = S.charCodeAt(pos);
            if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
                //if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(S[pos])!==-1 ){
                var name = parseName();
                // search beginning of the string
                var code = S.charCodeAt(pos);
                while (code && code !== singleQuoteCC && code !== doubleQuoteCC && !((code > 64 && code < 91) || (code > 96 && code < 123)) && code !== closeBracketCC) {
                    pos++;
                    code = S.charCodeAt(pos);
                }
                /** @type {string | null} */
                var value;
                if (code === singleQuoteCC || code === doubleQuoteCC) {
                    value = parseString();
                    if (pos === -1) {
                        return {
                            tagName,
                            attributes,
                            children,
                        };
                    }
                } else {
                    value = null;
                    pos--;
                }
                attributes[name] = value;
            }
            pos++;
        }
        // optional parsing of children
        if (S.charCodeAt(pos - 1) !== slashCC) {
            if (tagName == "script") {
                var start = pos + 1;
                pos = S.indexOf('</script>', pos);
                children = [S.slice(start, pos)];
                pos += 9;
            } else if (tagName == "style") {
                var start = pos + 1;
                pos = S.indexOf('</style>', pos);
                children = [S.slice(start, pos)];
                pos += 8;
            } else if (SelfClosingTags.indexOf(tagName) === -1) {
                pos++;
                children = parseChildren(tagName);
            } else {
                pos++
            }
        } else {
            pos++;
        }
        return {
            tagName,
            attributes,
            children,
        };
    }

    /**
     *    is parsing a string, that starts with a char and with the same usually  ' or "
     * @returns {string}
     */

    function parseString() {
        var startChar = S[pos];
        var startpos = pos + 1;
        pos = S.indexOf(startChar, startpos)
        return S.slice(startpos, pos);
    }

    /**
     * Find elements by attribute name and value using regex
     * @returns {number}
     */
    function findElements() {
        if (!options || !options.attrName || !options.attrValue) return -1;
        var r = new RegExp('\\s' + options.attrName + '\\s*=[\'"]' + options.attrValue + '[\'"]').exec(S)
        if (r) {
            return r.index;
        } else {
            return -1;
        }
    }

    /** @type {(import('./tXml.d.ts').TNode | string)[] | import('./tXml.d.ts').TNode} */
    var out;
    
    if (options.attrValue !== undefined) {
        options.attrName = options.attrName || 'id';
        out = [];

        while ((pos = findElements()) !== -1) {
            pos = S.lastIndexOf('<', pos);
            if (pos !== -1) {
                out.push(parseNode());
            }
            S = S.substr(pos);
            pos = 0;
        }
    } else if (options.parseNode) {
        out = parseNode()
    } else {
        out = parseChildren('');
    }

    if (options.filter && Array.isArray(out)) {
        out = filter(out, options.filter);
    }

    if (options.simplify) {
        const arrOut = Array.isArray(out) ? out : [out];
        // @ts-ignore - simplify returns different type structure
        return simplify(arrOut);
    }

    if (options.setPos && typeof out === 'object' && !Array.isArray(out)) {
        // @ts-ignore - adding pos property dynamically
        out.pos = pos;
    }

    // @ts-ignore - return type varies based on options
    return out;
}

/**
 * transform the DomObject to an object that is like the object of PHP`s simple_xml_load_*() methods.
 * this format helps you to write code that is more likely to keep your program working, even if there are small changes in the XML schema.
 * be aware, that it is not possible to reproduce the original xml from a simplified version, because the order of elements is not saved.
 * therefore your program will be more flexible and easier to read.
 *
 * @param {(import('./tXml.d.ts').TNode | string)[]} children the childrenList
 * @returns {Record<string, any> | string}
 */
export function simplify(children) {
    /** @type {Record<string, any>} */
    var out = {};
    
    if (!children.length) {
        return '';
    }

    if (children.length === 1 && typeof children[0] == 'string') {
        return children[0];
    }
    
    // map each object
    children.forEach(function(child) {
        if (typeof child !== 'object') {
            return;
        }
        if (!out[child.tagName])
            out[child.tagName] = [];
        var kids = simplify(child.children);
        out[child.tagName].push(kids);
        if (Object.keys(child.attributes).length && typeof kids === 'object' && !Array.isArray(kids)) {
            kids._attributes = child.attributes;
        }
    });

    for (var i in out) {
        if (out[i].length == 1) {
            out[i] = out[i][0];
        }
    }

    return out;
}


/**
 * similar to simplify, but lost less
 *
 * @param {(import('./tXml.d.ts').TNode | string)[]} children the childrenList
 * @param {Record<string, string | null>} [parentAttributes]
 * @returns {Record<string, any> | string | {_attributes: Record<string, string | null>, value: string}}
 */
export function simplifyLostLess(children, parentAttributes = {}) {
    /** @type {Record<string, any>} */
    var out = {};
    
    if (!children.length) {
        return out;
    }

    if (children.length === 1 && typeof children[0] == 'string') {
        return Object.keys(parentAttributes).length ? {
            _attributes: parentAttributes,
            value: children[0]
        } : children[0];
    }
    
    // map each object
    children.forEach(function(child) {
        if (typeof child !== 'object') {
            return;
        }
        if (!out[child.tagName])
            out[child.tagName] = [];
        var kids = simplifyLostLess(child.children || [], child.attributes);
        out[child.tagName].push(kids);
        if (Object.keys(child.attributes).length && typeof kids === 'object' && !Array.isArray(kids)) {
            kids._attributes = child.attributes;
        }
    });

    return out;
}

/**
 * behaves the same way as Array.filter, if the filter method return true, the element is in the resultList
 * @param {(import('./tXml.d.ts').TNode | string)[]} children the children of a node
 * @param {(node: import('./tXml.d.ts').TNode, index: number, depth: number, path: string) => boolean} f the filter method
 * @param {number} [dept]
 * @param {string} [path]
 * @returns {import('./tXml.d.ts').TNode[]}
 */
export function filter(children, f, dept = 0, path = '') {
    /** @type {import('./tXml.d.ts').TNode[]} */
    var out = [];
    
    children.forEach(function(child, i) {
        if (typeof(child) === 'object' && f(child, i, dept, path)) {
            out.push(child);
        }
        if (typeof child === 'object' && child.children) {
            var kids = filter(child.children, f, dept + 1, (path ? path + '.' : '') + i + '.' + child.tagName);
            out = out.concat(kids);
        }
    });
    return out;
}

/**
 * stringify a previously parsed string object.
 * this is useful,
 *  1. to remove whitespace
 * 2. to recreate xml data, with some changed data.
 * @param {import('./tXml.d.ts').TNode | (import('./tXml.d.ts').TNode | string)[]} O the object to Stringify
 */
export function stringify(O) {
    if (!O) return '';
    
    var out = '';

    /**
     * @param {(import('./tXml.d.ts').TNode | string)[]} nodes
     */
    function writeChildren(nodes) {
        if (nodes) {
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (typeof node === 'string') {
                    out += node.trim();
                } else if (node) {
                    writeNode(node);
                }
            }
        }
    }

    /**
     * @param {import('./tXml.d.ts').TNode} N
     */
    function writeNode(N) {
        if (!N) return;
        out += "<" + N.tagName;
        for (var i in N.attributes) {
            var attrValue = N.attributes[i];
            if (attrValue === null) {
                out += ' ' + i;
            } else if (attrValue.indexOf('"') === -1) {
                out += ' ' + i + '="' + attrValue.trim() + '"';
            } else {
                out += ' ' + i + "='" + attrValue.trim() + "'";
            }
        }
        if (N.tagName[0] === '?') {
            out += '?>';
            return;
        }
        out += '>';
        writeChildren(N.children);
        out += '</' + N.tagName + '>';
    }
    writeChildren(Array.isArray(O) ? O : [O]);

    return out;
}


/**
 * use this method to read the text content, of some node.
 * It is great if you have mixed content like:
 * this text has some <b>big</b> text and a <a href=''>link</a>
 * @param {import('./tXml.d.ts').TNode | (import('./tXml.d.ts').TNode | string)[] | string} tDom
 * @return {string}
 */
export function toContentString(tDom) {
    if (Array.isArray(tDom)) {
        var out = '';
        tDom.forEach(function(e) {
            out += ' ' + toContentString(e);
            out = out.trim();
        });
        return out;
    } else if (typeof tDom === 'object' && tDom !== null) {
        return toContentString(tDom.children)
    } else {
        return ' ' + tDom;
    }
}

/**
 * @param {string} S
 * @param {string} id
 * @param {boolean} [simplified]
 * @returns {import('./tXml.d.ts').TNode | Record<string, any> | string | undefined}
 */
export function getElementById(S, id, simplified) {
    var out = parse(S, {
        attrValue: id
    });
    return simplified ? simplify(out) : out[0];
}

/**
 * @param {string} S
 * @param {string} classname
 * @param {boolean} [simplified]
 * @returns {(import('./tXml.d.ts').TNode | string)[] | Record<string, any> | string}
 */
export function getElementsByClassName(S, classname, simplified) {
    const out = parse(S, {
        attrName: 'class',
        attrValue: '[a-zA-Z0-9- ]*' + classname + '[a-zA-Z0-9- ]*'
    });
    return simplified ? simplify(out) : out;
}

/**
 * Type guard to check if a node is a text node (string).
 * Useful for filtering and type narrowing when working with mixed node arrays.
 * 
 * @param {import('./tXml.d.ts').TNode | string} node - The node to check
 * @returns {node is string} True if the node is a string (text node)
 * @example
 * const parsed = parse('<div>Hello <span>World</span></div>');
 * parsed[0].children.forEach(child => {
 *   if (isTextNode(child)) {
 *     console.log('Text:', child);
 *   }
 * });
 */
export function isTextNode(node) {
    return typeof node === 'string';
}

/**
 * Type guard to check if a node is an element node (TNode object).
 * Useful for filtering and type narrowing when working with mixed node arrays.
 * 
 * @param {import('./tXml.d.ts').TNode | string} node - The node to check
 * @returns {node is import('./tXml.d.ts').TNode} True if the node is a TNode (element node)
 * @example
 * const parsed = parse('<div>Hello <span>World</span></div>');
 * parsed[0].children.forEach(child => {
 *   if (isElementNode(child)) {
 *     console.log('Element:', child.tagName);
 *   }
 * });
 */
export function isElementNode(node) {
    return typeof node === 'object' && node !== null && 'tagName' in node;
}
