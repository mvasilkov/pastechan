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

module.exports = {
    makeSecret,
}
