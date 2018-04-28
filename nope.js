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

const nope = {
    badPageId: nopeFun(404),
    pageNotFound: nopeFun(404),
    badPageContents: nopeFun(400),
    cannotSavePage: nopeFun(503),
}

module.exports = nope
