const crypto = require('crypto')

const { badPageId } = require('./functions')

const lowestDifficulty = 9

const difficulty = () => lowestDifficulty

function validate(nonce, salt, n, contents) {
    nonce = +nonce
    if (badNonce(nonce) || badPageId(salt) || badN(n) || badContents(contents)) return false

    const bufNonce = Buffer.allocUnsafe(4)
    bufNonce.writeUInt32BE(nonce, 0)

    const bufN = Buffer.allocUnsafe(1)
    bufN.writeUInt8(n, 0)

    let sha256sum = crypto.createHash('sha256')
    sha256sum.update(bufNonce)
    sha256sum.update(`:${salt}:`)
    sha256sum.update(bufN)
    sha256sum.update(`:${contents}`)
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

function badContents(contents) {
    return typeof contents != 'string'
}

module.exports = {
    difficulty,
    validate,
}
