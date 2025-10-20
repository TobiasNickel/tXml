import { Transform } from 'node:stream';
import { TNode, ParseOptions } from './tXml.d.ts';

/**
 * Create a Node.js Transform stream that parses XML chunks
 * @param offset - Starting offset or string whose length is the offset
 * @param parseOptions - Options for the XML parser
 * @returns Transform stream that emits parsed XML nodes
 */
export function transformStream(
    offset?: number | string,
    parseOptions?: ParseOptions
): Transform;

/**
 * Create a Web Streams API TransformStream that parses XML chunks
 * Compatible with browsers, Deno, Bun, and modern Node.js
 * @param offset - Starting offset or string whose length is the offset
 * @param parseOptions - Options for the XML parser
 * @returns Web TransformStream that emits parsed XML nodes
 */
export function transformWebStream(
    offset?: number | string,
    parseOptions?: ParseOptions
): TransformStream<string, TNode | string>;
