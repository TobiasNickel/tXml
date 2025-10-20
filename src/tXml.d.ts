/**
 * A parsed XML node
 */
export interface TNode {
    tagName: string;
    attributes: Record<string, string | null>;
    children: (TNode | string)[];
}

/**
 * Options for parsing XML
 */
export interface ParseOptions {
    /** Starting position in the string */
    pos?: number;
    /** Array of tag names that have no children and don't need to be closed */
    noChildNodes?: string[];
    /** If true, the returned object will have a pos property indicating where parsing stopped */
    setPos?: boolean;
    /** Keep XML comments in the output */
    keepComments?: boolean;
    /** Keep whitespace text nodes */
    keepWhitespace?: boolean;
    /** Automatically simplify the output */
    simplify?: boolean;
    /** Parse a single node instead of a list of nodes */
    parseNode?: boolean;
    /** Attribute name to search for (used with attrValue) */
    attrName?: string;
    /** Attribute value to search for (regex pattern) */
    attrValue?: string;
    /** Filter function to apply to nodes */
    filter?: (node: TNode, index: number, depth: number, path: string) => boolean;
}

/**
 * Parse XML/HTML into a DOM Object with minimal validation and fault tolerance
 * @param xml - The XML string to parse
 * @param options - Parsing options
 * @returns Array of parsed nodes and text content
 */
export function parse(xml: string, options?: ParseOptions): (TNode | string)[];

/**
 * Transform the DOM object to a simpler format like PHP's SimpleXML
 * Note: The order of elements is not preserved, and the original XML cannot be reproduced
 * @param children - Array of nodes to simplify
 * @returns Simplified object structure
 */
export function simplify(children: TNode[]): Record<string, any>;

/**
 * Similar to simplify, but preserves more information
 * @param children - Array of nodes to simplify
 * @param parentAttributes - Parent node attributes
 * @returns Simplified object structure with less data loss
 */
export function simplifyLostLess(
    children: TNode[],
    parentAttributes?: Record<string, string | null>
): Record<string, any>;

/**
 * Filter nodes like Array.filter - returns nodes where the filter function returns true
 * @param children - Array of nodes to filter
 * @param f - Filter function
 * @param depth - Current depth in the tree (internal use)
 * @param path - Current path in the tree (internal use)
 * @returns Filtered array of nodes
 */
export function filter(
    children: (TNode | string)[],
    f: (node: TNode, index: number, depth: number, path: string) => boolean,
    depth?: number,
    path?: string
): TNode[];

/**
 * Stringify a parsed object back to XML
 * Useful for removing whitespace or recreating XML with modified data
 * @param node - The node(s) to stringify
 * @returns XML string
 */
export function stringify(node: TNode | (TNode | string)[]): string;

/**
 * Read the text content of a node, useful for mixed content
 * Example: "this text has some <b>big</b> text and a <a href=''>link</a>"
 * @param tDom - The node(s) to extract text from
 * @returns Concatenated text content
 */
export function toContentString(tDom: TNode | (TNode | string)[]): string;

/**
 * Find an element by ID attribute
 * @param xml - XML string to search
 * @param id - ID value to find
 * @param simplified - Whether to return simplified output
 * @returns Found node(s)
 */
export function getElementById(xml: string, id: string, simplified?: boolean): TNode | Record<string, any>;

/**
 * Find elements by class name
 * @param xml - XML string to search
 * @param classname - Class name to find
 * @param simplified - Whether to return simplified output
 * @returns Found nodes
 */
export function getElementsByClassName(xml: string, classname: string, simplified?: boolean): TNode[] | Record<string, any>;
