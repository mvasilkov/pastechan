const nope = {
    badPageId(res) {
        res.sendStatus(404)
    },
    pageNotFound(res) {
        res.sendStatus(404)
    },
    badPageContents(res) {
        res.sendStatus(400)
    },
    cannotSavePage(res) {
        res.sendStatus(503)
    },
}

module.exports = nope
