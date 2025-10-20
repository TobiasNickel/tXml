// @ts-ignore - node:stream types are available in Node.js 18+
import { Transform } from 'node:stream';
import { parse } from './tXml.js';

/**
 * Create a Node.js Transform stream that parses XML chunks
 * @param {number|string} offset - Starting offset or string whose length is the offset
 * @param {import('./tXml.d.ts').ParseOptions} [parseOptions] - Options for the XML parser
 * @returns {Transform} Transform stream that emits parsed XML nodes
 */
export function transformStream(offset, parseOptions) {
    if (!parseOptions) parseOptions = {};
    if (typeof offset === 'string') {
        offset = offset.length;
    }

    let position = offset || 0;
    let data = '';

    const stream = new Transform({
        objectMode: true,
        /**
         * @param {any} chunk
         * @param {string} encoding
         * @param {Function} callback
         */
        transform(chunk, encoding, callback) {
            data += chunk;
            let lastPos = 0;

            while (true) {
                position = data.indexOf('<', position) + 1;
                
                if (!position) {
                    position = lastPos;
                    callback();
                    return;
                }

                if (data[position] === '/') {
                    position = position + 1;
                    lastPos = position;
                    continue;
                }

                if (data[position] === '!' && data[position + 1] === '-' && data[position + 2] === '-') {
                    const commentEnd = data.indexOf('-->', position + 3);
                    if (commentEnd === -1) {
                        data = data.slice(lastPos);
                        position = 0;
                        callback();
                        return;
                    }

                    if (parseOptions.keepComments) {
                        this.push(data.substring(position - 1, commentEnd + 3));
                    }

                    position = commentEnd + 1;
                    lastPos = commentEnd;
                    continue;
                }

                const res = parse(data, {
                    ...parseOptions,
                    pos: position - 1,
                    parseNode: true,
                    setPos: true
                });

                // When setPos is true, parse returns an object with pos property
                // @ts-ignore - res has pos property when setPos option is true
                position = res.pos;

                if (position > (data.length - 1) || position < lastPos) {
                    data = data.slice(lastPos);
                    position = 0;
                    callback();
                    return;
                } else {
                    this.push(res);
                    lastPos = position;
                }
            }
        }
    });

    return stream;
}

/**
 * Create a Web Streams API TransformStream that parses XML chunks
 * Compatible with browsers, Deno, Bun, and modern Node.js
 * @param {number|string} offset - Starting offset or string whose length is the offset
 * @param {import('./tXml.d.ts').ParseOptions} [parseOptions] - Options for the XML parser
 * @returns {TransformStream} Web TransformStream that emits parsed XML nodes
 */
export function transformWebStream(offset, parseOptions) {
    if (!parseOptions) parseOptions = {};
    if (typeof offset === 'string') {
        offset = offset.length;
    }

    let position = offset || 0;
    let data = '';

    return new TransformStream({
        /**
         * @param {any} chunk
         * @param {any} controller
         */
        transform(chunk, controller) {
            data += chunk;
            let lastPos = 0;

            while (true) {
                position = data.indexOf('<', position) + 1;
                
                if (!position) {
                    position = lastPos;
                    return;
                }

                if (data[position] === '/') {
                    position = position + 1;
                    lastPos = position;
                    continue;
                }

                if (data[position] === '!' && data[position + 1] === '-' && data[position + 2] === '-') {
                    const commentEnd = data.indexOf('-->', position + 3);
                    if (commentEnd === -1) {
                        data = data.slice(lastPos);
                        position = 0;
                        return;
                    }

                    if (parseOptions.keepComments) {
                        controller.enqueue(data.substring(position - 1, commentEnd + 3));
                    }

                    position = commentEnd + 1;
                    lastPos = commentEnd;
                    continue;
                }

                const res = parse(data, {
                    ...parseOptions,
                    pos: position - 1,
                    parseNode: true,
                    setPos: true
                });

                // When setPos is true, parse returns an object with pos property
                // @ts-ignore - res has pos property when setPos option is true
                position = res.pos;

                if (position > (data.length - 1) || position < lastPos) {
                    data = data.slice(lastPos);
                    position = 0;
                    return;
                } else {
                    controller.enqueue(res);
                    lastPos = position;
                }
            }
        }
    });
}
