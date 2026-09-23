/**
 * @author: Tobias Nickel
 * @created: 06.04.2015
 * I needed a small xmlparser that can be used in a worker.
 */

/**
 * Decode XML entities in text and attribute values.
 * Unknown or malformed entities are left unchanged.
 * @param {string} value
 * @returns {string}
 */
function decodeEntities(value) {
    return value.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function(match, entity) {
        if (entity === 'amp') return '&';
        if (entity === 'lt') return '<';
        if (entity === 'gt') return '>';
        if (entity === 'quot') return '"';
        if (entity === 'apos') return "'";

        if (entity[0] === '#') {
            var isHex = entity[1] === 'x' || entity[1] === 'X';
            var num = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
            if (!Number.isNaN(num) && num >= 0 && num <= 0x10FFFF) {
                try {
                    return String.fromCodePoint(num);
                } catch (e) {
                    return match;
                }
            }
        }

        return match;
    });
}

/**
 * Encode text for safe XML serialization.
 * @param {string} value
 * @returns {string}
 */
function encodeTextEntities(value) {
    return value.replace(/[&<>]/g, function(ch) {
        return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;';
    });
}

/**
 * Encode attribute values for safe XML serialization.
 * @param {string} value
 * @returns {string}
 */
function encodeAttributeEntities(value) {
    return value.replace(/[&<>"']/g, function(ch) {
        switch (ch) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            default: return '&apos;';
        }
    });
}

/**
 * parseXML / html into a DOM Object. with no validation and some failure tolerance
 * @param {string} S your XML to parse
 * @param {import('./tXml').ParseOptions} [options] all other options:
 * @return {(import('./tXml').TNode | string)[] | any}
 */
export function parse(S, options) {
    "txml";
    options = options || {};

    var pos = options.pos || 0;
    var keepComments = !!options.keepComments;
    var keepWhitespace = options.keepWhitespace !== undefined ? !!options.keepWhitespace : !!options.keepWhitespaces;
    var decodeEntitiesEnabled = !!options.decodeEntities;
    var skipXmlDeclaration = !!options.skipXmlDeclaration;

    var openBracket = "<";
    var openBracketCC = "<".charCodeAt(0);
    var closeBracket = ">";
    var closeBracketCC = ">".charCodeAt(0);
    var minusCC = "-".charCodeAt(0);
    var slashCC = "/".charCodeAt(0);
    var questionMarkCC = '?'.charCodeAt(0);
    var exclamationCC = '!'.charCodeAt(0);
    var singleQuoteCC = "'".charCodeAt(0);
    var doubleQuoteCC = '"'.charCodeAt(0);
    var equalSignCC = '='.charCodeAt(0);
    var openCornerBracketCC = '['.charCodeAt(0);
    var closeCornerBracketCC = ']'.charCodeAt(0);
    var questionCC = '?'.charCodeAt(0);
    var len = S.length;

    // Fast check for characters that terminate a tag/attribute name:
    // space, \t, \n, \r, '>', '/', '=' (same set as the old nameSpacer string).
    function isNameTerminatorCC(cc) {
        return cc === 32 || cc === 9 || cc === 10 || cc === 13 || cc === 62 || cc === 47 || cc === 61;
    }

    function isXmlDeclarationTag(tagName) {
        return typeof tagName === 'string' && tagName.toLowerCase() === '?xml';
    }


    /**
     * parsing a list of entries
     * @param {string} tagName
     * @returns {(import('./tXml').TNode | string)[]}
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
                        //comment support: jump straight to the comment end
                        const startCommentPos = pos;
                        var commentEnd = S.indexOf('-->', pos + 2);
                        if (commentEnd === -1) {
                            if (keepComments) {
                                children.push(S.substring(startCommentPos));
                            }
                            pos = len;
                        } else {
                            if (keepComments) {
                                children.push(S.substring(startCommentPos, commentEnd + 3));
                            }
                            pos = commentEnd + 3;
                        }
                        continue;
                    } else if (
                        S.charCodeAt(pos + 2) === openCornerBracketCC &&
                        S.charCodeAt(pos + 8) === openCornerBracketCC &&
                        (S.substring(pos + 3, pos + 8) === 'CDATA' ||
                            S.substring(pos + 3, pos + 8).toLowerCase() === 'cdata')
                    ) {
                        // cdata
                        var cdataEndIndex = S.indexOf(']]>', pos);
                        if (cdataEndIndex == -1) {
                            children.push(S.substring(pos + 9));
                            pos = len;
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
                if (skipXmlDeclaration && isXmlDeclarationTag(node.tagName)) {
                    continue;
                }
                children.push(node);
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
        var text = S.slice(start, pos + 1);
        return decodeEntitiesEnabled ? decodeEntities(text) : text;
    }
    /**
     *    returns text until the first nonAlphabetic letter
     * @returns {string}
     */
    function parseName() {
        var start = pos;
        while (pos < len && !isNameTerminatorCC(S.charCodeAt(pos))) {
            pos++;
        }
        return S.slice(start, pos);
    }
    /**
     *    is parsing a node, including tagName, Attributes and its children,
     * to parse children it uses the parseChildren again, that makes the parsing recursive
     * @returns {import('./tXml').TNode}
     */
    var SelfClosingTags = options.selfClosingTags || options.noChildNodes || ['img', 'br', 'input', 'meta', 'link', 'hr'];

    function parseNode() {
        pos++;
        const tagName = parseName();
        const isProcessingInstruction = tagName[0] === '?';
        const instructionContentStart = pos;
        /** @type {Record<string, string | null>} */
        const attributes = {};
        /** @type {(import('./tXml').TNode | string)[]} */
        let children = [];

        // parsing attributes
        while (
            S[pos] &&
            S.charCodeAt(pos) !== closeBracketCC &&
            !(isProcessingInstruction && S.charCodeAt(pos) === questionMarkCC && S.charCodeAt(pos + 1) === closeBracketCC)
        ) {
            var c = S.charCodeAt(pos);
            if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
                //if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(S[pos])!==-1 ){
                var name = parseName();
                /** @type {string | null} */
                var value = null;

                // Skip whitespace after the attribute name.
                while (S.charCodeAt(pos) === 32 || S.charCodeAt(pos) === 9 || S.charCodeAt(pos) === 10 || S.charCodeAt(pos) === 13) {
                    pos++;
                }

                if (S.charCodeAt(pos) === equalSignCC) {
                    pos++;

                    // Skip whitespace after '='.
                    while (S.charCodeAt(pos) === 32 || S.charCodeAt(pos) === 9 || S.charCodeAt(pos) === 10 || S.charCodeAt(pos) === 13) {
                        pos++;
                    }

                    var code = S.charCodeAt(pos);
                    if (code === singleQuoteCC || code === doubleQuoteCC) {
                        value = parseString();
                        if (pos >= len) {
                            return {
                                tagName,
                                attributes,
                                children,
                            };
                        }
                    } else if (code && code !== closeBracketCC) {
                        // HTML-style unquoted attribute value: read until whitespace, '/', or '>'.
                        var valueStart = pos;
                        while (pos < len && !isNameTerminatorCC(S.charCodeAt(pos))) {
                            pos++;
                        }
                        value = S.slice(valueStart, pos);
                        if (decodeEntitiesEnabled) {
                            value = decodeEntities(value);
                        }
                    }
                }
                attributes[name] = value;
                continue;
            }
            pos++;
        }

        const isExplicitSelfClosed = !isProcessingInstruction && S.charCodeAt(pos - 1) === slashCC;

        if (isProcessingInstruction) {
            var instructionContent = S.slice(instructionContentStart, pos).trim();

            if (instructionContent.length > 0 && Object.keys(attributes).length === 0) {
                children = [instructionContent];
            }

            if (S.charCodeAt(pos) === questionMarkCC && S.charCodeAt(pos + 1) === closeBracketCC) {
                pos += 2;
            } else if (S.charCodeAt(pos) === closeBracketCC) {
                pos += 1;
            }

            return {
                tagName,
                attributes,
                children,
            };
        }

        // optional parsing of children
        if (S.charCodeAt(pos - 1) !== slashCC && S.charCodeAt(pos - 1) !== questionCC) {
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
        const node = {
            tagName,
            attributes,
            children,
        };

        if (isExplicitSelfClosed) {
            Object.defineProperty(node, 'selfClosed', {
                value: true,
                enumerable: false,
                writable: true,
                configurable: true,
            });
        }

        return node;
    }

    /**
     *    is parsing a string, that starts with a char and with the same usually  ' or "
     * @returns {string}
     */

    function parseString() {
        var startChar = S[pos];
        var startpos = pos + 1;
        var endQuote = S.indexOf(startChar, startpos);
        if (endQuote === -1) {
            // Unterminated attribute value: consume to end of input.
            pos = len;
            var restValue = S.slice(startpos);
            return decodeEntitiesEnabled ? decodeEntities(restValue) : restValue;
        }
        pos = endQuote;
        var value = S.slice(startpos, endQuote);
        return decodeEntitiesEnabled ? decodeEntities(value) : value;
    }


    /** @type {(import('./tXml').TNode | string)[] | import('./tXml').TNode} */
    var out;
    
    if (options.attrValue !== undefined) {
        options.attrName = options.attrName || 'id';
        out = [];

        // Compile the search pattern once and scan forward through S without
        // copying the remaining string on every hit O(n)
        var attrPattern = new RegExp('\\s' + options.attrName + '\\s*=[\'"]' + options.attrValue + '[\'"]', 'g');
        var attrMatch;
        while ((attrMatch = attrPattern.exec(S)) !== null) {
            pos = S.lastIndexOf('<', attrMatch.index);
            if (pos !== -1) {
                out.push(parseNode());
                if (pos <= attrMatch.index) {
                    // parseNode did not advance past the match (malformed
                    // input): move forward to guarantee progress.
                    pos = attrMatch.index + 1;
                }
                attrPattern.lastIndex = pos;
            } else {
                pos = attrMatch.index + 1;
                attrPattern.lastIndex = pos;
            }
        }
        pos = len;
    } else if (options.parseNode) {
        out = parseNode();
        while (skipXmlDeclaration && typeof out === 'object' && out && isXmlDeclarationTag(out.tagName)) {
            out = parseNode();
        }
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
 * @param {(import('./tXml').TNode | string)[]} children the childrenList
 * @returns {Record<string, any> | string}
 */
export function simplify(children) {
    if (typeof children === 'string') {
        return simplify(parse(children));
    }

    if (!Array.isArray(children)) {
        throw new TypeError('simplify() expects parsed node array or XML string');
    }

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
 * @param {(import('./tXml').TNode | string)[]} children the childrenList
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
 * @param {(import('./tXml').TNode | string)[]} children the children of a node
 * @param {(node: import('./tXml').TNode, index: number, depth: number, path: string) => boolean} f the filter method
 * @param {number} [dept]
 * @param {string} [path]
 * @returns {import('./tXml').TNode[]}
 */
export function filter(children, f, dept = 0, path = '') {
    /** @type {import('./tXml').TNode[]} */
    var out = [];
    // Most filter callbacks only inspect the node (or node + index). Building
    // the dotted path string for every node is wasted work in that case, so
    // only build it when the callback declares that parameter. A zero-arity
    // function may still read `arguments`, so keep building paths for those.
    var needsPath = f.length === 0 || f.length >= 4;

    /**
     * @param {(import('./tXml').TNode | string)[]} nodes
     * @param {number} depth
     * @param {string} currentPath
     */
    function walk(nodes, depth, currentPath) {
        nodes.forEach(function(child, i) {
            if (typeof child !== 'object') return;

            if (f(child, i, depth, currentPath)) {
                out.push(child);
            }

            if (child.children) {
                walk(
                    child.children,
                    depth + 1,
                    needsPath ? (currentPath ? currentPath + '.' : '') + i + '.' + child.tagName : ''
                );
            }
        });
    }

    walk(children, dept, needsPath ? path : '');
    return out;
}

/**
 * stringify a previously parsed string object.
 * this is useful,
 *  1. to remove whitespace
 * 2. to recreate xml data, with some changed data.
 * @param {import('./tXml').TNode | (import('./tXml').TNode | string)[]} O the object to Stringify
 * @param {import('./tXml').StringifyOptions} [options] stringify options
 */
export function stringify(O, options) {
    if (!O) return '';

    options = options || {};
    var encodeEntitiesEnabled = !!options.encodeEntities;
    var keepWhitespace = options.keepWhitespace !== undefined ? !!options.keepWhitespace : !!options.keepWhitespaces;
    var selfCloseEmpty = options.selfCloseEmpty !== false;
    
    var out = '';

    /**
     * @param {(import('./tXml').TNode | string)[]} nodes
     */
    function writeChildren(nodes) {
        if (nodes) {
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (typeof node === 'string') {
                    var textNode = keepWhitespace ? node : node.trim();
                    out += encodeEntitiesEnabled ? encodeTextEntities(textNode) : textNode;
                } else if (node) {
                    writeNode(node);
                }
            }
        }
    }

    /**
     * @param {(import('./tXml').TNode | string)[] | undefined} nodes
     * @returns {boolean}
     */
    function hasSerializableChildren(nodes) {
        if (!nodes || nodes.length === 0) {
            return false;
        }

        for (var i = 0; i < nodes.length; i++) {
            var child = nodes[i];
            if (typeof child === 'string') {
                var textNode = keepWhitespace ? child : child.trim();
                if (textNode.length > 0) {
                    return true;
                }
            } else if (child) {
                return true;
            }
        }

        return false;
    }

    /**
    * @param {import('./tXml').TNode} N
     */
    function writeNode(N) {
        if (!N) return;
        out += "<" + N.tagName;
        for (var i in N.attributes) {
            var attrValue = N.attributes[i];
            if (attrValue === null) {
                out += ' ' + i;
            } else if (encodeEntitiesEnabled) {
                out += ' ' + i + '="' + encodeAttributeEntities(attrValue.trim()) + '"';
            } else if (attrValue.indexOf('"') === -1) {
                out += ' ' + i + '="' + attrValue.trim() + '"';
            } else {
                out += ' ' + i + "='" + attrValue.trim() + "'";
            }
        }
        if (N.tagName[0] === '?') {
            if (N.children && N.children.length) {
                var instructionPayload = N.children.filter(function(child) {
                    return typeof child === 'string';
                }).join(' ').trim();
                if (instructionPayload.length > 0) {
                    out += ' ' + instructionPayload;
                }
            }
            out += '?>';
            return;
        }

        if (N.selfClosed === true) {
            out += '/>';
            return;
        }

        if (selfCloseEmpty && !hasSerializableChildren(N.children)) {
            out += '/>';
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
 * @param {import('./tXml').TNode | (import('./tXml').TNode | string)[] | string} tDom
 * @return {string}
 */
export function toContentString(tDom) {
    if (Array.isArray(tDom)) {
        // Join parts first and trim once: O(n)
        var parts = new Array(tDom.length);
        for (var i = 0; i < tDom.length; i++) {
            parts[i] = ' ' + toContentString(tDom[i]);
        }
        return parts.join('').trim();
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
 * @returns {import('./tXml').TNode | Record<string, any> | string | undefined}
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
 * @returns {(import('./tXml').TNode | string)[] | Record<string, any> | string}
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
 * @param {import('./tXml').TNode | string} node - The node to check
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
 * @param {import('./tXml').TNode | string} node - The node to check
 * @returns {node is import('./tXml').TNode} True if the node is a TNode (element node)
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
