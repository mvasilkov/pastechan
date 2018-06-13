/* This file is part of the Longpaste project.
 * https://github.com/mvasilkov/longpaste
 * Copyright (c) 2018 Mark Vasilkov (https://github.com/mvasilkov)
 * License: MIT */
'use strict'

const { stringToUTF8 } = require('./utf8')

/* Size in bytes */
const SIZE_NONCE = 4 // uint32_t
const SIZE_SALT = 12 // ObjectId

/* Offset in bytes */
const OFFSET_NONCE = 0
const OFFSET_SALT = OFFSET_NONCE + SIZE_NONCE + 1
const OFFSET_N = OFFSET_SALT + SIZE_SALT + 1

function solve(salt, n, contents, done) {
    // nonce : salt : n : contents
    const buf = stringToUTF8(['nonc', 'decoded.salt', 'n', contents].join('\t'))
    buf.set(salt.match(/.{2}/g).map(a => parseInt(a, 16)), OFFSET_SALT)

    const pbuf = new DataView(buf.buffer)
    pbuf.setUint8(OFFSET_N, n)

    /* Safari 9 compat */
    const subtle = crypto.subtle || crypto.webkitSubtle

    let nonce = 0
    compute()

    function compute() {
        pbuf.setUint32(OFFSET_NONCE, nonce, false)
        subtle.digest('SHA-256', buf).then(check)
    }

    function check(sha256sum) {
        sha256sum = new DataView(sha256sum)

        let k = 0
        for (let p = 0; p < 32; p += 4) {
            const a = sha256sum.getUint32(p, false)
            if (a == 0) {
                k += 32
                continue
            }
            k += 32 - Math.floor(Math.log2(a) + 1)
            break
        }

        if (k >= n) {
            done(nonce)
            return
        }
        ++nonce
        compute()
    }
}

module.exports.solve = solve
