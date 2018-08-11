/* This file is part of the pastechan project.
 * https://github.com/mvasilkov/pastechan
 * Copyright (c) 2018 Mark Vasilkov (https://github.com/mvasilkov)
 * License: MIT */
const statuses = require('statuses')

const nopeFun = n => function (res) {
    const options = { message: `${n} ${statuses[n]}` }
    res.status(n).format({
        ['text/html']() {
            res.render('nope.html', options)
        },
        ['application/json']() {
            res.json(options)
        },
    })
}

module.exports = {
    badPageId: nopeFun(404), // Client has sent bad pageId or pageSecret
    pageNotFound: nopeFun(404), // No such page in the database
    badPageContents: nopeFun(400),
    cannotChangePage: nopeFun(403),
    cannotSavePage: nopeFun(503),
}
