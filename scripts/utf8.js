/* This file is part of the pastechan project.
 * https://github.com/mvasilkov/pastechan
 * Copyright (c) 2018 Mark Vasilkov (https://github.com/mvasilkov)
 * License: MIT */
'use strict'

// The following is based on Emscripten's UTF-8 functions.
// Returns the number of bytes the given JavaScript string takes if encoded as a UTF8 byte array.
function lengthBytesUTF8(a) {
    let len = 0
    for (let n = 0; n < a.length; ++n) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit,
        // not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        let u = a.charCodeAt(n) // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (a.charCodeAt(++n) & 0x3FF)
        if (u <= 0x7F) {
            ++len
        }
        else if (u <= 0x7FF) {
            len += 2
        }
        else if (u <= 0xFFFF) {
            len += 3
        }
        else if (u <= 0x1FFFFF) {
            len += 4
        }
        else if (u <= 0x3FFFFFF) {
            len += 5
        }
        else {
            len += 6
        }
    }
    return len
}

function stringToUTF8Array(a, outU8Array) {
    let p = 0
    for (let n = 0; n < a.length; ++n) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit,
        // not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and
        // https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
        let u = a.charCodeAt(n) // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (a.charCodeAt(++n) & 0x3FF)
        if (u <= 0x7F) {
            outU8Array[p++] = u
        }
        else if (u <= 0x7FF) {
            outU8Array[p++] = 0xC0 | (u >> 6)
            outU8Array[p++] = 0x80 | (u & 63)
        }
        else if (u <= 0xFFFF) {
            outU8Array[p++] = 0xE0 | (u >> 12)
            outU8Array[p++] = 0x80 | ((u >> 6) & 63)
            outU8Array[p++] = 0x80 | (u & 63)
        }
        else if (u <= 0x1FFFFF) {
            outU8Array[p++] = 0xF0 | (u >> 18)
            outU8Array[p++] = 0x80 | ((u >> 12) & 63)
            outU8Array[p++] = 0x80 | ((u >> 6) & 63)
            outU8Array[p++] = 0x80 | (u & 63)
        }
        else if (u <= 0x3FFFFFF) {
            outU8Array[p++] = 0xF8 | (u >> 24)
            outU8Array[p++] = 0x80 | ((u >> 18) & 63)
            outU8Array[p++] = 0x80 | ((u >> 12) & 63)
            outU8Array[p++] = 0x80 | ((u >> 6) & 63)
            outU8Array[p++] = 0x80 | (u & 63)
        }
        else {
            outU8Array[p++] = 0xFC | (u >> 30)
            outU8Array[p++] = 0x80 | ((u >> 24) & 63)
            outU8Array[p++] = 0x80 | ((u >> 18) & 63)
            outU8Array[p++] = 0x80 | ((u >> 12) & 63)
            outU8Array[p++] = 0x80 | ((u >> 6) & 63)
            outU8Array[p++] = 0x80 | (u & 63)
        }
    }
}

function stringToUTF8(a) {
    if (typeof window.TextEncoder == 'function') return (new TextEncoder).encode(a)
    const buf = new Uint8Array(lengthBytesUTF8(a))
    stringToUTF8Array(a, buf)
    return buf
}

module.exports.stringToUTF8 = stringToUTF8
