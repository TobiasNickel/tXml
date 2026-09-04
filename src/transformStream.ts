import { Transform, type TransformCallback } from 'node:stream';
import { parse, type TNode, type ParseOptions } from './tXml';

/**
 * Find the position directly behind the root opening tag.
 * Returns -1 when more data is needed.
 * @param xml 
 * @returns 
 */
function detectRootContentOffset(xml: string): number {
    let i = 0;

    while (i < xml.length) {
        const open = xml.indexOf('<', i);
        if (open === -1) return -1;

        if (xml.startsWith('<!--', open)) {
            const end = xml.indexOf('-->', open + 4);
            if (end === -1) return -1;
            i = end + 3;
            continue;
        }

        if (xml.startsWith('<?', open)) {
            const end = xml.indexOf('?>', open + 2);
            if (end === -1) return -1;
            i = end + 2;
            continue;
        }

        if (xml.startsWith('<!', open)) {
            const end = xml.indexOf('>', open + 2);
            if (end === -1) return -1;
            i = end + 1;
            continue;
        }

        if (xml[open + 1] === '/') {
            i = open + 2;
            continue;
        }

        let quote = '';
        for (let p = open + 1; p < xml.length; p++) {
            const ch = xml[p];
            if (quote) {
                if (ch === quote) quote = '';
                continue;
            }
            if (ch === '"' || ch === "'") {
                quote = ch;
                continue;
            }
            if (ch === '>') {
                return p + 1;
            }
        }

        return -1;
    }

    return -1;
}

/**
 * Create a Node.js Transform stream that parses XML chunks
 * @param offset - Starting offset; if omitted, root offset is auto-detected
 * @param parseOptions? - Options for the XML parser
 * @returns Transform stream that emits parsed XML nodes
 */
export function transformStream(offset?: number | string, parseOptions?: ParseOptions): Transform {
    if (!parseOptions) parseOptions = {};
    let autoDetectOffset = typeof offset === 'undefined';
    if (typeof offset === 'string') {
        offset = offset.length;
    }

    let position: number = offset || 0;
    let data = '';

    const stream = new Transform({
        objectMode: true,
        transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback) {
            data += chunk;

            if (autoDetectOffset) {
                const detectedOffset = detectRootContentOffset(data);
                if (detectedOffset === -1) {
                    callback();
                    return;
                }
                position = detectedOffset;
                autoDetectOffset = false;
            }

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

                    if (parseOptions!.keepComments) {
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
                }) as TNode & { pos: number };

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
 * @param offset - Starting offset; if omitted, root offset is auto-detected
 * @param parseOptions? - Options for the XML parser
 * @returns Web TransformStream that emits parsed XML nodes
 */
export function transformWebStream(offset?: number | string, parseOptions?: ParseOptions): TransformStream<string, TNode | string> {
    if (!parseOptions) parseOptions = {};
    let autoDetectOffset = typeof offset === 'undefined';
    if (typeof offset === 'string') {
        offset = offset.length;
    }

    let position: number = offset || 0;
    let data = '';

    return new TransformStream({
        transform(chunk: string, controller: TransformStreamDefaultController<TNode | string>) {
            data += chunk;

            if (autoDetectOffset) {
                const detectedOffset = detectRootContentOffset(data);
                if (detectedOffset === -1) {
                    return;
                }
                position = detectedOffset;
                autoDetectOffset = false;
            }

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

                    if (parseOptions!.keepComments) {
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
                }) as TNode & { pos: number };

                // When setPos is true, parse returns an object with pos property
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
