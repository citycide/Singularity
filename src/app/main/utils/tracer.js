/**
 * Tracer will parse out the stack trace lines into their parts
 * @param {string} stack - from an Error object
 * @returns {Array}
 * @credit Georg Tavonius & contributors
 * @reference https://github.com/errwischt/stacktrace-parser
 */

import path from 'path';

export default function(stack) {
    const chrome = /^\s*at (?:(?:(?:Anonymous function)?|((?:\[object object])?\S+(?: \[as \S+])?)) )?\(?((?:file|http|https):.*?):(\d+)(?::(\d+))?\)?\s*$/i;
    const gecko = /^(?:\s*(\S*)(?:\((.*?)\))?@)?(\S.*?):(\d+)(?::(\d+))?\s*$/i;
    const node  = /^\s*at (?:((?:\[object object])?\S+(?: \[as \S+])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
    const lines = stack.split('\n');
    const hash = [];
    let parts;
    let element;

    for (let i = 0, j = lines.length; i < j; ++i) {
        if ((parts = gecko.exec(lines[i]))) {
            element = {
                file: parts[3],
                fileParsed: path.parse(parts[3]),
                methodName: parts[1] || `<unknown>`,
                lineNumber: Number(parts[4]),
                column: parts[5] ? Number(parts[5]) : null
            };
        } else if ((parts = chrome.exec(lines[i]))) {
            element = {
                file: parts[2],
                fileParsed: path.parse(parts[2]),
                methodName: parts[1] || `<unknown>`,
                lineNumber: Number(parts[3]),
                column: parts[4] ? Number(parts[4]) : null
            };
        } else if ((parts = node.exec(lines[i]))) {
            element = {
                file: parts[2],
                fileParsed: path.parse(parts[2]),
                methodName: parts[1] || `<unknown>`,
                lineNumber: Number(parts[3]),
                column: parts[4] ? Number(parts[4]) : null
            };
        } else {
            continue;
        }

        hash.push(element);
    }

    return hash;
}
