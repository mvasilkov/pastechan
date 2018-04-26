const statuses = require('statuses')

const nopeFun = n => function (res) {
    res.status(n).render('nope.html', { message: `${n} ${statuses[n]}` })
}

const nope = {
    badPageId: nopeFun(404),
    pageNotFound: nopeFun(404),
    badPageContents: nopeFun(400),
    cannotSavePage: nopeFun(503),
}

module.exports = nope
