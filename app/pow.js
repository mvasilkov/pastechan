/* This file is part of the Longpaste project.
 * https://github.com/mvasilkov/longpaste
 * Copyright (c) 2018 Mark Vasilkov (https://github.com/mvasilkov)
 * License: MIT */
const crypto = require('crypto')

const { badPageId } = require('./functions')

const lowestDifficulty = 9

const difficulty = () => lowestDifficulty

const bufSep = Buffer.from('\t', 'utf8')

function validate(nonce, salt, n, contents) {
    nonce = +nonce
    if (badNonce(nonce) || badPageId(salt) || badN(n)) return false

    const bufNonce = Buffer.allocUnsafe(4)
    bufNonce.writeUInt32BE(nonce, 0)

    const bufSalt = Buffer.from(salt, 'hex')

    const bufN = Buffer.allocUnsafe(1)
    bufN.writeUInt8(n, 0)

    let sha256sum = crypto.createHash('sha256')
    sha256sum.update(bufNonce)
    sha256sum.update(bufSep)
    sha256sum.update(bufSalt)
    sha256sum.update(bufSep)
    sha256sum.update(bufN)
    sha256sum.update(bufSep)
    sha256sum.update(contents, 'utf8')
    sha256sum = sha256sum.digest()

    let k = 0
    for (let p = 0; p < 32; p += 4) {
        const a = sha256sum.readUInt32BE(p)
        if (a == 0) {
            k += 32
            continue
        }
        k += 32 - Math.floor(Math.log2(a) + 1)
        break
    }

    return k >= n
}

function badNonce(nonce) {
    return !Number.isInteger(nonce) || nonce < 0 || nonce > 0xffffffff
}

function badN(n) {
    return !Number.isInteger(n) || n < lowestDifficulty
}

module.exports = {
    difficulty,
    validate,
}
