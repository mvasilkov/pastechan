/* This file is part of the pastechan project.
 * https://github.com/mvasilkov/pastechan
 * Copyright (c) 2018 Mark Vasilkov (https://github.com/mvasilkov)
 * License: MIT */
const truncateWords = require('truncate-words')

const pageSize = 20

function posts(db) {
    return (req, res) => {
        const pages = []
        let before = req.query.before || undefined

        db.createReadStream({ limit: pageSize, lte: before, reverse: true })
            .on('data', p => {
                p.value.contents = truncateWords(p.value.contents, 25)
                pages.push(p)
                before = p.key
            })
            .on('end', () => {
                res.render('dataview.html', { pages, before })
            })
    }
}

function init(app, db) {
    app.get('/-dataview', posts(db))
}

module.exports = {
    init,
}
