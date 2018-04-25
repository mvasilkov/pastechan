/* https://github.com/Level/packager/blob/master/level-packager.js */
const levelup = require('levelup')
const encode = require('encoding-down')

function packager(leveldown) {
    function Level(location, options, callback) {
        if (typeof options == 'function') {
            callback = options
        }
        if (typeof options != 'object' || options === null) {
            options = {}
        }

        return levelup(encode(leveldown(location), options), options, callback)
    }

    function nop() {
    }

    ['destroy', 'repair'].forEach(function (m) {
        if (typeof leveldown[m] == 'function') {
            Level[m] = function (location, callback) {
                leveldown[m](location, callback || nop)
            }
        }
    })

    Level.errors = levelup.errors

    return Level
}

/* https://github.com/Level/level/blob/master/level.js */
module.exports = packager(require('leveldown'))
