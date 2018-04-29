const crypto = require('crypto')

function makeSecret(next) {
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

module.exports = {
    makeSecret,
    badPageId,
    badPageSecret,
}
