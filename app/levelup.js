/* This file is part of the pastechan project.
 * https://github.com/mvasilkov/pastechan
 * Copyright (c) 2018 Mark Vasilkov (https://github.com/mvasilkov)
 * License: MIT */
const levelup = require('levelup')
const encoding = require('encoding-down')

/* https://github.com/Level/packager/blob/master/level-packager.js */
function packager(leveldown) {
    function Level(location, options, callback) {
        if (typeof options == 'function') {
            callback = options
        }
        if (typeof options != 'object' || options === null) {
            options = {}
        }

        return levelup(encoding(leveldown(location), options), options, callback)
    }

    function nop() {
    }

    ['destroy', 'repair'].forEach(function (fun) {
        if (typeof leveldown[fun] == 'function') {
            Level[fun] = function (location, callback) {
                leveldown[fun](location, callback || nop)
            }
        }
    })

    Level.errors = levelup.errors

    return Level
}

/* https://github.com/Level/level/blob/master/level.js */
module.exports = packager(require('leveldown'))
