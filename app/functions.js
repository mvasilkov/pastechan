/* This file is part of the pastechan project.
 * https://github.com/mvasilkov/pastechan
 * Copyright (c) 2018 Mark Vasilkov (https://github.com/mvasilkov)
 * License: MIT */
const crypto = require('crypto')

function makePageSecret(next) {
    crypto.randomBytes(64, (err, buf) => {
        if (err) {
            next(null)
            return
        }
        const sha256sum = crypto.createHash('sha256')
        sha256sum.update(buf)
        next(sha256sum.digest('hex'))
    })
}

function badPageId(a) {
    return typeof a != 'string' || a.length != 24 // ObjectId
}

function badPageSecret(a) {
    return typeof a != 'string' || a.length != 64 // SHA-256
}

function cleanupCRLF(a) {
    return a.replace(/\r\n/g, '\n')
}

module.exports = {
    makePageSecret,
    badPageId,
    badPageSecret,
    cleanupCRLF,
}
